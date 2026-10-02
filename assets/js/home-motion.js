/* V3.1 home-only progressive enhancement; native vertical scrolling. */
(() => {
  'use strict';
  const root = document.documentElement;
  const home = document.querySelector('body.home-motion');
  if (!home) return;
  const q = (s) => home.querySelector(s);
  const all = (s) => Array.from(home.querySelectorAll(s));
  const story = q('.story'), stage = q('.stage'), zone = q('.device-zone');
  const copies = all('.scene-copy'), screens = all('.screen-scene');
  const bgs = all('.scene-bg'), words = all('.giant-word'), orbits = all('.orbit-card');
  const phone = q('.phone'), blobs = all('.blob'), rail = q('.rail-viewport');
  const items = all('.rail-item'), previous = q('.rail-prev'), next = q('.rail-next');
  const label = q('.progress-label'), fill = q('.progress-fill'), toggle = q('.motion-toggle');
  const count = copies.length, last = count - 1;
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t = clamp(t), t * t * (3 - 2 * t));
  const range = (a, b, x) => ease((x - a) / (b - a));
  const keys = [
    {x:9,y:0,r:7,s:1}, {x:2,y:-8,r:-6,s:1.035},
    {x:7,y:5,r:5,s:1.005}, {x:-5,y:0,r:-7,s:1.04},
    {x:5,y:7,r:6,s:1.01}, {x:-1,y:-7,r:-4,s:1.03}, {x:4,y:0,r:5,s:1.01}
  ];
  let enabled = false, manualReduced = false, mobile = false;
  let target = 0, displayed = 0, active = -1, raf = 0, previousTime = 0;
  let metrics = {}, lastRender = -10, isSeeking = false, seekTimer = 0;

  function visible(el, opacity, transform) {
    el.style.opacity = opacity.toFixed(4);
    el.style.visibility = opacity > .001 ? 'visible' : 'hidden';
    if (transform !== undefined) el.style.transform = transform;
  }
  function setAccessibleScene(index) {
    if (index === active) return;
    const focused = document.activeElement;
    const wasInCopy = copies.some(c => c.contains(focused));
    active = index;
    copies.forEach((el, i) => {
      el.inert = i !== index;
      el.setAttribute('aria-hidden', String(i !== index));
      el.querySelectorAll('a,button').forEach(a => { a.tabIndex = i === index ? 0 : -1; });
    });
    if (wasInCopy) copies[index].querySelector('a')?.focus({preventScroll:true});
    items.forEach((el,i) => {
      el.classList.toggle('active', i + 1 === index);
      if (i + 1 === index) el.setAttribute('aria-current','step');
      else el.removeAttribute('aria-current');
    });
    previous.disabled = index === 0;
    next.disabled = index === last;
    label.textContent = `${String(index).padStart(2,'0')} / ${String(last).padStart(2,'0')}`;
    q('.scene-progress').setAttribute('aria-valuenow',String(index));
    q('.scene-progress').setAttribute('aria-valuetext',index === 0 ? 'スタジオ紹介' : items[index-1].getAttribute('aria-label'));
  }
  // Keep a readable hold around each chapter; stagger text exits/entries to avoid double printing.
  function textOpacity(i, p) {
    const n = Math.floor(p), f = p - n;
    if (i === n) return 1 - range(.16,.52,f);
    if (i === n + 1) return range(.46,.80,f);
    return 0;
  }
  function blendOpacity(i,p) {
    const n = Math.floor(p), t = range(.14,.86,p-n);
    return i === n ? 1-t : i === n+1 ? t : 0;
  }
  function measure() {
    mobile = innerWidth <= 900;
    const stack = q('.copy-stack');
    if (mobile) {
      // Sum untransformed child boxes: the outgoing/incoming text must never push into the phone.
      const longest = Math.max(...copies.map(el => Array.from(el.children).reduce((h,child) => {
        const cs = getComputedStyle(child);
        return h + child.offsetHeight + parseFloat(cs.marginTop || 0) + parseFloat(cs.marginBottom || 0);
      },0)));
      const copyTop = 88;
      stack.style.height = `${Math.ceil(longest)}px`;
      zone.style.top = `${Math.ceil(copyTop + longest + 22)}px`;
      zone.style.bottom = `${Math.ceil(stage.offsetHeight - q('.rail-shell').offsetTop + 14)}px`;
    } else {
      stack.style.height = ''; zone.style.top = ''; zone.style.bottom = '';
    }
    const zw = zone.clientWidth, zh = zone.clientHeight;
    const pw = phone.offsetWidth, ph = phone.offsetHeight;
    const angle = 8 * Math.PI / 180;
    // Include max rotation, scale, and vertical travel in the fit, not just the unrotated device size.
    const fit = Math.min(mobile ? .87 : 1,
      (zh - (mobile ? 18 : 60)) / ((ph*Math.cos(angle) + pw*Math.sin(angle)) * 1.04),
      (zw - (mobile ? 54 : 100)) / ((pw*Math.cos(angle) + ph*Math.sin(angle)) * 1.04));
    const centers = items.map(el => el.offsetLeft + el.offsetWidth/2);
    metrics = {
      start: story.getBoundingClientRect().top + scrollY,
      travel: Math.max(1,story.offsetHeight-stage.offsetHeight),
      fit: Math.max(.25,fit), zw, zh,
      rx: Math.max(25,Math.min(zw/2-(mobile?27:78),pw*fit/2+(mobile?40:90))),
      ry: Math.max(25,Math.min(zh/2-32,ph*fit*.44)),
      centers, railWidth: rail.clientWidth, railMax: Math.max(0,rail.scrollWidth-rail.clientWidth)
    };
    updateTarget();
    render(displayed, true);
  }
  function updateTarget() {
    if (!enabled) return;
    target = clamp((scrollY-metrics.start)/metrics.travel)*last;
    if (!raf) { previousTime=0; raf=requestAnimationFrame(frame); }
  }
  function frame(now) {
    raf=0;
    if (!enabled || document.hidden) return;
    const elapsed = previousTime ? Math.min(64,Math.max(1,now-previousTime)) : 16.67;
    previousTime=now;
    // Time-based damping gives the same easing speed on 60 Hz and high-refresh screens.
    displayed += (target-displayed) * (1-Math.exp(-elapsed/105));
    if (Math.abs(target-displayed)<.0004) displayed=target;
    try { render(displayed); }
    catch (error) { disableMotion(); console.warn('Scroll animation stopped; static content remains visible.',error); return; }
    if (Math.abs(target-displayed)>.0004) raf=requestAnimationFrame(frame);
  }
  function render(p,force=false) {
    if (!enabled || (!force && Math.abs(p-lastRender)<.00005)) return;
    lastRender=p;
    const lower=Math.min(last,Math.floor(p)),upper=Math.min(last,lower+1);
    const t=range(.14,.86,p-lower),a=keys[lower],b=keys[upper];
    const factor=mobile ? .5 : 1;
    phone.style.transform=`translate3d(calc(-50% + ${mix(a.x,b.x,t)*factor}px),calc(-50% + ${mix(a.y,b.y,t)*factor}px),0) rotate(${mix(a.r,b.r,t)*(mobile?.7:1)}deg) scale(${mix(a.s,b.s,t)*metrics.fit})`;
    copies.forEach((el,i) => {
      const op=textOpacity(i,p), direction=i>p?1:-1;
      visible(el,op,`translate3d(0,${direction*(1-op)*(mobile?12:20)}px,0)`);
      el.style.pointerEvents = op > .5 ? 'auto' : 'none';
    });
    screens.forEach((el,i) => {
      const op=textOpacity(i,p);
      visible(el,op,`translate3d(${(i>p?1:-1)*(1-op)*10}px,${(i>p?1:-1)*(1-op)*12}px,0)`);
    });
    // Opaque base + incoming layer prevents the background whitening at a midpoint.
    bgs.forEach((el,i) => {
      const op=i===lower?1:i===upper&&upper!==lower?t:0;
      visible(el,op,`scale(1.02)`);
    });
    words.forEach((el,i) => {
      const op=blendOpacity(i,p);
      visible(el,op*.68,`translate(calc(-50% + ${(i-p)*(mobile?48:94)}px),-50%)`);
    });
    const selected=clamp(Math.round(p),0,last);
    setAccessibleScene(selected);
    fill.style.transform=`scaleY(${p/last})`;
    // Use measured offsets at both breakpoints; no hard-coded desktop item width.
    const ri=clamp(p-1,0,items.length-1),rl=Math.floor(ri),rr=Math.min(items.length-1,rl+1);
    const center=mix(metrics.centers[rl],metrics.centers[rr],ease(ri-rl));
    const left=clamp(center-metrics.railWidth/2,0,metrics.railMax);
    if (Math.abs(rail.scrollLeft-left)>.2) rail.scrollLeft=left;
    orbits.forEach((el,i) => {
      const strength=blendOpacity(i+1,p),intro=blendOpacity(0,p);
      const angle=i*Math.PI/3-.85 + p*.20;
      const depth=(Math.sin(angle)+1)/2;
      const x=Math.cos(angle)*metrics.rx, y=Math.sin(angle)*metrics.ry;
      const size=.84+depth*.12+strength*.07;
      el.style.transform=`translate3d(calc(-50% + ${x}px),calc(-50% + ${y}px),0) scale(${size}) rotate(${(i%2?1:-1)*(4-strength*3)}deg)`;
      el.style.opacity=String(clamp(.24+intro*.28+strength*.70));
      el.style.zIndex='11';
    });
    blobs.forEach((el,i) => { el.style.transform=`translate3d(${Math.sin(p*.7+i)*12}px,${Math.cos(p*.5+i)*10}px,0)`; });
  }
  function jump(index) {
    index=clamp(index,0,last);
    if (!enabled) { (index ? q(`#app-${index}`) : story).scrollIntoView({behavior:'auto'}); return; }
    isSeeking=true; clearTimeout(seekTimer);
    scrollTo({top:metrics.start+metrics.travel*index/last,behavior:mq.matches?'auto':'smooth'});
    seekTimer=setTimeout(()=>{isSeeking=false;},1200);
  }
  function disableMotion() {
    enabled=false;
    if(raf)cancelAnimationFrame(raf);raf=0;
    root.classList.remove('motion-ready');
    q('.copy-stack').style.height='';zone.style.top='';zone.style.bottom='';
    copies.forEach((el,i)=>{
      el.inert=i!==0;
      el.style.pointerEvents=i===0?'auto':'none';
      el.setAttribute('aria-hidden',String(i!==0));
      el.querySelectorAll('a,button').forEach(x=>x.tabIndex=i===0?0:-1);
    });
    toggle.setAttribute('aria-pressed','true');toggle.textContent='動き OFF';
    toggle.setAttribute('aria-label',mq.matches?'端末の設定に合わせて動きを抑えています':'動きを有効にする');
  }
  function configure() {
    const smallHeight=innerHeight<560 || (innerWidth<=600 && innerHeight<700);
    const allowed=!mq.matches&&!manualReduced&&!smallHeight;
    if (!allowed) {disableMotion();toggle.disabled=mq.matches||smallHeight;return;}
    toggle.disabled=false;root.classList.add('motion-ready');enabled=true;active=-1;lastRender=-10;
    toggle.setAttribute('aria-pressed','false');toggle.textContent='動き ON';toggle.setAttribute('aria-label','動きを少なくする');
    measure();displayed=target;render(displayed,true);
  }
  try {
    if (!story || !phone || !window.requestAnimationFrame) return;
    root.classList.add('has-controls');
    items.forEach((el,i)=>el.addEventListener('click',()=>jump(i+1)));
    previous.addEventListener('click',()=>jump(active-1)); next.addEventListener('click',()=>jump(active+1));
    rail.addEventListener('keydown',e=>{
      if (e.key!=='ArrowLeft'&&e.key!=='ArrowRight') return;
      e.preventDefault();jump(active+(e.key==='ArrowRight'?1:-1));
    });
    toggle.addEventListener('click',()=>{
      manualReduced=!manualReduced;
      configure();scrollTo({top:0,behavior:'instant'});
    });
    addEventListener('scroll',updateTarget,{passive:true});
    let resizeTimer=0;
    addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(configure,100);},{passive:true});
    if (mq.addEventListener) mq.addEventListener('change',configure);
    else if (mq.addListener) mq.addListener(configure);
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;}
      else if(enabled){previousTime=0;updateTarget();}
    });
    // A single headline is exposed at a time; the decorative phone/orbits stay out of reading order.
    q('.device-zone').setAttribute('aria-hidden','true');
    all('.giant-word,.scene-bg,.blob').forEach(el=>el.setAttribute('aria-hidden','true'));
    configure();
    if (document.fonts?.ready) document.fonts.ready.then(()=>{if(enabled)measure();});
    addEventListener('pageshow',()=>{if(enabled){measure();displayed=target;render(displayed,true);}});
  } catch(error) {
    disableMotion();
    console.warn('Static preview is available; motion could not initialize.',error);
  }
})();
