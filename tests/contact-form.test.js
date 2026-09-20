const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateContact,
  buildContactPayload,
  submitContact,
} = require("../assets/js/contact-form.js");

const valid = {
  name: "山田 はなこ",
  email: "hanako@example.com",
  app: "夫婦稟議",
  category: "不具合",
  message: "招待コードを入力するとエラーになります。",
  website: "",
};

test("valid contact values pass validation and are trimmed", () => {
  const result = validateContact({ ...valid, name: "  山田 はなこ  " });
  assert.equal(result.ok, true);
  assert.equal(result.values.name, "山田 はなこ");
});

test("invalid input and the honeypot are rejected", () => {
  assert.equal(validateContact({ ...valid, message: " " }).ok, false);
  assert.equal(validateContact({ ...valid, email: "invalid" }).ok, false);
  assert.equal(validateContact({ ...valid, email: "a@example.com\r\nBcc:x@example.com" }).ok, false);
  assert.equal(validateContact({ ...valid, message: "x".repeat(5001) }).ok, false);
  assert.equal(validateContact({ ...valid, website: "bot.example" }).ok, false);
});

test("payload contains the Formspree subject and support metadata", () => {
  const payload = buildContactPayload(valid, {
    sourceUrl: "https://nandakanstudio-cyber.github.io/nandakan/contact/",
    now: new Date("2026-09-20T01:02:03.000Z"),
  });
  assert.equal(payload._subject, "【NANDAKANStudioお問い合わせ】【夫婦稟議】不具合");
  assert.equal(payload.email, valid.email);
  assert.equal(payload["対象アプリ"], "夫婦稟議");
  assert.equal(payload["お問い合わせ種別"], "不具合");
  assert.equal(payload["送信元ページ"], "https://nandakanstudio-cyber.github.io/nandakan/contact/");
  assert.equal(payload._gotcha, "");
});

test("submitContact posts multipart data and accepts an ok provider response", async () => {
  let request;
  const result = await submitContact({
    endpoint: "https://formspree.io/f/example",
    values: valid,
    sourceUrl: "https://nandakanstudio-cyber.github.io/nandakan/contact/",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, status: 200 };
    },
  });
  assert.deepEqual(result, { ok: true });
  assert.equal(request.url, "https://formspree.io/f/example");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers.Accept, "application/json");
  assert.equal(request.options.body.get("_gotcha"), "");
});

test("submitContact rejects provider errors", async () => {
  await assert.rejects(
    submitContact({
      endpoint: "https://formspree.io/f/example",
      values: valid,
      fetchImpl: async () => ({ ok: false, status: 422 }),
    }),
    /送信サービスがエラーを返しました/,
  );
});
