const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const contactHtml = fs.readFileSync(path.join(root, "contact/index.html"), "utf8");
const main = fs.readFileSync(path.join(root, "assets/js/main.js"), "utf8");

test("published contact page loads the contact client and verified endpoint", () => {
  assert.match(contactHtml, /assets\/js\/contact-form\.js/);
  assert.match(contactHtml, /data-contact-endpoint="https:\/\/formspree\.io\/f\/xbgldojr"/);
});

test("contact page renders a real form and initializes its submit handler", () => {
  for (const required of [
    '<form class="form-group" id="contact-form"',
    'name="name"',
    'name="email"',
    'name="app"',
    'name="category"',
    'name="message"',
    'type="submit"',
    'data-form-status',
    'initContactForm',
  ]) {
    assert.match(main, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
