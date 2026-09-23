/* pager.js: click-through pages on top of normal scrolling.
   Every element with class .pg is a page. Arrow keys / space, the bottom-right
   pager buttons, and a click on empty space (not a link, button, video or text
   selection) move one page. Scroll still works and snaps near page tops. */
(function(){
  const pages=Array.from(document.querySelectorAll('.pg'));if(pages.length<2)return;
  const root=document.scrollingElement||document.documentElement;
  const style=document.createElement('style');
  const deck=document.documentElement.dataset.snap==='mandatory';
  style.textContent=`html{scroll-snap-type:y proximity}.pg{scroll-snap-align:start}
  .pager{position:fixed;right:calc(clamp(16px,3vw,44px) + env(safe-area-inset-right,0px));bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:70;display:flex;align-items:center;gap:8px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.16em;color:var(--pager-fg,#fff);mix-blend-mode:var(--pager-blend,difference)}
  .pager .n{margin-right:6px;opacity:.8}
  .pager button{appearance:none;background:none;border:1px solid currentColor;color:inherit;width:34px;height:30px;cursor:pointer;font:inherit;border-radius:0;opacity:.85}
  .pager button:hover{opacity:1}.pager button:disabled{opacity:.25;cursor:default}
  @media (max-width:760px){.pager{right:14px}}`;
  document.head.appendChild(style);
  const ui=document.createElement('div');ui.className='pager';ui.setAttribute('aria-label','Pages');
  ui.innerHTML='<span class="n"><span id="pgCur">01</span> / '+String(pages.length).padStart(2,'0')+'</span><button id="pgPrev" aria-label="Previous page">←</button><button id="pgNext" aria-label="Next page">→</button>';
  document.body.appendChild(ui);
  const cur=document.getElementById('pgCur'),prev=document.getElementById('pgPrev'),next=document.getElementById('pgNext');
  const topOf=el=>el.getBoundingClientRect().top+root.scrollTop;
  function index(){const y=root.scrollTop+innerHeight*0.4;let i=0;for(let k=0;k<pages.length;k++){if(topOf(pages[k])<=y+2)i=k;else break;}return i;}
  let anim=null,target=null;
  function jump(i){i=Math.max(0,Math.min(pages.length-1,i));const from=root.scrollTop,to=Math.round(topOf(pages[i])),d=to-from;if(!d){update();return;}
    if(anim)cancelAnimationFrame(anim);const dur=Math.min(700,320+Math.abs(d)*0.22),t0=performance.now();
    document.documentElement.style.scrollSnapType='none';
    const step=now=>{const k=Math.min(1,(now-t0)/dur);const e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;root.scrollTop=from+d*e;
      if(k<1)anim=requestAnimationFrame(step);else{anim=null;root.scrollTop=to;document.documentElement.style.scrollSnapType='';target=null;update();}};
    anim=requestAnimationFrame(step);}
  function go(dir){const base=target!=null?target:index();target=Math.max(0,Math.min(pages.length-1,base+dir));jump(target);}
  function update(){const i=index();cur.textContent=String(i+1).padStart(2,'0');prev.disabled=i===0;next.disabled=i===pages.length-1;
    pages.forEach((p,k)=>p.classList.toggle('is-cur',k===i));}
  prev.addEventListener('click',e=>{e.stopPropagation();go(-1);});next.addEventListener('click',e=>{e.stopPropagation();go(1);});
  document.addEventListener('keydown',e=>{if(e.metaKey||e.ctrlKey||e.altKey)return;const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable))return;
    if(['ArrowRight','ArrowDown','PageDown',' ','Enter'].includes(e.key)){e.preventDefault();go(1);}
    else if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();go(-1);}
    else if(e.key==='Home'){e.preventDefault();jump(0);}else if(e.key==='End'){e.preventDefault();jump(pages.length-1);}});
  /* click on empty space advances; a drag or a text selection does not */
  let dx=0,dy=0;document.addEventListener('pointerdown',e=>{dx=e.clientX;dy=e.clientY;},{passive:true});
  document.addEventListener('click',e=>{if(e.defaultPrevented)return;if(Math.hypot(e.clientX-dx,e.clientY-dy)>6)return;
    if(e.target.closest('a,button,video,input,textarea,select,label,[data-nopage]'))return;
    const sel=getSelection();if(sel&&sel.toString().length)return;
    go(1);});
  /* deck mode: a wheel tick or a swipe moves exactly one page */
  if(deck){let lock=0;addEventListener('wheel',e=>{if(Math.abs(e.deltaY)<Math.abs(e.deltaX))return;e.preventDefault();const now=performance.now();if(now<lock||Math.abs(e.deltaY)<8)return;lock=now+750;go(e.deltaY>0?1:-1);},{passive:false});
    let ty=null,tt=0;addEventListener('touchstart',e=>{ty=e.changedTouches[0].clientY;tt=e.timeStamp;},{passive:true});
    addEventListener('touchend',e=>{if(ty===null)return;const dy=e.changedTouches[0].clientY-ty;if(Math.abs(dy)>50&&e.timeStamp-tt<700)go(dy<0?1:-1);ty=null;},{passive:true});}
  let raf;addEventListener('scroll',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(update);},{passive:true});
  addEventListener('resize',update);update();
})();
