import * as THREE from '/static/vendor/three/three.module.js';
import { GLTFLoader } from '/static/vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from '/static/vendor/three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from '/static/vendor/three/examples/jsm/controls/OrbitControls.js';

function ready(fn){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true }); else fn(); }

ready(() => {
  const mount = document.getElementById('viewer');
  if (!mount) return;
  // Loading overlay controls
  let overlay = mount.querySelector('#loading-overlay');
  let overlayRemoved = false;
  const overlayText = overlay ? overlay.querySelector('.loading-text') : null;
  function showOverlay(msg){ if (!overlay || overlayRemoved) return; overlay.style.display = 'flex'; if (msg && overlayText) overlayText.textContent = msg; }
  function hideOverlay(){ if (!overlay || overlayRemoved) return; try { overlay.remove(); overlayRemoved = true; } catch(_) { overlay.style.display = 'none'; overlay.style.pointerEvents = 'none'; } }
  showOverlay('Загрузка модели…');

  // Я создаю сцену
  const scene = new THREE.Scene();
  scene.background = null;

  // Я настраиваю камеру
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.set(2.5, 1.6, 3.2);

  // Я готовлю WebGL‑рендерер
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // Сделаем картинку заметно светлее
  renderer.toneMappingExposure = 1.6;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  mount.appendChild(renderer.domElement);

  // Я добавляю свет: мягкий общий + «фонарик» от камеры
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
  hemi.position.set(0, 1, 0);
  scene.add(hemi);
  const ambient = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
  scene.add(keyLight);
  scene.add(keyLight.target);

  // Ground removed

  // Я читаю параметры URL (embed и src) до инициализации контролов
  const params = new URLSearchParams(location.search);
  const srcParam = params.get('src');
  const isEmbed = params.has('embed');

  // Я настраиваю OrbitControls (жесты/зум/панорама)
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 0.7, 0);
  controls.enableZoom = !isEmbed;
  controls.enablePan = !isEmbed;
  controls.enableRotate = !isEmbed;
  controls.rotateSpeed = 0.9;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  // Сделаем изначальные границы более широкими; уточним после кадрирования модели
  controls.minDistance = 0.1;
  controls.maxDistance = 400;
  // Touch mapping for kiosks: one finger rotate, two fingers pinch+pan
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  // Prevent browser gestures on the canvas in some browsers
  renderer.domElement.style.touchAction = 'none';

  // Я отслеживаю resize и подгоняю рендер
  function resize() {
    const w = mount.clientWidth || 800;
    const h = mount.clientHeight || 600;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', resize);

  // Вспомогательные функции кадрирования и ограничений зума
  function frameObject(obj) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fitDist = maxDim / (2 * Math.atan((Math.PI * camera.fov) / 360));
    const dist = fitDist * 1.4;
    const dirToCam = new THREE.Vector3(1, 0.5, 1).normalize();
    camera.position.copy(center).addScaledVector(dirToCam, dist);
    controls.target.copy(center);
    controls.update();
    return { center, dist, size };
  }

  function updateZoomLimits(baseDist) {
    // Позволим сильно приближать и удалять, но в разумных пределах относительно размеров модели
    const minD = Math.max(0.05, baseDist * 0.02);   // можно приблизить до 2% от базовой дистанции
    const maxD = Math.max(20, baseDist * 80);       // можно отдалить до 80x
    controls.minDistance = minD;
    controls.maxDistance = maxD;
  }

  function updateHeadLight() {
    // Я «привязываю» направленный свет к камере и цели обзора
    keyLight.position.copy(camera.position);
    keyLight.target.position.copy(controls.target);
    keyLight.target.updateMatrixWorld();
  }

  // Я создаю загрузчик GLTF/GLB (c DRACO)
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath('/static/vendor/three/examples/jsm/libs/draco/');
  loader.setDRACOLoader(draco);

  // Я определяю URL модели из параметров
  const url = srcParam || '/media/3d/scene.glb';
  let modelCenter = new THREE.Vector3();
  loader.load(url, (gltf) => {
    const root = gltf.scene || gltf.scenes?.[0];
    if (!root) throw new Error('Empty GLB');
    scene.add(root);
    const framed = frameObject(root); // я кадрирую модель в кадр
    modelCenter = framed.center;
    updateZoomLimits(framed.dist);
    updateHeadLight();
    controls.saveState && controls.saveState();
    // Фон оставляю статичным — задан в шаблоне/CSS
    // model loaded → hide overlay after next paint
    requestAnimationFrame(hideOverlay);
  }, (e) => {
    // progress — update percent if available
    try {
      if (e && e.total && e.total > 0 && overlayText) {
        const pct = Math.min(100, Math.round((e.loaded / e.total) * 100));
        overlayText.textContent = `Загрузка модели… ${pct}%`;
      }
    } catch(_) {}
  }, (err) => {
    console.error('GLB load error:', err);
    if (overlay && overlayText) {
      overlay.style.background = 'rgba(255,255,255,0.85)';
      overlayText.textContent = 'Не удалось загрузить модель';
    } else {
      const div = document.createElement('div');
      div.className = 'error';
      div.textContent = 'Не удалось загрузить /media/3d/scene.glb';
      document.body.appendChild(div);
    }
  });

  // Рендер‑цикл
  function tick() {
    controls.update();
    updateHeadLight();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  // Я обновляю свет при движении камеры
  controls.addEventListener('change', () => { updateHeadLight(); });

  // Динамическую подстройку фона я отключил — фон статичен

  // Кнопки HUD для тач‑экранов
  const zoomInBtn = isEmbed ? null : mount.querySelector('.hud-zoom-in');
  const zoomOutBtn = isEmbed ? null : mount.querySelector('.hud-zoom-out');
  const resetBtn = isEmbed ? null : mount.querySelector('.hud-reset');
  function stop(e){ e.preventDefault(); e.stopPropagation(); }
  const step = 140; // bigger step → более заметный зум на клике
  function zoomIn() { // я приближаю камеру
    const s = (typeof controls._getZoomScale === 'function') ? controls._getZoomScale(step) : 0.95;
    if (typeof controls._dollyIn === 'function') { controls._dollyIn(s); } else { /* fallback: move camera */ const v = new THREE.Vector3(); v.subVectors(camera.position, controls.target).multiplyScalar(0.95); camera.position.copy(v.add(controls.target)); }
    controls.update(); updateHeadLight();
  }
  function zoomOut() { // я отдаляю камеру
    const s = (typeof controls._getZoomScale === 'function') ? controls._getZoomScale(step) : 0.95;
    if (typeof controls._dollyOut === 'function') { controls._dollyOut(s); } else { const v = new THREE.Vector3(); v.subVectors(camera.position, controls.target).multiplyScalar(1/0.95); camera.position.copy(v.add(controls.target)); }
    controls.update(); updateHeadLight();
  }
  if (zoomInBtn) zoomInBtn.addEventListener('pointerdown', (e) => { stop(e); zoomIn(); });
  if (zoomOutBtn) zoomOutBtn.addEventListener('pointerdown', (e) => { stop(e); zoomOut(); });
  if (resetBtn) resetBtn.addEventListener('pointerdown', (e) => { stop(e); controls.reset && controls.reset(); updateHeadLight(); });

  // Двойной тап — я сбрасываю вид
  let lastTap = 0;
  renderer.domElement.addEventListener('pointerdown', (e) => {
    const t = performance.now();
    if (t - lastTap < 300) {
      // reset: zoom a bit out toward default and re-aim
      if (!isEmbed) { controls.reset && controls.reset(); updateHeadLight(); }
    }
    lastTap = t;
  }, { passive: true });

  resize();
  tick();
});
