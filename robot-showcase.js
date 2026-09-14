import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const stage = document.querySelector('[data-robot-showcase]');

if (stage) {
  const canvas = stage.querySelector('.next-robot-canvas');
  const loaderText = stage.querySelector('[data-robot-loader-text]');
  const loaderBar = stage.querySelector('[data-robot-loader-bar]');
  const modelUrl = stage.dataset.model || 'assets/robot-web-lite.glb';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
  camera.position.set(0.16, 0.32, 4.7);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const robotRig = new THREE.Group();
  const orientationRig = new THREE.Group();
  robotRig.add(orientationRig);
  scene.add(robotRig);

  // Lighting is intentionally studio-like so the CAD model keeps its engineering-detail look.
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6d67a6, 2.35));

  const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
  keyLight.position.set(4.5, 5.5, 6.5);
  scene.add(keyLight);

  const coolRim = new THREE.PointLight(0x61d8ff, 18, 10, 2);
  coolRim.position.set(-3.2, 1.7, -2.6);
  scene.add(coolRim);

  const greenFill = new THREE.PointLight(0x9cff57, 12, 9, 2);
  greenFill.position.set(3.2, -1.8, 1.1);
  scene.add(greenFill);

  const purpleFill = new THREE.PointLight(0x875cff, 9, 9, 2);
  purpleFill.position.set(-2.4, -1.2, 2.2);
  scene.add(purpleFill);

  // Soft fake ground shadow. It is much cheaper than real-time shadow maps for a CAD-heavy robot.
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const shadowCtx = shadowCanvas.getContext('2d');
  const shadowGradient = shadowCtx.createRadialGradient(128, 128, 8, 128, 128, 118);
  shadowGradient.addColorStop(0, 'rgba(10,15,24,.30)');
  shadowGradient.addColorStop(.45, 'rgba(10,15,24,.13)');
  shadowGradient.addColorStop(1, 'rgba(10,15,24,0)');
  shadowCtx.fillStyle = shadowGradient;
  shadowCtx.fillRect(0, 0, 256, 256);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.3, 1.8),
    new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -1.03, 0.08);
  scene.add(shadow);

  let robot = null;
  let modelLoaded = false;
  let inView = false;
  let loadStarted = false;
  let raf = 0;
  let lastTime = performance.now();
  let scrollTarget = .5;
  let scrollValue = .5;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let autoYaw = -0.48;
  let manualYaw = 0;
  let manualVelocity = 0;
  let dragging = false;
  let dragStartX = 0;
  let dragStartYaw = 0;
  let resumeAutoAt = 0;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  function setLoader(label, pct = null) {
    if (loaderText) loaderText.textContent = label;
    if (loaderBar && pct !== null) loaderBar.style.transform = `scaleX(${clamp(pct, 0, 1)})`;
  }

  function tuneMaterial(material) {
    if (!material || !material.isMeshStandardMaterial) return;
    material = material;
    const c = material.color;
    const max = Math.max(c.r, c.g, c.b);
    const min = Math.min(c.r, c.g, c.b);
    const saturation = max > 0 ? (max - min) / max : 0;
    const luminance = (c.r + c.g + c.b) / 3;

    // Neutral Onshape parts read more like aluminum/steel with a moderate metallic response.
    if (saturation < .15 && luminance > .12) {
      material.metalness = Math.max(material.metalness || 0, .36);
      material.roughness = .46;
    } else {
      material.metalness = Math.min(material.metalness || 0, .12);
      material.roughness = .58;
    }
    material.envMapIntensity = .8;
    material.needsUpdate = true;
  }

  function loadRobot() {
    if (loadStarted) return;
    loadStarted = true;
    setLoader('LOADING ROBOT / 0%', 0);

    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      modelUrl,
      (gltf) => {
        robot = gltf.scene;

        robot.traverse((obj) => {
          if (!obj.isMesh) return;
          obj.frustumCulled = true;
          if (Array.isArray(obj.material)) obj.material.forEach(tuneMaterial);
          else tuneMaterial(obj.material);
        });

        // The model comes from Onshape (Z-up). Rotate it into Three.js' Y-up world.
        orientationRig.rotation.x = -Math.PI / 2;
        orientationRig.add(robot);

        // Center the complete assembly around the animation pivot and fit it consistently.
        const box = new THREE.Box3().setFromObject(robot);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        robot.position.sub(center);
        const maxDimension = Math.max(size.x, size.y, size.z) || 1;
        const modelScale = 2.42 / maxDimension;
        robot.scale.setScalar(modelScale);

        // Re-center after scale so the visual pivot feels stable while spinning.
        const fittedBox = new THREE.Box3().setFromObject(orientationRig);
        const fittedCenter = fittedBox.getCenter(new THREE.Vector3());
        robotRig.position.sub(fittedCenter);
        robotRig.position.y += .06;

        modelLoaded = true;
        stage.classList.add('robot-ready');
        setLoader('ROBOT ONLINE / DRAG TO ROTATE', 1);
        resize();
        startLoop();
      },
      (xhr) => {
        if (!xhr.total) {
          setLoader('LOADING 3D ROBOT…');
          return;
        }
        const pct = clamp(xhr.loaded / xhr.total, 0, 1);
        setLoader(`LOADING ROBOT / ${Math.round(pct * 100)}%`, pct);
      },
      (error) => {
        console.warn('Robot model could not be loaded:', error);
        stage.classList.add('robot-error');
        setLoader('MODEL OFFLINE / assets/robot-web-lite.glb', 0);
      },
    );
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function updateScrollProgress() {
    const rect = stage.getBoundingClientRect();
    const viewport = window.innerHeight || 1;
    // 0 when entering from below, 1 when leaving through the top.
    scrollTarget = clamp((viewport - rect.top) / (viewport + rect.height), 0, 1);
  }

  function onPointerMove(event) {
    const rect = stage.getBoundingClientRect();
    pointerTargetX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    pointerTargetY = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);

    if (dragging) {
      const dx = event.clientX - dragStartX;
      const nextYaw = dragStartYaw + dx * .0085;
      manualVelocity = nextYaw - manualYaw;
      manualYaw = nextYaw;
      resumeAutoAt = performance.now() + 1250;
    }
  }

  function onPointerDown(event) {
    if (!finePointer || !modelLoaded) return;
    dragging = true;
    dragStartX = event.clientX;
    dragStartYaw = manualYaw;
    manualVelocity = 0;
    stage.classList.add('is-dragging');
    stage.setPointerCapture?.(event.pointerId);
  }

  function onPointerUp(event) {
    if (!dragging) return;
    dragging = false;
    resumeAutoAt = performance.now() + 1300;
    stage.classList.remove('is-dragging');
    stage.releasePointerCapture?.(event.pointerId);
  }

  function onPointerLeave() {
    pointerTargetX = 0;
    pointerTargetY = 0;
  }

  function render(now) {
    raf = 0;
    if (!inView && modelLoaded) return;

    const dt = Math.min((now - lastTime) / 1000, .04);
    lastTime = now;
    scrollValue += (scrollTarget - scrollValue) * (1 - Math.pow(.0008, dt));
    pointerX += (pointerTargetX - pointerX) * (1 - Math.pow(.001, dt));
    pointerY += (pointerTargetY - pointerY) * (1 - Math.pow(.001, dt));

    if (modelLoaded) {
      if (!reducedMotion && !dragging && now > resumeAutoAt) {
        autoYaw += dt * .34;
      }
      if (!dragging) {
        manualYaw += manualVelocity;
        manualVelocity *= Math.pow(.06, dt);
      }

      // Alex Dickhans-style idea: scroll changes the camera/view while the robot keeps rotating.
      // Here it is scoped to this section so the rest of the portfolio remains normal HTML.
      const scrollArc = (scrollValue - .5);
      const bob = reducedMotion ? 0 : Math.sin(now * .00115) * .055;
      const breathe = reducedMotion ? 0 : Math.sin(now * .00062) * .018;

      robotRig.rotation.y = autoYaw + manualYaw + scrollArc * 1.05 + pointerX * .18;
      robotRig.rotation.z = pointerX * -.055 + Math.sin(now * .00082) * .012;
      robotRig.position.x = lerp(.10, -.10, scrollValue) + pointerX * .045;
      robotRig.position.y = .04 + bob - pointerY * .045;
      robotRig.scale.setScalar(1 + breathe);

      const cameraTargetX = pointerX * .18 + scrollArc * .08;
      const cameraTargetY = .31 - scrollArc * .34 - pointerY * .09;
      const cameraTargetZ = 4.65 - Math.sin(scrollValue * Math.PI) * .18;
      camera.position.x += (cameraTargetX - camera.position.x) * .055;
      camera.position.y += (cameraTargetY - camera.position.y) * .055;
      camera.position.z += (cameraTargetZ - camera.position.z) * .055;
      camera.lookAt(0, -.04, 0);

      shadow.scale.x = 1 + Math.sin(now * .00115) * .025;
      shadow.material.opacity = .82 - Math.abs(bob) * .8;
    }

    renderer.render(scene, camera);
    if (inView || !modelLoaded) startLoop();
  }

  function startLoop() {
    if (raf) return;
    raf = requestAnimationFrame(render);
  }

  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointerup', onPointerUp);
  stage.addEventListener('pointercancel', onPointerUp);
  stage.addEventListener('pointerleave', onPointerLeave);
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', resize, { passive: true });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      inView = entry.isIntersecting;
      if (entry.isIntersecting) {
        loadRobot();
        updateScrollProgress();
        startLoop();
      }
    });
  }, { rootMargin: '550px 0px 550px 0px', threshold: 0 });

  observer.observe(stage);
  resize();
  updateScrollProgress();
  renderer.render(scene, camera);
}
