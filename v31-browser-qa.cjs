const { chromium } = require('playwright');
const http = require('http'), fs=require('fs'), path=require('path'), assert=require('assert/strict');
const root=process.cwd();
const out=path.resolve('v31-qa-artifacts');
fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let base=root;if(p.startsWith('/nandakan/'))p=p.slice(10);else{res.writeHead(404).end();return;}
 let file=path.join(base,p);if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(!file.startsWith(base)||!fs.existsSync(file)){res.writeHead(404).end();return;}res.setHeader('Content-Type',types[path.extname(file)]||'text/plain');res.end(fs.readFileSync(file));});
function check(v,message){assert.ok(v,message);}
const crypto=require('crypto');
for(const item of JSON.parse(fs.readFileSync('v31-source-manifest.json','utf8'))){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,item.path))).digest('hex'),item.sha256,'Candidate file differs: '+item.path);}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/nandakan/`;
 const browser=await chromium.launch({headless:true});
 const results={browser:await browser.version(),base:'/nandakan/',viewports:[],interactions:[],errors:[],screenshots:[]};
 try{
 for(const [w,h] of [[1440,1000],[1280,800],[1024,768],[768,1024],[390,844],[375,812],[320,700],[375,667],[320,568],[844,390]]){
  const context=await browser.newContext({viewport:{width:w,height:h}});const page=await context.newPage();
  page.on('pageerror',e=>results.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)results.errors.push(r.url()+':'+r.status())});
  await page.goto(url);await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth));
  const enhanced=await page.locator('html').evaluate(e=>e.classList.contains('motion-ready'));
  const vp={width:w,height:h,enhanced,scenes:[]};results.viewports.push(vp);
  for(let scene=0;scene<(enhanced?7:1);scene++){
   await page.evaluate(i=>{const st=document.querySelector('.story'), stage=document.querySelector('.stage');window.scrollTo({top:st.offsetTop+(st.offsetHeight-stage.offsetHeight)*i/6,behavior:'instant'});},scene);
   await page.waitForTimeout(1000);
   const state=await page.evaluate(()=>{
    const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
    const visible=Array.from(document.querySelectorAll('.scene-copy')).filter(e=>getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden'&&parseFloat(getComputedStyle(e).opacity)>.5);
    const copy=visible[0];const cr=copy&&rect(copy);let children=copy?Array.from(copy.children).map(rect):[];
    const active=document.querySelector('.rail-item.active');const ar=active&&rect(active);const rr=rect(document.querySelector('.rail-viewport'));
    const phone=rect(document.querySelector('.phone'));const rail=rect(document.querySelector('.rail-shell'));
    const overlap=children.some(c=>c.x<phone.right&&c.right>phone.x&&c.y<phone.bottom&&c.bottom>phone.y);
    const clipped=children.some(c=>c.x< -1||c.right>innerWidth+1||c.y<0|| (document.documentElement.classList.contains('motion-ready')&&c.bottom>rail.y));
    return {scene:copy?.dataset.scene,title:copy?.querySelector('.scene-title').innerText,visible:visible.length,overflow:document.documentElement.scrollWidth>innerWidth,overlap,clipped,phone,rail,children,active:active?.dataset.jump,activeRailVisible:!ar||(ar.x>=rr.x-1&&ar.right<=rr.right+1),focusableHidden:Array.from(document.querySelectorAll('.scene-copy[aria-hidden="true"] a')).filter(a=>a.tabIndex>=0).length};
   });
   vp.scenes.push(state);
   check(state.visible===1,`${w}x${h} scene ${scene}: visible=${state.visible}`);
   check(state.scene===String(scene),`${w}x${h} wrong scene ${state.scene}`);
   check(!state.overflow,`${w}x${h} overflow`);check(!state.overlap,`${w}x${h} scene ${scene} copy/phone overlap`);check(!state.clipped,`${w}x${h} scene ${scene} copy clipped`);check(state.activeRailVisible,`${w}x${h} scene ${scene} rail clipped`);check(state.focusableHidden===0,'hidden focusable links');
   if((w===1440||w===390)&&enhanced){const name=`${w===1440?'desktop':'mobile'}-scene-${scene}.png`;await page.screenshot({path:path.join(out,name)});results.screenshots.push(name);}
  }
  if(enhanced){
   // Sample each transition in both directions; two readable headlines must never overlap.
   for(let i=0;i<6;i++)for(const f of [.25,.5,.75]){
    await page.evaluate(p=>{const s=document.querySelector('.story'),t=document.querySelector('.stage');scrollTo({top:s.offsetTop+(s.offsetHeight-t.offsetHeight)*p/6,behavior:'instant'});},i+f);
    await page.waitForTimeout(650);
    check(await page.evaluate(()=>Array.from(document.querySelectorAll('.scene-copy')).filter(e=>parseFloat(getComputedStyle(e).opacity)>.25).length<=1),`${w} doubled readable text`);
   }
  }
  await context.close();
 }
 // Control behavior at phone width.
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();await page.goto(url);
 await page.getByRole('button',{name:'次のシーン',exact:true}).click();await page.waitForTimeout(1700);check(await page.locator('.scene-copy[aria-hidden="false"]').getAttribute('data-scene')==='1','next button');
 await page.locator('.rail-item[data-jump="1"]').focus();await page.keyboard.press('ArrowRight');await page.waitForTimeout(1700);check(await page.locator('.scene-copy[aria-hidden="false"]').getAttribute('data-scene')==='2','keyboard');
 await page.locator('.rail-item[data-jump="6"]').evaluate(e=>e.click());await page.waitForTimeout(1700);check(await page.locator('.scene-copy[aria-hidden="false"]').getAttribute('data-scene')==='6','last rail');
 await page.getByRole('button',{name:'前のシーン',exact:true}).click();await page.waitForTimeout(1700);check(await page.locator('.scene-copy[aria-hidden="false"]').getAttribute('data-scene')==='5','previous');
 await page.locator('.motion-toggle').click();check(!await page.locator('html').evaluate(e=>e.classList.contains('motion-ready')),'motion off');check(await page.locator('.scene-copy[data-scene="0"]').isVisible(),'fallback intro');
 await page.locator('.motion-toggle').click();check(await page.locator('html').evaluate(e=>e.classList.contains('motion-ready')),'motion on');
 await page.locator('.nav-cta').click();await page.waitForTimeout(1800);check(await page.locator('#apps').evaluate(e=>e.getBoundingClientRect().top<innerHeight),'skip to app list');
 const links=await page.locator('a').evaluateAll(a=>a.map(x=>x.href));for(const link of [...new Set(links)])if(link.startsWith(url.split('/nandakan/')[0])&&!link.includes('#')){const r=await page.request.get(link);check(r.ok(),`broken local link ${link}`)}
 results.interactions.push('next/previous/last scene','ArrowRight','motion off/on','skip app list','all home local links');await context.close();
 for(const mode of ['no-js','reduced-motion']){
  const ctx=await browser.newContext({viewport:{width:390,height:844},javaScriptEnabled:mode!=='no-js',reducedMotion:mode==='reduced-motion'?'reduce':'no-preference'});const p=await ctx.newPage();await p.goto(url);await p.waitForTimeout(300);
  check(!await p.locator('html').evaluate(e=>e.classList.contains('motion-ready')),mode+' not static');check(await p.locator('.app-card').count()===11,mode+' missing apps');check(await p.locator('.scene-copy[data-scene="0"]').isVisible(),mode+' intro missing');check(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),mode+' overflow');
  const name=`mobile-${mode}.png`;await p.screenshot({path:path.join(out,name),fullPage:true});results.screenshots.push(name);results.interactions.push(mode+' static catalog');await ctx.close();
 }
 check(results.errors.length===0,JSON.stringify(results.errors));results.passed=true;
 }catch(e){results.failure=e.stack;throw e;}finally{fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(results,null,2));await browser.close();server.close();}
 console.log(JSON.stringify({passed:results.passed,viewports:results.viewports.length,scenes:results.viewports.reduce((n,v)=>n+v.scenes.length,0),checks:results.interactions,screenshots:results.screenshots.length}));
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
