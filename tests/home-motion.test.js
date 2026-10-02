// State-machine regression tests. These do not replace real browser layout QA.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/home-motion.js'), 'utf8');

function setup({ reduced = false, width = 1440, height = 1000 } = {}) {
  const element = () => {
    const classes = new Set(), listeners = new Map(), attrs = new Map();
    return {
      style: {}, children: [], offsetTop: 900, offsetLeft: 0, offsetWidth: 136,
      offsetHeight: 46, clientWidth: 630, clientHeight: 700, scrollWidth: 872, scrollLeft: 0,
      classList: { add: v => classes.add(v), remove: v => classes.delete(v), contains: v => classes.has(v), toggle: (v,on) => on ? classes.add(v) : classes.delete(v) },
      addEventListener: (type,fn) => listeners.set(type,fn),
      dispatch: (type,event = {}) => listeners.get(type)?.(event),
      setAttribute: (k,v) => attrs.set(k,v), getAttribute: k => attrs.get(k), removeAttribute: k => attrs.delete(k),
      contains: () => false, querySelectorAll: () => [], querySelector: () => null,
      getBoundingClientRect: () => ({top: 0}), scrollIntoView() {}, focus() {}
    };
  };
  const one = Object.fromEntries(['.story','.stage','.device-zone','.phone','.rail-viewport','.rail-prev','.rail-next','.progress-label','.progress-fill','.motion-toggle','.scene-progress','.copy-stack','.rail-shell'].map(s => [s,element()]));
  one['.story'].offsetHeight = 7200; one['.stage'].offsetHeight = height;
  one['.phone'].offsetWidth = 302; one['.phone'].offsetHeight = 620;
  const many = Object.fromEntries(['.scene-copy','.screen-scene','.scene-bg','.giant-word','.orbit-card','.blob','.rail-item'].map(s=>[s,Array.from({length: ['.rail-item','.orbit-card'].includes(s) ? 6 : s === '.blob' ? 3 : 7},element)]));
  const anchors = many['.scene-copy'].map(copy => {
    const anchor = element(); copy.querySelectorAll = () => [anchor]; copy.querySelector = () => anchor;
    copy.children = [{offsetHeight: 200}]; return anchor;
  });
  many['.rail-item'].forEach((item,i)=>{item.offsetLeft=i*144;item.setAttribute('aria-label','App '+(i+1));});
  const home = {querySelector:s=>one[s],querySelectorAll:s=>many[s]||[]};
  const root = element(), events = new Map(), mq = {matches:reduced,addEventListener(type,fn){this.listener=fn}};
  let frames=[],now=0;
  const raf = fn => (frames.push(fn),frames.length);
  const document = {documentElement:root,activeElement:null,hidden:false,querySelector:()=>home,addEventListener:(t,fn)=>events.set(t,fn)};
  const ctx = {document,window:{matchMedia:()=>mq,requestAnimationFrame:raf},innerWidth:width,innerHeight:height,scrollY:0,
    requestAnimationFrame:raf,cancelAnimationFrame:()=>{frames=[]},addEventListener:(t,fn)=>events.set(t,fn),
    getComputedStyle:()=>({marginTop:'0',marginBottom:'0'}),setTimeout:()=>1,clearTimeout(){},console,
    scrollTo({top}) {ctx.scrollY=top;events.get('scroll')?.();}
  };
  vm.runInNewContext(source,ctx);
  const settle = () => {for(let n=0;frames.length&&n<200;n++){const batch=frames;frames=[];for(const f of batch)f(now+=16.67);}assert.equal(frames.length,0,'animation stops after settling');};
  const seek = index => {ctx.scrollTo({top:(7200-height)*index/6});settle();};
  return {one,many,root,mq,anchors,ctx,settle,seek,events};
}

test('moving to a scene and disabling motion restores clickable intro links', () => {
  const s=setup(); s.seek(3);
  assert.equal(s.many['.scene-copy'][0].style.pointerEvents,'none');
  s.one['.motion-toggle'].dispatch('click');
  assert.equal(s.root.classList.contains('motion-ready'),false);
  assert.equal(s.many['.scene-copy'][0].style.pointerEvents,'auto');
  assert.equal(s.anchors[0].tabIndex,0);
});

test('all seven scenes update copy, rail, progress and hidden focus state', () => {
  const s=setup();
  for(const i of [0,1,2,3,4,5,6,5,4,3,2,1,0]) {
    s.seek(i);
    assert.equal(s.one['.scene-progress'].getAttribute('aria-valuenow'),String(i));
    assert.equal(s.many['.scene-copy'][i].getAttribute('aria-hidden'),'false');
    s.anchors.forEach((a,j)=>assert.equal(a.tabIndex,j===i?0:-1));
    assert.equal(s.one['.rail-prev'].disabled,i===0);
    assert.equal(s.one['.rail-next'].disabled,i===6);
  }
});

test('reduced motion and small screens stay static', () => {
  for(const options of [{reduced:true},{width:375,height:667},{width:844,height:390}]){
    const s=setup(options);
    assert.equal(s.root.classList.contains('motion-ready'),false);
    assert.equal(s.one['.motion-toggle'].disabled,true);
    assert.equal(s.anchors[0].tabIndex,0);
  }
});

test('motion can be repeatedly disabled and enabled after changing scenes', () => {
  const s=setup();
  for(let n=0;n<3;n++){
    s.seek(6);s.one['.motion-toggle'].dispatch('click');
    assert.equal(s.root.classList.contains('motion-ready'),false);
    s.one['.motion-toggle'].dispatch('click');s.settle();
    assert.equal(s.root.classList.contains('motion-ready'),true);
    assert.equal(s.one['.scene-progress'].getAttribute('aria-valuenow'),'0');
  }
});

test('rail clicks and keyboard arrows use native scroll destinations and stay bounded', () => {
  const s=setup();
  s.many['.rail-item'][2].dispatch('click'); s.settle();
  assert.equal(s.one['.scene-progress'].getAttribute('aria-valuenow'),'3');
  let prevented=false;
  s.one['.rail-viewport'].dispatch('keydown',{key:'ArrowRight',preventDefault(){prevented=true;}}); s.settle();
  assert.equal(prevented,true);
  assert.equal(s.one['.scene-progress'].getAttribute('aria-valuenow'),'4');
  s.seek(6); s.one['.rail-next'].dispatch('click'); s.settle();
  assert.equal(s.one['.scene-progress'].getAttribute('aria-valuenow'),'6');
  s.seek(0); s.one['.rail-prev'].dispatch('click'); s.settle();
  assert.equal(s.one['.scene-progress'].getAttribute('aria-valuenow'),'0');
});

test('changing reduced-motion preference after scrolling restores intro interaction', () => {
  const s=setup(); s.seek(4); s.mq.matches=true; s.mq.listener();
  assert.equal(s.root.classList.contains('motion-ready'),false);
  assert.equal(s.many['.scene-copy'][0].style.pointerEvents,'auto');
  assert.equal(s.one['.motion-toggle'].disabled,true);
});
