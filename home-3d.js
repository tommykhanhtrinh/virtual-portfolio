import * as THREE from 'https://unpkg.com/three@0.168.0/build/three.module.js';

const stage = document.querySelector('.home-page .portrait-stage');

if (stage) {
  stage.classList.add('robot-sim-stage');
  stage.innerHTML = `
    <div class="robot-sim-shell">
      <canvas class="robot-sim-canvas" aria-label="Interactive 3D VEX robot animation"></canvas>
      <div class="robot-sim-ui" aria-hidden="true">
        <div class="robot-sim-label"><span>VERTEX 50922S</span><strong>Push Back · digital twin</strong></div>
        <div class="robot-sim-phase"><span>01</span><b>BUILD</b></div>
        <div class="robot-sim-telemetry">
          <span>POSE</span><b class="telemetry-pose">x 0.00 · y 0.00 · θ 0°</b>
          <span>STATE</span><b class="telemetry-state">INITIALIZING</b>
        </div>
        <div class="robot-sim-hint">SCROLL / MOVE CURSOR ↗</div>
        <div class="robot-sim-axis"><i></i><i></i><i></i><small>X&nbsp;&nbsp;Y&nbsp;&nbsp;Z</small></div>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.id = 'robot-sim-styles';
  style.textContent = `
    .home-page .robot-sim-stage{min-height:650px;display:grid;place-items:center;position:relative;isolation:isolate}
    .home-page .robot-sim-shell{width:min(100%,620px);height:650px;position:relative;overflow:hidden;border-radius:42px;border:1px solid rgba(10,15,24,.13);background:#f7f5ee;box-shadow:0 38px 90px rgba(10,15,24,.14);transform:rotate(1deg);isolation:isolate}
    .home-page .robot-sim-shell:after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;box-shadow:inset 0 0 0 1px rgba(255,255,255,.58);z-index:8}
    .robot-sim-canvas{width:100%;height:100%;display:block;cursor:crosshair}
    .robot-sim-ui{position:absolute;inset:0;z-index:5;pointer-events:none;font-family:"DM Sans",sans-serif;color:#0a0f18}
    .robot-sim-label{position:absolute;left:22px;top:22px;display:flex;flex-direction:column;gap:3px;padding:12px 14px;border-radius:18px;background:rgba(247,245,238,.78);border:1px solid rgba(10,15,24,.11);backdrop-filter:blur(12px);box-shadow:0 12px 28px rgba(10,15,24,.08)}
    .robot-sim-label span,.robot-sim-telemetry span,.robot-sim-hint,.robot-sim-axis small{font-size:9px;font-weight:900;letter-spacing:.11em;text-transform:uppercase}
    .robot-sim-label strong{font:700 15px/1.1 "Space Grotesk",sans-serif;letter-spacing:-.02em}
    .robot-sim-phase{position:absolute;right:20px;top:20px;width:88px;height:88px;border-radius:50%;background:#0a0f18;color:#fff;display:grid;place-content:center;text-align:center;box-shadow:0 14px 35px rgba(10,15,24,.18)}
    .robot-sim-phase span{font:700 10px/1 "Space Grotesk",sans-serif;color:#9cff57;letter-spacing:.08em}.robot-sim-phase b{font:700 18px/1.05 "Space Grotesk",sans-serif;letter-spacing:-.03em;margin-top:4px}
    .robot-sim-telemetry{position:absolute;left:22px;bottom:22px;min-width:210px;display:grid;grid-template-columns:auto 1fr;gap:4px 10px;padding:12px 14px;border-radius:16px;background:rgba(10,15,24,.86);color:#fff;border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(12px);box-shadow:0 12px 30px rgba(10,15,24,.18)}
    .robot-sim-telemetry span{color:#9aa4b1}.robot-sim-telemetry b{font:700 10px/1.2 "Space Grotesk",sans-serif;letter-spacing:.03em}
    .robot-sim-hint{position:absolute;right:24px;bottom:24px;color:#59616b;background:rgba(255,255,255,.7);padding:9px 11px;border-radius:999px;border:1px solid rgba(10,15,24,.1);backdrop-filter:blur(10px)}
    .robot-sim-axis{position:absolute;right:24px;bottom:70px;width:62px;height:62px}.robot-sim-axis i{position:absolute;left:28px;bottom:18px;width:28px;height:2px;background:#111;transform-origin:left center}.robot-sim-axis i:nth-child(1){transform:rotate(0deg);background:#ff5c5c}.robot-sim-axis i:nth-child(2){transform:rotate(-90deg);background:#4f8cff}.robot-sim-axis i:nth-child(3){transform:rotate(145deg);background:#40b36e}.robot-sim-axis small{position:absolute;bottom:0;right:0;color:#5b6169;font-size:7px}
    @media(max-width:900px){.home-page .robot-sim-shell{height:560px}.home-page .robot-sim-stage{min-height:560px}}
    @media(max-width:680px){.home-page .robot-sim-shell{height:500px;border-radius:30px}.robot-sim-label{left:14px;top:14px}.robot-sim-phase{right:14px;top:14px;width:70px;height:70px}.robot-sim-phase b{font-size:14px}.robot-sim-telemetry{left:14px;bottom:14px;min-width:185px}.robot-sim-hint,.robot-sim-axis{display:none}}
    @media(prefers-reduced-motion:reduce){.home-page .robot-sim-shell{transform:none}}
  `;
  document.head.appendChild(style);

  const canvas = stage.querySelector('.robot-sim-canvas');
  const shell = stage.querySelector('.robot-sim-shell');
  const phaseEl = stage.querySelector('.robot-sim-phase');
  const poseEl = stage.querySelector('.telemetry-pose');
  const stateEl = stage.querySelector('.telemetry-state');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf7f5ee);
  scene.fog = new THREE.FogExp2(0xf7f5ee, 0.018);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  camera.position.set(15.5, 11.5, 18.5);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.07;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const hemi = new THREE.HemisphereLight(0xffffff, 0xb9c1cb, 2.0);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 3.2);
  key.position.set(10, 18, 9); key.castShadow = true; key.shadow.mapSize.set(2048,2048); scene.add(key);
  const rim = new THREE.DirectionalLight(0x7ec8ff, 2.0); rim.position.set(-10, 7, -9); scene.add(rim);
  const green = new THREE.PointLight(0x9cff57, 16, 20, 2); green.position.set(-5,4,6); scene.add(green);

  const matMetal = new THREE.MeshStandardMaterial({ color:0x9ea5ad, metalness:.9, roughness:.28 });
  const matDark = new THREE.MeshStandardMaterial({ color:0x11151b, metalness:.55, roughness:.34 });
  const matBlue = new THREE.MeshStandardMaterial({ color:0x3c63ff, metalness:.55, roughness:.3 });
  const matRed = new THREE.MeshStandardMaterial({ color:0xff3b4d, metalness:.45, roughness:.35 });
  const matGreen = new THREE.MeshStandardMaterial({ color:0x9cff57, metalness:.15, roughness:.48 });
  const matWhite = new THREE.MeshStandardMaterial({ color:0xf4f6f8, metalness:.2, roughness:.35 });
  const matRubber = new THREE.MeshStandardMaterial({ color:0x191b1f, metalness:.05, roughness:.82 });
  const matYellow = new THREE.MeshStandardMaterial({ color:0xffcf3a, metalness:.15, roughness:.5 });

  const root = new THREE.Group();
  scene.add(root);

  const addBox = (parent, size, pos, mat, rot=[0,0,0]) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat); mesh.position.set(...pos); mesh.rotation.set(...rot); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const addCylinder = (parent, r, depth, pos, mat, rot=[Math.PI/2,0,0], segments=28) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r,r,depth,segments), mat); mesh.position.set(...pos); mesh.rotation.set(...rot); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };

  function makePerforatedBeam(length, vertical=false){
    const g = new THREE.Group();
    addBox(g, vertical?[.28,length,.28]:[length,.28,.28], [0,0,0], matMetal);
    const count = Math.max(3,Math.floor(length/.55));
    const holeGeo = new THREE.CylinderGeometry(.07,.07,.31,12);
    const holeMat = new THREE.MeshStandardMaterial({color:0x272b30,metalness:.2,roughness:.65});
    for(let i=0;i<count;i++){
      const h = new THREE.Mesh(holeGeo,holeMat);
      const t = count===1?0:i/(count-1)-.5;
      if(vertical){h.position.set(0,t*(length-.42),0);h.rotation.x=Math.PI/2;}
      else{h.position.set(t*(length-.42),0,0);h.rotation.x=Math.PI/2;}
      g.add(h);
    }
    return g;
  }

  const robot = new THREE.Group();
  robot.scale.setScalar(.92);
  root.add(robot);

  for (const z of [-2.15,2.15]) {
    const rail = makePerforatedBeam(5.8); rail.position.set(0,.78,z); robot.add(rail);
    const rail2 = makePerforatedBeam(5.8); rail2.position.set(0,1.22,z); robot.add(rail2);
  }
  for (const x of [-2.75,0,2.75]) addBox(robot,[.3,.35,4.55],[x,1,0],matMetal);
  addBox(robot,[5.1,.18,3.65],[0,1.45,0],new THREE.MeshStandardMaterial({color:0x242830,metalness:.75,roughness:.38}));

  const wheels=[];
  [-2.2,0,2.2].forEach(x=>{
    [-2.55,2.55].forEach(z=>{
      const w=addCylinder(robot,.73,.54,[x,.72,z],matRubber,[Math.PI/2,0,0],32); wheels.push(w);
      addCylinder(robot,.34,.58,[x,.72,z],matBlue,[Math.PI/2,0,0],24);
      addCylinder(robot,.13,.7,[x,.72,z],matMetal,[Math.PI/2,0,0],16);
    });
  });
  [-1.25,1.25].forEach(x=>[-1.72,1.72].forEach(z=>{
    addBox(robot,[1.05,.72,.72],[x,1.05,z],matDark);
    addCylinder(robot,.28,.18,[x,1.05,z+(z>0?.44:-.44)],matRed,[Math.PI/2,0,0]);
  }));

  addBox(robot,[2.65,.8,2.05],[.3,2.05,.15],new THREE.MeshStandardMaterial({color:0x3b414b,metalness:.25,roughness:.45}));
  addBox(robot,[1.75,.48,.98],[-1.35,1.9,.05],matDark);
  addBox(robot,[1.2,.34,.75],[1.8,1.88,-.15],matBlue);
  const screenMat = new THREE.MeshStandardMaterial({color:0x70dbff,emissive:0x143e55,emissiveIntensity:1.2,metalness:.05,roughness:.2});
  addBox(robot,[1.8,.08,1.25],[.35,2.47,.12],screenMat,[0,0,0]);

  [-1.75,1.75].forEach(x=>{
    const tower = makePerforatedBeam(4.6,true); tower.position.set(x,3.75,0); robot.add(tower);
    addBox(robot,[.34,4.6,.34],[x,3.75,.75],matMetal);
  });
  addBox(robot,[3.9,.28,.36],[0,5.85,.15],matMetal);

  const intake = new THREE.Group(); intake.position.set(0,2.35,-2.85); robot.add(intake);
  addBox(intake,[4.6,.28,.3],[0,0,0],matMetal);
  const flexWheels=[];
  [-1.6,-.55,.55,1.6].forEach(x=>{
    const fw=addCylinder(intake,.46,.34,[x,.22,-.08],matGreen,[0,0,Math.PI/2],28); flexWheels.push(fw);
    addCylinder(intake,.12,.38,[x,.22,-.08],matMetal,[0,0,Math.PI/2],16);
  });
  addBox(intake,[4.9,.18,1.05],[0,-.34,-.4],matDark,[.15,0,0]);

  addBox(robot,[3.65,.32,.32],[0,4.15,-1.08],matMetal,[0,0,.08]);
  addBox(robot,[3.65,.32,.32],[0,4.15,1.08],matMetal,[0,0,-.08]);
  addBox(robot,[2.4,.34,2.4],[.15,4.5,0],new THREE.MeshStandardMaterial({color:0x191d24,metalness:.35,roughness:.55,transparent:true,opacity:.88}));
  addBox(robot,[1.6,.22,.25],[0,5.15,-1.2],matRed);

  addCylinder(robot,.32,1.6,[2.35,3.15,.35],matWhite,[0,0,Math.PI/2],24);
  addCylinder(robot,.18,1.1,[-2.25,3.05,.45],matYellow,[0,0,Math.PI/2],24);
  for(let i=0;i<7;i++){
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.1+i*.12,2.6,.8),
      new THREE.Vector3(-1.4+i*.08,3.1,1.3),
      new THREE.Vector3(.3+i*.04,3.35,1.4),
      new THREE.Vector3(2.1,3.15,.75-i*.06)
    ]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve,20,.025,6,false),new THREE.MeshStandardMaterial({color:i%2?0x77d6ff:0xe8f2f7,roughness:.45})); robot.add(tube);
  }

  const boltGeo=new THREE.CylinderGeometry(.055,.055,.12,10); const boltMat=new THREE.MeshStandardMaterial({color:0xcfd3d7,metalness:1,roughness:.18});
  for(let x=-2.4;x<=2.4;x+=.48){ for(const z of [-2.32,2.32]){ const b=new THREE.Mesh(boltGeo,boltMat); b.position.set(x,1.28,z); b.rotation.x=Math.PI/2; robot.add(b); } }

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.MeshStandardMaterial({color:0xe7e4dc,roughness:.86,metalness:0})); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
  const grid = new THREE.GridHelper(20,20,0x9ca3af,0xcdd2d8); grid.position.y=.012; grid.material.opacity=.42; grid.material.transparent=true; scene.add(grid);
  const wallMat=new THREE.MeshStandardMaterial({color:0xe9edf1,metalness:.15,roughness:.45,transparent:true,opacity:.9});
  addBox(scene,[20,.3,.3],[0,.15,-10],wallMat); addBox(scene,[20,.3,.3],[0,.15,10],wallMat); addBox(scene,[.3,.3,20],[-10,.15,0],wallMat); addBox(scene,[.3,.3,20],[10,.15,0],wallMat);

  const goalMat=new THREE.MeshStandardMaterial({color:0x242832,metalness:.42,roughness:.35});
  [-6.6,6.6].forEach(x=>{
    addBox(scene,[.35,3.2,4.5],[x,1.6,0],goalMat);
    addBox(scene,[1.8,.22,4.5],[x+(x<0?.9:-.9),.5,0],goalMat);
  });
  for(const x of [-4.2,0,4.2]) for(const z of [-5.2,5.2]) addCylinder(scene,.38,.34,[x,.38,z],x<0?matRed:matBlue,[0,0,0],28);

  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-6.5,.08,5.2),
    new THREE.Vector3(-4.3,.08,2.5),
    new THREE.Vector3(-1.8,.08,1.8),
    new THREE.Vector3(.2,.08,-.8),
    new THREE.Vector3(3.2,.08,-2.5),
    new THREE.Vector3(5.8,.08,-5.1)
  ]);
  const pathTube = new THREE.Mesh(new THREE.TubeGeometry(path,100,.055,8,false),new THREE.MeshBasicMaterial({color:0xff304f})); scene.add(pathTube);
  const pathPts=path.getPoints(80); const dotGeo=new THREE.SphereGeometry(.08,10,10); const dotMat=new THREE.MeshBasicMaterial({color:0xff304f});
  pathPts.filter((_,i)=>i%5===0).forEach(p=>{const d=new THREE.Mesh(dotGeo,dotMat);d.position.copy(p);scene.add(d)});

  const ringMat=new THREE.MeshBasicMaterial({color:0x61d8ff,transparent:true,opacity:.22,side:THREE.DoubleSide});
  const rings=[];
  [2.5,3.2,3.9].forEach((r,i)=>{const ring=new THREE.Mesh(new THREE.RingGeometry(r,r+.035,96),ringMat.clone()); ring.rotation.x=-Math.PI/2; ring.position.y=.05+i*.02; scene.add(ring);rings.push(ring)});

  const nodeMat=new THREE.MeshStandardMaterial({color:0x0a0f18,roughness:.4});
  const particles=[];
  for(let i=0;i<90;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(Math.random()*.035+.025,8,8),nodeMat);
    m.position.set((Math.random()-.5)*22,Math.random()*12+1,(Math.random()-.5)*22);
    scene.add(m);particles.push(m);
  }

  let mouseX=0,mouseY=0,targetMouseX=0,targetMouseY=0,scrollP=0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  shell.addEventListener('pointermove',e=>{
    const r=shell.getBoundingClientRect(); targetMouseX=((e.clientX-r.left)/r.width-.5)*2; targetMouseY=((e.clientY-r.top)/r.height-.5)*2;
  });
  shell.addEventListener('pointerleave',()=>{targetMouseX=0;targetMouseY=0});

  function resize(){
    const rect=shell.getBoundingClientRect(); renderer.setSize(rect.width,rect.height,false); camera.aspect=rect.width/rect.height; camera.updateProjectionMatrix();
  }
  resize(); new ResizeObserver(resize).observe(shell);

  function clamp01(v){return Math.max(0,Math.min(1,v));}
  function updateScroll(){
    const hero=document.querySelector('.home-hero'); if(!hero)return;
    const rect=hero.getBoundingClientRect(); const total=Math.max(1,hero.offsetHeight-window.innerHeight*.45);
    scrollP=clamp01((-rect.top)/total);
  }
  window.addEventListener('scroll',updateScroll,{passive:true}); updateScroll();

  const cameraPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(15.5,11.5,18.5),
    new THREE.Vector3(9.5,8.5,14.5),
    new THREE.Vector3(5.5,6.5,11.5),
    new THREE.Vector3(11.5,7.3,6.5)
  ]);

  const clock=new THREE.Clock();
  function animate(){
    const t=clock.getElapsedTime(); mouseX+=(targetMouseX-mouseX)*.055; mouseY+=(targetMouseY-mouseY)*.055;
    const p=reduced?.36:scrollP;
    const phase=p<.28?0:p<.62?1:2;
    const phaseData=[['01','BUILD','ASSEMBLY / CHECK'],['02','TEST','AUTONOMOUS RUN'],['03','REBUILD','DIAGNOSE / ITERATE']][phase];
    phaseEl.innerHTML=`<span>${phaseData[0]}</span><b>${phaseData[1]}</b>`; stateEl.textContent=phaseData[2];

    let pathT;
    if(phase===0){pathT=.05+Math.sin(t*.45)*.012;}
    else if(phase===1){pathT=.08+((t*.055)%1)*.84;}
    else{pathT=.72+Math.sin(t*.7)*.035;}
    const pos=path.getPointAt(clamp01(pathT)); const tan=path.getTangentAt(clamp01(pathT));
    robot.position.copy(pos); robot.position.y=.05 + Math.sin(t*2.1)*.025;
    robot.rotation.y=Math.atan2(tan.x,tan.z);
    robot.rotation.z=Math.sin(t*1.5)*.006;
    wheels.forEach((w,i)=>w.rotation.y += (phase===1?.09:.015)*(i%2?1:-1));
    flexWheels.forEach(w=>w.rotation.x += phase===1?.16:.025);

    rings.forEach((r,i)=>{r.position.x=robot.position.x;r.position.z=robot.position.z;r.material.opacity=.11+.08*Math.sin(t*1.5+i);r.scale.setScalar(1+.025*Math.sin(t*1.2+i));});
    particles.forEach((m,i)=>{m.position.y += Math.sin(t*.45+i)*.00045;});

    const cp=cameraPath.getPointAt(p);
    camera.position.set(cp.x+mouseX*1.25,cp.y-mouseY*.8,cp.z+mouseX*.5);
    const look=new THREE.Vector3(robot.position.x*.72,2.2+mouseY*.4,robot.position.z*.72);
    camera.lookAt(look);

    poseEl.textContent=`x ${robot.position.x.toFixed(2)} · y ${robot.position.z.toFixed(2)} · θ ${Math.round(THREE.MathUtils.radToDeg(robot.rotation.y))}°`;
    renderer.render(scene,camera); requestAnimationFrame(animate);
  }
  animate();
}
