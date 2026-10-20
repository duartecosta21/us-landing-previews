// Ponto unico de configuracao da marca (trocar aqui e no <title> do index.html)
const BRAND = "BookedDoc";

(function () {
  document.querySelectorAll("[data-brand]").forEach(function (e) { e.textContent = BRAND; });
  document.title = document.title.replace("BookedDoc", BRAND);

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js");

  // marcar itens de reveal
  var rvSel = ".steps li, .grid li, .fit > div, .gbox, .faq details";
  document.querySelectorAll(rvSel).forEach(function (el, i) { el.classList.add("rv"); });

  // abertura
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      root.classList.add("ready");
      document.querySelectorAll(".bar i").forEach(function (b) {
        b.style.transform = "scaleX(" + b.dataset.fill + ")";
      });
    });
  });

  // IntersectionObserver
  function show(el, delay) {
    if (delay) el.style.transitionDelay = delay + "ms";
    el.classList.add("in");
  }
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var sibs = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        show(el, el.classList.contains("rv") ? Math.min(sibs, 6) * 90 : 0);
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".rv, .leak").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".rv, .leak").forEach(function (el) { el.classList.add("in"); });
  }

  // timeline: linha desenha com a rolagem
  var tl = document.getElementById("tl"), fill = document.getElementById("tlFill");
  var items = tl ? tl.querySelectorAll(".tl-item") : [];
  function tlUpdate() {
    if (!tl) return;
    var r = tl.getBoundingClientRect(), vh = window.innerHeight;
    var p = reduce ? 1 : Math.min(1, Math.max(0, (vh * 0.65 - r.top) / r.height));
    fill.style.transform = "scaleY(" + p + ")";
    items.forEach(function (it) {
      var ir = it.getBoundingClientRect();
      it.classList.toggle("on", reduce || ir.top < vh * 0.65);
    });
  }

  // barra fixa mobile
  var sticky = document.getElementById("sticky"), hero = document.querySelector(".hero"), apply = document.getElementById("apply");
  function stickyUpdate() {
    var hb = hero.getBoundingClientRect().bottom, ar = apply.getBoundingClientRect();
    var inForm = ar.top < window.innerHeight * 0.6 && ar.bottom > 0;
    sticky.classList.toggle("show", hb < 0 && !inForm);
  }

  var tick = false;
  function onScroll() {
    if (tick) return; tick = true;
    requestAnimationFrame(function () { tlUpdate(); stickyUpdate(); tick = false; });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  tlUpdate(); stickyUpdate();

  // formulario (nao envia nada)
  var form = document.getElementById("form"), prog = document.getElementById("prog");
  function go(n) {
    form.querySelectorAll(".step").forEach(function (s) { s.classList.toggle("is-on", s.dataset.step == n); });
    prog.style.transform = "scaleX(" + (n / 4) + ")";
  }
  function val(name) { var c = form.querySelector("input[name=" + name + "]:checked"); return c ? c.value : ""; }
  document.getElementById("next1").addEventListener("click", function () {
    var ok = val("owner") && val("type");
    document.getElementById("err1").hidden = !!ok;
    if (ok) go(2);
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = val("spend") && form.querySelector("[name=name]").value.trim() && form.email.value.trim() && form.phone.value.trim();
    document.getElementById("err2").hidden = !!ok;
    if (ok) go(3);
  });
  // confirmacao ficticia do calendario de exemplo completa a barra de progresso
  form.addEventListener("bdcal:confirm", function () { prog.style.transform = "scaleX(1)"; });
})();
