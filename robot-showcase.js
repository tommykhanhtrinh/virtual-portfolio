import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const stage = document.querySelector('[data-robot-showcase]');

if (stage) {
  const canvas = stage.querySelector('.next-robot-canvas');
  const loaderText = stage.querySelector('[data-robot-loader-text]');
  const loaderBar = stage.querySelector('[data-robot-loader-bar]');
  const modelUrl = stage.dataset.model || 'assets/robot-current-optimized.glb';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
  camera.position.set(0.12, 0.28, 4.68);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const robotRig = new THREE.Group();
  const orientationRig = new THREE.Group();
  robotRig.add(orientationRig);
  scene.add(robotRig);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x68638f, 2.25));

  const keyLight = new THREE.DirectionalLight(0xffffff, 4.1);
  keyLight.position.set(4.5, 5.4, 6.2);
  scene.add(keyLight);

  const coolRim = new THREE.PointLight(0x61d8ff, 17, 10, 2);
  coolRim.position.set(-3.1, 1.8, -2.4);
  scene.add(coolRim);

  const greenFill = new THREE.PointLight(0x9cff57, 12, 9, 2);
  greenFill.position.set(3.1, -1.6, 1.2);
  scene.add(greenFill);

  const purpleFill = new THREE.PointLight(0x875cff, 8, 9, 2);
  purpleFill.position.set(-2.4, -1.1, 2.1);
  scene.add(purpleFill);

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const shadowCtx = shadowCanvas.getContext('2d');
  const shadowGradient = shadowCtx.createRadialGradient(128, 128, 8, 128, 128, 118);
  shadowGradient.addColorStop(0, 'rgba(10,15,24,.29)');
  shadowGradient.addColorStop(.46, 'rgba(10,15,24,.12)');
  shadowGradient.addColorStop(1, 'rgba(10,15,24,0)');
  shadowCtx.fillStyle = shadowGradient;
  shadowCtx.fillRect(0, 0, 256, 256);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.25, 1.72),
    new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -1.03, 0.08);
  scene.add(shadow);

  const robotPath = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-0.28, -0.045, 0.08),
    new THREE.Vector3(-0.14, 0.12, -0.11),
    new THREE.Vector3(0.14, 0.10, 0.11),
    new THREE.Vector3(0.28, -0.035, -0.06),
  );
  const pathPoints = robotPath.getPoints(70);
  const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
  const pathMaterial = new THREE.LineBasicMaterial({
    color: 0x875cff,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });
  const pathLine = new THREE.Line(pathGeometry, pathMaterial);
  pathLine.position.z = -0.48;
  pathLine.scale.set(2.5, 2.5, 2.5);
  scene.add(pathLine);

  const grid = new THREE.GridHelper(3.65, 16, 0x875cff, 0x0a0f18);
  grid.position.set(0, -1.02, -0.36);
  grid.scale.z = 0.78;
  const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
  gridMaterials.forEach((material, index) => {
    material.transparent = true;
    material.opacity = index === 0 ? 0.10 : 0.045;
    material.depthWrite = false;
  });
  scene.add(grid);

  let robot = null;
  let modelLoaded = false;
  let inView = false;
  let loadStarted = false;
  let raf = 0;
  let lastTime = performance.now();
  let scrollTarget = 0.5;
  let scrollValue = 0.5;
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
  const spinningParts = [];
  const zAxis = new THREE.Vector3(0, 0, 1);
  const spinQuaternion = new THREE.Quaternion();

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  function setLoader(label, pct = null) {
    if (loaderText) loaderText.textContent = label;
    if (loaderBar && pct !== null) loaderBar.style.transform = `scaleX(${clamp(pct, 0, 1)})`;
  }

  function tuneMaterial(material) {
    if (!material || !material.isMeshStandardMaterial) return;
    const c = material.color;
    const max = Math.max(c.r, c.g, c.b);
    const min = Math.min(c.r, c.g, c.b);
    const saturation = max > 0 ? (max - min) / max : 0;
    const luminance = (c.r + c.g + c.b) / 3;

    if (saturation < 0.15 && luminance > 0.12) {
      material.metalness = Math.max(material.metalness || 0, 0.34);
      material.roughness = 0.48;
    } else {
      material.metalness = Math.min(material.metalness || 0, 0.11);
      material.roughness = 0.58;
    }

    material.flatShading = true;
    material.envMapIntensity = 0.8;
    material.needsUpdate = true;
  }

  function collectMechanicalMotion(root) {
    spinningParts.length = 0;
    root.traverse((obj) => {
      const name = obj.name || '';
      if (/^occurrence of/i.test(name) || !/wheel|gear/i.test(name)) return;
      if (!obj.children.length && !obj.isMesh) return;

      const isFlex = /flex wheel/i.test(name);
      const isGear = /gear/i.test(name);
      spinningParts.push({
        object: obj,
        baseQuaternion: obj.quaternion.clone(),
        speed: isGear ? 1.25 : isFlex ? 2.9 : 2.15,
        direction: spinningParts.length % 2 ? -1 : 1,
        phase: (spinningParts.length % 7) * 0.18,
      });
    });
  }

  function loadRobot() {
    if (loadStarted) return;
    loadStarted = true;
    setLoader('LOADING LATEST ROBOT / 0%', 0);

    const gltfLoader = new GLTFLoader();
    gltfLoader.setMeshoptDecoder(MeshoptDecoder);
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

        collectMechanicalMotion(robot);

        orientationRig.rotation.x = -Math.PI / 2;
        orientationRig.add(robot);

        const box = new THREE.Box3().setFromObject(robot);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z) || 1;
        const modelScale = 2.38 / maxDimension;
        robot.scale.setScalar(modelScale);
        robot.position.copy(center).multiplyScalar(-modelScale);

        modelLoaded = true;
        stage.classList.add('robot-ready');
        setLoader('ROBOT ONLINE / DRAG TO ROTATE', 1);
        resize();
        startLoop();
      },
      (xhr) => {
        if (!xhr.total) {
          setLoader('LOADING LATEST 3D ROBOT…');
          return;
        }
        const pct = clamp(xhr.loaded / xhr.total, 0, 1);
        setLoader(`LOADING ROBOT / ${Math.round(pct * 100)}%`, pct);
      },
      (error) => {
        console.warn('Robot model could not be loaded:', error);
        stage.classList.add('robot-error');
        setLoader('MODEL OFFLINE / robot-current-optimized.glb', 0);
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
    scrollTarget = clamp((viewport - rect.top) / (viewport + rect.height), 0, 1);
  }

  function onPointerMove(event) {
    const rect = stage.getBoundingClientRect();
    pointerTargetX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    pointerTargetY = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);

    if (dragging) {
      const dx = event.clientX - dragStartX;
      const nextYaw = dragStartYaw + dx * 0.0085;
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

    const dt = Math.min((now - lastTime) / 1000, 0.04);
    lastTime = now;
    scrollValue += (scrollTarget - scrollValue) * (1 - Math.pow(0.0008, dt));
    pointerX += (pointerTargetX - pointerX) * (1 - Math.pow(0.001, dt));
    pointerY += (pointerTargetY - pointerY) * (1 - Math.pow(0.001, dt));

    if (modelLoaded) {
      if (!reducedMotion && !dragging && now > resumeAutoAt) autoYaw += dt * 0.29;
      if (!dragging) {
        manualYaw += manualVelocity;
        manualVelocity *= Math.pow(0.06, dt);
      }

      const pathT = reducedMotion
        ? 0.5
        : 1 - (Math.cos(((now / 3600) % 2) * Math.PI) + 1) / 2;
      const pathPosition = robotPath.getPoint(pathT);
      const pathTangent = robotPath.getTangent(pathT);
      const scrollArc = scrollValue - 0.5;
      const bob = reducedMotion ? 0 : Math.sin(now * 0.00135) * 0.045;
      const breathe = reducedMotion ? 0 : Math.sin(now * 0.00062) * 0.012;
      const tangentYaw = Math.atan2(pathTangent.x, Math.max(0.04, Math.abs(pathTangent.z))) * 0.12;

      robotRig.position.x = pathPosition.x + pointerX * 0.045 + scrollArc * -0.08;
      robotRig.position.y = pathPosition.y + bob - pointerY * 0.04;
      robotRig.position.z = pathPosition.z * 0.7;
      robotRig.rotation.y = autoYaw + manualYaw + tangentYaw + scrollArc * 0.92 + pointerX * 0.16;
      robotRig.rotation.z = pointerX * -0.055 + Math.sin(now * 0.00082) * 0.011;
      robotRig.rotation.x = scrollArc * -0.06 + pointerY * 0.025;
      robotRig.scale.setScalar(1 + breathe);

      if (!reducedMotion) {
        spinningParts.forEach((part) => {
          const angle = now * 0.001 * part.speed * part.direction + part.phase;
          spinQuaternion.setFromAxisAngle(zAxis, angle);
          part.object.quaternion.copy(part.baseQuaternion).multiply(spinQuaternion);
        });
      }

      const cameraTargetX = pointerX * 0.17 + scrollArc * 0.16;
      const cameraTargetY = lerp(0.48, 0.08, scrollValue) - pointerY * 0.08;
      const cameraTargetZ = 4.72 - Math.sin(scrollValue * Math.PI) * 0.22;
      camera.position.x += (cameraTargetX - camera.position.x) * 0.055;
      camera.position.y += (cameraTargetY - camera.position.y) * 0.055;
      camera.position.z += (cameraTargetZ - camera.position.z) * 0.055;
      camera.lookAt(0, -0.045, 0);

      pathLine.rotation.z = Math.sin(now * 0.00028) * 0.035;
      pathMaterial.opacity = 0.12 + Math.sin(now * 0.0011) * 0.035;
      grid.rotation.y = scrollArc * 0.12;
      shadow.scale.x = 1 + Math.sin(now * 0.00135) * 0.025;
      shadow.material.opacity = 0.82 - Math.abs(bob) * 0.8;
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
