(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.NANDAKAN_CONTACT = api;
})(typeof window !== "undefined" ? window : undefined, function () {
  "use strict";

  const LIMITS = Object.freeze({
    name: 80,
    email: 254,
    app: 80,
    category: 80,
    message: 5000,
  });
  const DANGEROUS_HTML = /<\s*\/?\s*(script|iframe|object|embed|style)\b/i;
  const HEADER_CONTROL = /[\r\n\u0000-\u001f\u007f]/;
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const SUBMISSION_COOLDOWN_MILLISECONDS = 15_000;
  const STORAGE_KEY = "nandakanContactLastSentAt";

  function cleanedValues(values) {
    return {
      name: String(values?.name || "").trim(),
      email: String(values?.email || "").trim(),
      app: String(values?.app || "").trim(),
      category: String(values?.category || "").trim(),
      message: String(values?.message || "").trim(),
      website: String(values?.website || "").trim(),
    };
  }

  function validateContact(values) {
    const normalized = cleanedValues(values);
    const labels = {
      name: "お名前",
      email: "メールアドレス",
      app: "対象アプリ",
      category: "お問い合わせ種別",
      message: "お問い合わせ内容",
    };
    const errors = {};

    for (const field of Object.keys(labels)) {
      if (!normalized[field]) errors[field] = `${labels[field]}を入力してください。`;
      else if (normalized[field].length > LIMITS[field]) {
        errors[field] = `${labels[field]}は${LIMITS[field]}文字以内で入力してください。`;
      }
    }
    if (normalized.email && (!EMAIL.test(normalized.email) || HEADER_CONTROL.test(normalized.email))) {
      errors.email = "有効なメールアドレスを入力してください。";
    }
    for (const field of ["name", "app", "category"]) {
      if (HEADER_CONTROL.test(normalized[field])) {
        errors[field] = `${labels[field]}に使用できない文字が含まれています。`;
      }
    }
    for (const field of ["name", "app", "category", "message"]) {
      if (DANGEROUS_HTML.test(normalized[field])) {
        errors[field] = `${labels[field]}に使用できないHTMLが含まれています。`;
      }
    }
    if (normalized.website) errors.website = "自動送信と判定されました。";

    return { ok: Object.keys(errors).length === 0, values: normalized, errors };
  }

  function buildContactPayload(values, metadata = {}) {
    const validation = validateContact(values);
    if (!validation.ok) {
      const error = new Error("入力内容を確認してください。");
      error.validationErrors = validation.errors;
      throw error;
    }
    const now = metadata.now instanceof Date ? metadata.now : new Date();
    const sourceUrl = String(metadata.sourceUrl || "");
    const value = validation.values;
    return {
      name: value.name,
      email: value.email,
      "対象アプリ": value.app,
      "お問い合わせ種別": value.category,
      message: value.message,
      _subject: `【NANDAKANStudioお問い合わせ】【${value.app}】${value.category}`,
      "送信日時": now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }),
      "送信元ページ": sourceUrl,
      _gotcha: "",
    };
  }

  async function submitContact(options) {
    const endpoint = String(options?.endpoint || "").trim();
    if (!/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint)) {
      throw new Error("お問い合わせ送信先が設定されていません。");
    }
    const payload = buildContactPayload(options.values, {
      sourceUrl: options.sourceUrl,
      now: options.now,
    });
    const body = new FormData();
    Object.entries(payload).forEach(([key, value]) => body.append(key, value));
    const fetchImpl = options.fetchImpl || fetch;
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { Accept: "application/json" },
      body,
    });
    if (!response.ok) {
      throw new Error(`送信サービスがエラーを返しました（${response.status || "unknown"}）。`);
    }
    return { ok: true };
  }

  function setStatus(status, kind, message) {
    status.className = `form-status ${kind}`;
    status.textContent = message;
  }

  function readLastSentAt() {
    try {
      return Number(sessionStorage.getItem(STORAGE_KEY) || 0);
    } catch (_) {
      return 0;
    }
  }

  function writeLastSentAt(value) {
    try {
      sessionStorage.setItem(STORAGE_KEY, String(value));
    } catch (_) {
      // Private browsing or storage restrictions must not prevent submission.
    }
  }

  function initContactForm(form) {
    if (!form || form.dataset.contactReady === "true") return;
    form.dataset.contactReady = "true";
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector("[data-form-status]");
    let submitting = false;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (submitting) return;
      if (!form.reportValidity()) return;

      const formData = new FormData(form);
      const values = {
        name: formData.get("name"),
        email: formData.get("email"),
        app: formData.get("app"),
        category: formData.get("category"),
        message: formData.get("message"),
        website: formData.get("website"),
      };
      const validation = validateContact(values);
      if (!validation.ok) {
        setStatus(status, "error", Object.values(validation.errors)[0]);
        return;
      }
      if (Date.now() - readLastSentAt() < SUBMISSION_COOLDOWN_MILLISECONDS) {
        setStatus(status, "error", "連続送信を防ぐため、少し待ってから再度お試しください。");
        return;
      }

      submitting = true;
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      setStatus(status, "sending", "送信中です…");
      try {
        await submitContact({
          endpoint: form.action,
          values: validation.values,
          sourceUrl: window.location.href,
        });
        writeLastSentAt(Date.now());
        form.reset();
        setStatus(status, "success", "お問い合わせを送信しました。ありがとうございます。");
      } catch (_) {
        setStatus(status, "error", "送信できませんでした。時間をおいて再度お試しいただくか、メールでお問い合わせください。");
      } finally {
        submitting = false;
        button.disabled = false;
        button.removeAttribute("aria-busy");
      }
    });
  }

  return { LIMITS, validateContact, buildContactPayload, submitContact, initContactForm };
});
