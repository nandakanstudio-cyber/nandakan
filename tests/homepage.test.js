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
  assert.doesNotMatch(html, /リリース準備中/);
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


test('TotteCloud is published with its verified App Store destination on entry pages', () => {
  const store = 'https://apps.apple.com/jp/app/id6815161304';
  const card = html.match(/<article[^>]+data-app-slug="tottecloud"[^>]*>[\s\S]*?<\/article>/)[0];
  assert.ok(card.includes('公開中'));
  assert.ok(card.includes(store));
  for (const page of ['tottecloud/index.html', 'support/tottecloud/index.html']) {
    assert.ok(read(page).includes(store));
    assert.ok(read(page).includes('App Storeで公開中'));
    assert.ok(!read(page).includes('リリース準備中'));
  }
  assert.ok(render('apps').includes('公開中'));
  assert.ok(render('apps').includes(store));
  assert.ok(!render('apps').includes('リリース準備中'));
});

test('TotteCloud retains both websites and adds paths back to the comprehensive studio', () => {
  assert.ok(read('tottecloud/index.html').includes('href="https://nandakan-studio.com/"'));
  for (const page of ['tottecloud/index.html', 'privacy/tottecloud/index.html', 'support/tottecloud/index.html']) {
    assert.ok(read(page).includes('NANDAKANStudio 総合サイト'));
    for (const [, link] of read(page).matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(?:#|https:|mailto:)/.test(link)) continue;
      assert.ok(fs.existsSync(path.resolve(root, path.dirname(page), link.split('?')[0])), page + ': ' + link);
    }
  }
});

test('TotteCloud paid and free plan limits remain unchanged', () => {
  const intro = read('tottecloud/index.html');
  for (const fact of ['月30枚', '5枚増えます', '無料プランには広告があります', 'Proは買い切り', 'Google Driveの保存容量は増えません']) {
    assert.ok(intro.includes(fact), fact);
  }
});

test('TotteCloud store link has explicit light and dark colors', () => {
  const css = read('tottecloud/style.css');
  assert.match(css, /\.store-link[^}]*background: #084eab; color: #fff/);
  assert.match(css, /\.store-link[^}]*background: #91c4ff; color: #14181e/);
});
