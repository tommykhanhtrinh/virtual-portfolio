import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const stage = document.querySelector('[data-vex-card-3d]');

if (stage) {
  const canvas = stage.querySelector('.vex-card-canvas');
  const loaderText = stage.querySelector('[data-vex-card-loader-text]');
  const loaderMeta = stage.querySelector('[data-vex-card-loader-meta]');
  const loaderBar = stage.querySelector('[data-vex-card-loader-bar]');
  const modelUrl = stage.dataset.model || 'assets/vex-card-robot-full.glb';
  const card = stage.closest('.work-vex');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer:fine)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, 0.01, 100);
  camera.position.set(0.05, 0.55, 4.65);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.55));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const robotRig = new THREE.Group();
  const orientationRig = new THREE.Group();
  robotRig.add(orientationRig);
  scene.add(robotRig);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x111c2a, 2.4));

  const key = new THREE.DirectionalLight(0xffffff, 4.6);
  key.position.set(4.8, 5.6, 6.5);
  scene.add(key);

  const cyanRim = new THREE.PointLight(0x61d8ff, 14, 9, 2);
  cyanRim.position.set(-3.6, 1.3, -2.3);
  scene.add(cyanRim);

  const greenFill = new THREE.PointLight(0x9cff57, 11, 8, 2);
  greenFill.position.set(3.1, -1.2, 1.7);
  scene.add(greenFill);

  const violetFill = new THREE.PointLight(0x875cff, 8, 8, 2);
  violetFill.position.set(-2.2, -1.25, 2.3);
  scene.add(violetFill);

  const grid = new THREE.GridHelper(8, 16, 0x425367, 0x1c2a39);
  grid.position.y = -1.06;
  grid.material.transparent = true;
  grid.material.opacity = 0.38;
  scene.add(grid);

  const driveCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-0.92, -0.03, 0.18),
    new THREE.Vector3(-0.42, 0.10, -0.16),
    new THREE.Vector3(0.36, -0.08, 0.12),
    new THREE.Vector3(0.92, 0.02, -0.10),
  );

  const curveLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(driveCurve.getPoints(80)),
    new THREE.LineBasicMaterial({ color: 0x9cff57, transparent: true, opacity: 0.42 }),
  );
  curveLine.position.y = -1.015;
  scene.add(curveLine);

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 128;
  const ctx = shadowCanvas.getContext('2d');
  const grad = ctx.createRadialGradient(128, 64, 4, 128, 64, 118);
  grad.addColorStop(0, 'rgba(0,0,0,.48)');
  grad.addColorStop(.5, 'rgba(0,0,0,.18)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 128);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 1.3),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(shadowCanvas),
      transparent: true,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.04;
  scene.add(shadow);

  let robot = null;
  let loaded = false;
  let loadStarted = false;
  let inView = false;
  let raf = 0;
  let last = performance.now();
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let manualYaw = 0;
  let yawVelocity = 0;
  let visualYaw = 0;
  let dragging = false;
  let dragStartX = 0;
  let dragStartYaw = 0;
  let dragDistance = 0;
  let suppressNextClick = false;
  let resumeAutoAt = 0;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const damp = (current, target, lambda, dt) => THREE.MathUtils.damp(current, target, lambda, dt);

  function setLoader(label, progress = null, meta = '') {
    if (loaderText) loaderText.textContent = label;
    if (loaderMeta) loaderMeta.textContent = meta;
    if (loaderBar && progress !== null) {
      loaderBar.style.transform = `scaleX(${clamp(progress, 0, 1)})`;
    }
  }

  function tuneMaterial(material) {
    if (!material) return;
    if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
    if (!material.isMeshStandardMaterial && !material.isMeshPhysicalMaterial) return;

    const c = material.color;
    const max = Math.max(c.r, c.g, c.b);
    const min = Math.min(c.r, c.g, c.b);
    const saturation = max > 0 ? (max - min) / max : 0;
    const luminance = (c.r + c.g + c.b) / 3;

    if (saturation < .14 && luminance > .10) {
      material.metalness = Math.max(material.metalness || 0, .34);
      material.roughness = Math.max(.38, Math.min(material.roughness ?? .5, .52));
    } else {
      material.metalness = Math.min(material.metalness || 0, .14);
      material.roughness = Math.max(.48, material.roughness ?? .55);
    }

    material.envMapIntensity = .8;
    material.needsUpdate = true;
  }

  function fitRobot() {
    orientationRig.rotation.x = -Math.PI / 2;

    const box = new THREE.Box3().setFromObject(robot);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    robot.position.sub(center);
    robot.scale.setScalar(2.25 / (Math.max(size.x, size.y, size.z) || 1));

    const fitted = new THREE.Box3().setFromObject(orientationRig);
    const fittedCenter = fitted.getCenter(new THREE.Vector3());
    robotRig.position.set(-fittedCenter.x, -fittedCenter.y - .02, -fittedCenter.z);
  }

  function acceptModel(gltf) {
    robot = gltf.scene;
    robot.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.frustumCulled = true;
      if (Array.isArray(obj.material)) obj.material.forEach(tuneMaterial);
      else tuneMaterial(obj.material);
    });

    orientationRig.add(robot);
    fitRobot();
    loaded = true;
    stage.classList.remove('model-error');
    stage.classList.add('model-ready');
    setLoader('FULL-RES CAD / ONLINE', 1, 'DRAG TO ROTATE');
    resize();
    last = performance.now();
    startLoop();
  }

  function progress(xhr) {
    const loadedMB = xhr.loaded / 1024 / 1024;
    if (xhr.total) {
      const pct = clamp(xhr.loaded / xhr.total, 0, 1);
      setLoader(
        `FULL-RES CAD / ${Math.round(pct * 100)}%`,
        pct,
        `${loadedMB.toFixed(0)} / ${(xhr.total / 1024 / 1024).toFixed(0)} MB`,
      );
    } else {
      setLoader('FULL-RES CAD / LOADING', null, `${loadedMB.toFixed(0)} MB`);
    }
  }

  function loadRobot() {
    if (loadStarted) return;
    loadStarted = true;
    setLoader('FULL-RES CAD / CONNECTING', 0, 'SAME-ORIGIN ASSET');

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      acceptModel,
      progress,
      (error) => {
        console.warn('Full-resolution VEX model could not be loaded:', error);
        stage.classList.add('model-error');
        setLoader('FULL-RES CAD / OFFLINE', 0, 'PAGES ASSET MISSING');
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

  function pointerMove(event) {
    const rect = stage.getBoundingClientRect();
    pointerTargetX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    pointerTargetY = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);

    if (!dragging) return;
    const dx = event.clientX - dragStartX;
    dragDistance = Math.max(dragDistance, Math.abs(dx));
    const next = dragStartYaw + dx * .008;
    yawVelocity = next - manualYaw;
    manualYaw = next;
    resumeAutoAt = performance.now() + 1200;
  }

  function pointerDown(event) {
    if (!finePointer || !loaded) return;
    dragging = true;
    dragStartX = event.clientX;
    dragStartYaw = manualYaw;
    dragDistance = 0;
    yawVelocity = 0;
    stage.classList.add('is-dragging');
    stage.setPointerCapture?.(event.pointerId);
  }

  function pointerUp(event) {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('is-dragging');
    stage.releasePointerCapture?.(event.pointerId);
    resumeAutoAt = performance.now() + 1250;
    if (dragDistance > 6) suppressNextClick = true;
  }

  function pointerLeave() {
    pointerTargetX = 0;
    pointerTargetY = 0;
  }

  function shortestAngle(from, to) {
    let diff = (to - from + Math.PI) % (Math.PI * 2) - Math.PI;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
  }

  function render(now) {
    raf = 0;
    if (!inView && loaded) return;

    const dt = Math.min((now - last) / 1000, .04);
    last = now;
    pointerX = damp(pointerX, pointerTargetX, 7.5, dt);
    pointerY = damp(pointerY, pointerTargetY, 7.5, dt);

    if (loaded) {
      const phase = reducedMotion ? 0 : now * .00052;
      const pathT = reducedMotion ? .5 : (Math.sin(phase) + 1) * .5;
      const driveDirection = reducedMotion || Math.cos(phase) >= 0 ? 1 : -1;
      const p = driveCurve.getPoint(pathT);
      const tangent = driveCurve.getTangent(pathT).multiplyScalar(driveDirection);
      const pathYaw = Math.atan2(tangent.x, tangent.z);

      if (!dragging) {
        manualYaw += yawVelocity;
        yawVelocity *= Math.pow(.035, dt);
        if (!reducedMotion && now > resumeAutoAt) manualYaw += dt * .065;
      }

      const targetYaw = pathYaw + manualYaw + pointerX * .13;
      visualYaw += shortestAngle(visualYaw, targetYaw) * (1 - Math.pow(.0008, dt));

      const bob = reducedMotion ? 0 : Math.sin(now * .0015) * .035;
      const roll = reducedMotion ? 0 : Math.sin(now * .0009) * .012;
      robotRig.position.x = p.x + pointerX * .035;
      robotRig.position.y = p.y + bob - pointerY * .026;
      robotRig.position.z = p.z;
      robotRig.rotation.y = visualYaw;
      robotRig.rotation.z = roll - pointerX * .025;

      shadow.position.x = p.x;
      shadow.position.z = p.z;
      shadow.scale.x = 1 - Math.min(Math.abs(bob) * 2.5, .08);
      shadow.material.opacity = .88 - Math.abs(bob) * 2.2;

      camera.position.x = damp(camera.position.x, pointerX * .16, 5.5, dt);
      camera.position.y = damp(camera.position.y, .54 - pointerY * .10, 5.5, dt);
      camera.position.z = damp(camera.position.z, 4.60 - Math.abs(pointerX) * .05, 5.5, dt);
      camera.lookAt(0, -.12, 0);
    }

    renderer.render(scene, camera);
    if (inView || !loaded) startLoop();
  }

  function startLoop() {
    if (!raf) raf = requestAnimationFrame(render);
  }

  stage.addEventListener('pointermove', pointerMove);
  stage.addEventListener('pointerdown', pointerDown);
  stage.addEventListener('pointerup', pointerUp);
  stage.addEventListener('pointercancel', pointerUp);
  stage.addEventListener('pointerleave', pointerLeave);
  window.addEventListener('resize', resize, { passive: true });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      inView = entry.isIntersecting;
      if (entry.isIntersecting) {
        loadRobot();
        last = performance.now();
        startLoop();
      }
    });
  }, { rootMargin: '100px 0px 100px 0px', threshold: .02 });

  observer.observe(stage);

  if (card) {
    card.addEventListener('click', (event) => {
      if (!suppressNextClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressNextClick = false;
    }, true);
  }

  resize();
  renderer.render(scene, camera);
}
