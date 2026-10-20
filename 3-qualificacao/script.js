(function () {
  'use strict';
  // ===== CONFIG (ponto único de ajuste) =====
  var BRAND = 'BookedDoc'; // trocar aqui e no <title> do index.html
  var CONFIG = {
    // índices de resposta que desqualificam (0 = primeira opção)
    disqOwner: [2, 3],        // gerente sem poder de decisão, outro
    disqRevenue: [0],         // abaixo de US$ 40k/mês (faturamento mínimo de exemplo)
    disqSpend: [0, 1],        // sem anúncios, abaixo de US$ 1k (verba mínima de exemplo)
    freeResourceUrl: '#',     // link de exemplo (inerte)
    freeResourceLabel: 'Get the Front Desk Speed-to-Lead Checklist (PDF)'
  };

  document.title = document.title.replace('BookedDoc', BRAND);
  [].forEach.call(document.querySelectorAll('[data-brand]'), function (el) { el.textContent = BRAND; });
  var yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var STEPS = [
    { key: 'owner', q: 'Are you the owner or a decision maker?', hint: 'We only book calls with people who can approve a change.',
      opts: ['Owner or partner', 'Practice or medical director', 'Office manager (not the final decision maker)', 'Something else'] },
    { key: 'type', q: 'What type of practice do you run?', hint: '',
      opts: ['Dental', 'Med spa or aesthetics', 'Plastic or cosmetic surgery', 'General medicine or other specialty'] },
    { key: 'revenue', q: 'What is your average monthly revenue?', hint: 'A rough range is fine.',
      opts: ['Under $40k', '$40k to $75k', '$75k to $150k', '$150k to $300k', '$300k or more'] },
    { key: 'spend', q: 'How much do you spend on ads per month today?', hint: 'Meta, Google or both.',
      opts: ['I do not run ads', 'Under $1k', '$1k to $3k', '$3k to $10k', '$10k or more'] },
    { key: 'ltv', q: 'What is the average lifetime value of a patient?', hint: 'Total revenue from one patient over the relationship.',
      opts: ['Under $500', '$500 to $1,500', '$1,500 to $5,000', '$5,000 or more', 'Not sure'] },
    { key: 'gap', q: 'What is your biggest bottleneck right now?', hint: '',
      opts: ['Leads are slow to get a reply', 'Leads come in but few book', 'Booked patients do not show up', 'Lead quality is low', 'I do not know what is working'] },
    { key: 'contact', q: 'Where should we send your audit details?', hint: 'Last step.', contact: true }
  ];
  var i = 0, ans = {};
  var stage = document.getElementById('stage'), fill = document.getElementById('barFill'),
      count = document.getElementById('count'), back = document.getElementById('back'),
      form = document.getElementById('quizForm'), bar = form.querySelector('.bar');

  function esc(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

  function render(dir) {
    var s = STEPS[i];
    count.textContent = 'Question ' + (i + 1) + ' of ' + STEPS.length;
    var pct = Math.round(i / STEPS.length * 100);
    fill.style.width = pct + '%'; bar.setAttribute('aria-valuenow', pct);
    back.hidden = i === 0;
    var h = '<div class="step' + (dir < 0 ? ' back-dir' : '') + '"><h2>' + esc(s.q) + '</h2>' + (s.hint ? '<p class="hint">' + esc(s.hint) + '</p>' : '');
    if (s.contact) {
      h += '<div class="fields">' +
        f('name', 'Your name', 'text', 'name') + f('clinic', 'Clinic name', 'text', 'organization') +
        f('phone', 'Mobile phone', 'tel', 'tel') + f('email', 'Work email', 'email', 'email') + '</div>' +
        '<button class="btn" type="submit">See my next step</button>' +
        '<p class="fine">Nothing is sent from this preview page.</p>';
    } else {
      h += '<div class="opts" role="radiogroup">' + s.opts.map(function (o, k) {
        return '<button type="button" class="opt' + (ans[s.key] === k ? ' sel' : '') + '" role="radio" aria-checked="' + (ans[s.key] === k) + '" data-k="' + k + '">' + esc(o) + '</button>';
      }).join('') + '</div>';
    }
    stage.innerHTML = h + '</div>';
  }
  function f(id, label, type, ac) {
    return '<div class="field"><label for="f_' + id + '">' + label + '</label><input id="f_' + id + '" name="' + id + '" type="' + type + '" autocomplete="' + ac + '" value="' + esc(ans[id] || '') + '"><p class="err" id="e_' + id + '"></p></div>';
  }

  function disq(s, k) {
    if (s.key === 'owner') return CONFIG.disqOwner.indexOf(k) > -1 ? 'owner' : null;
    if (s.key === 'revenue') return CONFIG.disqRevenue.indexOf(k) > -1 ? 'revenue' : null;
    if (s.key === 'spend') return CONFIG.disqSpend.indexOf(k) > -1 ? 'spend' : null;
    return null;
  }
  var COPY = {
    owner: ['Thanks for being honest. This call is for owners.', 'Our audit works best with someone who can approve changes. Share the free resource below with your owner or director. It covers the first-reply and follow-up basics and takes ten minutes to apply.'],
    spend: ['Ads first, then us.', 'We build on top of ad spend that already exists, so a call now would not be useful for you. Start with the free resource below, and come back when ads are running.'],
    revenue: ['Not the right time for a call yet.', 'Our service is built for larger practices, and we do not want to take your time or money before it makes sense. The free resource below is a practical place to start.']
  };

  function finish(kind) {
    form.hidden = true;
    var box;
    if (kind) {
      box = document.getElementById('outBox');
      document.getElementById('outTitle').textContent = COPY[kind][0];
      document.getElementById('outText').textContent = COPY[kind][1];
      var l = document.getElementById('outLink'); l.href = CONFIG.freeResourceUrl; l.textContent = CONFIG.freeResourceLabel;
    } else {
      box = document.getElementById('inBox');
      document.getElementById('inText').textContent = 'Thanks' + (ans.name ? ', ' + ans.name.split(' ')[0] : '') + '. Choose a slot below and we will walk through your account and your post-click flow.';
    }
    box.hidden = false;
    fill.style.width = '100%';
    document.getElementById('qualify').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  stage.addEventListener('click', function (e) {
    var b = e.target.closest('.opt'); if (!b) return;
    var s = STEPS[i], k = +b.getAttribute('data-k');
    ans[s.key] = k;
    [].forEach.call(stage.querySelectorAll('.opt'), function (o) { var on = o === b; o.classList.toggle('sel', on); o.setAttribute('aria-checked', on); });
    var d = disq(s, k);
    setTimeout(function () {
      if (d) { finish(d); return; }
      i++; render(1);
    }, reduce ? 0 : 220);
  });
  back.addEventListener('click', function () { if (i > 0) { i--; render(-1); } });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!STEPS[i].contact) return;
    var ok = true;
    ['name', 'clinic', 'phone', 'email'].forEach(function (id) {
      var el = document.getElementById('f_' + id), v = el.value.trim(), msg = '';
      ans[id] = v;
      if (!v) msg = 'Required';
      else if (id === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) msg = 'Enter a valid email';
      else if (id === 'phone' && v.replace(/\D/g, '').length < 10) msg = 'Enter a valid phone number';
      el.classList.toggle('bad', !!msg);
      document.getElementById('e_' + id).textContent = msg;
      if (msg) ok = false;
    });
    if (ok) finish(null);
  });

  document.getElementById('miniForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = document.getElementById('miniEmail').value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { document.getElementById('miniEmail').classList.add('bad'); return; }
    e.target.hidden = true; document.getElementById('miniThanks').hidden = false;
  });

  render(1);

  // reveal on scroll
  var els = [].slice.call(document.querySelectorAll('.rv,.r'));
  var leak = document.getElementById('leak');
  var steps = document.getElementById('steps');
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('in'); });
    if (leak) leak.classList.add('in');
    [].forEach.call(steps.children, function (li) { li.classList.add('lit'); });
  } else {
    requestAnimationFrame(function () { els.filter(function (el) { return el.classList.contains('r'); }).forEach(function (el) { el.classList.add('in'); }); });
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
    }, { threshold: 0.15 });
    els.filter(function (el) { return el.classList.contains('rv'); }).forEach(function (el) { io.observe(el); });
    new IntersectionObserver(function (en, o) { if (en[0].isIntersecting) { leak.classList.add('in'); o.disconnect(); } }, { threshold: 0.35 }).observe(leak);
    // process line + steps light up with scroll position
    var lis = [].slice.call(steps.children);
    var tick = function () {
      var r = steps.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh * 0.7 - r.top) / r.height));
      steps.style.setProperty('--p', p.toFixed(3));
      lis.forEach(function (li) { var t = li.getBoundingClientRect().top; li.classList.toggle('lit', t < vh * 0.7); });
    };
    window.addEventListener('scroll', tick, { passive: true }); window.addEventListener('resize', tick); tick();
  }

  // sticky mobile CTA once the quiz has left the screen
  var sticky = document.getElementById('sticky'), quiz = document.getElementById('qualify');
  function stick() {
    var r = quiz.getBoundingClientRect();
    sticky.classList.toggle('show', r.bottom < 0 || r.top > window.innerHeight);
  }
  window.addEventListener('scroll', stick, { passive: true }); stick();
})();
