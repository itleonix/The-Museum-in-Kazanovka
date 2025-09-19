// ES module version using three.module.js from our static vendor path
import * as THREE from '/static/vendor/three/three.module.js';

function ready(fn){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true }); else fn(); }

ready(function initThreeDemo() {
  const mount = document.querySelector('.main') || document.body;
  if (!mount) return;

  const holder = document.createElement('div');
  holder.style.width = '100%';
  holder.style.maxWidth = '960px';
  holder.style.height = '280px';
  holder.style.margin = '10px 0 20px 0';
  holder.style.borderRadius = '16px';
  holder.style.overflow = 'hidden';
  holder.style.background = 'rgba(0,0,0,0.05)';
  holder.style.boxShadow = 'inset 0 0 0 2px rgba(255,255,255,0.8)';

  const section = document.querySelector('.section-green');
  if (section && section.parentNode) {
    section.parentNode.insertBefore(holder, section);
  } else {
    mount.appendChild(holder);
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(2.5, 1.8, 3.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  holder.appendChild(renderer.domElement);

  function resize() {
    const w = holder.clientWidth || 600;
    const h = holder.clientHeight || 280;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', resize);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
  hemi.position.set(0, 1, 0);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(3, 5, 2);
  scene.add(dir);

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x5cc0a7, roughness: 0.35, metalness: 0.1 });
  const cube = new THREE.Mesh(boxGeo, boxMat);
  cube.position.y = 0.6;
  scene.add(cube);

  const planeGeo = new THREE.PlaneGeometry(8, 4);
  const planeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  let t = 0;
  function tick() {
    t += 0.016;
    cube.rotation.y += 0.01;
    cube.rotation.x = Math.sin(t * 0.5) * 0.15;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  resize();
  tick();
});

