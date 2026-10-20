(function () {
  const BRAND = 'BookedDoc'; // ponto unico de configuracao (tambem trocar no <title>)
  document.querySelectorAll('[data-brand]').forEach(e => e.textContent = BRAND);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Opcoes: v = valor usado no calculo (ponto medio), l = rotulo
  const Q = [
    { id: 'spend', t: 'How much do you spend on ads per month?', h: 'Meta and Google combined.', o: [
      ['Under $2,000', 1500], ['$2,000 to $5,000', 3500], ['$5,000 to $10,000', 7500], ['$10,000 to $25,000', 17500], ['$25,000 or more', 35000]] },
    { id: 'leads', t: 'Roughly how many leads do those ads bring in per month?', h: 'Form fills, calls and messages.', o: [
      ['Under 20', 15], ['20 to 50', 35], ['50 to 100', 75], ['100 to 250', 175], ['250 or more', 300]] },
    { id: 'resp', t: 'How fast does a new lead get a first reply?', h: 'Typical case, including evenings and weekends.', o: [
      ['Under 5 minutes', 0], ['5 to 30 minutes', 1], ['30 minutes to 2 hours', 2], ['2 to 24 hours', 3], ['More than a day, or not sure', 4]] },
    { id: 'who', t: 'Who usually replies to new leads?', h: 'The person, not the title.', o: [
      ['Front desk, between patients', 'front'], ['A dedicated coordinator or setter', 'coord'], ['The owner or doctor', 'owner'], ['Automated message, or nobody after hours', 'auto'], ['Not sure', 'unk']] },
    { id: 'book', t: 'What share of leads ends up booked?', h: 'Your best guess is fine.', o: [
      ['Under 10%', 0.05], ['10% to 25%', 0.175], ['25% to 40%', 0.325], ['40% or more', 0.5], ['I do not track it', 0.15]] },
    { id: 'ticket', t: 'What is a typical patient or case worth?', h: 'First treatment value, roughly.', o: [
      ['Under $500', 300], ['$500 to $1,500', 1000], ['$1,500 to $5,000', 3000], ['$5,000 or more', 8000]] }
  ];
  // Suposicao de modelagem conservadora e ilustrativa (illustrative estimate): perda por demora, faixa [baixa, alta]
  const LOSS = [[0, .03], [.03, .08], [.08, .15], [.15, .25], [.25, .35]];
  const WHO = {
    front: 'Front desk replies compete with patients in the chair. Leads tend to wait until a quiet moment.',
    coord: 'A dedicated person is a strong setup. The question is coverage at night and on weekends.',
    owner: 'Owner replies are high quality but hard to sustain at volume. Speed usually drops on busy days.',
    auto: 'Automated replies help, but a lead who gets nothing human after hours often goes elsewhere.',
    unk: 'Not knowing who replies is itself the first thing to fix. Someone should own every new lead.'
  };

  const stage = document.getElementById('stage');
  const barFill = document.getElementById('barFill');
  const bar = document.getElementById('bar');
  const stepLabel = document.getElementById('stepLabel');
  const backBtn = document.getElementById('backBtn');
  const progress = document.getElementById('progress');
  const ans = []; // indices
  let cur = 0, busy = false;
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const usd = n => '$' + fmt(n);
  const usdR = n => '$' + fmt(Math.round(n / 100) * 100);

  function setProgress(done) {
    barFill.style.width = (done / Q.length * 100) + '%';
    bar.setAttribute('aria-valuenow', done);
  }
  function swap(render, dir) {
    const go = () => { busy = false; stage.innerHTML = ''; render(); if (!reduce) { stage.classList.add('slide-in'); setTimeout(() => stage.classList.remove('slide-in'), 340); } };
    busy = true;
    if (reduce) return go();
    stage.classList.add('slide-out');
    setTimeout(() => { stage.classList.remove('slide-out'); go(); }, 260);
  }
  function showQ(i) {
    cur = i;
    stepLabel.textContent = 'Question ' + (i + 1) + ' of ' + Q.length;
    backBtn.hidden = i === 0;
    backFn = () => swap(() => showQ(cur - 1));
    setProgress(i);
    const q = Q[i];
    const wrap = document.createElement('div');
    wrap.innerHTML = '<h2 class="q-title"></h2><p class="q-help"></p><div class="opts" role="group"></div>';
    wrap.querySelector('.q-title').textContent = q.t;
    wrap.querySelector('.q-help').textContent = q.h;
    const opts = wrap.querySelector('.opts');
    opts.setAttribute('aria-label', q.t);
    q.o.forEach((o, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'opt' + (ans[i] === k ? ' sel' : '');
      b.innerHTML = '<span class="k">' + (k + 1) + '</span><span></span>';
      b.lastChild.textContent = o[0];
      b.addEventListener('click', () => {
        if (busy) return;
        busy = true;
        ans[i] = k;
        opts.querySelectorAll('.opt').forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
        setTimeout(() => next(), reduce ? 0 : 260);
      });
      opts.appendChild(b);
    });
    stage.appendChild(wrap);
  }
  function next() {
    if (cur < Q.length - 1) swap(() => showQ(cur + 1)); else swap(showResult);
  }
  let backFn = () => {};
  backBtn.addEventListener('click', () => { if (!busy) backFn(); });

  function calc() {
    const v = id => { const q = Q.find(x => x.id === id); return q.o[ans[Q.indexOf(q)]][1]; };
    const S = v('spend'), L = v('leads'), T = v('resp'), B = v('book'), V = v('ticket'), W = v('who');
    const [lo, hi] = LOSS[T];
    const booked = L * B;
    return { S, L, T, B, V, W, lo, hi, booked, lostLo: L * lo, lostHi: L * hi,
      extraLo: L * lo * B, extraHi: L * hi * B,
      valLo: L * lo * B * V, valHi: L * hi * B * V,
      cpb: booked > 0 ? S / booked : 0 };
  }

  let summary = '';
  function showResult() {
    stepLabel.textContent = 'Your estimate';
    backBtn.hidden = false; backFn = () => swap(() => showQ(Q.length - 1));
    setProgress(Q.length);
    const r = calc();
    const fast = r.T === 0;
    const rng = (a, b) => Math.round(b) < 1 ? 'less than 1' : Math.round(a) === Math.round(b) ? '~' + fmt(b) : fmt(a) + ' to ' + fmt(b);
    summary = 'Spend ' + usd(r.S) + '/mo; leads ' + fmt(r.L) + '/mo; reply: ' + Q[2].o[ans[2]][0] + '; who: ' + Q[3].o[ans[3]][0] + '; booked: ' + Math.round(r.B * 100) + '%; ticket ~' + usd(r.V) + '; est. extra bookings ' + rng(r.extraLo, r.extraHi) + '/mo';
    const d = document.createElement('div');
    d.innerHTML =
      '<p class="res-head">Your estimate <span class="illus">(illustrative estimate)</span></p>' +
      (fast
        ? '<div class="big">Reply speed is not your main leak<small></small></div><p class="res-sub">Under 5 minutes is where you want to be. Your next question is what happens <em>after</em> the first reply: follow-up and booking.</p>'
        : '<div class="big"><span data-count="' + r.lostLo + '" data-to="' + r.lostHi + '">0</span><small>leads per month</small></div><p class="res-sub">may be slipping away because of reply time alone. If they had been answered fast and booked at your current rate, that is roughly <b>' + rng(r.extraLo, r.extraHi) + ' more booked patients</b> a month' + (r.V ? ', worth about <b>' + usdR(r.valLo) + ' to ' + usdR(r.valHi) + '</b> at your ticket, before show-up and close rates' : '') + '.</p>') +
      '<div class="funnel" aria-label="Lead flow estimate">' +
      row('Leads', 100, '' + fmt(r.L), false) +
      row('Booked today', r.B * 100, fmt(r.booked), false) +
      (fast ? '' : row('Lost to delay', r.hi * 100, '~' + fmt(r.lostHi), true)) +
      '</div>' +
      '<p class="res-sub" style="font-size:15px">You pay about <b>' + usd(r.cpb) + '</b> in ad spend per booked patient (spend / booked leads).</p>' +
      '<ul class="notes"><li></li></ul>' +
      '<details class="math"><summary>Show the math</summary>' +
        '<p><code>Leads lost = leads per month x loss rate for your reply time</code></p>' +
        '<p>Your inputs: ' + fmt(r.L) + ' leads, loss rate assumed ' + Math.round(r.lo * 100) + '% to ' + Math.round(r.hi * 100) + '% for your reply time. Result: ' + fmt(r.lostLo) + ' to ' + fmt(r.lostHi) + ' leads.</p>' +
        '<p><code>Extra bookings = leads lost x your booking rate (' + Math.round(r.B * 100) + '%)</code></p>' +
        '<p><code>Value = extra bookings x ticket (~' + usd(r.V) + ')</code></p>' +
        '<p><code>Cost per booked = ad spend / (leads x booking rate)</code></p>' +
        '<p>The loss rates are conservative, illustrative assumptions, not measured data about your clinic. Treat the result as an illustrative estimate.</p>' +
      '</details>' +
      '<p class="disc">An estimate to show where to look first. It is not a forecast and not a promise of results. Your free audit replaces these assumptions with your real numbers.</p>' +
      '<button type="button" class="btn pulse" id="toForm">Get the free audit with my numbers</button>';
    d.querySelector('.notes li').textContent = WHO[r.W];
    stage.appendChild(d);
    document.getElementById('toForm').addEventListener('click', () => swap(showForm));
    // animacoes de entrada
    setTimeout(() => {
      d.querySelectorAll('.frow .t i').forEach(i => i.style.width = i.dataset.w + '%');
      const c = d.querySelector('[data-count]');
      if (c) countUp(c, r.lostLo, r.lostHi);
    }, 40);
    if (reduce) d.querySelectorAll('.frow .t i').forEach(i => i.style.width = i.dataset.w + '%');
  }
  function row(label, pct, val, lost) {
    return '<div class="frow"><span>' + label + '</span><span class="t"><i class="' + (lost ? 'lost' : '') + '" data-w="' + Math.max(2, Math.min(100, pct)) + '"></i></span><b>' + val + '</b></div>';
  }
  function countUp(el, lo, hi) {
    const text = (a, b) => (Math.round(a) === Math.round(b) || Math.round(b) < 1) ? '~' + fmt(b) : fmt(a) + ' to ' + fmt(b);
    if (reduce) { el.textContent = text(lo, hi); return; }
    const t0 = performance.now(), D = 1200;
    setTimeout(() => { el.textContent = text(lo, hi); }, D + 150); // garante o valor final se rAF atrasar
    (function f(t) {
      const p = Math.max(0, Math.min(1, (t - t0) / D)), e = 1 - Math.pow(1 - p, 3);
      el.textContent = text(lo * e, hi * e);
      if (p < 1) requestAnimationFrame(f);
    })(t0);
  }

  function showForm() {
    stepLabel.textContent = 'Last step';
    backBtn.hidden = false; backFn = () => swap(showResult);
    const d = document.createElement('div');
    d.id = 'book';
    d.innerHTML = '<h2 class="q-title">Where should we send your audit?</h2><p class="q-help">Four fields. Then pick a time.</p>' +
      '<form class="form" action="#" novalidate>' +
      f('name', 'Your name', 'text', 'name') + f('clinic', 'Clinic name', 'text', 'organization') + f('email', 'Email', 'email', 'email') + f('phone', 'Mobile phone', 'tel', 'tel') +
      '<input type="hidden" name="quiz_summary" id="qs"><p class="err" id="err" role="alert"></p>' +
      '<button class="btn f" type="submit">Continue to pick a time</button></form>';
    stage.appendChild(d);
    d.querySelectorAll('.f').forEach((e, i) => e.style.animationDelay = (i * 70) + 'ms');
    document.getElementById('qs').value = summary;
    d.querySelector('form').addEventListener('submit', e => {
      e.preventDefault();
      const fm = e.target, err = document.getElementById('err');
      const bad = ['name', 'clinic', 'email', 'phone'].find(n => !fm[n].value.trim() || (n === 'email' && !/^\S+@\S+\.\S+$/.test(fm[n].value)));
      if (bad) { err.textContent = 'Please check the ' + (bad === 'clinic' ? 'clinic name' : bad) + ' field.'; fm[bad].focus(); return; }
      swap(showBook);
    });
  }
  function f(n, l, t, ac) {
    return '<label class="f">' + l + '<input name="' + n + '" type="' + t + '" autocomplete="' + ac + '" required></label>';
  }
  function showBook() {
    stepLabel.textContent = 'Done';
    backBtn.hidden = true;
    const d = document.createElement('div');
    d.innerHTML = '<h2 class="q-title">Got it. Pick a time.</h2><p class="q-help">Your answers are attached to the booking so the call starts with your numbers. Nothing is sent from this preview.</p>' +
      '<div class="cal-host" data-title="Free audit call" data-duration="20 min"></div>' +
      '<button type="button" class="btn ghost" id="again">Retake the check</button>';
    stage.appendChild(d);
    if (window.BDCal) BDCal.mount(d.querySelector('.cal-host'));
    document.getElementById('again').addEventListener('click', () => { ans.length = 0; swap(() => showQ(0)); });
  }

  // CTAs que voltam ao quiz
  document.querySelectorAll('[data-goto-quiz]').forEach(a => a.addEventListener('click', () => {
    setTimeout(() => { const b = stage.querySelector('.opt'); if (b) b.focus({ preventScroll: true }); }, 400);
  }));

  // Reveal por rolagem
  const rev = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) {
        const sibs = [...e.target.parentNode.children].filter(x => x.classList.contains('reveal'));
        e.target.style.transitionDelay = Math.min(sibs.indexOf(e.target), 4) * 80 + 'ms';
        e.target.classList.add('in'); io.unobserve(e.target);
      }
    }), { threshold: .12, rootMargin: '0px 0px -5% 0px' });
    rev.forEach(e => io.observe(e));
  } else rev.forEach(e => e.classList.add('in'));
  // Passos do mecanismo acendem em sequencia
  const steps = [...document.querySelectorAll('.step')], list = document.getElementById('steps');
  if (reduce || !('IntersectionObserver' in window)) { steps.forEach(s => s.classList.add('in')); }
  else {
    list.style.setProperty('--p', 0); list.style.transition = '';
    const so = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) {
        so.disconnect();
        list.querySelector('.step') && (list.style.setProperty('--p', 1));
        steps.forEach((s, i) => setTimeout(() => s.classList.add('in'), 250 + i * 350));
      }
    }), { threshold: .3 });
    so.observe(list);
    const st = document.createElement('style'); st.textContent = '.steps::before{transition:transform 1.1s ease}'; document.head.appendChild(st);
  }

  showQ(0);
})();
