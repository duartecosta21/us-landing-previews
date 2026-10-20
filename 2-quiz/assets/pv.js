/* Shared: sample calendar (static, no network) and inert sample links */
(function () {
  'use strict';
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var TIMES = ['9:00 AM','10:30 AM','12:00 PM','1:30 PM','3:00 PM','4:30 PM'];
  var TODAY = new Date(2026, 9, 20); // sample date
  var LOGO = 'assets/favicon.png';

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function avail(d) { var w = d.getDay(); return d > TODAY && w !== 0 && w !== 6 && (d - TODAY) / 864e5 <= 40; }

  function mount(el, opts) {
    opts = opts || {};
    if (el.__bd) return; el.__bd = 1;
    el.classList.add('bd-cal');
    var title = opts.title || el.getAttribute('data-title') || 'Free audit call';
    var dur = opts.duration || el.getAttribute('data-duration') || '30 min';
    var view = { y: 2026, m: 9 }, sel = null;

    function render() {
      var first = new Date(view.y, view.m, 1), n = new Date(view.y, view.m + 1, 0).getDate();
      var h = '<div class="bd-cal__ev"><img src="' + LOGO + '" alt="" width="34" height="34"><div><b>' + esc(title) + '</b><span>BookedDoc &middot; ' + esc(dur) + ' &middot; video call</span></div></div>' +
        '<div class="bd-cal__mh"><b>' + MONTHS[view.m] + ' ' + view.y + '</b><div class="bd-cal__nav"><button type="button" data-nav="-1" aria-label="Previous month"' + (view.m === 9 ? ' disabled' : '') + '>&#8249;</button><button type="button" data-nav="1" aria-label="Next month"' + (view.m === 10 ? ' disabled' : '') + '>&#8250;</button></div></div>' +
        '<div class="bd-cal__g" role="grid">';
      DAYS.forEach(function (d) { h += '<div class="bd-cal__w">' + d.toUpperCase() + '</div>'; });
      for (var i = 0; i < first.getDay(); i++) h += '<span></span>';
      for (var d = 1; d <= n; d++) {
        var dt = new Date(view.y, view.m, d), on = avail(dt), key = view.y + '-' + view.m + '-' + d;
        h += '<button type="button" class="bd-cal__d' + (on ? ' on' : '') + (sel && sel.key === key ? ' sel' : '') + '" data-d="' + d + '"' + (on ? '' : ' disabled aria-disabled="true"') + '>' + d + '</button>';
      }
      h += '</div><p class="bd-cal__tz">Times shown in Eastern Time (US &amp; Canada)</p><div class="bd-cal__tp" data-tp></div>';
      el.innerHTML = h;
      if (sel && sel.m === view.m) showTimes(sel.d, false);
    }
    function showTimes(d, anim) {
      var dt = new Date(view.y, view.m, d), tp = el.querySelector('[data-tp]');
      var label = DAYS[dt.getDay()] + ', ' + MONTHS[view.m] + ' ' + d;
      // sample: availability varies a little by day
      var list = TIMES.filter(function (t, i) { return (i + d) % 5 !== 0; });
      tp.innerHTML = '<div class="' + (anim ? 'bd-cal__in' : '') + '"><h4>' + label + '</h4><div class="bd-cal__t">' + list.map(function (t) { return '<button type="button" data-t="' + t + '">' + t + '</button>'; }).join('') + '</div></div>';
    }
    function confirmSlot(t) {
      var dt = new Date(view.y, view.m, sel.d);
      var label = DAYS[dt.getDay()] + ', ' + MONTHS[view.m] + ' ' + sel.d + ' at ' + t + ' ET';
      el.innerHTML = '<div class="bd-cal__ok bd-cal__in"><svg class="bd-cal__ck" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="26"/><path d="M15 27l8 8 14-16"/></svg><h4>You are booked (sample)</h4><b>' + label + '</b><p>This is a sample calendar. No booking was made and nothing was sent.</p><button type="button" class="bd-cal__again" data-again>Choose another time</button></div>';
      el.setAttribute('aria-live', 'polite');
      el.dispatchEvent(new CustomEvent('bdcal:confirm', { bubbles: true, detail: { label: label } }));
    }
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || !el.contains(b)) return;
      if (b.hasAttribute('data-nav')) { view.m += +b.getAttribute('data-nav'); sel = null; render(); }
      else if (b.hasAttribute('data-d')) {
        var d = +b.getAttribute('data-d'); sel = { d: d, m: view.m, key: view.y + '-' + view.m + '-' + d };
        el.querySelectorAll('.bd-cal__d').forEach(function (x) { x.classList.toggle('sel', x === b); });
        showTimes(d, true);
      } else if (b.hasAttribute('data-t')) confirmSlot(b.getAttribute('data-t'));
      else if (b.hasAttribute('data-again')) { sel = null; render(); }
    });
    render();
  }
  window.BDCal = { mount: mount };
  function init() {
    document.querySelectorAll('[data-bdcal]').forEach(function (e) { mount(e); });
    document.addEventListener('click', function (e) { var a = e.target.closest('a[data-sample]'); if (a) e.preventDefault(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
