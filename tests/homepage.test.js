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

function render(page, slug, appOverrides) {
  const site = {innerHTML: ''};
  const el = {addEventListener() {}, classList:{toggle(){}}, setAttribute(){}};
  const document = {
    body:{dataset:{page, slug}}, head:{appendChild(){}}, createElement(){return {};},
    getElementById(){return site;}, querySelector(s){return s.includes('script[') ? {src:'https://example.test/nandakan/assets/js/main.js'} : el;},
    querySelectorAll(){return [];}
  };
  const ctx = {document, window:{matchMedia:()=>({matches:true})}, URL};
  vm.runInNewContext(read('assets/js/app-data.js'), ctx);
  if (appOverrides) {
    ctx.window.EVERYDAY_APPS = ctx.window.EVERYDAY_APPS.map(app =>
      app.slug === slug ? { ...app, ...appOverrides } : app);
  }
  vm.runInNewContext(read('assets/js/main.js'), ctx);
  return site.innerHTML;
}

test('the app directory links directly to all three verified Japanese App Store listings', () => {
  const directory = render('apps');
  const storeIds = [...directory.matchAll(/href="https:\/\/apps\.apple\.com\/jp\/app\/(?:[^"/]+\/)?id(\d+)"/g)]
    .map(([, id]) => id).sort();
  assert.deepEqual(storeIds, ['6810217834', '6815161304', '6820390181']);
});

test('the illustrated phone labels both unverified demos as concept screens', () => {
  for (const number of [5, 6]) {
    const phoneScene = html.match(new RegExp(`<div class="screen-scene app-screen" data-scene="${number}"[^>]*>\\s*<div class="screen-top">([^<]+)</div>`));
    assert.ok(phoneScene, `phone scene ${number}`);
    assert.match(phoneScene[1], /コンセプト/, `phone scene ${number} needs a visible label`);
  }
});

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
      assert.ok(fs.existsSync(path.resolve(root, path.dirname(page), link.split(/[?#]/)[0])), page + ': ' + link);
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

test('each generated app detail has three explained features', () => {
  for (const slug of ['fuufu-ringi', 'kinenbin', 'ato-nankai', 'fuufu-todo',
    'probability-simulator', 'developing-photo', 'speed-reversi', 'rhythms']) {
    const detail = render('app', slug);
    const explainedFeatures = [...detail.matchAll(/<div class="feature reveal">\s*<h3>[^<]+<\/h3>\s*<p>([^<]+)<\/p>/g)];
    assert.equal(explainedFeatures.length, 3, slug);
  }
});

test('development detail pages present planned use without a download link', () => {
  for (const slug of ['ato-nankai', 'fuufu-todo', 'probability-simulator',
    'developing-photo', 'speed-reversi', 'rhythms']) {
    const detail = render('app', slug);
    assert.match(detail, /構想している使い方/, slug);
    assert.doesNotMatch(detail, /href="https:\/\/apps\.apple\.com\//, slug);
  }
});

test('the three published support and privacy pages link to their own introduction and related route', () => {
  const base = 'https://example.test/nandakan/';
  const pages = [
    ['fuufu-ringi', 'apps/fuufu-ringi/', base,
      render('support-detail', 'fuufu-ringi'), render('privacy-detail', 'fuufu-ringi')],
    ['kinenbin', 'apps/kinenbin/', '../../',
      read('support/kinenbin/index.html'), read('privacy/kinenbin/index.html')],
    ['tottecloud', 'tottecloud/', '../../',
      read('support/tottecloud/index.html'), read('privacy/tottecloud/index.html')]
  ];
  for (const [slug, intro, root, support, privacy] of pages) {
    for (const html of [support, privacy]) {
      const navigation = html.match(/<nav[^>]+aria-label="アプリの関連情報"[^>]*>([\s\S]*?)<\/nav>/);
      assert.ok(navigation, slug + ' related navigation');
      const related = html === support ? 'privacy' : 'support';
      assert.ok(navigation[1].includes(`href="${root}${intro}"`), slug + ' introduction');
      assert.ok(navigation[1].includes(`href="${root}${related}/${slug}/"`), slug + ' ' + related);
    }
  }
});

test('Kinenbin support gives direct access to the existing notification and purchase FAQ answers', () => {
  const support = read('support/kinenbin/index.html');
  assert.match(support, /href="https:\/\/apps\.apple\.com\/jp\/app\/id6820390181"/);
  for (const target of ['notifications', 'restore-purchase']) {
    assert.ok(support.includes(`href="#${target}"`), target + ' link');
    assert.ok(support.includes(`<h3 id="${target}">`), target + ' heading');
  }
});

test('Kinenbin privacy retains its published policy as readable static content', () => {
  const privacy = read('privacy/kinenbin/index.html');
  assert.match(privacy, /最終更新日：2026年10月8日/);
  assert.match(privacy, /QR共有.*暗号化による閲覧制限がない/);
  assert.match(privacy, /移行用バックアップが残る/);
  assert.doesNotMatch(privacy, /<script[^>]+main\.js/);
  assert.match(privacy, /href="#sharing"/);
  assert.match(privacy, /<h2 id="sharing">/);
});

test('the published privacy routes point to the website consent notice', () => {
  const kinenbin = read('privacy/kinenbin/index.html');
  assert.ok(render('privacy-detail', 'fuufu-ringi').includes('href="https://example.test/nandakan/privacy/#website-analytics"'));
  assert.ok(kinenbin.includes('href="#website-analytics"'));
  assert.ok(kinenbin.includes('<h2 id="website-analytics">'));
  assert.ok(read('privacy/tottecloud/index.html').includes('href="../#website-analytics"'));
  assert.ok(render('privacy').includes('id="website-analytics"'));
});

test('development support uses the catalog development status', () => {
  for (const slug of ['ato-nankai', 'fuufu-todo', 'probability-simulator',
    'developing-photo', 'speed-reversi', 'rhythms']) {
    const support = render('support-detail', slug);
    assert.match(support, /開発中/, slug);
    assert.doesNotMatch(support, /公開準備中/, slug);
  }
});

test('TotteCloud privacy links to the policy destination Apple publishes', () => {
  const privacy = read('privacy/tottecloud/index.html');
  assert.ok(privacy.includes('href="https://nandakan-studio.com/privacy/tottecloud/"'));
});

test('the detail renderer still accepts cached app data with text-only highlights', () => {
  const detail = render('app', 'fuufu-ringi', {
    highlights: ['相談ごとを申請形式で整理'],
    detailFeatures: undefined,
  });
  assert.match(detail, /<h3>相談ごとを申請形式で整理<\/h3>/);
  assert.doesNotMatch(detail, /<p>undefined<\/p>/);
});
