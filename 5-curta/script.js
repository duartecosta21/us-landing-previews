const BRAND = "BRAND"; // unico ponto de configuracao do nome (trocar aqui + <title>)
document.title = BRAND + " | More booked consults from the ads you already run";
document.querySelectorAll("[data-brand]").forEach(e => { e.textContent = BRAND; });

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const rv = [...document.querySelectorAll(".rv")];
if (reduce || !("IntersectionObserver" in window)) {
  rv.forEach(e => e.classList.add("in"));
} else {
  const io = new IntersectionObserver((es) => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    io.unobserve(e.target);
  }), { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  rv.forEach(e => io.observe(e));
  // anel do botao 1,2s apos carregar
  setTimeout(() => document.getElementById("cta1").classList.add("go"), 1200);
}

// barra fixa (celular): aparece depois da 1a dobra, some quando a agenda esta visivel
const sticky = document.getElementById("sticky");
const book = document.getElementById("book");
const cta1 = document.getElementById("cta1");
let bookVis = false, ctaGone = false;
const upd = () => sticky.classList.toggle("show", ctaGone && !bookVis);
new IntersectionObserver(es => { bookVis = es[0].isIntersecting; upd(); }, { threshold: 0.2 }).observe(book);
new IntersectionObserver(es => { ctaGone = !es[0].isIntersecting; upd(); }).observe(cta1);
