// Pedal Diary — site behaviour
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
    // First visit, no saved choice: honour an OS dark preference with a dark
    // theme so the site feels at home; any explicit pick overrides this.
    try {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "space";
      }
    } catch (_) {}
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
        confettiBurst();
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
  // Feature card tilt — subtle 3° 3D rotation with theme-aware glow.
  // Cursor position drives rotateX/rotateY and the radial-gradient
  // origins (--gx, --gy). Parallax depth on [data-depth] descendants.
  // Skipped entirely on coarse pointers and reduced motion — touch
  // users keep the existing simple lift defined in CSS.
  // ---------------------------------------------------------------

  function setupTiltCards() {
    const coarse = window.matchMedia(
      "(hover: none) and (pointer: coarse)"
    ).matches;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (coarse || reduced) return;

    const cards = document.querySelectorAll(".feature-card");
    if (!cards.length) return;

    const MAX_ROT = 3; // degrees — deliberately subtle for a kids' app
    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);

    // Read data-depth → write CSS custom prop --d for translateZ.
    document
      .querySelectorAll(".feature-card [data-depth]")
      .forEach((el) => {
        el.style.setProperty("--d", el.dataset.depth);
      });

    cards.forEach((card) => {
      const state = {
        rx: 0, ry: 0, trx: 0, try_: 0,
        gx: 50, gy: 50, tgx: 50, tgy: 50,
        dirty: false,
      };

      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = clamp((e.clientX - r.left) / r.width, 0, 1);
        const py = clamp((e.clientY - r.top) / r.height, 0, 1);
        state.try_ = (px - 0.5) * MAX_ROT * 2;
        state.trx = -(py - 0.5) * MAX_ROT * 2;
        state.tgx = px * 100;
        state.tgy = py * 100;
        state.dirty = true;
      });

      card.addEventListener("pointerleave", () => {
        state.trx = 0;
        state.try_ = 0;
        state.tgx = 50;
        state.tgy = 50;
        state.dirty = true;
      });

      const tick = () => {
        if (
          state.dirty ||
          Math.abs(state.rx - state.trx) > 0.02 ||
          Math.abs(state.ry - state.try_) > 0.02 ||
          Math.abs(state.gx - state.tgx) > 0.05 ||
          Math.abs(state.gy - state.tgy) > 0.05
        ) {
          state.rx = lerp(state.rx, state.trx, 0.14);
          state.ry = lerp(state.ry, state.try_, 0.14);
          state.gx = lerp(state.gx, state.tgx, 0.16);
          state.gy = lerp(state.gy, state.tgy, 0.16);

          const s = card.style;
          s.setProperty("--rx", state.rx.toFixed(2) + "deg");
          s.setProperty("--ry", state.ry.toFixed(2) + "deg");
          s.setProperty("--gx", state.gx.toFixed(2) + "%");
          s.setProperty("--gy", state.gy.toFixed(2) + "%");
          state.dirty = false;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  // ---------------------------------------------------------------
  // Magnetic CTAs + theme-tinted click pulse.
  //   • Pull (hover): only on fine-pointer devices. Translates the
  //     target gently toward the cursor at low strength (0.15), then
  //     spring-lerps back to rest on pointerleave. The CSS combines
  //     --tx/--ty with the existing -2px hover lift.
  //   • Pulse (click): a button-shaped span is appended to <body>,
  //     sized + shaped to the clicked element, scales outward and
  //     fades. Reads --accent so it tints with the active theme.
  // Reduced-motion users see no pulse and no pull (CSS hover stays).
  // ---------------------------------------------------------------

  function setupMagneticCtas() {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const coarse = window.matchMedia(
      "(hover: none) and (pointer: coarse)"
    ).matches;

    if (!reduced) wireCtaPulse();
    if (reduced || coarse) return;

    wireMagneticPull();
  }

  function wireMagneticPull() {
    const targets = document.querySelectorAll(
      ".button.primary, .button.secondary, .appstore-badge"
    );
    if (!targets.length) return;

    const STRENGTH = 0.15;
    const lerp = (a, b, t) => a + (b - a) * t;

    targets.forEach((el) => {
      const state = { tx: 0, ty: 0, x: 0, y: 0, dirty: false };

      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        state.tx = (e.clientX - cx) * STRENGTH;
        state.ty = (e.clientY - cy) * STRENGTH;
        state.dirty = true;
      });

      el.addEventListener("pointerleave", () => {
        state.tx = 0;
        state.ty = 0;
        state.dirty = true;
      });

      const tick = () => {
        if (
          state.dirty ||
          Math.abs(state.x - state.tx) > 0.05 ||
          Math.abs(state.y - state.ty) > 0.05
        ) {
          state.x = lerp(state.x, state.tx, 0.18);
          state.y = lerp(state.y, state.ty, 0.18);
          el.style.setProperty("--tx", state.x.toFixed(2) + "px");
          el.style.setProperty("--ty", state.y.toFixed(2) + "px");
          state.dirty = false;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  function wireCtaPulse() {
    const SEL = ".button.primary, .button.secondary, .appstore-badge";
    document.addEventListener("pointerdown", (e) => {
      const el = e.target.closest(SEL);
      if (!el) return;

      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const pulse = document.createElement("span");
      pulse.className = "cta-pulse";
      pulse.style.left = r.left + "px";
      pulse.style.top = r.top + "px";
      pulse.style.width = r.width + "px";
      pulse.style.height = r.height + "px";
      pulse.style.borderRadius = cs.borderRadius;
      document.body.appendChild(pulse);
      pulse.addEventListener(
        "animationend",
        () => pulse.remove(),
        { once: true }
      );
    });
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
  // Support-page FAQ tools — search, topic filter and deep-linking.
  // Progressive enhancement: the toolbar is hidden in HTML and only
  // revealed here, so no-JS visitors simply see the full FAQ list.
  // ---------------------------------------------------------------

  function setupFaqTools() {
    const items = Array.from(document.querySelectorAll("details[data-cat]"));
    if (!items.length) return; // not the support page

    const tools = document.querySelector("[data-faq-tools]");
    if (tools) tools.removeAttribute("hidden");

    const input = document.getElementById("faq-search-input");
    const chips = Array.from(document.querySelectorAll(".faq-chip"));
    const noResults = document.querySelector("[data-faq-noresults]");
    if (noResults) noResults.setAttribute("aria-live", "polite");

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const norm = (s) => s.toLowerCase();
    let activeCat = "all";

    function apply() {
      const q = norm(input ? input.value.trim() : "");
      let shown = 0;
      items.forEach((d) => {
        const matchesCat = activeCat === "all" || d.dataset.cat === activeCat;
        const matchesText = !q || norm(d.textContent).indexOf(q) !== -1;
        const visible = matchesCat && matchesText;
        d.hidden = !visible;
        if (visible) shown += 1;
      });
      if (noResults) noResults.hidden = shown !== 0;
    }

    function setActiveCat(cat) {
      activeCat = cat || "all";
      chips.forEach((c) =>
        c.setAttribute(
          "aria-pressed",
          c.dataset.cat === activeCat ? "true" : "false"
        )
      );
    }

    if (input) input.addEventListener("input", apply);

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        setActiveCat(chip.dataset.cat);
        apply();
      });
    });

    function centreOn(target, smooth) {
      // Centre on the question (summary), not the whole answer: the summary is
      // short and its position is stable as the answer expands below it, so this
      // stays clear of the sticky header and works for long answers too.
      const anchor = target.querySelector("summary") || target;
      const rect = anchor.getBoundingClientRect();
      const top =
        rect.top + window.pageYOffset - window.innerHeight / 2 + rect.height / 2;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: smooth && !reduced ? "smooth" : "auto",
      });
    }

    function revealAncestors(el) {
      let n = el;
      while (n && n !== document.body) {
        if (n.classList && n.classList.contains("reveal")) {
          n.classList.add("is-revealed");
        }
        n = n.parentElement;
      }
    }

    // Gate the hash writes below: while a deep link is being applied during
    // load, a hash in the URL would re-arm the browser's native scroll-to-
    // fragment (which honours scroll-margin-top and lands under the header).
    let allowHashWrite = true;

    function openTarget(id, smooth) {
      if (!id) return;
      const target = document.getElementById(id);
      if (!target || target.tagName.toLowerCase() !== "details") return;
      // Clear any filter so the requested answer is guaranteed visible.
      setActiveCat("all");
      if (input) input.value = "";
      apply();
      revealAncestors(target);
      target.open = true;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => centreOn(target, smooth))
      );
    }

    window.addEventListener("hashchange", () => {
      openTarget(location.hash.slice(1), true);
    });

    // Reflect an opened FAQ in the URL so a direct link can be shared.
    items.forEach((d) => {
      d.addEventListener("toggle", () => {
        if (allowHashWrite && d.open && d.id) {
          history.replaceState(null, "", "#" + d.id);
        }
      });
    });

    apply();

    // The <head> stashes any #faq-… deep link into window.__pdDeepLink and strips
    // it from the URL. Keep the URL hash-free until after load, centre with no
    // fragment present, then restore the shareable hash once the browser's
    // load-time jump can no longer fire.
    const deepLink =
      window.__pdDeepLink || (location.hash ? location.hash.slice(1) : "");
    if (deepLink) {
      allowHashWrite = false;
      openTarget(deepLink, false);
      window.addEventListener("load", function () {
        const t = document.getElementById(deepLink);
        requestAnimationFrame(function () {
          if (t) centreOn(t, false);
          setTimeout(function () {
            allowHashWrite = true;
            try {
              history.replaceState(null, "", "#" + deepLink);
            } catch (e) {}
          }, 80);
        });
      });
    }
  }

  // ---------------------------------------------------------------
  // Reading-progress bar — tracks scroll position (most useful on the
  // long story/privacy pages; harmless on short ones).
  // ---------------------------------------------------------------

  function setupScrollProgress() {
    const bar = document.createElement("div");
    bar.className = "scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);

    let ticking = false;
    function update() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const ratio = max > 0 ? Math.min(1, doc.scrollTop / max) : 0;
      bar.style.transform = "scaleX(" + ratio + ")";
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  // ---------------------------------------------------------------
  // Theme-change confetti — a small accent-tinted burst, fired only on a
  // user theme change (never on load) and skipped under reduced motion.
  // ---------------------------------------------------------------

  function confettiBurst() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const accent =
      getComputedStyle(document.body).getPropertyValue("--accent").trim() ||
      "#2563eb";
    const colours = [accent, "#facc15", "#ffffff"];
    for (let i = 0; i < 18; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.background = colours[i % colours.length];
      piece.style.animationDelay = Math.floor(Math.random() * 140) + "ms";
      document.body.appendChild(piece);
      piece.addEventListener("animationend", () => piece.remove(), {
        once: true,
      });
    }
  }

  // ---------------------------------------------------------------
  // Service worker — registered late (on load) so it never competes with
  // first paint. The worker is network-first, so the live site is never
  // served stale; the cache is only an offline fallback.
  // ---------------------------------------------------------------

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function () {
        // Registration fails on file:// or unsupported contexts — ignore.
      });
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
    setupTiltCards();
    setupMagneticCtas();
    setupFaqTools();
    setupScrollProgress();
    registerServiceWorker();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
