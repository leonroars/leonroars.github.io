/* ============================================================
   PORTFOLIO — Theme, Language Toggle & Inline Pan-Zoom
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEYS = { theme: 'portfolio-theme', lang: 'portfolio-lang' };

  function getInitialTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.theme);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function getInitialLang() {
    const saved = localStorage.getItem(STORAGE_KEYS.lang);
    if (saved) return saved;
    const browserLang = navigator.language || navigator.userLanguage || '';
    return browserLang.toLowerCase().startsWith('ko') ? 'ko' : 'en';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀' : '☾';
  }

  function applyLang(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    localStorage.setItem(STORAGE_KEYS.lang, lang);
    const btn = document.getElementById('lang-toggle');
    if (btn) btn.textContent = lang === 'ko' ? 'EN' : 'KO';
    document.title = lang === 'ko'
      ? (document.documentElement.dataset.titleKo || '채호연 — 포트폴리오')
      : (document.documentElement.dataset.titleEn || 'HoYeon Chae — Portfolio');
  }

  function init() {
    applyTheme(getInitialTheme());
    applyLang(getInitialLang());

    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    });

    document.getElementById('lang-toggle')?.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-lang');
      applyLang(cur === 'ko' ? 'en' : 'ko');
    });

    initPanZoom();
  }

  // === Inline Pan-Zoom (map-style: scroll to zoom, drag to pan) ===
  function initPanZoom() {
    const containers = document.querySelectorAll('.pan-zoom-container');
    if (!containers.length) return;

    containers.forEach(container => {
      const inner = container.querySelector('.pan-zoom-inner');
      if (!inner) return;

      let scale = 1, panX = 0, panY = 0;
      let isPanning = false;
      let startX, startY, startPanX, startPanY;

      function apply() {
        inner.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + scale + ')';
      }

      function clamp() {
        const r = container.getBoundingClientRect();
        const cw = inner.scrollWidth * scale;
        const ch = inner.scrollHeight * scale;
        const mx = Math.max(0, (cw - r.width) / 2 + 120);
        const my = Math.max(0, (ch - r.height) / 2 + 120);
        panX = Math.max(-mx, Math.min(mx, panX));
        panY = Math.max(-my, Math.min(my, panY));
      }

      function zoom(delta, cx, cy) {
        const r = container.getBoundingClientRect();
        if (cx === undefined) cx = r.width / 2;
        if (cy === undefined) cy = r.height / 2;
        const prev = scale;
        scale = Math.max(0.5, Math.min(5, scale + delta));
        const ratio = scale / prev;
        panX = cx - ratio * (cx - panX);
        panY = cy - ratio * (cy - panY);
        clamp();
        apply();
      }

      function reset() { scale = 1; panX = 0; panY = 0; apply(); }

      // Scroll wheel → zoom toward cursor
      container.addEventListener('wheel', e => {
        e.preventDefault();
        const r = container.getBoundingClientRect();
        zoom(e.deltaY > 0 ? -0.15 : 0.15, e.clientX - r.left, e.clientY - r.top);
      }, { passive: false });

      // Mouse drag → pan
      container.addEventListener('mousedown', e => {
        if (e.target.closest('.pan-zoom-btn')) return;
        isPanning = true;
        startX = e.clientX; startY = e.clientY;
        startPanX = panX; startPanY = panY;
        container.style.cursor = 'grabbing';
        e.preventDefault();
      });

      window.addEventListener('mousemove', e => {
        if (!isPanning) return;
        panX = startPanX + (e.clientX - startX);
        panY = startPanY + (e.clientY - startY);
        clamp(); apply();
      });

      window.addEventListener('mouseup', () => {
        if (isPanning) { isPanning = false; container.style.cursor = ''; }
      });

      // Touch: single finger drag, two finger pinch
      let lastDist = 0, lastCenter = null;

      container.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
          isPanning = true;
          startX = e.touches[0].clientX; startY = e.touches[0].clientY;
          startPanX = panX; startPanY = panY;
        } else if (e.touches.length === 2) {
          isPanning = false;
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          lastDist = Math.sqrt(dx * dx + dy * dy);
          const r = container.getBoundingClientRect();
          lastCenter = {
            x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left,
            y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top
          };
        }
      }, { passive: true });

      container.addEventListener('touchmove', e => {
        if (e.touches.length === 1 && isPanning) {
          panX = startPanX + (e.touches[0].clientX - startX);
          panY = startPanY + (e.touches[0].clientY - startY);
          clamp(); apply(); e.preventDefault();
        } else if (e.touches.length === 2 && lastDist) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          zoom((dist - lastDist) * 0.005, lastCenter.x, lastCenter.y);
          lastDist = dist; e.preventDefault();
        }
      }, { passive: false });

      container.addEventListener('touchend', () => { isPanning = false; lastDist = 0; }, { passive: true });

      // Button controls (+, -, reset)
      container.querySelectorAll('.pan-zoom-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const a = btn.dataset.action;
          if (a === 'zoom-in') zoom(0.3);
          if (a === 'zoom-out') zoom(-0.3);
          if (a === 'reset') reset();
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
