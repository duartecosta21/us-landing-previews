// Screenshots via CDP (Chrome headless, PID proprio). node shoot.mjs
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port=9300+Math.floor(Math.random()*500);
const prof=fs.mkdtempSync('/private/tmp/qchrome-');
const ch=spawn(C,['--headless=new','--disable-gpu',`--remote-debugging-port=${port}`,`--user-data-dir=${prof}`,'about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let list;for(let i=0;i<50;i++){try{list=await (await fetch(`http://127.0.0.1:${port}/json`)).json();if(list.find(t=>t.type==='page'))break}catch{}await sleep(200)}
const ws=new WebSocket(list.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.onopen=r);
let id=0;const pend={};ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pend[d.id]){pend[d.id](d);delete pend[d.id]}};
const send=(method,params={})=>new Promise(r=>{pend[++id]=r;ws.send(JSON.stringify({id,method,params}))});
const ev=async e=>(await send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true})).result?.result?.value;
const snap=async n=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`${here}/shots/${n}.png`,Buffer.from(r.result.data,'base64'))};
async function setup(w,h,mobile,reduced=false){
  await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});
  await send('Page.navigate',{url:`file://${here}/index.html`});await sleep(1500);
}
const out={};
const click=async k=>{await ev(`document.querySelectorAll('.opt')[${k}].click()`);await sleep(600)};
for(const [tag,w,h,mob] of [['d',1440,900,false],['m',390,844,true]]){
  await setup(w,h,mob);
  out[tag+'_overflow']=await ev('document.documentElement.scrollWidth-window.innerWidth');
  out[tag+'_firstOptBottom']=await ev('Math.round(document.querySelector(".opt").getBoundingClientRect().bottom)');
  await snap(`${tag}-t0`); await sleep(1000); await snap(`${tag}-t1s`);
  await click(0);await snap(`${tag}-q2`);await click(0);await click(2);await snap(`${tag}-q4`);await click(3);await click(2);await click(0);
  await snap(`${tag}-contact`);
  await ev(`document.querySelector('form#quizForm button[type=submit]').click()`);await sleep(500);await snap(`${tag}-contact-err`);
  await ev(`(()=>{const s=(i,v)=>{document.getElementById('f_'+i).value=v};s('name','Test Owner');s('clinic','Test Clinic');s('phone','5555550123');s('email','a@b.co');document.querySelector('form#quizForm button[type=submit]').click()})()`);
  await sleep(1200);await snap(`${tag}-booking`);
  await setup(w,h,mob);await click(2);await sleep(800);await snap(`${tag}-disq-owner`);
  await setup(w,h,mob);await click(0);await click(0);await click(2);await click(0);await sleep(800);await snap(`${tag}-disq-spend`);
  await setup(w,h,mob);
  const H=await ev('document.documentElement.scrollHeight');out[tag+'_height']=H;
  let n=0;for(let y=0;y<H;y+=Math.round(h*0.85)){await ev(`window.scrollTo(0,${y})`);await sleep(1300);await snap(`${tag}-scroll${String(n++).padStart(2,'0')}`)}
  out[tag+'_sticky']=await ev('document.getElementById("sticky").classList.contains("show")');
  out[tag+'_overflowAfter']=await ev('document.documentElement.scrollWidth-window.innerWidth');
}
await setup(390,844,true,true);await ev('window.scrollTo(0,1400)');await sleep(300);await snap('m-reduced-scroll');
out.reduced_hidden_m=await ev('[...document.querySelectorAll(".rv,.r")].filter(e=>getComputedStyle(e).opacity<1).length');
await setup(1440,900,false,true);out.reduced_hidden_d=await ev('[...document.querySelectorAll(".rv,.r")].filter(e=>getComputedStyle(e).opacity<1).length');
console.log(JSON.stringify(out,null,1));
ws.close();ch.kill();
