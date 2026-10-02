
(()=>{try{
const APP=document.getElementById('fit');
if(!APP||/[?&]nointro/.test(location.search))return;
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches,R=(a,b)=>a+Math.random()*(b-a);
let rose='<svg viewBox="0 0 200 200" fill="none" stroke="#e9e5dc" stroke-width="1.4"><circle cx="100" cy="100" r="96"/><circle cx="100" cy="100" r="72"/><circle cx="100" cy="100" r="22"/>';
for(let i=0;i<12;i++)rose+='<g transform="rotate('+i*30+' 100 100)"><path d="M100 28V4M100 72V122"/><circle cx="100" cy="50" r="15"/><path d="M100 35 106 26 100 4 94 26Z"/></g>';
rose+='</svg>';
const wins=[[488,150],[492,80],[343,196],[637,190],[462,236],[526,236],[160,222],[826,232]].map((w,i)=>'<rect x="'+w[0]+'" y="'+w[1]+'" width="7" height="12" style="animation-delay:-'+(i*.7)+'s"/>').join('');
const castle='<svg class="cs" viewBox="0 0 1000 300" preserveAspectRatio="xMidYMax slice"><path fill="#000" stroke="rgba(233,229,220,.4)" stroke-width="1.5" d="M150 300V190h36V300ZM144 190l24-60 24 60ZM810 300V200h40V300ZM804 200l26-60 26 60ZM380 300V214h10v-8h10v8h10v-8h10v8h10v-8h10v8h10V300ZM550 300V214h10v-8h10v8h10v-8h10v8h10v-8h10v8h10V300ZM330 300V160h50V300ZM322 160l33-70 33 70ZM450 300V120h100V300ZM438 120 500 22l62 98ZM620 300V150h50V300ZM612 150l33-70 33 70ZM0 300V268l70-14 90 10 110-20 90 12 100-18V300ZM640 300V262l80-14 90 12 90-10 100 14V300Z"/>'+wins+'</svg>';
let ink='<svg class="ik" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">';
for(let i=0;i<26;i++){const a=R(0,6.28),d=R(150,430);ink+='<circle cx="'+(500+Math.cos(a)*d*1.35|0)+'" cy="'+(300+Math.sin(a)*d*.6|0)+'" r="'+(i<7?R(8,24):R(2,8)).toFixed(1)+'"/>'}
for(let i=0;i<7;i++){const x=R(120,880)|0,y=R(60,540)|0;ink+='<path d="M'+x+' '+y+'l'+R(-3,3).toFixed(1)+' '+R(30,90)|0+'" stroke="#e9e5dc" stroke-width="3" fill="none"/>'}
ink+='</svg>';
const tiles=(w,o)=>'<div class="tr">'+[...w].map((c,i)=>'<b class="tl'+((i+o)%2?' iv':'')+'" style="--r:'+(R(-5,5)).toFixed(1)+'deg;--d:'+((i+o*4)*.09).toFixed(2)+'s">'+c+'</b>').join('')+'</div>';
const HE=[['RONIN','浪'],['ARCHER','弓'],['MYSTIC','巫'],['MONK','僧'],['KAGE','影'],['ONI','鬼']];
const el=document.createElement('div');el.id='wk';el.className='gate'+(RM?' rm':'');
el.innerHTML='<i class="dt"></i><div class="rs">'+rose+'</div><i class="mn"></i>'+ink+'<i class="kj">死</i>'+castle
+[0,1,2].map(i=>'<i class="bt" style="--i:'+i+';top:'+(18+i*7)+'%"></i>').join('')
+'<div class="vt">言霊 ・ 斬 ・ 夜</div><div class="vl">TYPE · SLASH · SURVIVE</div>'
+'<div class="ct"><div class="wsw">WELCOME TO</div>'+tiles('DEAD',0)+tiles('KEYS',1)+'<div class="tg">TYPE FAST. STAY ALIVE.</div></div>'
+'<div class="ro">'+HE.map((h,i)=>'<div class="hc" style="--i:'+i+'"><i>'+h[1]+'</i><small>0'+(i+1)+'</small><b>'+h[0]+'</b></div>').join('')+'</div>'
+'<div class="sg"><u>ACT 0</u><div><small>STAGE 1</small><b>HOLLOW ROAD</b></div></div>'
+'<div class="pg"><i>黄泉</i><b>PRESS ANY KEY</b></div><div class="hn">ANY KEY · SKIP</div>'
+'<i class="fl a"></i><i class="fl b"></i><i class="fl c"></i><i class="ex"></i>';
APP.appendChild(el);
let st=0,M=null,tm=0;
const snd=()=>{try{
 aInit();if(!AU.ctx||!ST.sfx)return;
 AU.ctx.resume&&AU.ctx.resume();
 const c=AU.ctx,t=c.currentTime+.06;M=c.createGain();M.gain.value=1.15;M.connect(AU.sfx);
 const bell=(f,x,v,d)=>[1,2.76,5.4,8.9].forEach((k,i)=>tone(f*k,t+x,(d||2.8)-i*.4,'sine',v/(i+1),M));
 const boom=(x,v)=>{sweep(150,34,t+x,.55,'sine',v,M);noise(t+x,.35,v*.35,200,M);tone(55,t+x,.5,'triangle',v*.5,M,300)};
 // drone pad under everything
 [55,82.4,110,164.8].forEach((f,i)=>tone(f,t,6.4,'sawtooth',.03,M,420+i*80));
 // 0.2 lightning + tolling bell
 noise(t+.2,.9,.28,140,M);boom(.2,.5);bell(98,.2,.36,3.4);
 // 0.95 WELCOME TO whoosh
 swipe(t+.9,.35,.28,5200,700,M);tone(660,t+1.2,.16,'square',.04,M,3000);
 // 1.45 kanji slam
 boom(1.5,.4);tone(110,t+1.5,.6,'sawtooth',.08,M,700);
 // 1.95 title slam
 boom(1.95,.7);bell(73.4,1.95,.4,3);swipe(t+1.95,.3,.32,7500,1200,M);
 for(let i=0;i<8;i++){const x=2.07+i*.09;noise(t+x,.07,.2,2400,M);sweep(240,90,t+x,.1,'square',.1,M,1600);tone(420+(i%4)*70,t+x,.1,'triangle',.05,M)}
 // 2.9 tagline
 swipe(t+2.9,.3,.24,6500,1400,M);tone(880,t+3.05,.14,'square',.035,M,3200);
 // 3.3 hero cards rise
 swipe(t+3.25,.45,.2,900,6000,M);
 for(let i=0;i<6;i++){noise(t+3.3+i*.09,.05,.14,3200,M);tone(520+i*90,t+3.3+i*.09,.12,'triangle',.07,M)}
 // 3.95 highlight sweep ticks
 for(let i=0;i<6;i++)tone(700+i*120,t+3.95+i*.2,.16,'square',.04,M,3600);
 // 4.4 stage card
 swipe(t+4.4,.3,.2,6000,1400,M);bell(196,4.45,.12,1.6);
 // 5.0 tail rumble
 sweep(60,28,t+5,1.4,'sine',.4,M);
}catch(e){console.warn('intro sound',e)}};
const fin=()=>{if(st===2)return;st=2;clearTimeout(tm);
 try{if(M){M.gain.cancelScheduledValues(0);M.gain.setTargetAtTime(0,AU.ctx.currentTime,.1)}sfx('slash')}catch(e){}
 el.classList.add('out');setTimeout(()=>{el.remove();window.__kbGate=prev},700)};
const go=()=>{st=1;el.classList.remove('gate');el.classList.add('go');snd();tm=setTimeout(fin,RM?2400:6600)};
const act=()=>st===0?go():fin();
const prev=window.__kbGate;
window.__kbGate=function(e){
 if(el.isConnected){
  if(e.ctrlKey||e.metaKey||e.altKey||/^F\d{1,2}$/.test(e.key))return;
  e.preventDefault();e.stopImmediatePropagation();
  if(!e.repeat&&e.key!=='Shift'&&e.key!=='Tab')act();
  return}
 return prev&&prev(e)};
el.addEventListener('pointerdown',e=>{e.preventDefault();act()});
}catch(e){console.warn('intro off',e)}})();
