(function () {
  "use strict";

  const MEASUREMENT_ID = "G-Y0SK6CQBKD";
  const script = document.querySelector('script[src*="/analytics.js"]');
  if (!script || !/^G-[A-Z0-9]+$/.test(MEASUREMENT_ID)) return;
  const root = new URL("../../", script.src);
  const storageKey = `nandakan:analytics-consent:v1:${root.pathname}`;
  const disableKey = `ga-disable-${MEASUREMENT_ID}`;
  const knownApps = { "6810217834": "fuufu-ringi" };
  let started = false;
  let allowed = false;

  function readChoice(value) {
    try {
      const saved = JSON.parse(value);
      return saved && saved.expires > Date.now() && ["granted", "denied"].includes(saved.choice) ? saved.choice : null;
    } catch (_) { return null; }
  }

  function storedChoice() {
    try { return readChoice(window.localStorage.getItem(storageKey)); }
    catch (_) { return null; }
  }

  function remember(choice) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ choice, expires: Date.now() + 180 * 24 * 60 * 60 * 1000 }));
    } catch (_) { /* With storage blocked, the choice applies only to this page. */ }
  }

  function pageLocation() {
    const value = new URL(window.location.href);
    return value.origin + value.pathname;
  }

  function referrerOrigin() {
    try {
      const value = new URL(document.referrer);
      return /^https?:$/.test(value.protocol) ? value.origin + "/" : "";
    } catch (_) { return ""; }
  }

  function gtag() { window.dataLayer.push(arguments); }

  function start() {
    if (started) return;
    started = true;
    allowed = true;
    window[disableKey] = false;
    window.dataLayer = window.dataLayer || [];
    gtag("consent", "default", {
      analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied"
    });
    gtag("consent", "update", { analytics_storage: "granted" });
    gtag("js", new Date());
    // Set clean values globally too: subsequent automatic engagement/session events
    // must not fall back to URL queries, fragments, or referrer paths.
    const clean = {
      page_location: pageLocation(), page_referrer: referrerOrigin(), page_title: document.title,
      allow_google_signals: false, allow_ad_personalization_signals: false,
      campaign_id: "", campaign_source: "", campaign_medium: "", campaign_name: "", campaign_term: "", campaign_content: ""
    };
    gtag("set", clean);
    gtag("config", MEASUREMENT_ID, {
      ...clean, send_page_view: false,
      cookie_domain: "none", cookie_path: root.pathname, cookie_expires: 180 * 24 * 60 * 60
    });
    gtag("event", "page_view", { send_to: MEASUREMENT_ID, ...clean });
    const google = document.createElement("script");
    google.async = true;
    google.referrerPolicy = "no-referrer";
    google.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(google);
  }

  function clearCookies() {
    // These host-only cookies are scoped to this repository's path, not other sites.
    for (const name of ["_ga", `_ga_${MEASUREMENT_ID.slice(2)}`]) {
      document.cookie = `${name}=; Max-Age=0; Path=${root.pathname}; SameSite=Lax`;
    }
  }

  function stop() {
    allowed = false;
    window[disableKey] = true;
    clearCookies();
    // Reload removes the already-loaded Google runtime and pending listeners.
    // Do not send a denied-consent ping: basic consent mode stays completely blocked.
    if (started) window.location.reload();
  }

  function element(tag, id, text) {
    const value = document.createElement(tag);
    if (id) value.id = id;
    if (text) value.textContent = text;
    return value;
  }

  const banner = element("section", "nandakan-analytics-banner");
  banner.setAttribute("aria-label", "アクセス解析の設定");
  const copy = element("p", null, "サイト改善のため、同意した場合のみGoogle Analyticsで閲覧ページ・流入元・App Storeへの移動を解析し、Cookieを使用します。許可しなくてもすべてのページを利用できます。");
  banner.appendChild(copy);
  const privacy = element("a", null, "詳しい説明");
  privacy.href = new URL("privacy/#website-analytics", root).href;
  banner.appendChild(privacy);
  const actions = element("div", "nandakan-analytics-actions");
  const decline = element("button", "nandakan-analytics-decline", "許可しない");
  const accept = element("button", "nandakan-analytics-allow", "許可する");
  decline.type = accept.type = "button";
  actions.appendChild(decline);
  actions.appendChild(accept);
  banner.appendChild(actions);
  document.body.appendChild(banner);
  const settings = element("button", "nandakan-analytics-settings", "アクセス解析の設定");
  settings.type = "button";
  settings.setAttribute("aria-controls", banner.id);
  document.body.appendChild(settings);

  function hideBanner() {
    banner.hidden = true;
    settings.hidden = false;
    settings.setAttribute("aria-expanded", "false");
  }
  function showBanner() {
    banner.hidden = false;
    settings.hidden = true;
    settings.setAttribute("aria-expanded", "true");
  }
  accept.addEventListener("click", function () { remember("granted"); start(); hideBanner(); settings.focus(); });
  decline.addEventListener("click", function () { remember("denied"); hideBanner(); settings.focus(); stop(); });
  settings.addEventListener("click", function () { showBanner(); decline.focus(); });

  document.addEventListener("click", function (event) {
    if (!allowed || window[disableKey]) return;
    const link = event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if (!link) return;
    let target;
    try { target = new URL(link.href); } catch (_) { return; }
    if (target.protocol !== "https:" || target.hostname !== "apps.apple.com") return;
    const match = target.pathname.match(/\/id(\d+)\/?$/);
    const app = match && knownApps[match[1]];
    if (!app) return;
    gtag("event", "app_store_click", {
      send_to: MEASUREMENT_ID, app_slug: app, app_store_id: match[1],
      page_location: pageLocation(), page_referrer: referrerOrigin(),
      link_url: `https://apps.apple.com/app/id${match[1]}`
    });
  });

  window.addEventListener("storage", function (event) {
    if (event.key === storageKey && readChoice(event.newValue) !== "granted") {
      stop();
      hideBanner();
    }
  });
  const choice = storedChoice();
  if (choice === "granted") start();
  if (choice) hideBanner(); else showBanner();
}());
