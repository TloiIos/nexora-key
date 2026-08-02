// Lightweight Three.js astronaut made from primitives
// No external model required — creates a stylized astronaut and floats it
(function(){
  if (typeof THREE === 'undefined') return console.warn('Three.js not found. Include three.js before astronaut.js');
  const container = document.getElementById('astronautCanvas');
  if (!container) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x061021);

  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 4);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);

  // Lights
  const amb = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(amb);
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(3,6,5);
  scene.add(dir);
  const rim = new THREE.PointLight(0x6fd3ff, 0.35, 10);
  rim.position.set(-2,2,3);
  scene.add(rim);

  // Materials
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf6f7f9, metalness: 0.05, roughness: 0.55 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x20232a, metalness: 0.2, roughness: 0.45 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x77bfff, metalness: 0, roughness: 0.06, transmission: 0.92, transparent: true, opacity: 0.95, clearcoat: 0.2 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x2bb7ff, metalness: 0.2, roughness: 0.35, emissive: 0x10364a, emissiveIntensity: 0.2 });

  const astronaut = new THREE.Group();

  // Head + helmet
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 32), darkMat);
  head.position.set(0, 1.6, 0);
  astronaut.add(head);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 32), glassMat);
  helmet.position.copy(head.position);
  astronaut.add(helmet);

  // Body
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.5, 6, 16), whiteMat);
  body.position.set(0, 0.85, 0);
  astronaut.add(body);

  // Backpack
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.2), darkMat);
  pack.position.set(0, 0.95, -0.33);
  astronaut.add(pack);

  // Arms (parented to pivot for nicer animation)
  const leftPivot = new THREE.Object3D(); leftPivot.position.set(-0.4,1.25,0);
  const rightPivot = new THREE.Object3D(); rightPivot.position.set(0.4,1.25,0);

  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.6, 12), whiteMat);
  leftArm.position.set(0, -0.3, 0);
  leftArm.rotation.z = 0.25;
  leftPivot.add(leftArm);
  astronaut.add(leftPivot);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.6, 12), whiteMat);
  rightArm.position.set(0, -0.3, 0);
  rightArm.rotation.z = -0.25;
  rightPivot.add(rightArm);
  astronaut.add(rightPivot);

  // Legs
  const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.7, 12), whiteMat);
  leftLeg.position.set(-0.18, 0.2, 0);
  leftLeg.rotation.z = 0.06;
  astronaut.add(leftLeg);

  const rightLeg = leftLeg.clone();
  rightLeg.position.set(0.18, 0.2, 0);
  rightLeg.rotation.z = -0.06;
  astronaut.add(rightLeg);

  // visor accent
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.02), accentMat);
  visor.position.set(0, 1.6, 0.31);
  astronaut.add(visor);

  scene.add(astronaut);

  // Floor subtle
  const floor = new THREE.Mesh(new THREE.CircleGeometry(3, 64), new THREE.MeshStandardMaterial({ color:0x04101a, metalness:0, roughness:1 }));
  floor.rotation.x = -Math.PI/2;
  floor.position.y = -0.6;
  scene.add(floor);

  // Orbiting particles
  const particles = new THREE.Group();
  const pMat = new THREE.MeshStandardMaterial({ color:0x69d1ff, emissive:0x4fbfff, emissiveIntensity:0.8, metalness:0.2, roughness:0.3 });
  const pGeo = new THREE.SphereGeometry(0.03, 8, 8);
  const orbiters = [];
  for(let i=0;i<4;i++){
    const m = new THREE.Mesh(pGeo, pMat);
    const r = 0.9 + i*0.2;
    m.userData = {r: r, speed: 0.6 + i*0.18, phase: Math.random()*Math.PI*2, yOffset: (i-1.5)*0.05};
    particles.add(m);
    orbiters.push(m);
  }
  scene.add(particles);

  // Animation (clock-based for smoothness)
  const clock = new THREE.Clock();

  function animate(){
    const t = clock.getElapsedTime();

    // gentle rotation + bob
    const rotY = Math.sin(t*0.6) * 0.25;
    astronaut.rotation.y += (rotY - astronaut.rotation.y) * 0.08; // smooth lerp
    const bob = Math.sin(t*0.9) * 0.08;
    astronaut.position.y += (bob - astronaut.position.y) * 0.08;

    // head subtle look-around
    head.rotation.y = Math.sin(t*0.8) * 0.12;
    head.rotation.x = Math.sin(t*0.5) * 0.06;

    // arms swing
    leftPivot.rotation.z = Math.sin(t*1.6) * 0.18;
    rightPivot.rotation.z = -Math.sin(t*1.6) * 0.18;

    // legs small move
    leftLeg.rotation.x = Math.sin(t*1.2) * 0.06;
    rightLeg.rotation.x = -Math.sin(t*1.2) * 0.06;

    // orbiters
    orbiters.forEach((m, i) => {
      const u = m.userData;
      const ang = t * u.speed + u.phase;
      m.position.set(Math.cos(ang) * u.r, 1.2 + u.yOffset + Math.sin(t*0.8 + i) * 0.03, Math.sin(ang) * u.r);
      m.scale.setScalar(0.7 + Math.sin(t*2 + i)*0.12);
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  // Resize handling
  function onResize(){
    const w = container.clientWidth; const h = container.clientHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);
  // initial resize in case CSS changed size after load
  setTimeout(onResize, 50);

})();
