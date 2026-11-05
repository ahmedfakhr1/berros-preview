(function () {
  'use strict';
  var d = document, html = d.documentElement;
  html.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var TZ = 'Africa/Cairo';

  function cairoNow() {
    var p = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return { y: +p.year, m: +p.month, d: +p.day, min: (+p.hour) * 60 + (+p.minute) };
  }

  /* ---------- header ---------- */
  var hdr = $('.hdr');
  var hero = $('.hero');
  if (hdr && hero && 'IntersectionObserver' in window) {
    var sentinel = d.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;height:40px;width:1px;pointer-events:none';
    hero.appendChild(sentinel);
    new IntersectionObserver(function (e) { hdr.classList.toggle('solid', !e[0].isIntersecting); }).observe(sentinel);
  }

  /* ---------- drawer ---------- */
  var drawer = $('#drawer'), burger = $('.burger'), lastFocus = null;
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('open', open);
    drawer.toggleAttribute('inert', !open);
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    html.classList.toggle('drawer-open', open);
    d.body.style.overflow = open ? 'hidden' : '';
    if (open) { lastFocus = d.activeElement; var f = $('.drawer-x', drawer); if (f) f.focus(); }
    else if (lastFocus && lastFocus.focus) { lastFocus.focus({ preventScroll: true }); }
    syncBar();
  }
  if (burger) burger.addEventListener('click', function () { setDrawer(true); });
  if (drawer) {
    $('.drawer-x', drawer).addEventListener('click', function () { setDrawer(false); });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
  }

  /* ---------- AR pop-up ---------- */
  var ar = $('#ar-note');
  $$('[data-ar]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!ar) return;
      if (drawer && drawer.classList.contains('open')) setDrawer(false);
      if (typeof ar.showModal === 'function') ar.showModal(); else ar.setAttribute('open', '');
    });
  });
  if (ar) {
    $('button', ar).addEventListener('click', function () { ar.close ? ar.close() : ar.removeAttribute('open'); });
    ar.addEventListener('click', function (e) { if (e.target === ar && ar.close) ar.close(); });
  }

  /* ---------- asterisk footnotes ---------- */
  var openNote = null;
  function place(note) {
    // measured from the anchor, so a running transition cannot skew it
    var a = note.parentNode.getBoundingClientRect(), cx = a.left + a.width / 2, w = note.offsetWidth;
    var vw = html.clientWidth, m = 14, left = cx - w / 2, dx = 0;
    if (left < m) dx = m - left;
    else if (left + w > vw - m) dx = vw - m - (left + w);
    note.style.setProperty('--dx', Math.round(dx) + 'px');
  }
  function placeAll() { $$('.fn-note').forEach(place); }
  placeAll();
  window.addEventListener('resize', placeAll, { passive: true });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(placeAll);
  function setNote(btn, open, pinned) {
    var note = d.getElementById(btn.getAttribute('aria-controls'));
    if (!note) return;
    if (open && openNote && openNote !== btn) setNote(openNote, false);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.dataset.pinned = open && pinned ? '1' : '';
    note.classList.toggle('open', open);
    if (open) { place(note); openNote = btn; } else if (openNote === btn) openNote = null;
  }
  $$('.fn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      if (isOpen && btn.dataset.pinned) setNote(btn, false);
      else setNote(btn, true, true);
    });
    if (finePointer) {
      btn.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && btn.getAttribute('aria-expanded') !== 'true') setNote(btn, true, false); });
      btn.parentNode.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !btn.dataset.pinned && btn.getAttribute('aria-expanded') === 'true') setNote(btn, false); });
    }
  });
  d.addEventListener('click', function (e) { if (openNote && !e.target.closest('.fn-wrap')) setNote(openNote, false); });
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (openNote) { var b = openNote; setNote(b, false); b.focus(); }
    if (drawer && drawer.classList.contains('open')) setDrawer(false);
  });

  /* ---------- bottom bar: hides on scroll down and over the footer, booking and visit blocks ---------- */
  var bar = $('.bar'), lastY = window.scrollY, down = false, covered = 0, ticking = false;
  function syncBar() {
    if (!bar) return;
    bar.classList.toggle('hide', down || covered > 0 || html.classList.contains('drawer-open'));
  }
  if (bar) {
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY, dy = y - lastY;
        if (Math.abs(dy) > 6) { down = dy > 0 && y > 160; lastY = y; }
        syncBar(); ticking = false;
      });
    }, { passive: true });
    if ('IntersectionObserver' in window) {
      var seen = new Set();
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
        covered = seen.size; syncBar();
      }, { rootMargin: '0px 0px -40px 0px' });
      $$('[data-hidebar]').forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- reveal on scroll ---------- */
  var rv = $$('.rv');
  if (reduce || !('IntersectionObserver' in window)) rv.forEach(function (el) { el.classList.add('in'); });
  else {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    rv.forEach(function (el) { rio.observe(el); });
  }

  /* ---------- book a table ---------- */
  var book = $('#book-form');
  if (book) {
    var daysEl = $('.days', book), timeEl = $('#b-time'), gOut = $('#b-guests'), sum = $('.book-sum', book);
    var now = cairoNow(), guests = 2, dayIdx = 0;
    var base = Date.UTC(now.y, now.m - 1, now.d, 12);
    var fmt = function (o) { return new Intl.DateTimeFormat('en-GB', Object.assign({ timeZone: 'UTC' }, o)); };
    var wdLong = fmt({ weekday: 'long' }), wdShort = fmt({ weekday: 'short' }), dm = fmt({ day: 'numeric', month: 'short' }), dmLong = fmt({ day: 'numeric', month: 'long' });
    var days = [];
    for (var i = 0; i < 7; i++) days.push(new Date(base + i * 864e5));
    days.forEach(function (dt, i) {
      var b = d.createElement('button');
      b.type = 'button'; b.className = 'day';
      b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.innerHTML = (i === 0 ? 'Today' : wdShort.format(dt)) + '<small>' + dm.format(dt) + '</small>';
      b.addEventListener('click', function () {
        dayIdx = i;
        $$('.day', daysEl).forEach(function (x, j) { x.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
        fillTimes(); update();
      });
      daysEl.appendChild(b);
    });
    function label(m) { var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? 'PM' : 'AM', hh = h % 12 || 12; return hh + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ap; }
    function fillTimes() {
      var keep = timeEl.value ? +timeEl.value : 20 * 60;
      timeEl.innerHTML = '';
      var first = null;
      for (var m = 10 * 60; m <= 22 * 60 + 30; m += 30) {
        var o = d.createElement('option');
        o.value = m; o.textContent = label(m);
        if (dayIdx === 0 && m <= now.min + 30) o.disabled = true;
        else if (first === null) first = m;
        timeEl.appendChild(o);
      }
      var pick = keep;
      var opt = $('option[value="' + keep + '"]', timeEl);
      if (!opt || opt.disabled) pick = first;
      if (pick === null) {
        // nothing left today: move to tomorrow
        if (dayIdx === 0) { $$('.day', daysEl)[1].click(); return; }
      }
      timeEl.value = pick;
    }
    function update() {
      gOut.textContent = guests + (guests === 1 ? ' guest' : guests >= 12 ? '+ guests' : ' guests');
      var dt = days[dayIdx];
      sum.textContent = (dayIdx === 0 ? 'Today, ' : '') + wdLong.format(dt) + ' ' + dmLong.format(dt) + ', ' + label(+timeEl.value) + ', ' + gOut.textContent;
      $('[data-step="-1"]', book).disabled = guests <= 1;
      $('[data-step="1"]', book).disabled = guests >= 12;
    }
    $$('[data-step]', book).forEach(function (b) {
      b.addEventListener('click', function () { guests = Math.max(1, Math.min(12, guests + (+b.dataset.step))); update(); });
    });
    timeEl.addEventListener('change', update);
    book.addEventListener('submit', function (e) { e.preventDefault(); });
    fillTimes(); update();
  }

  /* ---------- menu page ---------- */
  var tabs = $$('.sw [role="tab"]');
  if (tabs.length) {
    var panels = tabs.map(function (t) { return d.getElementById(t.getAttribute('aria-controls')); });
    var plates = $('.menu-plates'), meta = $$('[data-meta]');
    var spyIO = null;
    function show(id, focusTab) {
      var key = id.replace('p-', '');
      tabs.forEach(function (t, i) {
        var on = panels[i].id === id;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
        if (on && focusTab) t.focus();
      });
      meta.forEach(function (m) { m.hidden = m.dataset.meta !== key; });
      if (plates) {
        plates.dataset.for = key;
        $$('img', plates).forEach(function (im) { var s = im.dataset[key === 'breakfast' ? 'b' : 'l']; if (s && im.getAttribute('src') !== s) im.src = s; });
      }
      spy(d.getElementById(id));
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () {
        show(panels[i].id);
        if (history.replaceState) history.replaceState(null, '', '#' + panels[i].id.replace('p-', ''));
      });
      t.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var j = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        show(panels[j].id, true);
      });
    });
    function spy(panel) {
      if (spyIO) spyIO.disconnect();
      var chips = $$('.chip', panel), cats = chips.map(function (c) { return d.getElementById(c.getAttribute('href').slice(1)); });
      function setActive(k) {
        chips.forEach(function (c, j) { if (j === k) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current'); });
        var c = chips[k], row = c && c.parentNode;
        if (c && row.scrollWidth > row.clientWidth) row.scrollTo({ left: c.offsetLeft - (row.clientWidth - c.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
      }
      if (!panel._chipsBound) {
        panel._chipsBound = true;
        chips.forEach(function (c, k) { c.addEventListener('click', function () { setActive(k); panel._lock = Date.now(); }); });
      }
      var cur = -1;
      function pick() {
        if (panel._lock && Date.now() - panel._lock < 900) return;
        var line = (hdr ? hdr.offsetHeight : 70) + 120, best = 0, bestTop = -Infinity;
        cats.forEach(function (c, k) { var t = c.getBoundingClientRect().top; if (t <= line && t > bestTop) { bestTop = t; best = k; } });
        if (best !== cur) { cur = best; setActive(best); }
      }
      spyFn = pick;
      cur = 0; setActive(0); pick();
    }
    var spyFn = null, spyTick = false;
    window.addEventListener('scroll', function () {
      if (spyTick || !spyFn) return; spyTick = true;
      requestAnimationFrame(function () { spyTick = false; spyFn(); });
    }, { passive: true });
    // stuck state of the chips bars
    $$('.chips-bar').forEach(function (bar) {
      if (!('IntersectionObserver' in window)) return;
      var s = d.createElement('div'); s.style.cssText = 'height:1px;margin-bottom:-1px';
      bar.parentNode.insertBefore(s, bar);
      new IntersectionObserver(function (e) { bar.classList.toggle('stuck', !e[0].isIntersecting && e[0].boundingClientRect.top < 0); }, { rootMargin: '-' + ((hdr ? hdr.offsetHeight : 70) + 1) + 'px 0px 0px 0px' }).observe(s);
    });
    // which menu: the link's hash first, else the time of day (breakfast until 2:30 PM, Cairo time)
    var h = decodeURIComponent(location.hash.slice(1)), start = null, target = null;
    if (h) {
      var el = d.getElementById(h === 'breakfast' || h === 'lunch' ? 'p-' + h : h);
      if (el) { var p = el.closest('[role="tabpanel"]'); if (p) { start = p.id; if (p !== el) target = el; } }
    }
    if (!start) { var n = cairoNow(); start = n.min < 14 * 60 + 30 ? 'p-breakfast' : 'p-lunch'; }
    show(start);
    requestAnimationFrame(function () {
      if (target) target.scrollIntoView({ block: 'start' });
    });
  }
})();
