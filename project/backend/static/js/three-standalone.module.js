import * as THREE from '/static/vendor/three/three.module.js';

function ready(fn){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true }); else fn(); }

ready(() => {
  const holder = document.getElementById('three-stage');
  if (!holder) return;

  // Я создаю сцену и камеру
  const scene = new THREE.Scene();
  scene.background = null;
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 1.2, 3.5);

  // Я настраиваю рендерер
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  holder.appendChild(renderer.domElement);

  // Я добавляю освещение
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(2, 3, 2);
  scene.add(dir);

  // Я добавляю один куб в центре сцены
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x5cc0a7, roughness: 0.35, metalness: 0.1 })
  );
  scene.add(cube);

  // Я делаю простое орбитальное управление (без внешних зависимостей)
  let isDown = false, sx = 0, sy = 0, az = 0.6, el = 0.25, dist = 4.0;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  function updateCamera() {
    const x = dist * Math.cos(el) * Math.sin(az);
    const y = dist * Math.sin(el);
    const z = dist * Math.cos(el) * Math.cos(az);
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
  }
  holder.addEventListener('pointerdown', (e) => { isDown = true; sx = e.clientX; sy = e.clientY; holder.setPointerCapture && holder.setPointerCapture(e.pointerId); });
  holder.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    az -= (e.clientX - sx) * 0.005;
    el += (e.clientY - sy) * 0.005;
    el = clamp(el, -1.2, 1.2);
    sx = e.clientX; sy = e.clientY; updateCamera();
  });
  holder.addEventListener('pointerup', () => { isDown = false; });
  holder.addEventListener('wheel', (e) => { e.preventDefault(); dist = clamp(dist * (e.deltaY > 0 ? 1.08 : 0.92), 2.0, 12.0); updateCamera(); }, { passive: false });

  // Я обрабатываю ресайз контейнера
  function resize() {
    const w = holder.clientWidth || 800;
    const h = holder.clientHeight || 600;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', resize);

  // Я запускаю анимацию
  function tick() {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.015;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  resize();
  updateCamera();
  tick();
});
