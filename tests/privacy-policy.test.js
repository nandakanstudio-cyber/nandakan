const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function renderFuufuRingiPrivacy() {
  const siteElement = { innerHTML: "" };
  const interactiveElement = {
    addEventListener() {},
    classList: { toggle() { return false; } },
    setAttribute() {},
  };
  const document = {
    body: { dataset: { page: "privacy-detail", slug: "fuufu-ringi" } },
    head: { appendChild() {} },
    createElement() { return {}; },
    getElementById(id) { return id === "site" ? siteElement : null; },
    querySelector(selector) {
      if (selector.includes('script[src*="main.js"]')) {
        return { src: "https://example.test/nandakan/assets/js/main.js" };
      }
      return interactiveElement;
    },
    querySelectorAll() { return []; },
  };
  const window = { matchMedia: () => ({ matches: true }) };
  const context = vm.createContext({ document, window, URL });

  vm.runInContext(
    fs.readFileSync(path.join(root, "assets/js/app-data.js"), "utf8"),
    context,
  );
  vm.runInContext(
    fs.readFileSync(path.join(root, "assets/js/main.js"), "utf8"),
    context,
  );

  return siteElement.innerHTML;
}

test("rendered FuufuRingi privacy policy describes current production services", () => {
  const html = renderFuufuRingiPrivacy();

  for (const expected of [
    "Firebase Cloud Messaging",
    "Apple Push Notification service",
    "StoreKit",
    "Apple署名付き取引情報",
    "Formspree",
    "正確な位置情報を独自に取得しません",
  ]) {
    assert.match(html, new RegExp(expected), expected);
  }
});

test("rendered FuufuRingi privacy policy states exact account deletion behavior", () => {
  const html = renderFuufuRingiPrivacy();

  for (const expected of [
    "Firebase Authenticationの匿名アカウントを削除",
    "利用者本人の下書き申請は削除",
    "削除済みユーザー",
    "夫婦ルームとその申請・コメントを削除",
    "もう一方の利用者のアカウントや投稿は削除しません",
    "正常完了後7日間",
  ]) {
    assert.match(html, new RegExp(expected), expected);
  }
});

test("rendered FuufuRingi privacy policy shows the audited revision date", () => {
  assert.match(renderFuufuRingiPrivacy(), /制定日・最終更新日：2026年9月20日/);
});
