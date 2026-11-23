/* ==========================================================================
   ritext — Liquid Glass: деликатные эффекты взаимодействия
   Аккуратные стеклянные подсказки вместо системных title.
   (Свет под курсором убран ради скорости.) Слушатели passive, ничего тяжёлого.
   ========================================================================== */
(function () {
  'use strict';

  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.documentElement;

  /* ---------- Стеклянные подсказки ---------- */
  if (finePointer) {
    var tip = document.createElement('div');
    tip.className = 'lg-tooltip';
    tip.setAttribute('role', 'tooltip');
    document.body.appendChild(tip);

    var target = null, timer = 0, lastShown = 0;

    function textOf(el) {
      var t = el.getAttribute('title');
      if (t) {
        // системную подсказку отключаем, но имя для скринридеров сохраняем
        if (!el.getAttribute('aria-label') && !el.textContent.trim()) el.setAttribute('aria-label', t);
        el.setAttribute('data-tip', t);
        el.removeAttribute('title');
      }
      return el.getAttribute('data-tip') || '';
    }
    function hide() {
      clearTimeout(timer);
      tip.classList.remove('is-on');
      target = null;
    }
    function show(el) {
      var text = textOf(el);
      if (!text || !document.body.contains(el)) return;
      tip.textContent = text;
      var r = el.getBoundingClientRect();
      var w = tip.offsetWidth, h = tip.offsetHeight;
      var x = Math.round(Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2)));
      var below = r.top - h - 10 < 8;
      var y = Math.round(below ? r.bottom + 10 : r.top - h - 10);
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
      tip.classList.toggle('is-below', below);
      tip.classList.add('is-on');
      lastShown = Date.now();
    }
    document.addEventListener('pointerover', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var el = e.target && e.target.closest ? e.target.closest('[title], [data-tip]') : null;
      if (el === target) return;
      hide();
      if (!el) return;
      target = el;
      textOf(el); // сразу убираем title, чтобы не мигала системная подсказка
      // если подсказка только что была — следующая появляется почти сразу
      var delay = Date.now() - lastShown < 700 ? 80 : 520;
      timer = setTimeout(function () { if (target === el) show(el); }, delay);
    }, true);
    document.addEventListener('pointerout', function (e) {
      if (target && !target.contains(e.relatedTarget)) hide();
    }, true);
    ['pointerdown', 'keydown', 'wheel', 'scroll', 'blur'].forEach(function (ev) {
      window.addEventListener(ev, hide, { passive: true, capture: true });
    });
  }
})();
