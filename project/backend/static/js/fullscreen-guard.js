// Basic protections only (no fullscreen logic)
(function(){
  const d = document;
  // Disable context menu globally
  d.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
  // Prevent accidental text selection / copying
  d.addEventListener('selectstart', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
  d.addEventListener('copy', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
  d.addEventListener('cut', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
  // Minimal CSS: no selection except for inputs/editables
  try {
    const style = d.createElement('style');
    style.setAttribute('data-guard', 'true');
    style.textContent = `
      html, body { -webkit-user-select: none; user-select: none; }
      input, textarea, [contenteditable="true"] { -webkit-user-select: text; user-select: text; caret-color: auto; }
      * { -webkit-tap-highlight-color: transparent; }
    `;
    d.head.appendChild(style);
  } catch(_) {}
})();
