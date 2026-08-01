// Lightweight Three.js astronaut made from primitives
// No external model required — creates a stylized astronaut and floats it
(function(){
  // Guard if THREE is not present
  if (typeof THREE === 'undefined') return console.warn('Three.js not found. Include three.js before astronaut.js');

  const container = document.getElementById('astronautCanvas');
  if (!container) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1020);

  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 4);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Lights
  const amb = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(amb);
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(5,10,7);
  scene.add(dir);

  // Materials
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf6f7f9, metalness: 0.05, roughness: 0.6 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x20232a, metalness: 0.2, roughness: 0.5 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x88c0ff, metalness: 0, roughness: 0.1, transmission: 0.9, transparent: true, opacity: 0.95 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x2bb7ff, metalness: 0.3, roughness: 0.4 });

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

  // Arms
  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.6, 12), whiteMat);
  leftArm.position.set(-0.55, 1.05, 0);
  leftArm.rotation.z = 0.4;
  astronaut.add(leftArm);

  const rightArm = leftArm.clone();
  rightArm.position.set(0.55, 1.05, 0);
  rightArm.rotation.z = -0.4;
  astronaut.add(rightArm);

  // Legs
  const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.7, 12), whiteMat);
  leftLeg.position.set(-0.18, 0.2, 0);
  leftLeg.rotation.z = 0.06;
  astronaut.add(leftLeg);

  const rightLeg = leftLeg.clone();
  rightLeg.position.set(0.18, 0.2, 0);
  rightLeg.rotation.z = -0.06;
  astronaut.add(rightLeg);

  // small details
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.02), accentMat);
  visor.position.set(0, 1.6, 0.31);
  astronaut.add(visor);

  scene.add(astronaut);

  // Floor subtle
  const floor = new THREE.Mesh(new THREE.CircleGeometry(3, 64), new THREE.MeshStandardMaterial({ color:0x071022, metalness:0, roughness:1 }));
  floor.rotation.x = -Math.PI/2;
  floor.position.y = -0.6;
  scene.add(floor);

  // Animation
  let t = 0;
  function animate(){
    t += 0.01;
    astronaut.rotation.y = Math.sin(t*0.6) * 0.15;
    astronaut.position.y = 0.05 * Math.sin(t*1.2);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  // Resize handling
  window.addEventListener('resize', () => {
    const w = container.clientWidth; const h = container.clientHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

})();
