(function () {
  "use strict";

  const apps = window.EVERYDAY_APPS || [];
  const site = window.EVERYDAY_SITE || {};
  const scriptUrl = new URL(document.querySelector('script[src$="main.js"]').src);
  const rootUrl = new URL("../../", scriptUrl);
  const body = document.body;
  const page = body.dataset.page || "home";
  const slug = body.dataset.slug || "";

  const url = (path) => new URL(path.replace(/^\//, ""), rootUrl).href;
  const favicon = document.createElement("link");
  favicon.rel = "icon";
  favicon.type = "image/svg+xml";
  favicon.href = url("assets/images/favicon.svg");
  document.head.appendChild(favicon);
  const appBySlug = (value) => apps.find((app) => app.slug === value);
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);

  function navCurrent(section) {
    if (page === "home" && section === "home") return ' aria-current="page"';
    if ((page === "apps" || page === "app") && section === "apps") return ' aria-current="page"';
    if ((page === "privacy" || page === "privacy-detail") && section === "privacy") return ' aria-current="page"';
    if ((page === "terms" || page === "terms-detail") && section === "terms") return ' aria-current="page"';
    if (page === "contact" && section === "contact") return ' aria-current="page"';
    return "";
  }

  function renderHeader() {
    return `
      <header class="site-header">
        <div class="container header-inner">
          <a class="brand" href="${url("")}" aria-label="${site.name} ホーム">
            <span class="brand-mark" aria-hidden="true">N</span>
            <span>${site.name}</span>
          </a>
          <button class="menu-button" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="メニューを開く"><span></span></button>
          <nav class="nav" id="site-nav" aria-label="メインナビゲーション">
            <a href="${url("")}"${navCurrent("home")}>Home</a>
            <a href="${url("apps/")}"${navCurrent("apps")}>Apps</a>
            <a href="${url("privacy/")}"${navCurrent("privacy")}>Privacy Policy</a>
            <a href="${url("terms/")}"${navCurrent("terms")}>Terms</a>
            <a href="${url("contact/")}"${navCurrent("contact")}>Contact</a>
          </nav>
        </div>
      </header>`;
  }

  function renderFooter() {
    return `
      <footer class="site-footer">
        <div class="container footer-inner">
          <div class="copyright">© 2026 ${site.name}</div>
          <div class="footer-links">
            <a href="${url("privacy/")}">Privacy Policy</a>
            <a href="${url("terms/")}">Terms of Use</a>
            <a href="${url("contact/")}">Contact</a>
          </div>
        </div>
      </footer>`;
  }

  function appIcon(app) {
    return `<div class="app-icon ${app.color}" aria-hidden="true">${escapeHtml(app.mark)}</div>`;
  }

  function appCard(app) {
    return `
      <article class="app-card">
        ${appIcon(app)}
        <span class="status">${escapeHtml(app.status)}</span>
        <h3>${escapeHtml(app.name)}</h3>
        <p>${escapeHtml(app.description)}</p>
        <div class="card-links">
          <a class="link-arrow" href="${url(`apps/${app.slug}/`)}">詳細</a>
          <a href="${url(`privacy/${app.slug}/`)}">プライバシー</a>
          <a href="${url(`terms/${app.slug}/`)}">利用規約</a>
        </div>
      </article>`;
  }

  function breadcrumbs(items) {
    return `<div class="breadcrumbs">${items.map((item, index) => {
      const separator = index ? " / " : "";
      return separator + (item.href ? `<a href="${url(item.href)}">${escapeHtml(item.label)}</a>` : escapeHtml(item.label));
    }).join("")}</div>`;
  }

  function renderHome() {
    return `
      <main>
        <section class="hero">
          <div class="container">
            <p class="eyebrow">Independent iOS Developer</p>
            <h1>毎日に、小さな便利と楽しさを。</h1>
            <p class="hero-copy">${site.name} は、日常生活・家族・仕事を少し便利にするiOSアプリを開発する個人開発サイトです。</p>
            <div class="button-row">
              <a class="button primary link-arrow" href="${url("apps/")}">アプリを見る</a>
              <a class="button" href="${url("privacy/")}">プライバシーポリシー</a>
            </div>
          </div>
        </section>
        <section class="section soft">
          <div class="container">
            <div class="section-heading">
              <p class="eyebrow">Our Apps</p>
              <h2>暮らしのそばにあるアプリ</h2>
              <p>家族との時間から、ちょっとした遊びまで。日常に自然になじむ体験を丁寧につくっています。</p>
            </div>
            <div class="app-grid">${apps.map(appCard).join("")}</div>
          </div>
        </section>
        <section class="section">
          <div class="container">
            <div class="cta-panel">
              <div><h2>ご質問や不具合のご連絡</h2><p>各アプリに関するお問い合わせは、メールで受け付けています。</p></div>
              <a class="button" href="${url("contact/")}">お問い合わせ</a>
            </div>
          </div>
        </section>
      </main>`;
  }

  function renderApps() {
    return `
      <main>
        <section class="page-hero"><div class="container">
          ${breadcrumbs([{ label: "Home", href: "" }, { label: "Apps" }])}
          <p class="eyebrow">Our Apps</p><h1>アプリ一覧</h1>
          <p>日常生活・家族・仕事を少し便利にするiOSアプリを開発しています。</p>
        </div></section>
        <section class="section" style="padding-top:24px"><div class="container"><div class="app-grid">${apps.map(appCard).join("")}</div></div></section>
      </main>`;
  }

  function renderAppDetail(app) {
    if (!app) return renderNotFound();
    return `
      <main>
        <section class="detail-hero"><div class="container">
          ${breadcrumbs([{ label: "Home", href: "" }, { label: "Apps", href: "apps/" }, { label: app.name }])}
          <div class="detail-layout">
            ${appIcon(app)}
            <div class="detail-copy">
              <span class="status">${escapeHtml(app.status)}</span>
              <h1>${escapeHtml(app.name)}</h1>
              <p class="category">${escapeHtml(app.category)} · iPhone向け</p>
              <p class="lead">${escapeHtml(app.description)}</p>
              <div class="legal-links">
                <a class="button small" href="${url(`privacy/${app.slug}/`)}">プライバシーポリシー</a>
                <a class="button small" href="${url(`terms/${app.slug}/`)}">利用規約</a>
              </div>
            </div>
          </div>
        </div></section>
        <section class="section soft"><div class="container">
          <div class="section-heading"><p class="eyebrow">Highlights</p><h2>主な特徴</h2></div>
          <div class="feature-grid">${app.highlights.map((item, index) => `<div class="feature"><span class="feature-number">0${index + 1}</span><h3>${escapeHtml(item)}</h3></div>`).join("")}</div>
        </div></section>
        <section class="section"><div class="container">
          <div class="cta-panel"><div><h2>現在、開発を進めています</h2><p>リリース情報は、このページで順次お知らせします。</p></div><a class="button" href="${url("apps/")}">アプリ一覧へ</a></div>
        </div></section>
      </main>`;
  }

  function renderDirectory(kind) {
    const isPrivacy = kind === "privacy";
    const title = isPrivacy ? "プライバシーポリシー" : "利用規約";
    const description = isPrivacy
      ? "各アプリの情報の取り扱いについてご案内します。App Store Connectには、対象アプリの個別ページURLをご登録ください。"
      : "各アプリをご利用いただく際の条件をご案内します。";
    return `
      <main>
        <section class="page-hero"><div class="container">
          ${breadcrumbs([{ label: "Home", href: "" }, { label: title }])}
          <p class="eyebrow">${isPrivacy ? "Privacy" : "Terms"}</p><h1>${title}</h1><p>${description}</p>
        </div></section>
        <section><div class="container directory">
          ${apps.map((app) => `<a class="directory-item" href="${url(`${kind}/${app.slug}/`)}"><div><strong>${escapeHtml(app.name)}</strong><span>${title}を読む</span></div><span class="directory-arrow" aria-hidden="true">→</span></a>`).join("")}
        </div></section>
      </main>`;
  }

  function privacySections(app) {
    return [
      ["1. 事業者名・対象アプリ", `<p>事業者名（開発者名）：${escapeHtml(site.developer)}<br>対象アプリ：${escapeHtml(app.name)}</p>`],
      ["2. 取得する情報", "<p>本アプリは、機能の提供、品質改善および不具合調査に必要な範囲で、端末情報、OSバージョン、利用状況、クラッシュ情報等を取得する場合があります。氏名、住所など個人を直接特定する情報は、利用者が自ら提供しない限り取得しません。</p>"],
      ["3. 利用目的", "<ul><li>本アプリの機能およびサービスの提供</li><li>利用状況の分析と品質改善</li><li>不具合の調査およびお問い合わせ対応</li><li>不正利用の防止</li></ul>"],
      ["4. 第三者提供", "<p>法令に基づく場合を除き、利用者の同意なく取得した情報を第三者へ提供しません。外部サービスを利用する場合は、提供先、提供する情報および利用目的を本ページで明示します。</p>"],
      ["5. 広告について", "<p>本アプリは、広告配信サービスを利用する場合があります。広告を導入する際は、利用するサービス名および取り扱う情報を本ページに追記します。</p>"],
      ["6. アプリ内課金について", "<p>本アプリは、Appleが提供する決済システムを利用してアプリ内課金を提供する場合があります。決済情報はAppleにより管理され、当方がクレジットカード情報等を取得することはありません。</p>"],
      ["7. 通知について", "<p>本アプリは、利用者が許可した場合に限りプッシュ通知またはローカル通知を送信する場合があります。通知は端末の設定からいつでも無効にできます。</p>"],
      ["8. お問い合わせ先", `<p>本ポリシーに関するお問い合わせは、<a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a> までご連絡ください。</p>`],
      ["9. 改定について", "<p>本ポリシーは、法令の変更、機能の追加または利用サービスの変更等に応じて改定する場合があります。重要な変更がある場合は、本ページその他適切な方法でお知らせします。</p>"]
    ];
  }

  function termsSections(app) {
    return [
      ["1. 本規約への同意", `<p>本利用規約は、${escapeHtml(site.developer)}が提供する「${escapeHtml(app.name)}」の利用条件を定めるものです。利用者は、本アプリを利用することで本規約に同意したものとみなされます。</p>`],
      ["2. 利用条件", "<p>利用者は、自らの責任と費用において、本アプリを利用するために必要な端末、通信環境等を準備するものとします。未成年者は、必要に応じて保護者の同意を得たうえで利用してください。</p>"],
      ["3. 禁止事項", "<ul><li>法令または公序良俗に違反する行為</li><li>本アプリの運営を妨害する行為</li><li>不正アクセス、解析、改変その他これらに類する行為</li><li>第三者の権利または利益を侵害する行為</li><li>その他、当方が不適切と判断する行為</li></ul>"],
      ["4. アプリ内課金", "<p>有料機能を提供する場合、その価格、期間その他の条件はアプリ内またはApp Store上に表示します。購入、返金等にはAppleの定める条件が適用されます。</p>"],
      ["5. 広告表示", "<p>本アプリには広告が表示される場合があります。広告の内容および広告先のサービスについて、当方はその正確性、安全性等を保証しません。</p>"],
      ["6. 免責事項", "<p>当方は、本アプリの完全性、正確性、継続性、特定目的への適合性を保証しません。本アプリの利用または利用不能から生じた損害について、当方に故意または重大な過失がある場合を除き、責任を負いません。法令上免責が認められない場合は、その法令の範囲に従います。</p>"],
      ["7. サービス内容の変更・終了", "<p>当方は、利用者への事前通知なく、本アプリの内容を変更し、または提供を一時停止・終了する場合があります。可能な場合は、本アプリ内または本サイトで事前にお知らせします。</p>"],
      ["8. 規約の変更", "<p>当方は、必要に応じて本規約を変更できます。変更後の規約は、本ページに掲載した時点から効力を生じるものとします。</p>"],
      ["9. お問い合わせ先", `<p>本規約に関するお問い合わせは、<a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a> までご連絡ください。</p>`]
    ];
  }

  function renderLegal(kind, app) {
    if (!app) return renderNotFound();
    const isPrivacy = kind === "privacy";
    const title = isPrivacy ? "プライバシーポリシー" : "利用規約";
    const sections = isPrivacy ? privacySections(app) : termsSections(app);
    return `
      <main>
        <section class="page-hero"><div class="container">
          ${breadcrumbs([{ label: "Home", href: "" }, { label: title, href: `${kind}/` }, { label: app.name }])}
          <p class="eyebrow">${isPrivacy ? "Privacy Policy" : "Terms of Use"}</p>
          <h1>${escapeHtml(app.name)}<br>${title}</h1>
          <p>${escapeHtml(app.name)}をご利用いただく際の${isPrivacy ? "情報の取り扱い" : "利用条件"}について記載しています。</p>
        </div></section>
        <article class="container legal">
          <p class="draft-note"><strong>仮文面：</strong>本ページは公開準備用のひな形です。アプリの実装・利用サービスに合わせ、公開前に内容をご確認ください。</p>
          ${sections.map(([heading, content]) => `<section><h2>${heading}</h2>${content}</section>`).join("")}
          <p class="legal-meta">制定日・最終更新日：${escapeHtml(site.updated)}</p>
        </article>
      </main>`;
  }

  function renderContact() {
    const subject = encodeURIComponent("【お問い合わせ】アプリ名");
    const bodyText = encodeURIComponent("アプリ名：\n利用端末：\niOSバージョン：\n\nお問い合わせ内容：\n");
    return `
      <main>
        <section class="page-hero"><div class="container">
          ${breadcrumbs([{ label: "Home", href: "" }, { label: "Contact" }])}
          <p class="eyebrow">Contact</p><h1>お問い合わせ</h1>
          <p>アプリに関するご質問、不具合のご報告、ご要望などをメールで受け付けています。</p>
        </div></section>
        <section><div class="container">
          <div class="contact-card">
            <h2>メールでのお問い合わせ</h2>
            <p>状況を確認しやすくするため、次の内容を記載してお送りください。</p>
            <ul class="contact-list"><li>アプリ名</li><li>利用端末</li><li>iOSバージョン</li><li>お問い合わせ内容</li></ul>
            <a class="button primary" href="mailto:${escapeHtml(site.email)}?subject=${subject}&body=${bodyText}">${escapeHtml(site.email)}</a>
            <p style="font-size:13px;margin-bottom:0">ご返信までお時間をいただく場合があります。あらかじめご了承ください。</p>
          </div>
        </div></section>
      </main>`;
  }

  function renderNotFound() {
    return `<main><section class="page-hero"><div class="container"><p class="eyebrow">Not Found</p><h1>ページが見つかりません</h1><p>URLをご確認いただくか、トップページへお戻りください。</p><div class="button-row" style="margin-top:28px"><a class="button primary" href="${url("")}">ホームへ</a></div></div></section></main>`;
  }

  let content;
  if (page === "home") content = renderHome();
  else if (page === "apps") content = renderApps();
  else if (page === "app") content = renderAppDetail(appBySlug(slug));
  else if (page === "privacy") content = renderDirectory("privacy");
  else if (page === "terms") content = renderDirectory("terms");
  else if (page === "privacy-detail") content = renderLegal("privacy", appBySlug(slug));
  else if (page === "terms-detail") content = renderLegal("terms", appBySlug(slug));
  else if (page === "contact") content = renderContact();
  else content = renderNotFound();

  document.getElementById("site").innerHTML = renderHeader() + content + renderFooter();

  const menuButton = document.querySelector(".menu-button");
  const nav = document.querySelector(".nav");
  menuButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "メニューを閉じる" : "メニューを開く");
  });
})();
