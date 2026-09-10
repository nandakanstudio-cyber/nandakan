(function () {
  "use strict";

  const apps = window.EVERYDAY_APPS || [];
  const site = window.EVERYDAY_SITE || {};
  const scriptUrl = new URL(document.querySelector('script[src*="main.js"]').src);
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
    if (page === "profile" && section === "profile") return ' aria-current="page"';
    if (page === "contact" && section === "contact") return ' aria-current="page"';
    if ((page === "support" || page === "support-detail" || page === "account-deletion") && section === "support") return ' aria-current="page"';
    if ((page === "privacy" || page === "privacy-detail") && section === "privacy") return ' aria-current="page"';
    if ((page === "terms" || page === "terms-detail") && section === "terms") return ' aria-current="page"';
    return "";
  }

  function renderHeader() {
    return `
      <header class="site-header">
        <div class="container header-inner">
          <a class="brand" href="${url("")}" aria-label="なんだかん ホーム">
            <span class="brand-mark" aria-hidden="true">N</span>
            <span>なんだかん</span>
          </a>
          <button class="menu-button" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="メニューを開く"><span></span></button>
          <nav class="nav" id="site-nav" aria-label="メインナビゲーション">
            <a href="${url("apps/")}"${navCurrent("apps")}>アプリ</a>
            <a href="${url("support/")}"${navCurrent("support")}>サポート</a>
            <a href="${url("profile/")}"${navCurrent("profile")}>プロフィール</a>
            <a href="${url("contact/")}"${navCurrent("contact")}>おはなし</a>
          </nav>
        </div>
      </header>`;
  }

  function renderFooter() {
    return `
      <footer class="site-footer">
        <div class="container footer-inner">
          <div class="footer-brand">
            <div class="footer-brand-mark" aria-hidden="true">N</div>
            <span>なんだかん</span>
          </div>
          <div class="footer-links">
            <a href="${url("support/")}">サポート</a>
            <a href="${url("privacy/")}">プライバシー</a>
            <a href="${url("terms/")}">利用規約</a>
            <a href="${url("contact/")}">おはなし</a>
          </div>
          <span class="copyright">© 2026 NANDAKAN</span>
        </div>
      </footer>`;
  }

  function appIcon(app, large) {
    if (app.icon) {
      return `<img class="app-icon image ${large ? "large" : ""}" src="${url(app.icon)}" alt="" aria-hidden="true">`;
    }
    return `<div class="app-icon ${app.color}${large ? " large" : ""}" aria-hidden="true">${escapeHtml(app.mark)}</div>`;
  }

  function appCard(app) {
    return `
      <a class="app-card reveal" href="${url(`apps/${app.slug}/`)}">
        ${appIcon(app)}
        <h3>${escapeHtml(app.name)}</h3>
        <p>${escapeHtml(app.category)}</p>
        <span class="card-arrow" aria-hidden="true">くわしく →</span>
      </a>`;
  }

  function breadcrumbs(items) {
    return `<div class="breadcrumbs">${items.map((item, index) => {
      const separator = index ? " / " : "";
      return separator + (item.href ? `<a href="${url(item.href)}">${escapeHtml(item.label)}</a>` : escapeHtml(item.label));
    }).join("")}</div>`;
  }

  function renderMarquee() {
    const items = apps.map((app) => `<span>${escapeHtml(app.name)}</span><em>✦</em>`).join("");
    return `
      <div class="marquee" aria-hidden="true">
        <div class="marquee-track">${items}${items}</div>
      </div>`;
  }

  function renderHomescreen() {
    return `
      <div class="homescreen" aria-label="開発中のアプリ">
        ${apps.map((app) => `
          <a class="hs-app" href="${url(`apps/${app.slug}/`)}">
            ${appIcon(app)}
            <span>${escapeHtml(app.name)}</span>
          </a>`).join("")}
        <div class="hs-dock"><i></i>NOW DEVELOPING — ${String(apps.length).padStart(2, "0")} APPS<i></i></div>
      </div>`;
  }

  function renderHome() {
    return `
      <main>
        <section class="hero">
          <div class="container hero-grid">
            <div>
              <div class="hero-eyebrow">NANDAKAN — INDIE iOS APPS</div>
              <h1>なんだか、<br>べんり。</h1>
              <p class="hero-copy">くらしのすきまの「なんだかな〜」を、ちいさなアプリでまるっと解決。本業のかたわら、家族と自分のためにコツコツつくっています。</p>
              <div class="button-row">
                <a class="button on-blue" href="${url("apps/")}">アプリをのぞく →</a>
                <a class="button ghost-blue" href="${url("profile/")}">つくってるひと</a>
              </div>
            </div>
            ${renderHomescreen()}
          </div>
          ${renderMarquee()}
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading reveal">
              <div class="page-label">APPS — ${String(apps.length).padStart(2, "0")}</div>
              <h2>つくったアプリ</h2>
              <p>どれも「自分が使いたいから」つくった、ちいさくて素直なアプリたちです。</p>
            </div>
            <div class="app-grid">${apps.map(appCard).join("")}</div>
          </div>
        </section>

        <section class="section" style="padding-top:0">
          <div class="container">
            <div class="values-band reveal">
              <h3>つくるときに大事にしていること</h3>
              <div class="values-grid">
                <div class="value-item"><span class="value-dot" style="background:var(--coral)"></span><p>ひとつの「めんどう」だけを、まっすぐ解く。</p></div>
                <div class="value-item"><span class="value-dot" style="background:var(--green)"></span><p>説明書がいらないくらい、やさしくする。</p></div>
                <div class="value-item"><span class="value-dot" style="background:var(--blue)"></span><p>毎日ひらいても、ちょっとうれしい。</p></div>
              </div>
            </div>

            <div class="operator-card reveal">
              <div>
                <div class="page-label">OPERATOR</div>
                <h3>運営・お問い合わせ</h3>
                <p>運営者名：${escapeHtml(site.developer)}<br>お問い合わせ：<a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a></p>
              </div>
              <a class="button primary" href="${url("support/")}">アプリサポート</a>
            </div>
          </div>
        </section>
      </main>`;
  }

  function renderApps() {
    const count = String(apps.length).padStart(2, "0");
    return `
      <main>
        <section class="page-hero">
          <div class="container">
            <div class="page-label">APPS — ${count}</div>
            <h1>アプリ一覧</h1>
            <p>どれも「自分が使いたいから」つくった、ちいさくて素直なアプリたちです。</p>
          </div>
        </section>
        <section class="section" style="padding-top:56px">
          <div class="container">
            <div class="app-list">
              ${apps.map((app) => `
                <div class="app-list-card reveal">
                  ${appIcon(app, true)}
                  <div class="app-list-info">
                    <h3>${escapeHtml(app.name)}</h3>
                    <p>${escapeHtml(app.description)}</p>
                  </div>
                  <a class="button primary" href="${url(`apps/${app.slug}/`)}">詳細を見る</a>
                </div>`).join("")}
            </div>
          </div>
        </section>
      </main>`;
  }

  function renderProfile() {
    return `
      <main>
        <section class="page-hero">
          <div class="container">
            <div class="page-label">PROFILE</div>
            <h1>つくってるひと</h1>
          </div>
        </section>
        <section class="section" style="padding-top:56px">
          <div class="container">
            <div class="profile-hero-card reveal">
              <div class="profile-avatar" aria-hidden="true">N</div>
              <div>
                <h2>なんだかん</h2>
                <p>本業のかたわら、自分と家族のために小さなiOSアプリをつくっている個人開発者です。「あったらいいな」を、ひとつずつ形にしています。</p>
              </div>
            </div>

            <div class="stats-grid">
              <div class="stat-card reveal">
                <div class="stat-number" style="color:var(--cobalt)">${apps.length}</div>
                <div class="stat-label">開発中のアプリ</div>
              </div>
              <div class="stat-card reveal">
                <div class="stat-number" style="color:var(--green)">Swift</div>
                <div class="stat-label">使っている言語</div>
              </div>
              <div class="stat-card reveal">
                <div class="stat-number" style="color:var(--coral)">2026—</div>
                <div class="stat-label">活動年</div>
              </div>
            </div>

            <div class="values-band reveal">
              <h3>つくるときに大事にしていること</h3>
              <div class="values-grid">
                <div class="value-item"><span class="value-dot" style="background:var(--coral)"></span><p>ひとつの「めんどう」だけを、まっすぐ解く。</p></div>
                <div class="value-item"><span class="value-dot" style="background:var(--green)"></span><p>説明書がいらないくらい、やさしくする。</p></div>
                <div class="value-item"><span class="value-dot" style="background:var(--blue)"></span><p>毎日ひらいても、ちょっとうれしい。</p></div>
              </div>
            </div>
          </div>
        </section>
      </main>`;
  }

  function renderAppDetail(app) {
    if (!app) return renderNotFound();
    return `
      <main>
        <section class="detail-hero"><div class="container">
          ${breadcrumbs([{ label: "Home", href: "" }, { label: "アプリ", href: "apps/" }, { label: app.name }])}
          <div class="detail-layout">
            ${appIcon(app)}
            <div class="detail-copy">
              <span class="status">${escapeHtml(app.status)}</span>
              <h1>${escapeHtml(app.name)}</h1>
              <p class="category">${escapeHtml(app.category)} · ${escapeHtml(app.device || "iPhone向け")}</p>
              <p class="lead">${escapeHtml(app.description)}</p>
              <div class="legal-links">
                <a class="button" href="${url(`privacy/${app.slug}/`)}">プライバシーポリシー</a>
                <a class="button" href="${url(`terms/${app.slug}/`)}">利用規約</a>
                <a class="button" href="${url(`support/${app.slug}/`)}">サポート</a>
                ${app.hasAccount ? `<a class="button" href="${url(`account-deletion/${app.slug}/`)}">データ削除</a>` : ""}
              </div>
            </div>
          </div>
        </div></section>
        <section class="section" style="padding:64px 0"><div class="container">
          <div class="section-heading reveal">
            <div class="page-label">HIGHLIGHTS</div>
            <h2>主な特徴</h2>
          </div>
          <div class="feature-grid">${app.highlights.map((item, index) => `<div class="feature reveal"><span class="feature-number">0${index + 1}</span><h3>${escapeHtml(item)}</h3></div>`).join("")}</div>
        </div></section>
        <section style="padding:0 0 96px"><div class="container">
          <div class="cta-panel reveal"><div><h2>現在、開発を進めています</h2><p>リリース情報は、このページで順次お知らせします。</p></div><a class="button on-blue" href="${url("apps/")}">アプリ一覧へ</a></div>
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
          <div class="page-label">${isPrivacy ? "PRIVACY" : "TERMS"}</div>
          <h1>${title}</h1><p>${description}</p>
        </div></section>
        <section><div class="container directory">
          ${apps.map((app) => `<a class="directory-item" href="${url(`${kind}/${app.slug}/`)}"><div><strong>${escapeHtml(app.name)}</strong><span>${title}を読む</span></div><span class="directory-arrow" aria-hidden="true">→</span></a>`).join("")}
        </div></section>
      </main>`;
  }

  function privacySections(app) {
    if (app.slug === "fuufu-ringi") {
      return [
        ["1. 事業者名・対象アプリ", `<p>事業者名（開発者名）：${escapeHtml(site.developer)}<br>対象アプリ：${escapeHtml(app.name)}</p>`],
        ["2. 取得する情報", "<p>本アプリは、サービス提供に必要な範囲で、次の情報を取り扱います。</p><ul><li>Firebase Authenticationが発行する匿名のユーザーID</li><li>夫婦ルームの識別子、参加情報および招待に関する情報</li><li>利用者が入力した申請、コメント、承認状況、作成・更新日時等のコンテンツ</li><li>広告の表示・計測・不正防止に必要な端末情報、IPアドレス、広告識別子、広告への反応および診断情報</li><li>同意管理画面で選択したプライバシー設定</li></ul><p>氏名、住所、電話番号およびメールアドレスは、利用者がお問い合わせ時に自ら提供しない限り取得しません。位置情報は取得しません。</p>"],
        ["3. 端末の機能と権限", "<ul><li><strong>カメラ：</strong>招待用QRコードを読み取る場合にのみ使用します。撮影画像を保存またはサーバーへ送信しません。</li><li><strong>カレンダー：</strong>利用者が選択した予定を端末のカレンダーへ追加する場合にのみ使用します。</li><li><strong>通知：</strong>利用者が許可した場合に、端末内のローカル通知を表示します。通知は端末の設定からいつでも無効にできます。</li></ul>"],
        ["4. 利用目的", "<ul><li>匿名認証、夫婦ルームへの参加およびデータ同期</li><li>申請、承認、コメント等の本アプリ機能の提供</li><li>広告の表示、効果測定および不正利用の防止</li><li>利用者の同意状況に応じた広告配信</li><li>不具合調査、品質改善およびお問い合わせ対応</li></ul>"],
        ["5. 利用する外部サービス", '<p>本アプリは、Google LLCが提供する次のサービスを利用します。</p><ul><li><strong>Firebase Authentication：</strong>匿名ユーザーの認証</li><li><strong>Cloud Firestore：</strong>夫婦ルーム、申請、コメント等のデータ保存・同期</li><li><strong>Google AdMob：</strong>広告の配信・計測・不正防止</li><li><strong>User Messaging Platform（UMP）：</strong>広告に関する同意の取得・管理</li></ul><p>各サービスで取り扱われる情報は、<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Googleのプライバシーポリシー</a>および各サービスの規定に従って管理されます。</p>'],
        ["6. 広告とトラッキング", "<p>本アプリはGoogle AdMobを利用して広告を表示します。地域や設定に応じて、UMPによる同意画面を表示する場合があります。広告識別子（IDFA）を利用する場合は、AppleのApp Tracking Transparencyの許可を事前に求め、利用者が許可しない限りIDFAを利用したトラッキングは行いません。利用者はアプリ内のプライバシー設定から、利用可能な場合に同意内容を見直せます。</p>"],
        ["7. 第三者提供", "<p>法令に基づく場合を除き、利用者の同意なく個人情報を第三者へ販売または提供しません。ただし、本ポリシーに記載した外部サービスへの送信は、機能提供、広告配信および不正防止に必要な範囲で行われます。</p>"],
        ["8. 保存期間と削除", "<p>取得した情報は、利用目的に必要な期間または法令上必要な期間保存します。公開版では、アプリ内の設定画面からアカウントと関連データの削除を申請できます。共有中の夫婦ルームに属する申請やコメントは、もう一方の利用者への影響を避けるため、削除ではなく匿名化または必要最小限の保持を行う場合があります。アプリを利用できない場合の削除相談は、下記お問い合わせ先へご連絡ください。</p>"],
        ["9. 安全管理", "<p>情報への不正アクセス、漏えい、改ざんまたは滅失を防ぐため、Firebaseの認証およびアクセス制御を含む合理的な安全管理措置を講じます。</p>"],
        ["10. お問い合わせ先", `<p>本ポリシー、データの取り扱いまたは削除に関するお問い合わせは、<a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a> までご連絡ください。</p>`],
        ["11. 改定について", "<p>法令、機能または利用サービスの変更に応じて、本ポリシーを改定する場合があります。重要な変更がある場合は、本ページその他適切な方法でお知らせします。</p>"]
      ];
    }

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
    if (app.slug === "fuufu-ringi") {
      return [
        ["1. 本規約への同意", `<p>本利用規約は、${escapeHtml(site.developer)}（以下「当方」）が提供する「${escapeHtml(app.name)}」（以下「本アプリ」）の利用条件を定めるものです。利用者は、本アプリを利用することで本規約に同意したものとみなされます。</p>`],
        ["2. 本アプリの内容", "<p>本アプリは、夫婦や家族の相談ごとを申請・承認の形式で共有し、コメントや状況を整理するためのサービスです。本アプリ上の承認は、家族内のコミュニケーションを補助するものであり、法的な契約、許認可または専門家による判断を代替するものではありません。</p>"],
        ["3. アカウントと夫婦ルーム", "<ul><li>本アプリは、端末ごとに発行される匿名アカウントを利用します。</li><li>招待コードまたはQRコードは、信頼できる相手にのみ共有してください。</li><li>夫婦ルームへ参加すると、同じルームの利用者が申請、コメント、承認状況等を閲覧できる場合があります。</li><li>端末の紛失、アプリの削除または認証情報の消失により、データへアクセスできなくなる場合があります。</li></ul>"],
        ["4. 利用者が登録する内容", "<p>利用者は、自ら登録する申請、コメントその他の内容について責任を負います。第三者の個人情報、秘密情報、権利を侵害する内容または違法・有害な内容を登録しないでください。</p>"],
        ["5. 禁止事項", "<ul><li>法令または公序良俗に違反する行為</li><li>第三者へのなりすまし、嫌がらせまたは権利侵害</li><li>招待情報の不正取得または意図しない第三者への公開</li><li>本アプリまたは外部サービスへの不正アクセス、過度な負荷、解析、改変</li><li>広告表示や計測を不正に操作する行為</li><li>その他、当方が本アプリの運営上不適切と合理的に判断する行為</li></ul>"],
        ["6. 広告", "<p>本アプリにはGoogle AdMobによる広告が表示される場合があります。広告配信に伴う情報の取り扱いは、本アプリのプライバシーポリシーをご確認ください。広告先の商品・サービスに関する取引は、利用者と広告主との間で行われます。</p>"],
        ["7. アカウントとデータの削除", `<p>リリース版では、本アプリ内の設定画面からアカウントと関連データの削除を開始できます。共有中の夫婦ルームに属する情報は、他の参加者への影響を考慮し、匿名化または必要最小限の保持を行う場合があります。詳しくは<a href="${url("account-deletion/fuufu-ringi/")}">データ削除の案内</a>をご確認ください。</p>`],
        ["8. 知的財産権", "<p>本アプリ、文章、画像、プログラムその他のコンテンツに関する権利は、当方または正当な権利者に帰属します。本規約は、利用者に対してこれらの権利を譲渡するものではありません。</p>"],
        ["9. 提供内容の変更・停止・終了", "<p>当方は、保守、障害、外部サービスの変更その他運営上必要な場合に、本アプリの全部または一部を変更、停止または終了することがあります。可能な場合は、本アプリ内または本サイトでお知らせします。</p>"],
        ["10. 免責と責任の範囲", "<p>当方は、本アプリが常に利用可能であること、完全に正確であること、特定の目的に適合することを保証しません。当方の責任を制限する場合でも、消費者契約法その他の適用法令により認められる範囲に限ります。当方の故意または重大な過失による損害について、本条の制限は適用されません。</p>"],
        ["11. 本規約の変更", "<p>法令、機能または外部サービスの変更等に応じて、本規約を改定する場合があります。重要な変更は、本ページその他適切な方法でお知らせします。</p>"],
        ["12. 準拠法・管轄", "<p>本規約は日本法に準拠します。本アプリに関して紛争が生じた場合は、適用法令に従い管轄裁判所を定めます。</p>"],
        ["13. お問い合わせ", `<p>本規約または本アプリに関するお問い合わせは、<a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a> までご連絡ください。</p>`]
      ];
    }
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
    const draftNote = app.slug === "fuufu-ringi"
      ? ""
      : '<p class="draft-note"><strong>仮文面：</strong>本ページは公開準備用のひな形です。アプリの実装・利用サービスに合わせ、公開前に内容をご確認ください。</p>';
    return `
      <main>
        <section class="page-hero"><div class="container">
          ${breadcrumbs([{ label: "Home", href: "" }, { label: title, href: `${kind}/` }, { label: app.name }])}
          <div class="page-label">${isPrivacy ? "PRIVACY POLICY" : "TERMS OF USE"}</div>
          <h1>${escapeHtml(app.name)}<br>${title}</h1>
          <p>${escapeHtml(app.name)}をご利用いただく際の${isPrivacy ? "情報の取り扱い" : "利用条件"}について記載しています。</p>
        </div></section>
        <article class="container legal">
          ${draftNote}
          ${sections.map(([heading, content]) => `<section><h2>${heading}</h2>${content}</section>`).join("")}
          <p class="legal-meta">制定日・最終更新日：${escapeHtml(isPrivacy ? (app.privacyUpdated || site.updated) : (app.termsUpdated || site.updated))}</p>
        </article>
      </main>`;
  }

  function renderSupportDirectory() {
    return `
      <main>
        <section class="page-hero"><div class="container">
          ${breadcrumbs([{ label: "Home", href: "" }, { label: "サポート" }])}
          <div class="page-label">SUPPORT</div>
          <h1>アプリサポート</h1>
          <p>使い方、不具合、データやプライバシーに関するご案内です。対象のアプリを選んでください。</p>
        </div></section>
        <section><div class="container directory">
          ${apps.map((app) => `<a class="directory-item" href="${url(`support/${app.slug}/`)}"><div><strong>${escapeHtml(app.name)}</strong><span>サポート情報を見る</span></div><span class="directory-arrow" aria-hidden="true">→</span></a>`).join("")}
        </div></section>
      </main>`;
  }

  function supportSections(app) {
    if (app.slug === "fuufu-ringi") {
      return [
        ["はじめに", "<p>夫婦稟議は、家族の相談ごとを申請・承認の形で整理するアプリです。現在は公開準備中です。正式リリース後の不具合報告やご要望も、このページの窓口で受け付けます。</p>"],
        ["よくある質問", "<h3>夫婦ルームにはどう参加しますか？</h3><p>ルームを作成した方が表示する招待コードまたはQRコードを、参加する方の端末で入力・読み取ります。招待情報は信頼できる相手にだけ共有してください。</p><h3>通知が届きません</h3><p>iPhoneの「設定」→「通知」→「夫婦稟議」で通知が許可されているか確認してください。本アプリで使用する通知は、端末内で設定されるローカル通知です。</p><h3>カメラやカレンダーを許可しなくても使えますか？</h3><p>基本機能は利用できます。カメラはQRコードを読み取るとき、カレンダーは予定を追加するときだけ必要です。招待コードの手入力など、許可しない場合の代替手段も利用できます。</p><h3>端末を変更したらデータは引き継げますか？</h3><p>本アプリは匿名アカウントを利用するため、端末変更やアプリ削除の前後で自動的に同じアカウントへ戻れない場合があります。大切な情報は必要に応じて別途控えてください。</p>"],
        ["不具合を報告する", `<p>次の情報を添えて <a href="mailto:${escapeHtml(site.email)}?subject=${encodeURIComponent("【夫婦稟議】不具合・お問い合わせ")}">${escapeHtml(site.email)}</a> までご連絡ください。</p><ul><li>利用端末（例：iPhone 16）</li><li>iOSのバージョン</li><li>発生した画面と操作手順</li><li>表示されたメッセージ</li><li>可能であれば個人情報を隠したスクリーンショット</li></ul>`],
        ["プライバシーとデータ", `<p><a href="${url("privacy/fuufu-ringi/")}">プライバシーポリシー</a>で取得情報と利用目的を確認できます。アカウントと関連データの削除については、<a href="${url("account-deletion/fuufu-ringi/")}">データ削除の案内</a>をご覧ください。</p>`],
        ["運営・連絡先", `<p>運営：${escapeHtml(site.developer)}<br>メール：<a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a></p><p>通常は数営業日以内の返信に努めますが、内容により時間をいただく場合があります。</p>`]
      ];
    }
    return [
      ["サポートについて", `<p>${escapeHtml(app.name)}は現在公開準備中です。使い方、ご要望、不具合に関するお問い合わせをメールで受け付けています。</p>`],
      ["お問い合わせ時にお知らせください", "<ul><li>アプリ名</li><li>利用端末とOSバージョン</li><li>発生した画面と操作手順</li><li>可能であれば個人情報を隠したスクリーンショット</li></ul>"],
      ["連絡先", `<p>運営：${escapeHtml(site.developer)}<br>メール：<a href="mailto:${escapeHtml(site.email)}?subject=${encodeURIComponent(`【${app.name}】お問い合わせ`)}">${escapeHtml(site.email)}</a></p>`],
      ["関連情報", `<p><a href="${url(`privacy/${app.slug}/`)}">プライバシーポリシー</a> ／ <a href="${url(`terms/${app.slug}/`)}">利用規約</a></p>`]
    ];
  }

  function renderSupportDetail(app) {
    if (!app) return renderNotFound();
    return `
      <main>
        <section class="page-hero"><div class="container">
          ${breadcrumbs([{ label: "Home", href: "" }, { label: "サポート", href: "support/" }, { label: app.name }])}
          <div class="page-label">APP SUPPORT</div>
          <h1>${escapeHtml(app.name)}<br>サポート</h1>
          <p>${escapeHtml(app.name)}の使い方や不具合、データに関するご案内です。</p>
        </div></section>
        <article class="container legal support-article">
          ${supportSections(app).map(([heading, content]) => `<section><h2>${heading}</h2>${content}</section>`).join("")}
        </article>
      </main>`;
  }

  function renderAccountDeletion(app) {
    if (!app || !app.hasAccount) return renderNotFound();
    return `
      <main>
        <section class="page-hero"><div class="container">
          ${breadcrumbs([{ label: "Home", href: "" }, { label: "サポート", href: "support/" }, { label: app.name, href: `support/${app.slug}/` }, { label: "データ削除" }])}
          <div class="page-label">DATA &amp; ACCOUNT DELETION</div>
          <h1>${escapeHtml(app.name)}<br>アカウントとデータの削除</h1>
          <p>削除できる情報、操作方法、お問い合わせによる削除相談をご案内します。</p>
        </div></section>
        <article class="container legal">
          <p class="release-note"><strong>公開前のご案内：</strong>以下はリリース版で提供する削除手順です。アプリ内の削除機能は、App Storeへの提出前に実装・確認します。</p>
          <section><h2>アプリ内で削除する方法</h2><ol><li>夫婦稟議を開きます。</li><li>「設定」を開きます。</li><li>「アカウントとデータを削除」を選びます。</li><li>表示される対象データと注意事項を確認します。</li><li>確認操作を完了して削除を実行します。</li></ol><p>単なるログアウトやアプリの削除だけでは、サーバー上のデータが削除されない場合があります。</p></section>
          <section><h2>削除の対象</h2><ul><li>Firebase Authenticationの匿名アカウント</li><li>そのアカウントに直接関連付けられた参加情報や設定</li><li>法令またはセキュリティ上の理由で保持する必要がない関連データ</li></ul></section>
          <section><h2>共有データについて</h2><p>夫婦ルーム内の申請やコメントには、もう一方の利用者が閲覧・利用する共有情報が含まれます。相手の利用への影響や会話の整合性を保つため、共有データの一部は削除ではなく投稿者情報の匿名化を行う場合があります。削除確認画面で対象を案内します。</p></section>
          <section><h2>アプリを操作できない場合</h2><p>端末の紛失などでアプリ内操作ができない場合は、<a href="mailto:${escapeHtml(site.email)}?subject=${encodeURIComponent("【夫婦稟議】アカウント・データ削除相談")}">${escapeHtml(site.email)}</a> へご相談ください。本人または対象データを確認できない場合、第三者のデータを守るため削除できないことがあります。パスワードや認証コードはメールに記載しないでください。</p></section>
          <section><h2>関連ページ</h2><p><a href="${url("privacy/fuufu-ringi/")}">プライバシーポリシー</a> ／ <a href="${url("terms/fuufu-ringi/")}">利用規約</a> ／ <a href="${url("support/fuufu-ringi/")}">サポート</a></p></section>
          <p class="legal-meta">最終更新日：2026年9月10日</p>
        </article>
      </main>`;
  }

  function renderContact() {
    const subject = encodeURIComponent("【お問い合わせ】アプリ名");
    const bodyText = encodeURIComponent("アプリ名：\n利用端末：\niOSバージョン：\n\nお問い合わせ内容：\n");
    return `
      <main>
        <section class="page-hero">
          <div class="container">
            <div class="page-label">CONTACT</div>
            <h1>おはなししよう</h1>
            <p>ご感想・ご要望・不具合のご連絡をメールで受け付けています。通常は数営業日以内の返信に努めます。</p>
          </div>
        </section>
        <section class="section" style="padding-top:56px">
          <div class="container">
            <div class="contact-wrapper">
              <div class="contact-form-card reveal">
                <div class="form-group">
                  <div>
                    <div class="form-label">おなまえ</div>
                    <div class="form-field">山田 はなこ</div>
                  </div>
                  <div>
                    <div class="form-label">メールアドレス</div>
                    <div class="form-field">example@example.com</div>
                  </div>
                  <div>
                    <div class="form-label">メッセージ</div>
                    <div class="form-field textarea">このアプリのここが好きです…</div>
                  </div>
                  <a class="button primary" style="align-self:flex-start" href="mailto:${escapeHtml(site.email)}?subject=${subject}&body=${bodyText}">メールを作成する →</a>
                </div>
              </div>
              <div class="contact-social">
                <a class="social-pill reveal" href="mailto:${escapeHtml(site.email)}?subject=${subject}&body=${bodyText}">${escapeHtml(site.email)}</a>
                <a class="social-pill reveal" href="${url("support/")}">アプリサポートを見る →</a>
                <p class="contact-note">運営：${escapeHtml(site.developer)}<br>パスワード、認証コード、クレジットカード情報は送信しないでください。</p>
              </div>
            </div>
          </div>
        </section>
      </main>`;
  }

  function renderNotFound() {
    return `<main><section class="page-hero"><div class="container"><div class="page-label">NOT FOUND</div><h1>ページが見つかりません</h1><p>URLをご確認いただくか、トップページへお戻りください。</p><div class="button-row" style="margin-top:28px;justify-content:flex-start"><a class="button primary" href="${url("")}">ホームへ</a></div></div></section></main>`;
  }

  let content;
  if (page === "home") content = renderHome();
  else if (page === "apps") content = renderApps();
  else if (page === "app") content = renderAppDetail(appBySlug(slug));
  else if (page === "profile") content = renderProfile();
  else if (page === "privacy") content = renderDirectory("privacy");
  else if (page === "terms") content = renderDirectory("terms");
  else if (page === "privacy-detail") content = renderLegal("privacy", appBySlug(slug));
  else if (page === "terms-detail") content = renderLegal("terms", appBySlug(slug));
  else if (page === "support") content = renderSupportDirectory();
  else if (page === "support-detail") content = renderSupportDetail(appBySlug(slug));
  else if (page === "account-deletion") content = renderAccountDeletion(appBySlug(slug));
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

  // Scroll reveal
  const revealTargets = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("in"));
  }
})();
