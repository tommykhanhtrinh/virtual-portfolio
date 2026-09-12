const stage = document.querySelector('.home-page .portrait-stage');

if (stage) {
  stage.classList.add('robot-sim-stage');

  const style = document.createElement('style');
  style.id = 'robot-sim-styles';
  style.textContent = `
    .home-page .robot-sim-stage{
      min-height:650px;
      display:grid;
      place-items:center;
      position:relative;
      isolation:isolate;
    }
    .home-page .robot-sim-stage .robot-sim-shell{
      width:min(100%,590px);
      height:630px;
      position:relative;
      overflow:hidden;
      border-radius:42px;
      border:1px solid rgba(10,15,24,.12);
      background:
        radial-gradient(circle at 18% 16%,rgba(156,255,87,.18),transparent 28%),
        radial-gradient(circle at 82% 24%,rgba(97,216,255,.16),transparent 30%),
        #f7f5ee;
      box-shadow:0 38px 90px rgba(10,15,24,.14);
      transform:rotate(1deg);
    }
    .home-page .robot-sim-stage .robot-sim-shell:after{
      content:"";
      position:absolute;
      inset:0;
      pointer-events:none;
      border-radius:inherit;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.52);
      z-index:7;
    }
    .robot-sim-canvas{
      width:100%;
      height:100%;
      display:block;
      cursor:crosshair;
    }
    .robot-sim-ui{
      position:absolute;
      inset:0;
      z-index:5;
      pointer-events:none;
      font-family:"DM Sans",sans-serif;
      color:#0a0f18;
    }
    .robot-sim-label{
      position:absolute;
      left:24px;
      top:24px;
      display:flex;
      flex-direction:column;
      gap:3px;
      padding:12px 14px;
      border-radius:18px;
      background:rgba(247,245,238,.78);
      border:1px solid rgba(10,15,24,.1);
      backdrop-filter:blur(12px);
      box-shadow:0 12px 28px rgba(10,15,24,.08);
    }
    .robot-sim-label span,
    .robot-sim-status,
    .robot-sim-hint,
    .robot-sim-person small{
      font-size:9px;
      font-weight:900;
      letter-spacing:.11em;
      text-transform:uppercase;
    }
    .robot-sim-label strong{
      font:700 15px/1.1 "Space Grotesk",sans-serif;
      letter-spacing:-.02em;
    }
    .robot-sim-status{
      position:absolute;
      right:22px;
      top:22px;
      display:flex;
      align-items:center;
      gap:8px;
      padding:9px 12px;
      border-radius:999px;
      color:#17331a;
      background:rgba(156,255,87,.78);
      border:1px solid rgba(10,15,24,.1);
      box-shadow:0 10px 24px rgba(10,15,24,.08);
    }
    .robot-sim-status i{
      width:7px;height:7px;border-radius:50%;background:#16a34a;
      box-shadow:0 0 0 0 rgba(22,163,74,.32);
      animation:robotPulse 1.7s infinite;
    }
    .robot-sim-hint{
      position:absolute;
      right:24px;
      bottom:23px;
      color:#6b7280;
      background:rgba(247,245,238,.72);
      border:1px solid rgba(10,15,24,.08);
      padding:9px 12px;
      border-radius:999px;
      backdrop-filter:blur(10px);
    }
    .robot-sim-person{
      position:absolute;
      left:22px;
      bottom:20px;
      display:flex;
      align-items:center;
      gap:10px;
      padding:8px 13px 8px 8px;
      border-radius:999px;
      color:#fff;
      background:rgba(10,15,24,.88);
      border:1px solid rgba(255,255,255,.12);
      box-shadow:0 14px 28px rgba(10,15,24,.14);
      backdrop-filter:blur(10px);
    }
    .robot-sim-person img{
      width:46px;height:46px;border-radius:50%;object-fit:cover;object-position:50% 38%;
      border:2px solid #9cff57;
    }
    .robot-sim-person strong{
      display:block;
      margin-top:2px;
      font:700 13px/1 "Space Grotesk",sans-serif;
    }
    .robot-sim-loader{
      position:absolute;
      inset:0;
      z-index:6;
      display:grid;
      place-items:center;
      background:#f7f5ee;
      transition:opacity .55s ease,visibility .55s ease;
    }
    .robot-sim-loader.is-ready{opacity:0;visibility:hidden}
    .robot-loader-copy{text-align:center}
    .robot-loader-copy b{
      display:block;
      margin-bottom:9px;
      font:700 clamp(27px,3vw,40px)/1 "Space Grotesk",sans-serif;
      letter-spacing:-.05em;
    }
    .robot-loader-copy span{
      font-size:10px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#6b7280;
    }
    .robot-loader-bar{
      width:170px;height:3px;margin:17px auto 0;border-radius:999px;overflow:hidden;background:#dedbd1;
    }
    .robot-loader-bar:before{
      content:"";display:block;width:42%;height:100%;background:#875cff;
      animation:robotLoad 1.05s ease-in-out infinite alternate;
    }
    @keyframes robotLoad{from{transform:translateX(-100%)}to{transform:translateX(238%)}}
    @keyframes robotPulse{70%{box-shadow:0 0 0 9px rgba(22,163,74,0)}100%{box-shadow:0 0 0 0 rgba(22,163,74,0)}}

    .home-page .robot-sim-stage .floating-chip,
    .home-page .robot-sim-stage .orbit-ring,
    .home-page .robot-sim-stage > .portrait-frame{display:none!important}

    @media(max-width:1100px){
      .home-page .robot-sim-stage .robot-sim-shell{height:570px}
      .home-page .robot-sim-stage{min-height:590px}
    }
    @media(max-width:900px){
      .home-page .robot-sim-stage .robot-sim-shell{width:min(100%,720px);height:520px;transform:none}
      .home-page .robot-sim-stage{min-height:540px}
    }
    @media(max-width:560px){
      .home-page .robot-sim-stage .robot-sim-shell{height:470px;border-radius:28px}
      .home-page .robot-sim-stage{min-height:490px}
      .robot-sim-label{left:14px;top:14px}
      .robot-sim-status{right:14px;top:14px}
      .robot-sim-hint{display:none}
      .robot-sim-person{left:14px;bottom:14px}
      .robot-sim-person img{width:40px;height:40px}
    }
    @media(prefers-reduced-motion:reduce){
      .robot-sim-status i,.robot-loader-bar:before{animation:none!important}
    }
  `;
  document.head.appendChild(style);

  stage.insertAdjacentHTML('beforeend', `
    <div class="robot-sim-shell" aria-label="Interactive VEX robot autonomous path animation">
      <canvas class="robot-sim-canvas"></canvas>
      <div class="robot-sim-ui" aria-hidden="true">
        <div class="robot-sim-label"><span>AUTONOMOUS / PATH PLANNING</span><strong>Build → test → iterate.</strong></div>
        <div class="robot-sim-status"><i></i> SIMULATING</div>
        <div class="robot-sim-person">
          <img src="assets/portrait-trinh.png" alt="">
          <div><small>BUILDER / DRIVER</small><strong>Khánh Trình</strong></div>
        </div>
        <div class="robot-sim-hint">MOVE CURSOR · EXPLORE THE FIELD</div>
      </div>
      <div class="robot-sim-loader">
        <div class="robot-loader-copy"><b>Initializing robot…</b><span>Loading autonomous field</span><div class="robot-loader-bar"></div></div>
      </div>
    </div>
  `);

  const canvas = stage.querySelector('.robot-sim-canvas');
  const loader = stage.querySelector('.robot-sim-loader');

  try {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf7f5ee);
    scene.fog = new THREE.Fog(0xf7f5ee, 12, 27);

    const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
    camera.position.set(8.4, 7.1, 11.6);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const hemi = new THREE.HemisphereLight(0xffffff, 0xc8c4b8, 2.1);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 4.0);
    key.position.set(5, 10, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -10;
    key.shadow.camera.right = 10;
    key.shadow.camera.top = 10;
    key.shadow.camera.bottom = -10;
    scene.add(key);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 18),
      new THREE.MeshStandardMaterial({ color: 0xf7f5ee, roughness: 0.95, metalness: 0 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(22, 18, 0x6d737c, 0xbfc1bd);
    grid.position.y = 0.012;
    grid.material.opacity = 0.62;
    grid.material.transparent = true;
    scene.add(grid);

    const fieldBorder = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(18.2, 0.04, 13.2)),
      new THREE.LineBasicMaterial({ color: 0x8a8e93, transparent: true, opacity: 0.55 })
    );
    fieldBorder.position.y = 0.025;
    scene.add(fieldBorder);

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-7.1, 0.08, 4.4),
      new THREE.Vector3(-5.6, 0.08, 4.1),
      new THREE.Vector3(-3.3, 0.08, 2.8),
      new THREE.Vector3(-1.4, 0.08, 0.5),
      new THREE.Vector3(0.0, 0.08, -1.8),
      new THREE.Vector3(2.0, 0.08, -3.3),
      new THREE.Vector3(4.2, 0.08, -3.8),
      new THREE.Vector3(5.9, 0.08, -2.1),
      new THREE.Vector3(5.2, 0.08, 0.3),
      new THREE.Vector3(3.2, 0.08, 2.5),
      new THREE.Vector3(1.1, 0.08, 3.7)
    ], false, 'catmullrom', 0.42);

    const pathPoints = curve.getPoints(180);
    const pathGeo = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const pathLine = new THREE.Line(pathGeo, new THREE.LineBasicMaterial({ color: 0xff6257, linewidth: 2 }));
    scene.add(pathLine);

    const waypointMat = new THREE.MeshStandardMaterial({ color: 0xff6257, emissive: 0x5b100d, emissiveIntensity: 0.14 });
    [0, .2, .4, .6, .8, 1].forEach(t => {
      const p = curve.getPointAt(t);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(.075, 14, 14), waypointMat);
      dot.position.copy(p);
      dot.position.y = .12;
      scene.add(dot);
    });

    const nodeMat = new THREE.MeshStandardMaterial({ color: 0x121417, roughness: .55 });
    const nodes = [
      [-7.8,-4.7],[-6.1,-1.2],[-5.0,5.0],[-3.6,-4.0],[-2.2,4.9],[-.8,-5.2],[1.8,5.1],[3.8,-4.8],[6.0,4.2],[7.8,-.6],[7.2,2.5],[.4,5.8]
    ];
    nodes.forEach(([x,z], i) => {
      const node = new THREE.Mesh(new THREE.SphereGeometry(i % 3 === 0 ? .10 : .075, 12, 12), nodeMat);
      node.position.set(x,.11,z);
      scene.add(node);
    });

    const robot = new THREE.Group();
    const white = new THREE.MeshStandardMaterial({ color: 0xf1f2ee, metalness: .34, roughness: .36 });
    const orange = new THREE.MeshStandardMaterial({ color: 0xf0a72f, metalness: .18, roughness: .42 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x232629, roughness: .62 });
    const green = new THREE.MeshStandardMaterial({ color: 0x86f05f, roughness: .44, emissive: 0x18440f, emissiveIntensity: .08 });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.25,.38,1.65), white);
    chassis.position.y = .58;
    chassis.castShadow = true;
    robot.add(chassis);

    const bumperFront = new THREE.Mesh(new THREE.BoxGeometry(2.36,.42,.24), orange);
    bumperFront.position.set(0,.58,.94);
    bumperFront.castShadow = true;
    robot.add(bumperFront);
    const bumperBack = bumperFront.clone();
    bumperBack.position.z = -.94;
    robot.add(bumperBack);

    const railA = new THREE.Mesh(new THREE.BoxGeometry(.16,1.85,.16), orange);
    railA.position.set(.78,1.45,-.30);
    railA.rotation.z = -.10;
    railA.castShadow = true;
    robot.add(railA);
    const railB = railA.clone();
    railB.position.x = -.78;
    railB.rotation.z = .10;
    robot.add(railB);

    const tower = new THREE.Mesh(new THREE.BoxGeometry(1.65,.16,.18), white);
    tower.position.set(0,2.25,-.30);
    tower.castShadow = true;
    robot.add(tower);

    const scoop = new THREE.Mesh(new THREE.BoxGeometry(1.55,.18,.82), orange);
    scoop.position.set(0,1.53,.54);
    scoop.rotation.x = -.34;
    scoop.castShadow = true;
    robot.add(scoop);

    const ball = new THREE.Mesh(new THREE.SphereGeometry(.52,24,24), green);
    ball.position.set(.43,1.35,-.38);
    ball.castShadow = true;
    robot.add(ball);

    const wheelGeo = new THREE.CylinderGeometry(.34,.34,.28,24);
    const wheels = [];
    [[-1.08,.61],[-1.08,-.61],[1.08,.61],[1.08,-.61]].forEach(([x,z]) => {
      const wheel = new THREE.Mesh(wheelGeo, dark);
      wheel.rotation.z = Math.PI/2;
      wheel.position.set(x,.38,z);
      wheel.castShadow = true;
      wheels.push(wheel);
      robot.add(wheel);
    });

    const sensorRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.5,.025,8,64),
      new THREE.MeshBasicMaterial({ color: 0x875cff, transparent:true, opacity:.45 })
    );
    sensorRing.rotation.x = Math.PI/2;
    sensorRing.position.y = .12;
    robot.add(sensorRing);

    robot.scale.setScalar(.83);
    scene.add(robot);

    const robotShadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.15, 36),
      new THREE.MeshBasicMaterial({ color:0x111111, transparent:true, opacity:.09, depthWrite:false })
    );
    robotShadow.rotation.x = -Math.PI/2;
    robotShadow.position.y = .025;
    scene.add(robotShadow);

    const pointer = { x:0, y:0 };
    const shell = stage.querySelector('.robot-sim-shell');
    shell.addEventListener('pointermove', e => {
      const r = shell.getBoundingClientRect();
      pointer.x = ((e.clientX-r.left)/r.width-.5)*2;
      pointer.y = ((e.clientY-r.top)/r.height-.5)*2;
    }, {passive:true});
    shell.addEventListener('pointerleave', () => { pointer.x = 0; pointer.y = 0; }, {passive:true});

    const resize = () => {
      const r = shell.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width));
      const h = Math.max(1, Math.round(r.height));
      renderer.setSize(w,h,false);
      camera.aspect = w/h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(shell);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, {threshold:.05});
    io.observe(shell);

    const clock = new THREE.Clock();
    let staticRendered = false;

    const renderFrame = () => {
      requestAnimationFrame(renderFrame);
      if (!visible && !reduced) return;
      if (reduced && staticRendered) return;

      const elapsed = clock.getElapsedTime();
      const t = reduced ? .54 : (elapsed * .055) % 1;
      const pos = curve.getPointAt(t);
      const tangent = curve.getTangentAt(Math.min(.999, t));
      robot.position.copy(pos);
      robot.position.y = .02 + (reduced ? 0 : Math.sin(elapsed*3.2)*.015);
      robot.rotation.y = Math.atan2(tangent.x, tangent.z);
      robotShadow.position.set(pos.x,.025,pos.z);
      sensorRing.rotation.z = reduced ? 0 : elapsed*.8;
      sensorRing.material.opacity = reduced ? .34 : .28 + Math.sin(elapsed*2.5)*.12;
      wheels.forEach((wheel,i) => { wheel.rotation.x = reduced ? 0 : elapsed * (i<2 ? 2.8 : -2.8); });

      const scrollShift = Math.min(window.scrollY / Math.max(window.innerHeight,1), 1.2);
      camera.position.x += ((8.4 + pointer.x*.9) - camera.position.x) * .045;
      camera.position.y += ((7.1 - pointer.y*.45 + scrollShift*.3) - camera.position.y) * .045;
      camera.position.z += ((11.6 + pointer.x*.15) - camera.position.z) * .045;
      camera.lookAt(.2,0.5,0);
      renderer.render(scene,camera);
      staticRendered = reduced;
    };

    setTimeout(() => loader?.classList.add('is-ready'), 420);
    renderFrame();
  } catch (error) {
    console.warn('3D hero animation could not load; using static fallback.', error);
    stage.querySelector('.robot-sim-shell')?.classList.add('is-fallback');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const drawFallback = () => {
        const r = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.floor(r.width * devicePixelRatio));
        canvas.height = Math.max(1, Math.floor(r.height * devicePixelRatio));
        ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
        ctx.clearRect(0,0,r.width,r.height);
        ctx.strokeStyle = 'rgba(10,15,24,.14)';
        ctx.lineWidth = 1;
        for(let x=0;x<r.width;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,r.height);ctx.stroke()}
        for(let y=0;y<r.height;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(r.width,y);ctx.stroke()}
        ctx.strokeStyle='#ff6257';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(35,r.height*.77);ctx.bezierCurveTo(r.width*.25,r.height*.77,r.width*.33,r.height*.42,r.width*.58,r.height*.40);ctx.bezierCurveTo(r.width*.74,r.height*.39,r.width*.76,r.height*.20,r.width*.88,r.height*.23);ctx.stroke();
        ctx.fillStyle='#f0a72f';ctx.fillRect(r.width*.51-34,r.height*.37-22,68,44);ctx.fillStyle='#f1f2ee';ctx.fillRect(r.width*.51-25,r.height*.37-13,50,26);
      };
      drawFallback();
      window.addEventListener('resize',drawFallback,{passive:true});
    }
    loader?.classList.add('is-ready');
  }
}
