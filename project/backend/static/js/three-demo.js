// Simple three.js demo hooked into the existing layout
// Uses global THREE from vendor/three/three.min.js
(function () {
  if (typeof THREE === 'undefined') return; // three.js not loaded
  function ready(fn){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  ready(function initThreeDemo() {
    // Render inside main container; fallback to body
    var mount = document.querySelector('.main') || document.body;
    if (!mount) return;

    // Create container so it does not interfere with existing flow
    var holder = document.createElement('div');
    holder.style.width = '100%';
    holder.style.maxWidth = '960px';
    holder.style.height = '280px';
    holder.style.margin = '10px 0 20px 0';
    holder.style.borderRadius = '16px';
    holder.style.overflow = 'hidden';
    holder.style.background = 'rgba(0,0,0,0.05)';
    holder.style.boxShadow = 'inset 0 0 0 2px rgba(255,255,255,0.8)';

    // Place it under the page title, before the sections
    var section = document.querySelector('.section-green');
    if (section && section.parentNode) {
      section.parentNode.insertBefore(holder, section);
    } else {
      mount.appendChild(holder);
    }

    // Three.js boilerplate
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(2.5, 1.8, 3.2);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    holder.appendChild(renderer.domElement);

    // Resize handler
    function resize() {
      var w = holder.clientWidth || 600;
      var h = holder.clientHeight || 280;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    window.addEventListener('resize', resize);

    // Lights
    var hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
    hemi.position.set(0, 1, 0);
    scene.add(hemi);
    var dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(3, 5, 2);
    scene.add(dir);

    // Content: a colored spinning box on a plane
    var boxGeo = new THREE.BoxGeometry(1, 1, 1);
    var boxMat = new THREE.MeshStandardMaterial({ color: 0x5cc0a7, roughness: 0.35, metalness: 0.1 });
    var cube = new THREE.Mesh(boxGeo, boxMat);
    cube.position.y = 0.6;
    scene.add(cube);

    var planeGeo = new THREE.PlaneGeometry(8, 4);
    var planeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
    var plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    // Animate
    var t = 0;
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
})();

