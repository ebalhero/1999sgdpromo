/* Interactive behaviour: hero colour views (auto-advance), testimonial / portfolio views, mobile menu. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var L = window.SITE_LAYOUT;

  function views(block) { return Array.prototype.filter.call(block.children, function (c) { return c.classList.contains('ss'); }); }
  function show(block, i) {
    views(block).forEach(function (v, k) { v.classList.toggle('sactive', k === i); });
    block._view = i;
  }

  /* hero: three background views, fade 0.5s, auto-advance (aav 1.75 in source) */
  var hero = document.getElementById('hero');
  if (hero) {
    hero.classList.add('sb-fade'); show(hero, 0);
    var every = (L.blocks.hero.aav || 1.75) * 1000;
    if (!reduce) setInterval(function () { if (!document.hidden) show(hero, ((hero._view || 0) + 1) % views(hero).length); }, every);
  }

  /* testimonials + portfolio: dots switch views ("block|index|…" in data-state) */
  ['testimonials', 'portfolio'].forEach(function (id) {
    var b = document.getElementById(id); if (!b) return;
    show(b, 0);
    Array.prototype.forEach.call(b.querySelectorAll('[data-state]'), function (a) {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        show(b, parseInt(a.getAttribute('data-state').split('|')[1], 10));
      });
    });
  });

  /* mobile menu */
  var menu = document.getElementById('menu-open');
  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-lock', open);
  }
  var burger = document.querySelector('[data-sid="logo-navigation_7"]');
  var close = document.querySelector('[data-sid="menu-open_5"]');
  if (menu && burger) burger.addEventListener('click', function () { setMenu(true); });
  if (menu && close) close.addEventListener('click', function () { setMenu(false); });
  if (menu) Array.prototype.forEach.call(menu.querySelectorAll('a'), function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu) setMenu(false); });
  document.addEventListener('layout:done', function (e) { if (e.detail.mode === 'd' && menu) setMenu(false); });

  /* "Home" links (#/) scroll to top */
  Array.prototype.forEach.call(document.querySelectorAll('a[href="#/"]'), function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  });
})();
