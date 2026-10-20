/* Filmstrip gallery (replacement for the Showit "sliding-gallery" / Flickity widget used in the Inquiry section).
   Settings from the source: type filmstrip, wrap-around, centred cell, dots on, auto-advance 2s, draggable. */
(function () {
  var AUTOPLAY_MS = 2000;

  function Filmstrip(root, opts) {
    var slider = root.querySelector('.ssg-slider');
    var cells = Array.prototype.slice.call(slider.querySelectorAll('.ssg-slider-cell'));
    var ar = cells.map(function (c) { return parseFloat(c.getAttribute('data-ar')) || (c.naturalWidth / c.naturalHeight) || 0.667; });
    var xs = [], widths = [], total = 0, H = 0, C = 0;
    var pos = 0, target = 0, selected = 0, dragging = false, hover = false, timer = null, anim = 0, scale = 1;

    var dots = document.createElement('ol'); dots.className = 'flickity-page-dots';
    cells.forEach(function (_, i) {
      var li = document.createElement('li'); li.className = 'dot';
      li.addEventListener('click', function () { go(i); restart(); });
      dots.appendChild(li);
    });
    slider.appendChild(dots);

    function measure() {
      H = slider.offsetHeight; C = slider.offsetWidth; total = 0;
      cells.forEach(function (c, i) { widths[i] = H * ar[i]; xs[i] = total; total += widths[i]; });
      var r = slider.getBoundingClientRect(); scale = C ? r.width / C : 1;
    }
    function center(i) { return xs[i] + widths[i] / 2; }
    function wrap(v) { var h = total / 2; return ((v + h) % total + total) % total - h; }
    function render() {
      cells.forEach(function (c, i) {
        var rel = wrap(center(i) - pos);
        /* 'translate' (not 'transform'): gallery.css forces transform:scale(1) !important on the selected cell */
        c.style.translate = (C / 2 + rel - widths[i] / 2).toFixed(2) + 'px 0';
        c.style.width = widths[i].toFixed(2) + 'px';
      });
      var nearest = 0, best = 1e9;
      cells.forEach(function (c, i) { var d = Math.abs(wrap(center(i) - pos)); if (d < best) { best = d; nearest = i; } });
      mark(nearest);
    }
    function mark(i) {
      if (i === selected && cells[i].classList.contains('is-selected')) return;
      selected = i;
      cells.forEach(function (c, k) { c.classList.toggle('is-selected', k === i); });
      Array.prototype.forEach.call(dots.children, function (d, k) { d.classList.toggle('is-selected', k === i); });
    }
    function tick() {
      pos += (target - pos) * 0.14;
      if (Math.abs(target - pos) < 0.2) { pos = target; anim = 0; render(); return; }
      render(); anim = requestAnimationFrame(tick);
    }
    function moveTo(t) { target = t; if (!anim && !dragging) anim = requestAnimationFrame(tick); }
    function go(i) {                                  // nearest wrapped route to cell i
      var d = wrap(center(i) - pos); moveTo(pos + d);
    }
    function next() { go((selected + 1) % cells.length); }
    function restart() {
      clearInterval(timer);
      if (opts.autoplay && !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        timer = setInterval(function () { if (!dragging && !hover && !document.hidden) next(); }, opts.autoplay);
    }

    /* dragging */
    var startX = 0, startPos = 0, lastX = 0, lastT = 0, vel = 0;
    slider.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      dragging = true; cancelAnimationFrame(anim); anim = 0;
      startX = lastX = e.clientX; startPos = pos; lastT = performance.now(); vel = 0;
      slider.classList.add('is-dragging'); slider.setPointerCapture(e.pointerId);
    });
    slider.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var now = performance.now();
      pos = startPos - (e.clientX - startX) / scale;
      vel = (e.clientX - lastX) / scale / Math.max(1, now - lastT); lastX = e.clientX; lastT = now;
      render();
    });
    function end() {
      if (!dragging) return; dragging = false; slider.classList.remove('is-dragging');
      var projected = pos - vel * 180;               // light momentum
      var best = 0, bd = 1e9;
      cells.forEach(function (c, i) { var d = Math.abs(wrap(center(i) - projected)); if (d < bd) { bd = d; best = i; } });
      target = pos + wrap(center(best) - pos); anim = requestAnimationFrame(tick); restart();
    }
    slider.addEventListener('pointerup', end); slider.addEventListener('pointercancel', end);
    slider.addEventListener('mouseenter', function () { hover = true; });
    slider.addEventListener('mouseleave', function () { hover = false; });
    cells.forEach(function (c) { c.draggable = false; });

    function relayout() { measure(); pos = target = pos; render(); }
    measure(); pos = target = center(0); render(); restart();
    slider.style.opacity = 1;
    document.addEventListener('layout:done', relayout);
    window.addEventListener('load', relayout);
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-gallery]'), function (g) {
    new Filmstrip(g, { autoplay: AUTOPLAY_MS });
  });
})();
