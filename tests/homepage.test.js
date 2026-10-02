const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const html = read('index.html');
const context = { window: {} };
vm.runInNewContext(read('assets/js/app-data.js'), context);

test('homepage is static progressive enhancement with seven approved scenes', () => {
  assert.match(html, /class="home-document"/);
  assert.match(html, /assets\/css\/home-motion.css/);
  assert.match(html, /assets\/js\/home-motion.js/);
  assert.doesNotMatch(html, /assets\/js\/main.js/);
  assert.equal((html.match(/class="scene-copy"/g) || []).length, 7);
  assert.match(html, /日常の/);
  assert.match(html, /id="apps"/);
});

test('homepage preserves every existing app, description, status and verified store link', () => {
  for (const app of context.window.EVERYDAY_APPS) {
    assert.ok(html.includes(app.name), app.name);
    assert.ok(html.includes(app.description), app.slug + ' description');
    assert.ok(html.includes(`href="apps/${app.slug}/"`), app.slug + ' detail URL');
    const card = html.match(new RegExp(`<article[^>]+data-app-slug="${app.slug}"[^>]*>[\\s\\S]*?</article>`));
    assert.ok(card, app.slug + ' static card');
    assert.ok(card[0].includes(app.status), app.slug + ' status');
    if (app.storeUrl) assert.ok(card[0].includes(app.storeUrl), 'verified store URL');
  }
  assert.match(html, /href="tottecloud\/"/);
  assert.match(html, /リリース準備中/);
  assert.equal((html.match(/紹介デモ・配信状況未確認/g) || []).length, 4);
});

test('homepage maintains support, legal, contact, profile and deletion routes', () => {
  for (const route of ['apps/', 'support/', 'privacy/', 'terms/', 'contact/', 'profile/', 'account-deletion/fuufu-ringi/']) {
    assert.ok(html.includes(`href="${route}"`), route);
  }
  for (const [, link] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(?:#|https:|mailto:)/.test(link)) continue;
    const file = link.split('?')[0];
    assert.ok(fs.existsSync(path.join(root, file)), link);
  }
});

function render(page) {
  const site = {innerHTML: ''};
  const el = {addEventListener() {}, classList:{toggle(){}}, setAttribute(){}};
  const document = {
    body:{dataset:{page}}, head:{appendChild(){}}, createElement(){return {};},
    getElementById(){return site;}, querySelector(s){return s.includes('script[') ? {src:'https://example.test/nandakan/assets/js/main.js'} : el;},
    querySelectorAll(){return [];}
  };
  const ctx = {document, window:{matchMedia:()=>({matches:true})}, URL};
  vm.runInNewContext(read('assets/js/app-data.js'), ctx);
  vm.runInNewContext(read('assets/js/main.js'), ctx);
  return site.innerHTML;
}

test('existing TotteCloud routes are discoverable without inventing a terms page', () => {
  assert.match(render('apps'), /href="https:\/\/example.test\/nandakan\/tottecloud\/"/);
  assert.match(render('privacy'), /href="https:\/\/example.test\/nandakan\/privacy\/tottecloud\/"/);
  assert.match(render('support'), /href="https:\/\/example.test\/nandakan\/support\/tottecloud\/"/);
  assert.doesNotMatch(render('terms'), /terms\/tottecloud/);
});
