const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function renderLegal(page, slug) {
  const siteElement = { innerHTML: "" };
  const interactiveElement = {
    addEventListener() {},
    classList: { toggle() { return false; } },
    setAttribute() {},
  };
  const document = {
    body: { dataset: { page, slug } },
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
  for (const file of ["app-data.js", "main.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, "assets/js", file), "utf8"), context);
  }
  return siteElement.innerHTML;
}

// Catch accidentally using the generic advertisement clause for Kinenbin.
test("Kinenbin terms render the ad-free condition for both editions", () => {
  const html = renderLegal("terms-detail", "kinenbin");
  assert.match(html, /無料版・プレミアムともに、広告は表示しません/);
  assert.doesNotMatch(html, /本アプリには広告が表示される場合があります/);
  assert.doesNotMatch(html, /広告先のサービス/);
});

// Catch a generic draft badge leaking onto the corrected Kinenbin terms.
test("Kinenbin terms render without the preparation-template notice", () => {
  const html = renderLegal("terms-detail", "kinenbin");
  assert.doesNotMatch(html, /class="draft-note"/);
  assert.doesNotMatch(html, /公開準備用のひな形/);
});

// Catch broadening the new exception to unrelated apps or privacy pages.
test("the Kinenbin terms exception leaves generic legal routes unchanged", () => {
  const otherTerms = renderLegal("terms-detail", "fuufu-todo");
  assert.match(otherTerms, /class="draft-note"/);
  assert.match(otherTerms, /本アプリには広告が表示される場合があります/);
  const genericPrivacy = renderLegal("privacy-detail", "kinenbin");
  assert.match(genericPrivacy, /class="draft-note"/);
  assert.doesNotMatch(renderLegal("terms-detail", "fuufu-ringi"), /class="draft-note"/);
  assert.doesNotMatch(renderLegal("privacy-detail", "fuufu-ringi"), /class="draft-note"/);
});
