const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const filename = path.join(root, 'assets/js/analytics.js');
const source = fs.existsSync(filename) ? fs.readFileSync(filename, 'utf8') : '';
const id = 'G-TEST123456';
const key = 'nandakan:analytics-consent:v1:/nandakan/';
function setup({ choice, href = 'https://example.test/nandakan/?email=secret@example.com#token', referrer = 'https://search.test/private?q=secret', storageBlocked = false } = {}) {
  const elements = new Map();
  const appended = [];
  const events = {};
  const stored = new Map(choice ? [[key, JSON.stringify({ choice, expires: Date.now() + 100000 })]] : []);
  class Element {
    constructor(tag) { this.tagName = tag; this.hidden = false; this.events = {}; this.children = []; }
    setAttribute(name, value) { this[name] = value; }
    appendChild(child) { this.children.push(child); appended.push(child); if (child.id) elements.set(child.id, child); return child; }
    addEventListener(type, listener) { this.events[type] = listener; }
    focus() { this.focused = true; }
    remove() { this.removed = true; }
  }
  const document = {
    title: 'NANDAKAN', referrer, cookie: '_ga=one; _ga_TEST123456=two; unrelated=keep',
    head: new Element('head'), body: new Element('body'),
    createElement: tag => new Element(tag),
    querySelector: selector => selector.includes('analytics.js') ? { src: 'https://example.test/nandakan/assets/js/analytics.js' } : null,
    getElementById: name => elements.get(name),
    addEventListener: (name, listener) => { events[name] = listener; }
  };
  const window = {
    location: { href, hostname: 'example.test', reload() { window.reloaded = true; } },
    localStorage: { getItem(k) { if (storageBlocked) throw Error('blocked'); return stored.get(k) || null; }, setItem(k, v) { if (storageBlocked) throw Error('blocked'); stored.set(k, v); } },
    addEventListener: (name, listener) => { events[name] = listener; }
  };
  const context = vm.createContext({ document, window, URL, Date, console });
  vm.runInContext(source.replace(/const MEASUREMENT_ID = "[^"]*";/, `const MEASUREMENT_ID = "${id}";`), context);
  const commands = () => JSON.parse(JSON.stringify((window.dataLayer || []).map(args => Array.from(args))));
  const click = name => { assert.ok(elements.has(name), `Missing ${name}`); elements.get(name).events.click(); };
  const googleScripts = () => appended.filter(e => e.tagName === 'script' && e.src?.includes('googletagmanager.com'));
  return { window, document, stored, elements, events, commands, click, googleScripts };
}

test('analytics never loads Google or queues measurement before an explicit choice', () => {
  const s = setup();
  assert.ok(s.elements.has('nandakan-analytics-banner'));
  assert.equal(s.googleScripts().length, 0);
  assert.deepEqual(s.commands(), []);
});
test('declining and returning declined both keep Google entirely unloaded', () => {
  const s = setup(); s.click('nandakan-analytics-decline');
  assert.equal(s.googleScripts().length, 0);
  assert.equal(JSON.parse(s.stored.get(key)).choice, 'denied');
  assert.equal(setup({ choice: 'denied' }).googleScripts().length, 0);
});
test('granting queues one sanitized page view with advertising disabled', () => {
  const s = setup(); s.click('nandakan-analytics-allow'); s.click('nandakan-analytics-allow');
  assert.equal(s.googleScripts().length, 1);
  assert.equal(s.googleScripts()[0].referrerPolicy, 'no-referrer');
  const commands = s.commands();
  const config = commands.find(c => c[0] === 'config');
  assert.equal(config[1], id);
  assert.equal(config[2].send_page_view, false);
  assert.equal(config[2].allow_google_signals, false);
  assert.equal(config[2].allow_ad_personalization_signals, false);
  assert.equal(config[2].page_location, 'https://example.test/nandakan/');
  assert.equal(config[2].page_referrer, 'https://search.test/');
  assert.equal(config[2].cookie_domain, 'none');
  assert.equal(config[2].cookie_path, '/nandakan/');
  assert.equal(commands.filter(c => c[0] === 'event' && c[1] === 'page_view').length, 1);
  assert.ok(!JSON.stringify(commands).includes('secret'));
  assert.ok(commands.some(c => c[0] === 'consent' && c[2].ad_storage === 'denied' && c[2].ad_user_data === 'denied' && c[2].ad_personalization === 'denied'));
});
test('returning consent loads once and settings can withdraw consent', () => {
  const s = setup({ choice: 'granted' });
  assert.equal(s.googleScripts().length, 1);
  s.click('nandakan-analytics-settings');
  assert.equal(s.elements.get('nandakan-analytics-banner').hidden, false);
  s.click('nandakan-analytics-decline');
  assert.equal(s.window[`ga-disable-${id}`], true);
  assert.equal(JSON.parse(s.stored.get(key)).choice, 'denied');
  assert.equal(s.window.reloaded, true);
});
test('blocked storage still requires choice and does not break consent UI', () => {
  const s = setup({ storageBlocked: true });
  assert.equal(s.googleScripts().length, 0);
  s.click('nandakan-analytics-allow');
  assert.equal(s.googleScripts().length, 1);
});
test('only the verified App Store destination produces the app-specific event', () => {
  const s = setup();
  const emit = href => s.events.click({ target: { closest() { return { href }; } } });
  const store = 'https://apps.apple.com/jp/app/name/id6810217834?secret=hidden#token';
  emit(store); assert.equal(s.commands().length, 0);
  s.click('nandakan-analytics-allow');
  emit(store);
  emit('https://apps.apple.com.evil.test/app/id6810217834');
  emit('https://apps.apple.com/jp/app/id999999999');
  emit('mailto:secret@example.com');
  const events = s.commands().filter(c => c[0] === 'event' && c[1] === 'app_store_click');
  assert.equal(events.length, 1);
  assert.equal(events[0][2].app_slug, 'fuufu-ringi');
  assert.equal(events[0][2].app_store_id, '6810217834');
  assert.ok(!JSON.stringify(events).includes('hidden'));
  assert.ok(!JSON.stringify(events).includes('token'));
});
test('withdrawing in another tab immediately stops this page too', () => {
  const s = setup({ choice: 'granted' });
  s.events.storage({ key, newValue: JSON.stringify({ choice: 'denied', expires: Date.now()+100000 }) });
  assert.equal(s.window[`ga-disable-${id}`], true);
  assert.equal(s.window.reloaded, true);
});
test('all 43 normal HTML pages include a single correctly resolved analytics script and stylesheet', () => {
  const files = fs.readdirSync(root, { recursive: true }).filter(p => p.endsWith('.html') && !p.startsWith('.git') && !p.startsWith('google'));
  assert.equal(files.length, 43);
  for (const file of files) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    for (const [asset, pattern] of [['assets/js/analytics.js', /<script[^>]*src="([^"]*analytics\.js[^\"]*)"[^>]*defer[^>]*>/g], ['assets/css/analytics.css', /<link[^>]*href="([^"]*analytics\.css[^\"]*)"[^>]*>/g]]) {
      const matches = [...html.matchAll(pattern)];
      assert.equal(matches.length, 1, file + ' loads ' + asset);
      assert.equal(path.resolve(path.dirname(path.join(root, file)), matches[0][1].split('?')[0]), path.join(root, asset));
    }
  }
});
test('website privacy notice describes consent and Google without changing audited app policy date', () => {
  const main = fs.readFileSync(path.join(root, 'assets/js/main.js'), 'utf8');
  assert.match(main, /このウェブサイトのアクセス解析/);
  assert.match(main, /Google Analytics/);
  assert.match(main, /アクセス解析の設定/);
  assert.match(main, /policies\.google\.com\/privacy/);
  assert.match(fs.readFileSync(path.join(root, 'assets/js/app-data.js'), 'utf8'), /privacyUpdated: "2026年9月20日"/);
});

test('mobile homepage consent controls reserve space above the existing 58px app rail', () => {
  const css = fs.readFileSync(path.join(root, 'assets/css/analytics.css'), 'utf8');
  assert.match(css, /@media\s*\(max-width:\s*900px\)/);
  assert.match(css, /\.home-document\.motion-ready\s+#nandakan-analytics-settings/);
  assert.match(css, /bottom:\s*calc\(max\(12px,\s*env\(safe-area-inset-bottom\)\)\s*\+\s*70px\)/);
});
