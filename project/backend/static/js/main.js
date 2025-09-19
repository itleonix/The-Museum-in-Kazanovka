document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".section-left-green button");
  const back = document.querySelector(".background");
  const main = document.querySelector(".main");
  const panel = document.getElementById("section-panel");
  const pageTitle = document.querySelector('.h1-green');
  const defaultTitle = pageTitle ? pageTitle.textContent : "Энциклопедия Казановки";
  // Я читаю параметры глубокой ссылки (?item, ?theme)
  let deepItemSlug = null;
  let deepTheme = null;
  try {
    const up = new URLSearchParams(location.search);
    deepItemSlug = up.get('item') || null;
    deepTheme = up.get('theme') || null;
  } catch (e) {}
  // Я использую простой кэш <video> по src, чтобы не терять буфер
  const videoCache = new Map();
  function ensureCacheContainer() {
    let c = document.getElementById('media-cache');
    if (!c) {
      c = document.createElement('div');
      c.id = 'media-cache';
      c.style.display = 'none';
      (document.querySelector('.background') || document.body).appendChild(c);
    }
    return c;
  }
  function getCachedVideo(src) {
    if (!src) return null;
    let v = videoCache.get(src);
    if (!v) {
      v = document.createElement('video');
      v.src = src;
      v.preload = 'auto';
      v.playsInline = true;
      v.controls = true;
      v.dataset.cacheSrc = src;
      videoCache.set(src, v);
      ensureCacheContainer().appendChild(v);
    }
    return v;
  }
  

  let currentColorId = null; // запомним выбранный цвет
  // При заходе по глубокой ссылке я пропускаю первую загрузку правой панели
  let suppressNextPanelLoad = !!deepItemSlug;

  function setTheme(colorId) {
    const themes = {
      // В значениях CSS‑переменных не должно быть точки с запятой
      green:  { filter: "drop-shadow(0 8px 20px rgba(205,233,234,1))", color: "rgba(53,92,97,1)", backBtnClose: "rgba(216, 236, 237, 0.5)", backBtnCloseHover: "rgba(216, 236, 237, 0.7)" },
      blue:   { filter: "drop-shadow(0 8px 20px rgba(185,209,221,1))", color: "rgba(51,80,91,1)", backBtnClose: "rgba(222, 236, 244, 0.5)", backBtnCloseHover: "rgba(222, 236, 244, 0.7)" },
      yellow: { filter: "drop-shadow(0 8px 20px rgba(243,205,125,1))", color: "rgba(97,75,53,1)", backBtnClose: "rgba(255, 246, 215, 0.5)", backBtnCloseHover: "rgba(255, 246, 215, 0.7)" },
      orange: { filter: "drop-shadow(0 8px 20px rgba(255,195,177,1))", color: "rgba(97,65,53,1)", backBtnClose: "rgba(237, 223, 216, 0.5)", backBtnCloseHover: "rgba(237, 223, 216, 0.7)" },
      purple: { filter: "drop-shadow(0 8px 20px rgba(247,210,255,1))", color: "rgba(78,52,89,1)", backBtnClose: "rgba(233, 216, 237, 0.5)", backBtnCloseHover: "rgba(233, 216, 237, 0.7)" }
    };
    const theme = themes[colorId];
    if (!theme) return;
    document.documentElement.style.setProperty("--btn-filter", theme.filter);
    document.documentElement.style.setProperty("--btn-color", theme.color);
    document.documentElement.style.setProperty("--btn-back-close", theme.backBtnClose);
    document.documentElement.style.setProperty("--btn-hover-close", theme.backBtnCloseHover);
  }

  function btnRight(colorId) {
    const themes = {
      green:  {content: "url(/media/svg/green-right.svg)" },
      blue:   {content: "url(/media/svg/blue-right.svg)" },
      yellow: {content: "url(/media/svg/yellow-right.svg)" },
      orange: {content: "url(/media/svg/orange-right.svg)" },
      purple: {content: "url(/media/svg/purple-right.svg)" }
    };
    const theme = themes[colorId];
    if (!theme) return;
    document.documentElement.style.setProperty("--content", theme.content);
  }

  function setThemeItemsPanel(colorId) {
    const themes = {
      green:  {color: "rgba(47, 121, 108, 1)" },
      blue:   {color: "rgba(47, 101, 121, 1)" },
      yellow: {color: "rgba(153, 113, 3, 1)" },
      orange: {color: "rgba(121, 67, 47, 1)" },
      purple: {color: "rgba(94, 47, 121, 1)" }
    };
    const theme = themes[colorId];
    if (!theme) return;
    document.documentElement.style.setProperty("--items-panel-color", theme.color);
  }

  function setThemeTrackTrumb(colorId) {
    const themes = {
      green:  {track: "rgba(211, 236, 237, 1)", trumb: "rgba(255, 255, 255, 0.75)" },
      blue:   {track: "rgba(190, 221, 237, 1)", trumb: "rgba(255, 255, 255, 0.75)" },
      yellow: {track: "rgba(246, 219, 143, 1)", trumb: "rgba(255, 255, 255, 0.75)"  },
      orange: {track: "rgba(253, 170, 144, 1)", trumb: "rgba(255, 255, 255, 0.75)"  },
      purple: {track: "rgba(219, 192, 255, 1)", trumb: "rgba(255, 255, 255, 0.75)"  }
    };
    const theme = themes[colorId];
    if (!theme) return;
    document.documentElement.style.setProperty("--track-background", theme.track);
    document.documentElement.style.setProperty("--trumb-background", theme.trumb);
  }

  async function loadPanel(sectionSlug) {
    if (!panel) return;
    panel.innerHTML = `
  <div class="scroll-block">
    <div class="panel-loading">
      <div class="spinner"></div>
    </div>
  </div>`;
    try {
      const resp = await fetch(`/api/sections/${sectionSlug}/`, { headers: { Accept: "application/json" } });
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`HTTP ${resp.status}${text ? ": " + text.slice(0,180) : ""}`);
      }
      const data = await resp.json();
      renderPanel(data);
    } catch (err) {
      console.error('Failed to load section data', err);
      panel.innerHTML = `
        <div class="scroll-container">
          <div class="scroll-content">
            <div class="empty" style="padding:12px 14px; color:#a33;">Не удалось загрузить данные раздела. Проверьте сервер или БД.</div>
          </div>
          <div class="scrollbar"><div class="scrollbar-track"><div class="scrollbar-thumb"></div></div></div>
        </div>`;
    }
  }

  function applySubsectionColor(colorId) {
    if (!panel) return;
    const subs = panel.querySelectorAll(".subsection"); // берём ПОСЛЕ отрисовки
    subs.forEach(el => {
      // убрать старые цветовые классы вида subsection-*
      [...el.classList].forEach(c => c.startsWith("subsection-") && el.classList.remove(c));
      // добавить новый
      el.classList.add(`subsection-${colorId}`);
    });
  }

  function renderPanel(data) {
  const { subsections } = data;
  if (!panel) return;

  const inner = (!subsections || subsections.length === 0)
    ? `<div class="empty" style="padding:12px 14px;">Нет подразделов</div>`
    : `
      <div class="subsections">
        ${subsections.map((sub, i) => `
          <details class="subsection" ${i === 0 ? "open" : ""}>
              <summary class="subsection__title">${sub.name}</summary>
              ${
                sub.items && sub.items.length
                  ? `
                <div class="items">
                  ${sub.items.map(it => `
                    <hr>
                    <div class="item__title"><a class="item__link" href="${it.slug}">${it.title}</a></div>
                  `).join("")}
                </div>`
                  : `<div class="empty" style="padding:8px 14px;">Нет элементов</div>`
              }
          </details>
        `).join("")}
      </div>
    `;

  // ВСТАВЛЯЕМ КАСТОМНЫЙ СКРОЛЛ-КОНТЕЙНЕР
  panel.innerHTML = `
    <div class="scroll-container">
      <div class="scroll-content">
        ${inner}
      </div>
      <div class="scrollbar">
        <div class="scrollbar-track">
          <div class="scrollbar-thumb"></div>
        </div>
      </div>
    </div>
  `;

  // Покрасим свежевставленные subsections под текущую тему (если нужно)
  if (currentColorId) applySubsectionColor(currentColorId);

    // инициализация скролла и подписка на toggle
    const api = initCustomScrollbar(panel);
    panel.querySelectorAll('details.subsection').forEach(d => {
      d.addEventListener('toggle', () => api.update());
    });
    api.update(); // на всякий случай

}

function initCustomScrollbar(root) {
  const container = root.querySelector(".scroll-container");
  const content   = root.querySelector(".scroll-content");
  const track     = root.querySelector(".scrollbar-track");
  const thumb     = root.querySelector(".scrollbar-thumb");
  if (!container || !content || !track || !thumb) return { update: () => {} };

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // безопасное обновление (склеиваем частые события)
  let rafId = 0;
  const scheduleUpdate = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      updateThumb();
    });
  };

  function updateThumb() {
    const ch = content.scrollHeight;
    const vh = content.clientHeight;
    const st = content.scrollTop;

    if (ch <= vh) { thumb.style.transform = "translateY(0)"; return; }

    const trackH = track.getBoundingClientRect().height || container.clientHeight;
    const thumbH = thumb.getBoundingClientRect().height || 14;
    const maxScroll = ch - vh;
    const maxThumb  = Math.max(0, trackH - thumbH);
    const y = (st / maxScroll) * maxThumb;

    thumb.style.transform = `translateY(${y}px)`;
  }

  // прокрутка
  content.addEventListener("scroll", scheduleUpdate, { passive: true });

  // ResizeObserver: изменение размеров контента/трека
  const ro = new ResizeObserver(scheduleUpdate);
  ro.observe(content);
  ro.observe(track);

  // MutationObserver: изменения DOM + атрибутов (open у <details>)
  const mo = new MutationObserver(scheduleUpdate);
  mo.observe(content, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["open", "style", "class"]
  });

  // transitionend: когда высота меняется анимацией (например max-height/grid)
  content.addEventListener("transitionend", scheduleUpdate);
  content.addEventListener("animationend", scheduleUpdate);

  // изображения/шрифты
  content.querySelectorAll("img").forEach(img => {
    if (!img.complete) img.addEventListener("load", scheduleUpdate, { once: true });
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleUpdate).catch(() => {});
  }

  // перетаскивание «шарика»
  let dragging = false, startY = 0, startScroll = 0;
  thumb.addEventListener("mousedown", e => {
    dragging = true;
    startY = e.clientY;
    startScroll = content.scrollTop;
    document.body.style.userSelect = "none";
    e.preventDefault();
  });
  document.addEventListener("mousemove", e => {
    if (!dragging) return;
    const trackH = track.clientHeight;
    const thumbH = thumb.offsetHeight;
    const maxThumb  = Math.max(0, trackH - thumbH);
    const maxScroll = Math.max(1, content.scrollHeight - content.clientHeight);
    const dy = e.clientY - startY;
    const scrollDelta = (dy / maxThumb) * maxScroll;
    content.scrollTop = clamp(startScroll + scrollDelta, 0, maxScroll);
  });
  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.userSelect = "";
  });

  // клик по треку
  track.addEventListener("mousedown", e => {
    if (e.target === thumb) return;
    const rect = track.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const trackH = rect.height;
    const maxScroll = Math.max(1, content.scrollHeight - content.clientHeight);
    const ratio = clamp(clickY / trackH, 0, 1);
    content.scrollTop = ratio * maxScroll;
  });

  // старт
  scheduleUpdate();

  // вернём API, чтобы можно было дергать вручную после вставки нового HTML
  const api = { update: scheduleUpdate };
  root._customScrollApi = api;
  return api;
}

  function activate(btn) {
    buttons.forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");

    const colorId = btn.id;
    const sectionSlug = btn.dataset.section;
    currentColorId = colorId; // запомнить

    back.className = "background";
    back.classList.add(`background-${colorId}`);

    main.className = "main";
    main.classList.add(`main-${colorId}`);

    setTheme(colorId);
    setThemeItemsPanel(colorId);
    btnRight(colorId);
    setThemeTrackTrumb(colorId);

    if (sectionSlug) {
      if (suppressNextPanelLoad) {
        // пропустить первичную загрузку панели при глубокой ссылке на элемент
        suppressNextPanelLoad = false;
      } else {
        loadPanel(sectionSlug); // после renderPanel() будет applySubsectionColor()
      }
    } else {
      // если панель уже есть и мы просто меняем цвет
      applySubsectionColor(colorId);
    }
  }

  buttons.forEach(btn => btn.addEventListener("click", () => activate(btn)));

  // Preselect theme from URL (?theme=green|blue|yellow|orange|purple)
  if (deepTheme) {
    const btn = Array.from(buttons).find(b => b.id === deepTheme);
    if (btn) activate(btn);
  }

  if (![...buttons].some(b => b.classList.contains("selected")) && buttons.length > 0) {
    activate(buttons[0]);
  }

  // If URL contains ?item=<slug>, open that item detail directly without flashing the panel
  if (deepItemSlug) {
    const root = document.querySelector('.section-green');
    if (root) {
      const left = root.querySelector('.section-left-green');
      const right = root.querySelector('.section-right-green');
      if (left) left.style.display = 'none';
      if (right) right.style.display = 'none';
      // optional: show lightweight placeholder immediately
      let detail = document.getElementById('item-detail');
      if (!detail) {
        detail = document.createElement('div');
        detail.id = 'item-detail';
        detail.innerHTML = `
          <div class="detail-header">
            <button type="button" class="back-button" aria-label="Назад">⟵ Назад</button>
          </div>
          <div class="scroll-container"><div class="scroll-content">
            <div class="panel-loading"><div class="spinner"></div></div>
          </div><div class="scrollbar"><div class="scrollbar-track"><div class="scrollbar-thumb"></div></div></div></div>`;
        root.appendChild(detail);
      }
    }
    loadItemDetail(deepItemSlug);
  }

  // Intercept item clicks: open AJAX detail inside `.section-green`
  if (panel) {
    panel.addEventListener('click', (e) => {
      const link = e.target && e.target.closest && e.target.closest('a.item__link');
      if (!link) return;
      e.preventDefault();
      const slug = link.getAttribute('href');
      if (slug) loadItemDetail(slug);
    });
  }

  async function loadItemDetail(slug) {
    try {
      const resp = await fetch(`/api/items/${slug}/`, { headers: { Accept: 'application/json' } });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      renderItemDetail(data);
    } catch (err) {
      console.error('Failed to load item detail', err);
    }
  }

  function renderItemDetail(item) {
    const root = document.querySelector('.section-green');
    if (!root) return;

    const left = root.querySelector('.section-left-green');
    const right = root.querySelector('.section-right-green');
    if (left) left.style.display = 'none';
    if (right) right.style.display = 'none';

    let detail = root.querySelector('#item-detail');
    if (detail) detail.remove();

    const images = Array.isArray(item.images) ? item.images.filter(Boolean) : [];
    const maxImgs = Number(item.display_images_count || 0) || images.length;
    const imgsToShow = images.slice(0, maxImgs > 0 ? maxImgs : images.length);
    // Prepare media sequence: images first, then video, 3D model last
    const medias = [];
    imgsToShow.forEach(src => medias.push({ type: 'img', src }));
    if (item.video) medias.push({ type: 'video', src: item.video });
    if (item.model_3d) medias.push({ type: 'model3d', src: item.model_3d });

    detail = document.createElement('div');
    detail.id = 'item-detail';
    detail.innerHTML = `
      <div class="detail-header">
        <button type="button" class="back-button" aria-label="Назад">⟵ Назад</button>
      </div>
      <div class="scroll-container">
        <div class="scroll-content">
          ${item.description ? `<div class="item-detail__description item-detail__text">${item.description}</div>` : ''}
          <div class="detail-gallery" id="detail-gallery">
            <div class="gallery-title">Галерея</div>
            <div class="gallery-viewport"><div class="gallery-track"></div></div>
            <div class="gallery-dots"></div>
          </div>
        </div>
        <div class="scrollbar">
          <div class="scrollbar-track">
            <div class="scrollbar-thumb"></div>
          </div>
        </div>
      </div>
    `;
    root.appendChild(detail);

    // Update page H1 with the item title
    if (pageTitle) pageTitle.textContent = item.title || defaultTitle;

    

    const api = initCustomScrollbar(detail);
    api.update();

    // Embed media into the text with wrapping (video last)
    const desc = detail.querySelector('.item-detail__text');
    if (desc && medias.length) {
      embedMediaInText(desc, medias, { title: item.title || '', slug: item.slug || '' });
      api.update();
    }

    // Make inline images in text open the fullscreen viewer
    const inlineImgs = detail.querySelectorAll('.item-detail__text .media-inline img');
    if (inlineImgs.length) {
      inlineImgs.forEach((imgEl, i) => {
        imgEl.style.cursor = 'zoom-in';
        imgEl.draggable = false;
        imgEl.addEventListener('click', () => {
          const src = imgEl.getAttribute('src') || '';
          const idx = images.findIndex(u => u === src);
          const start = idx >= 0 ? idx : 0;
          openImageViewer(images.filter(Boolean), start);
        });
      });
    }

    // Initialize bottom gallery slider with all item photos
    const galleryRoot = detail.querySelector('#detail-gallery');
    if (galleryRoot) {
      initDetailGallery(galleryRoot, images.filter(Boolean), () => api.update());
    }

    const backBtn = detail.querySelector('.back-button');
    if (backBtn) backBtn.addEventListener('click', () => {
      // Move cached videos back to hidden cache container to preserve buffers
      const cache = ensureCacheContainer();
      detail.querySelectorAll('video').forEach(v => {
        if (v.dataset && v.dataset.cacheSrc) {
          cache.appendChild(v);
        }
      });
      detail.remove();
      if (left) left.style.display = '';
      if (right) right.style.display = '';
      if (pageTitle) pageTitle.textContent = defaultTitle;
      // If the right panel wasn't loaded yet (deep-link case), load it now
      try {
        if (panel && !panel.querySelector('.scroll-container')) {
          const selBtn = document.querySelector('.section-left-green button.selected');
          const slug = selBtn && selBtn.dataset ? selBtn.dataset.section : null;
          if (slug) loadPanel(slug);
        }
      } catch (e) {}
      // Remove ?item= from URL so reload doesn't reopen the last item
      try {
        const url = new URL(window.location.href);
        const params = url.searchParams;
        params.delete('item');
        if (currentColorId) params.set('theme', currentColorId);
        const qs = params.toString();
        const next = url.pathname + (qs ? ('?' + qs) : '');
        window.history.replaceState(null, '', next);
      } catch (e) {}
    });
  }
  
  // Insert media into <p> paragraphs: photos spread across first ~70% of text; video and 3D go into the remaining part
  function embedMediaInText(container, medias, options) {
    const paras = Array.from(container.querySelectorAll('p'));
    const targets = paras.length ? paras : [container];
    const P = targets.length;
    const imgs = medias.filter(m => m.type === 'img');
    const model3d = medias.find(m => m.type === 'model3d');
    const video = medias.find(m => m.type === 'video');

    // Use only the first ~70% of paragraphs for placement of photos; rest (tail) for video/3D
    const P70 = Math.max(1, Math.floor(P * 0.6));
    const zone = targets.slice(0, P70);
    const tail = targets.slice(P70);

    // Place photos evenly across the 70% zone, alternate sides
    const N = imgs.length || 0;
    imgs.forEach((m, i) => {
      const side = (i % 2 === 0) ? 'media-left' : 'media-right';
      const fig = document.createElement('figure');
      fig.className = `media-inline ${side}`;
      const img = document.createElement('img');
      img.src = m.src; img.width = 200; img.height = 150; img.alt = '';
      fig.appendChild(img);
      const idx = zone.length ? Math.min(zone.length - 1, Math.floor(((i + 0.5) * zone.length) / Math.max(1, N))) : 0;
      const t = zone[idx] || container;
      if (t.firstChild) t.insertBefore(fig, t.firstChild); else t.appendChild(fig);
    });

    // Place video in the remaining part (tail) with vertical spacing
    if (video) {
      const used = imgs.length;
      const side = (used % 2 === 0) ? 'media-left' : 'media-right';
      const fig = document.createElement('figure');
      fig.className = `media-inline media-video ${side} media-clear`;
      const v = getCachedVideo(video.src);
      if (v) { v.width = 200; v.height = 150; fig.appendChild(v); }
      const t = tail.length ? tail[0] : (targets[P - 1] || container);
      // Insert video after any already inserted figures in that paragraph
      const figures = t.querySelectorAll('.media-inline');
      const lastFig = figures.length ? figures[figures.length - 1] : null;
      if (lastFig && lastFig.nextSibling) t.insertBefore(fig, lastFig.nextSibling);
      else if (lastFig) t.appendChild(fig);
      else if (t.firstChild) t.insertBefore(fig, t.firstChild);
      else t.appendChild(fig);
    }

    // Place 3D model in the tail after video; same spacing
    if (model3d) {
      const used = imgs.length + (video ? 1 : 0);
      const side = (used % 2 === 0) ? 'media-left' : 'media-right';
      const fig = document.createElement('figure');
      // Добавляем media-clear, чтобы следующий блок ушёл ниже предыдущих флоатов (не стоял рядом)
      fig.className = `media-inline media-3d ${side} media-clear`;
      // Inline preview via three.js (no controls/legend), plus clickable overlay
      const wrap = document.createElement('div');
      wrap.className = 'model3d-embed';
      const holder = document.createElement('div');
      const holderId = `m3d-${Math.random().toString(36).slice(2)}`;
      holder.id = holderId;
      holder.className = 'model3d-canvas';
      wrap.appendChild(holder);
      const overlay = document.createElement('div');
      overlay.className = 'model3d-overlay';
      overlay.setAttribute('role', 'button');
      overlay.setAttribute('tabindex', '0');
      overlay.title = 'Открыть 3D модель';
      const overlayImg = document.createElement('img');
      overlayImg.className = 'model3d-overlay__img';
      overlayImg.src = '/media/3d/3d-model.png';
      overlayImg.alt = 'Открыть 3D модель';
      overlay.appendChild(overlayImg);
      const openFull = () => openModelViewer(model3d.src, options && options.title, options && options.slug);
      overlay.addEventListener('click', openFull);
      overlay.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFull(); } });
      wrap.appendChild(overlay);
      fig.appendChild(wrap);

      // Lazy-init inline renderer via ES module
      const mod = document.createElement('script');
      mod.type = 'module';
      const safeSrc = encodeURIComponent(model3d.src);
      mod.textContent = `
        import * as THREE from '/static/vendor/three/three.module.js';
        import { GLTFLoader } from '/static/vendor/three/examples/jsm/loaders/GLTFLoader.js';
        import { DRACOLoader } from '/static/vendor/three/examples/jsm/loaders/DRACOLoader.js';
        (function(){
          const el = document.getElementById('${holderId}');
          if (!el) return;
          const scene = new THREE.Scene();
          const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
          const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
          renderer.outputColorSpace = THREE.SRGBColorSpace;
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1.4;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
          el.appendChild(renderer.domElement);

          // Lights
          const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8); scene.add(hemi);
          const amb = new THREE.AmbientLight(0xffffff, 0.22); scene.add(amb);
          const key = new THREE.DirectionalLight(0xffffff, 1.3); scene.add(key); scene.add(key.target);

          function size(){ const w = el.clientWidth||300, h = el.clientHeight||200; camera.aspect = w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h,false); }
          new ResizeObserver(size).observe(el); size();

          function frame(obj){ const b=new THREE.Box3().setFromObject(obj), c=b.getCenter(new THREE.Vector3()), s=b.getSize(new THREE.Vector3()); const md=Math.max(s.x,s.y,s.z)||1; const dist = md/(2*Math.tan((Math.PI*camera.fov)/360)) * 0.8; camera.position.copy(c).add(new THREE.Vector3(1,0.6,1).normalize().multiplyScalar(dist)); camera.lookAt(c); key.position.copy(camera.position); key.target.position.copy(c); key.target.updateMatrixWorld(); }

          const loader = new GLTFLoader(); const draco = new DRACOLoader(); draco.setDecoderPath('/static/vendor/three/examples/jsm/libs/draco/'); loader.setDRACOLoader(draco);
          loader.load(decodeURIComponent('${safeSrc}'), (g)=>{ const root=g.scene||g.scenes?.[0]; if(!root) return; scene.add(root); frame(root); render(); }, undefined, (e)=>{ /* ignore */ });

          function render(){ renderer.render(scene,camera); }
        })();
      `;
      fig.appendChild(mod);
      // Поместим модель через несколько абзацев после видео
      const GAP_PARAGRAPHS = 2; // количество абзацев между видео и 3D
      const targetIdx = tail.length ? Math.min(tail.length - 1, GAP_PARAGRAPHS) : -1;
      const t = targetIdx >= 0 ? tail[targetIdx] : (targets[P - 1] || container);
      // Insert after any already inserted figures in that paragraph
      const figures = t.querySelectorAll('.media-inline');
      const lastFig = figures.length ? figures[figures.length - 1] : null;
      if (lastFig && lastFig.nextSibling) t.insertBefore(fig, lastFig.nextSibling);
      else if (lastFig) t.appendChild(fig);
      else if (t.firstChild) t.insertBefore(fig, t.firstChild);
      else t.appendChild(fig);
    }
  }

  function openModelViewer(url, title, slug) {
    if (!url) return;
    const p = new URLSearchParams();
    p.set('src', url);
    if (currentColorId) p.set('theme', currentColorId);
    if (title) p.set('title', title);
    if (slug) p.set('slug', slug);
    const href = `/three-viewer/?${p.toString()}`;
    window.location.href = href;
  }

  // Нижний слайдер: только изображения, точки + перетаскивание/свайпы
  function initDetailGallery(root, images, notifyUpdate) {
    const viewport = root.querySelector('.gallery-viewport');
    const track = root.querySelector('.gallery-track');
    const dotsWrap = root.querySelector('.gallery-dots');
    if (!viewport || !track || !dotsWrap) return;

    // Я создаю слайды и точки пагинации
    track.innerHTML = '';
    dotsWrap.innerHTML = '';
    images.forEach((src, i) => {
      const slide = document.createElement('div');
      slide.className = 'gallery-slide';
      slide.dataset.index = String(i);
      const img = document.createElement('img');
      img.src = src; img.alt = '';
      img.draggable = false;
      slide.appendChild(img);
      track.appendChild(slide);

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'gallery-dot';
      dot.setAttribute('aria-label', `Страница ${i+1}`);
      dot.addEventListener('click', () => animateTo(i * slideWidth()));
      dotsWrap.appendChild(dot);
      // dot visibility will be updated dynamically based on reachable pages

      if (img && !img.complete) img.addEventListener('load', () => notifyUpdate && notifyUpdate(), { once: true });
    });

    // Я включаю инерционную прокрутку по оси X
    let pos = 0;                      // current scroll position in px
    let startPos = 0;                 // position at pointerdown
    let dragging = false, moved = false;
    let lastX = 0, lastT = 0;         // for velocity
    let velocity = 0;                 // px/ms (positive → move left)
    let rafId = 0;                    // momentum animation id
    let downIndex = -1;               // for click-open

    function slideWidth() {
      const first = track.querySelector('.gallery-slide');
      if (!first) return 0;
      const rect = first.getBoundingClientRect();
      const gap = parseFloat(getComputedStyle(track).gap || getComputedStyle(track).columnGap || 0) || 0;
      return rect.width + gap;
    }
    function maxTranslateX() {
      const total = track.scrollWidth || track.getBoundingClientRect().width || 0;
      const vw = viewport.clientWidth || 0;
      return Math.max(0, total - vw);
    }
    function reachablePagesCount() {
      const swRaw = slideWidth();
      const maxX = maxTranslateX();
      // If layout isn't ready yet (no widths), show all dots for now
      if (!swRaw || swRaw <= 1 || !isFinite(swRaw) || maxX === 0) {
        return images.length;
      }
      const sw = Math.max(1, swRaw);
      // With index = round(pos/sw), indices reachable are 0..floor((maxX+sw/2)/sw)
      const maxIndex = Math.floor((maxX + sw / 2) / sw);
      return Math.max(1, Math.min(images.length, maxIndex + 1));
    }

    function updateDotsVisibility() {
      const count = reachablePagesCount();
      const dots = Array.from(dotsWrap.querySelectorAll('.gallery-dot'));
      dots.forEach((d, i) => {
        const visible = i < count;
        d.style.display = visible ? '' : 'none';
        d.setAttribute('aria-hidden', visible ? 'false' : 'true');
      });
    }

    function apply() {
      const maxX = maxTranslateX();
      if (pos < 0) pos = 0; else if (pos > maxX) pos = maxX;
      track.style.transform = `translateX(${-pos}px)`;
      updateDotsVisibility();
      const sw = Math.max(1, slideWidth());
      const visibleCount = reachablePagesCount();
      const idx = Math.max(0, Math.min(visibleCount - 1, Math.round(pos / sw)));
      dotsWrap.querySelectorAll('.gallery-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
      notifyUpdate && notifyUpdate();
    }
    function stopMomentum() { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } }
    function animateTo(target) {
      stopMomentum();
      const start = pos;
      const maxX = maxTranslateX();
      const to = Math.max(0, Math.min(maxX, target));
      const dur = 400; // ms
      const t0 = performance.now();
      const easeOutCubic = (t)=>1-Math.pow(1-t,3);
      const step = () => {
        const now = performance.now();
        const p = Math.min(1, (now - t0)/dur);
        pos = start + (to - start) * easeOutCubic(p);
        apply();
        if (p < 1) rafId = requestAnimationFrame(step); else rafId = 0;
      };
      rafId = requestAnimationFrame(step);
    }
    function momentum() {
      stopMomentum();
      const friction = 0.94;           // decay per frame
      const minVel = 0.02;             // px/ms threshold to stop
      let last = performance.now();
      const tick = () => {
        const now = performance.now();
        const dt = Math.max(0, now - last); last = now;
        pos += velocity * dt;
        apply();
        // bounce at edges by zeroing velocity
        if (pos <= 0 || pos >= maxTranslateX()) velocity *= 0.5;
        velocity *= friction;
        if (Math.abs(velocity) < minVel) { rafId = 0; return; }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }

    // События указателя: drag/свайпы
    viewport.addEventListener('pointerdown', (e) => {
      dragging = true; moved = false; stopMomentum();
      startPos = pos; startX = e.clientX; lastX = e.clientX; lastT = performance.now(); velocity = 0;
      viewport.setPointerCapture(e.pointerId);
      root.classList.add('dragging');
      const el = e.target && e.target.closest ? e.target.closest('.gallery-slide') : null;
      if (el) { downIndex = Array.from(track.children).indexOf(el); } else { downIndex = -1; }
    });
    let startX = 0;
    viewport.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - startX;      // смещение с момента нажатия
      pos = startPos - dx;                 // контент движу противоположно указателю
      // скорость в px/ms (отрицательная — если движение вправо)
      const dt = Math.max(1, now - lastT);
      const instV = (lastX - e.clientX) / dt; // px per ms
      // Я сглаживаю резкие пики (low‑pass)
      velocity = 0.7 * velocity + 0.3 * instV;
      lastX = e.clientX; lastT = now;
      if (Math.abs(dx) > 1) moved = true;
      track.style.transition = 'none';
      apply();
      e.preventDefault();
    });
    function endDrag(e) {
      if (!dragging) return; dragging = false;
      track.style.transition = 'none';
      const clickThreshold = 5;
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      // Обновляю скорость последней дельтой — чтобы не было рывка
      const vFinal = (lastX - e.clientX) / dt;
      if (!Number.isNaN(vFinal) && isFinite(vFinal) && Math.abs(vFinal) > 0.001) {
        velocity = vFinal;
      }
      if (!moved || Math.abs(e.clientX - startX) < clickThreshold) {
        if (downIndex >= 0) openImageViewer(images, downIndex);
      } else {
        momentum();
      }
      root.classList.remove('dragging');
      startX = 0;
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('pointerleave', endDrag);

    // Инициализация: повторяю в rAF — даю раскладке стабилизироваться
    apply();
    requestAnimationFrame(() => apply());
    window.addEventListener('resize', () => apply());
  }

  // Полноэкранный просмотр изображений: я добавляю оверлей в `.background`
  function openImageViewer(images, startIndex) {
    if (!Array.isArray(images) || images.length === 0) return;
    const container = back || document.querySelector('.background') || document.body;
    let index = Math.max(0, Math.min(startIndex || 0, images.length - 1));

    const overlay = document.createElement('div');
    overlay.className = 'image-viewer';
    overlay.innerHTML = `
      <button type="button" class="viewer-close" aria-label="Закрыть"></button>
      <div class="viewer-center"><img class="viewer-image" alt="" /></div>
    `;
    const imgEl = overlay.querySelector('.viewer-image');
    const closeBtn = overlay.querySelector('.viewer-close');

    function setSrc() {
      imgEl.src = images[index] || '';
    }

    let switchSeq = 0;
    function preloadAndSwap(targetSrc, mySeq) {
      const loader = new Image();
      loader.onload = () => {
        if (mySeq !== switchSeq) return; // пришёл более свежий запрос
        imgEl.src = targetSrc;
        // Я обеспечиваю видимость fade‑in даже при кэшированной картинке
        requestAnimationFrame(() => { imgEl.style.opacity = '1'; });
      };
      loader.onerror = () => {
        if (mySeq !== switchSeq) return;
        // Даже при ошибке я делаю fade‑in, чтобы не зависнуть невидимым
        requestAnimationFrame(() => { imgEl.style.opacity = '1'; });
      };
      loader.src = targetSrc;
    }
    function switchTo(newIndex) {
      const next = Math.max(0, Math.min(images.length - 1, newIndex));
      if (next === index) return;
      const mySeq = ++switchSeq;
      const doSwap = () => {
        // reset zoom/pan on image change
        scale = 1; tx = 0; ty = 0; imgEl.style.transform = '';
        index = next;
        preloadAndSwap(images[index] || '', mySeq);
      };
      // Если уже прозрачное (быстрые переключения) — меняю сразу
      const currentOpacity = parseFloat(getComputedStyle(imgEl).opacity || '1');
      if (currentOpacity <= 0.01) {
        doSwap();
      } else {
        const onFadeOut = (ev) => {
          if (ev && ev.propertyName !== 'opacity') return;
          imgEl.removeEventListener('transitionend', onFadeOut);
          if (mySeq !== switchSeq) return; // пришёл более свежий запрос
          doSwap();
        };
        imgEl.addEventListener('transitionend', onFadeOut);
        // Запускаю fade‑out
        imgEl.style.opacity = '0';
      }
    }

    function close() {
      document.body.style.overflow = '';
      overlay.remove();
      window.removeEventListener('keydown', onKey);
    }

    function onKey(e) {
      if (e.key === 'Escape') { close(); }
      else if (e.key === 'ArrowLeft') { switchTo(index - 1); }
      else if (e.key === 'ArrowRight') { switchTo(index + 1); }
    }

    closeBtn.addEventListener('click', close);
    // Свайп/щипок/перетаскивание для полноэкранного вьюера с зумом
    let vDragging = false, vStartX = 0, vMoved = false;
    let scale = 1, tx = 0, ty = 0, panStartX = 0, panStartY = 0;
    const pointers = new Map();
    let pinchStartDist = 0, startScale = 1;
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    function clampTy(val) {
      if (scale <= 1) return 0;
      const vh = window.innerHeight || imgEl.parentElement?.clientHeight || 0;
      const limit = (vh * (1 - 1/scale)) / 2; // держу верх/низ без зазоров
      return clamp(val, -limit, limit);
    }
    function clampTx(val) {
      if (scale <= 1) return 0;
      const vw = window.innerWidth || imgEl.parentElement?.clientWidth || 0;
      const baseW = imgEl.clientWidth || vw; // ширина при scale=1
      const scaledW = baseW * scale;
      if (scaledW <= vw) return 0; // горизонтальный pan не нужен, если картинка уже вьюпорта
      const limit = (scaledW - vw) / 2; // на экстремумах края совпадают
      return clamp(val, -limit, limit);
    }
    function applyTransform() {
      tx = clampTx(tx);
      ty = clampTy(ty);
      imgEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    }

    overlay.addEventListener('pointerdown', (e) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      vMoved = false;
      if (pointers.size === 2) {
        const ps = Array.from(pointers.values());
        pinchStartDist = Math.hypot(ps[1].x - ps[0].x, ps[1].y - ps[0].y) || 1;
        startScale = scale;
      } else if (scale > 1 && pointers.size === 1) {
        vDragging = true;
        panStartX = e.clientX - tx;
        panStartY = e.clientY - ty;
        overlay.setPointerCapture && overlay.setPointerCapture(e.pointerId);
      } else if (scale === 1 && pointers.size === 1) {
        vDragging = true; vStartX = e.clientX;
        overlay.setPointerCapture && overlay.setPointerCapture(e.pointerId);
      }
    });
    overlay.addEventListener('pointermove', (e) => {
      const p = pointers.get(e.pointerId);
      if (p) { p.x = e.clientX; p.y = e.clientY; }
      if (pointers.size === 2) {
        const ps = Array.from(pointers.values());
        const dist = Math.hypot(ps[1].x - ps[0].x, ps[1].y - ps[0].y) || 1;
        const next = clamp(startScale * (dist / (pinchStartDist || 1)), 1, 5);
        if (Math.abs(next - scale) > 0.001) vMoved = true;
        scale = next; applyTransform(); e.preventDefault(); return;
      }
      if (vDragging && scale > 1 && pointers.size === 1) {
        tx = e.clientX - panStartX;
        ty = e.clientY - panStartY;
        applyTransform(); vMoved = true; e.preventDefault();
      } else if (vDragging && scale === 1 && pointers.size === 1) {
        const dx = e.clientX - vStartX; if (Math.abs(dx) > 3) vMoved = true; e.preventDefault();
      }
    });
    function endViewerDrag(e) {
      pointers.delete(e.pointerId);
      if (pointers.size >= 1) return; // жду отпускания всех указателей
      if (!vDragging) return; vDragging = false;
      const dx = e.clientX - (vStartX || e.clientX);
      const threshold = Math.max(60, window.innerWidth * 0.1);
      if (scale === 1) {
        if (dx > threshold) { switchTo(index - 1); }
        else if (dx < -threshold) { switchTo(index + 1); }
      }
    }
    overlay.addEventListener('pointerup', endViewerDrag);
    overlay.addEventListener('pointercancel', endViewerDrag);
    overlay.addEventListener('pointerleave', endViewerDrag);
    // Prevent backdrop-click close after a swipe
    overlay.addEventListener('click', (e) => { if (vMoved) { e.stopImmediatePropagation(); } }, true);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    document.body.style.overflow = 'hidden';
    container.appendChild(overlay);
    // ensure image is fully visible
    imgEl.style.opacity = '1';
    imgEl.style.transformOrigin = 'center center';
    setSrc();
    // Wheel zoom (mouse/touchpad)
    overlay.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = -e.deltaY;
      const factor = Math.pow(1.0018, delta);
      const next = clamp(scale * factor, 1, 5);
      if (Math.abs(next - scale) < 0.001) return;
      scale = next; applyTransform();
    }, { passive: false });
    window.addEventListener('keydown', onKey);
  }
});

