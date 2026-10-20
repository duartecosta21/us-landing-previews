(function(){
'use strict';
/* ===== Configuration (single place) ===== */
const BRAND = 'BRAND';            // change here and in <title>
const DELAY_SECONDS = 20;         // booking button unlock delay
const SIMULATED_DURATION = 90;    // fake video length in seconds
/* ======================================== */
const q=(s)=>document.querySelector(s), qa=(s)=>[...document.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.title = document.title.replace('BRAND', BRAND);
qa('[data-brand]').forEach(e=>e.textContent=BRAND);

let delay = DELAY_SECONDS;
const p = new URLSearchParams(location.search).get('delay');
if(p!==null && !isNaN(+p)) delay = Math.max(0,+p);

/* Booking button lock */
const btn=q('#bookBtn'), txt=q('#btnTxt'), note=q('#ctaNote'), count=q('#count');
const sticky=q('#sticky'), stickyBtn=q('#stickyBtn'), topLink=q('[data-cta-link]');
function unlock(){
  btn.removeAttribute('aria-disabled'); btn.removeAttribute('tabindex');
  stickyBtn.removeAttribute('tabindex'); sticky.dataset.unlocked='1';
  topLink.classList.add('on');
  note.textContent='Free call. No obligation.';
  if(!reduce){btn.classList.add('pulse');}
  updateSticky();
}
if(delay===0 || reduce){ unlock(); }
else{
  btn.style.setProperty('--delay',delay+'s');
  count.textContent=delay;
  const t0=performance.now();
  const iv=setInterval(()=>{
    const left=Math.max(0,Math.ceil(delay-(performance.now()-t0)/1000));
    count.textContent=left;
    if(left<=0){clearInterval(iv);unlock();}
  },250);
}
[btn,stickyBtn,topLink].forEach(a=>a.addEventListener('click',e=>{
  if(btn.getAttribute('aria-disabled')==='true'){e.preventDefault();}
}));

/* Simulated muted autoplay */
const prog=q('#progress'), time=q('#time'), player=q('#player');
const fmt=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
time.textContent='0:00 / '+fmt(SIMULATED_DURATION);
if(!reduce){
  const s0=performance.now();
  (function tick(now){
    const el=Math.min(SIMULATED_DURATION,(now-s0)/1000);
    prog.style.width=(el/SIMULATED_DURATION*100)+'%';
    time.textContent=fmt(el)+' / '+fmt(SIMULATED_DURATION);
    if(el<SIMULATED_DURATION) requestAnimationFrame(tick);
  })(s0);
}
q('#unmute').addEventListener('click',()=>{player.classList.add('sound');});
q('.play').addEventListener('click',()=>{player.classList.add('sound');});

/* Reveal on scroll */
const io=new IntersectionObserver((es)=>es.forEach(e=>{
  if(!e.isIntersecting) return;
  e.target.classList.add('in'); io.unobserve(e.target);
}),{threshold:.15,rootMargin:'0px 0px -6% 0px'});
qa('.rv,#leak').forEach(e=> reduce? e.classList.add('in') : io.observe(e));

/* Steps: line draws, items light up in sequence */
const steps=q('#steps');
if(reduce){steps.classList.add('in');qa('#steps li').forEach(l=>l.classList.add('on'));}
else{
  new IntersectionObserver((es,o)=>{
    if(!es[0].isIntersecting) return; o.disconnect();
    steps.classList.add('in');
    qa('#steps li').forEach((l,i)=>setTimeout(()=>l.classList.add('on'),i*320));
  },{threshold:.25}).observe(steps);
}

/* FAQ: close others */
qa('.faq details').forEach(d=>d.addEventListener('toggle',()=>{
  if(d.open) qa('.faq details').forEach(o=>{if(o!==d)o.open=false;});
}));

/* Sticky mobile bar after hero */
const hero=q('.hero');
function updateSticky(){
  const past=hero.getBoundingClientRect().bottom<0;
  const unlocked=sticky.dataset.unlocked==='1';
  const show=past;
  sticky.classList.toggle('show',show);
  sticky.setAttribute('aria-hidden',show?'false':'true');
  stickyBtn.setAttribute('aria-disabled',unlocked?'false':'true');
  if(!unlocked){stickyBtn.style.pointerEvents='none';q('#stickyTxt').textContent='Booking link unlocking...';}
  else{stickyBtn.style.pointerEvents='';q('#stickyTxt').textContent='Book my free audit';}
}
addEventListener('scroll',updateSticky,{passive:true});updateSticky();
})();
