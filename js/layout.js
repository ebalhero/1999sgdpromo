/* Layout engine: reproduces how Showit places the fixed-size design canvas (1200px desktop / 320px mobile)
   inside the real viewport. Per-element left/top/width/height come from page.css; this script only applies
   (a) uniform scaling of the canvas, (b) horizontal edge-locking of elements when the viewport is wider
   than the canvas, and (c) vertical locking in "window height" (wH) sections.                           */
(function () {
  var L = window.SITE_LAYOUT, root = document.documentElement;
  var byId = {};
  L.elements.forEach(function (e) { byId[e.id] = e; });
  var nodes = Array.prototype.map.call(document.querySelectorAll('[data-sid]'), function (n) {
    return { n: n, e: byId[n.getAttribute('data-sid')] };
  }).filter(function (x) { return x.e; });
  var blocks = Array.prototype.slice.call(document.querySelectorAll('.sb[data-bid]'));

  function px(v) { return (Math.round(v * 100) / 100) + 'px'; }

  function place(n, e, mode, E, ev) {
    var g = e[mode]; if (!g) return;
    var x = g.x, y = g.y, w = g.w, h = g.h, lh = g.lockH || '', lv = g.lockV || '';
    switch (lh) {
      case 'l': x -= E / 2; break;
      case 'r': x += E / 2; break;
      case 's': x -= E / 2; w += E; break;
      case 'ls': x -= E / 2; w += E / 2; break;
      case 'rs': w += E / 2; break;
    }
    if (lv === 'b') y += ev; else if (lv === 's') { if (h != null) h += ev; } else if (lv !== 't') y += ev / 2;

    if (e.t === 'line') {
      var vertical = g.a === 90 || g.a === 270, svg = n.querySelector('svg'), ln = svg && svg.querySelector('line');
      if (vertical) {
        var cx = x + w / 2, cy = y + h / 2, len = w + (lv === 's' ? ev : 0);
        n.style.left = px(cx - 0.5); n.style.top = px(cy - w / 2); n.style.width = '1px'; n.style.height = px(len);
        svg.style.width = '0px'; svg.style.height = px(len);
        ln.setAttribute('x1', 0); ln.setAttribute('y1', 0); ln.setAttribute('x2', 0); ln.setAttribute('y2', '100%');
      } else {
        n.style.left = px(x); n.style.top = px(y); n.style.width = '1px'; n.style.height = '1px';
        svg.style.width = px(w); svg.style.height = '1px';
        ln.setAttribute('x1', 0); ln.setAttribute('y1', 0); ln.setAttribute('x2', '100%'); ln.setAttribute('y2', 0);
      }
      return;
    }
    n.style.left = px(x); n.style.top = px(y); n.style.width = px(w);
    if (h != null) n.style.height = px(h);
  }

  function apply() {
    var vw = root.clientWidth, vh = window.innerHeight;
    var mode = vw >= L.break ? 'd' : 'm';
    root.classList.toggle('d', mode === 'd'); root.classList.toggle('m', mode === 'm');
    var Wd = mode === 'd' ? L.desktopW : L.mobileW;
    var s = mode === 'd' ? Math.min(1, vw / Wd) : vw / Wd;     // canvas scale
    var E = Math.max(0, vw / s - Wd);                           // extra design-px beyond the canvas width
    var evBy = {};

    blocks.forEach(function (b) {
      var id = b.getAttribute('data-bid'), cfg = L.blocks[id][mode];
      var wH = cfg.nature === 'wH';
      var H = wH ? Math.max(cfg.h * s, vh) : cfg.h * s;
      var ev = wH ? Math.max(0, H / s - cfg.h) : 0;
      evBy[id] = ev;
      b.style.height = px(H);
      Array.prototype.forEach.call(b.querySelectorAll('.sc'), function (sc) {
        sc.style.cssText = 'position:absolute;top:0;left:50%;width:' + Wd + 'px;margin-left:' + (-Wd / 2) + 'px;height:' +
          px(cfg.h + ev) + ';transform-origin:50% 0;transform:scale(' + s + ')';
      });
    });
    nodes.forEach(function (x) { place(x.n, x.e, mode, E, evBy[x.e.b] || 0); });
    document.dispatchEvent(new CustomEvent('layout:done', { detail: { mode: mode, scale: s } }));
  }

  var raf = 0;
  function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(apply); }
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  apply();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);
})();
