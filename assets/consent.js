(() => {
  "use strict";

  const GA_ID = "G-NJK2H4R8VE";
  const STORAGE_KEY = "ysmf_cookie_consent_v1";
  const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

  let googleAnalyticsLoaded = false;

  function readChoice() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const saved = JSON.parse(raw);
      if (!saved || !saved.choice || !saved.savedAt) return null;

      if ((Date.now() - saved.savedAt) > CONSENT_MAX_AGE_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return saved.choice;
    } catch (_) {
      return null;
    }
  }

  function saveChoice(choice) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice, savedAt: Date.now() })
      );
    } catch (_) {
      // If storage is unavailable, the banner will simply ask again later.
    }
  }

  function loadGoogleAnalytics() {
    if (googleAnalyticsLoaded || window.__ysmfGoogleAnalyticsLoaded) return;

    googleAnalyticsLoaded = true;
    window.__ysmfGoogleAnalyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    window.gtag("js", new Date());
    window.gtag("config", GA_ID);

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    script.setAttribute("data-ysmf-analytics", "true");
    document.head.appendChild(script);
  }

  function clearGoogleAnalyticsCookies() {
    const names = document.cookie
      .split(";")
      .map((item) => item.split("=")[0].trim())
      .filter((name) => name === "_ga" || name.startsWith("_ga_"));

    const hostname = window.location.hostname;
    const domains = [hostname, "." + hostname];

    names.forEach((name) => {
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      domains.forEach((domain) => {
        document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}; SameSite=Lax`;
      });
    });
  }

  function removeBanner() {
    document.getElementById("ysmf-cookie-banner")?.remove();
  }

  function ensureSettingsButton() {
    if (document.getElementById("ysmf-cookie-settings")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.id = "ysmf-cookie-settings";
    button.className = "ysmf-cookie-settings";
    button.textContent = "Cookie settings";
    button.addEventListener("click", () => showBanner(true));
    document.body.appendChild(button);
  }

  function applyChoice(choice, fromUser = false) {
    if (choice === "accepted") {
      loadGoogleAnalytics();
      removeBanner();
      ensureSettingsButton();
      return;
    }

    if (choice === "rejected") {
      removeBanner();
      ensureSettingsButton();

      if (fromUser) {
        clearGoogleAnalyticsCookies();
        // Reload so a previously loaded analytics tag cannot continue on this page.
        window.location.reload();
      }
    }
  }

  function showBanner(isSettings = false) {
    removeBanner();

    const banner = document.createElement("section");
    banner.id = "ysmf-cookie-banner";
    banner.className = "ysmf-cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-modal", "false");
    banner.setAttribute("aria-label", "Cookie choices");

    banner.innerHTML = `
      <div class="ysmf-cookie-inner">
        <div class="ysmf-cookie-copy">
          <strong>${isSettings ? "Cookie settings" : "Your privacy choices"}</strong>
          <p>
            We use optional Google Analytics cookies to understand how people use YSMF.
            Analytics stays off unless you accept. You can change your choice at any time.
            <a href="cookie-policy.html">Cookie policy</a>
          </p>
        </div>
        <div class="ysmf-cookie-actions">
          <button type="button" class="ysmf-cookie-btn ysmf-cookie-btn-secondary" data-cookie-reject>
            Reject non-essential
          </button>
          <button type="button" class="ysmf-cookie-btn ysmf-cookie-btn-primary" data-cookie-accept>
            Accept analytics
          </button>
        </div>
      </div>
    `;

    banner.querySelector("[data-cookie-accept]").addEventListener("click", () => {
      saveChoice("accepted");
      applyChoice("accepted", true);
    });

    banner.querySelector("[data-cookie-reject]").addEventListener("click", () => {
      saveChoice("rejected");
      applyChoice("rejected", true);
    });

    document.body.appendChild(banner);
  }

  function init() {
    const choice = readChoice();

    if (choice === "accepted") {
      applyChoice("accepted");
    } else if (choice === "rejected") {
      applyChoice("rejected");
    } else {
      showBanner(false);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
