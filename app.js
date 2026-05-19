// Pedal Quest — site behaviour
// Theme switcher (with localStorage persistence) and scroll reveal.
// Vanilla JS, no dependencies. Loads with `defer` so DOM is parsed.

(() => {
  "use strict";

  const STORAGE_KEY = "pedalquest-theme";
  const DEFAULT_THEME = "sky";

  const THEMES = [
    { id: "sky",        label: "Sky" },
    { id: "sunset",     label: "Sunset" },
    { id: "forest",     label: "Forest" },
    { id: "underwater", label: "Underwater" },
    { id: "dinosaur",   label: "Dinosaur" },
    { id: "space",      label: "Space" },
    { id: "racing",     label: "Racing Track" }
  ];

  // ---------------------------------------------------------------
  // Theme application
  // ---------------------------------------------------------------

  function resolveSavedTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && THEMES.some((t) => t.id === saved)) {
        return saved;
      }
    } catch (_) {
      // localStorage unavailable (Safari private mode etc.) — fall through.
    }
    return DEFAULT_THEME;
  }

  function applyTheme(id) {
    const safe = THEMES.some((t) => t.id === id) ? id : DEFAULT_THEME;
    document.body.setAttribute("data-theme", safe);
    try {
      localStorage.setItem(STORAGE_KEY, safe);
    } catch (_) {
      // Silently ignore — page still works without persistence.
    }
    document.querySelectorAll(".theme-option").forEach((btn) => {
      btn.setAttribute(
        "aria-pressed",
        btn.dataset.theme === safe ? "true" : "false"
      );
    });
  }

  // ---------------------------------------------------------------
  // Theme picker UI — built dynamically so HTML stays clean.
  // ---------------------------------------------------------------

  function buildThemePicker() {
    const host = document.querySelector("[data-theme-picker]");
    if (!host) return;

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "theme-trigger";
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-label", "Change theme");
    trigger.innerHTML =
      '<span class="theme-dot" aria-hidden="true"></span><span>Theme</span>';

    const panel = document.createElement("div");
    panel.className = "theme-panel";
    panel.setAttribute("role", "menu");
    panel.setAttribute("data-open", "false");

    const title = document.createElement("p");
    title.className = "panel-title";
    title.textContent = "Pick a theme";
    panel.appendChild(title);

    THEMES.forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "theme-option";
      btn.dataset.theme = t.id;
      btn.setAttribute("role", "menuitemradio");
      btn.setAttribute("aria-pressed", "false");
      btn.innerHTML =
        '<span class="swatch ' +
        t.id +
        '" aria-hidden="true"></span><span>' +
        t.label +
        "</span>";
      btn.addEventListener("click", () => {
        applyTheme(t.id);
        closePanel();
        trigger.focus();
      });
      panel.appendChild(btn);
    });

    host.appendChild(trigger);
    host.appendChild(panel);

    function openPanel() {
      panel.setAttribute("data-open", "true");
      trigger.setAttribute("aria-expanded", "true");
    }

    function closePanel() {
      panel.setAttribute("data-open", "false");
      trigger.setAttribute("aria-expanded", "false");
    }

    function togglePanel() {
      if (panel.getAttribute("data-open") === "true") {
        closePanel();
      } else {
        openPanel();
      }
    }

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePanel();
    });

    document.addEventListener("click", (e) => {
      if (!host.contains(e.target)) closePanel();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closePanel();
    });
  }

  // ---------------------------------------------------------------
  // Scroll-reveal — adds .is-revealed once an element enters viewport.
  // Respects prefers-reduced-motion via both JS and CSS.
  // ---------------------------------------------------------------

  function setupReveal() {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const targets = document.querySelectorAll(".reveal");

    if (reducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    targets.forEach((el) => observer.observe(el));
  }

  // ---------------------------------------------------------------
  // Mark the current page in the site bar nav.
  // ---------------------------------------------------------------

  function markCurrentNav() {
    const here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".site-bar nav a").forEach((a) => {
      const href = (a.getAttribute("href") || "").split("/").pop();
      if (href === here || (here === "" && href === "index.html")) {
        a.setAttribute("aria-current", "page");
      }
    });
  }

  // ---------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------

  function init() {
    applyTheme(resolveSavedTheme());
    buildThemePicker();
    applyTheme(resolveSavedTheme());
    setupReveal();
    markCurrentNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
