/* Optional motion layer: semantic UI state remains owned by app.js. */
(() => {
  const page = document.documentElement;
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const control = document.getElementById("motion-toggle");
  const artwork = document.querySelector(".optics-art");
  if (!control || !artwork) return;
  const easing = "cubic-bezier(.22,1,.36,1)";
  const active = new Map();
  const indicators = new Map();
  let manuallyPaused = false;
  let artworkVisible = false;
  let ready = false;
  try {
    manuallyPaused = localStorage.getItem("fdtd-motion") === "paused";
  } catch {}

  function canAnimate() {
    return ready && !preference.matches && !manuallyPaused && !document.hidden;
  }
  function stop(element) {
    const entry = active.get(element);
    if (!entry) return;
    active.delete(element);
    entry.animation.cancel();
    entry.cleanup();
  }
  function animate(element, frames, options = {}, cleanup = () => {}) {
    if (!element || !canAnimate() || typeof element.animate !== "function") {
      cleanup();
      return;
    }
    stop(element);
    const animation = element.animate(frames, {
      duration: 300,
      easing,
      ...options,
    });
    active.set(element, { animation, cleanup });
    const finish = () => {
      if (active.get(element)?.animation !== animation) return;
      active.delete(element);
      cleanup();
    };
    animation.finished.then(finish, finish);
    return animation;
  }
  function cancelAll() {
    [...active.keys()].forEach(stop);
  }
  function updateWaveVisibility() {
    page.dataset.waveActive = String(artworkVisible && !document.hidden);
  }
  function updatePreference() {
    page.dataset.motion = preference.matches
      ? "reduced"
      : manuallyPaused
        ? "paused"
        : "running";
    control.disabled = preference.matches;
    control.setAttribute(
      "aria-pressed",
      String(preference.matches || manuallyPaused),
    );
    control.textContent = preference.matches
      ? "系统已减少动效"
      : manuallyPaused
        ? "播放动效"
        : "暂停动效";
    if (!canAnimate()) cancelAll();
    updateWaveVisibility();
  }

  function moveIndicator(list, withMotion) {
    const indicator = indicators.get(list);
    const selected = list.querySelector('[role="tab"][aria-selected="true"]');
    if (!indicator || !selected || !list.getBoundingClientRect().width) return;
    const before = indicator.getBoundingClientRect();
    const container = list.getBoundingClientRect();
    const target = selected.getBoundingClientRect();
    const next = {
      left: target.left - container.left + list.scrollLeft,
      top: target.top - container.top + list.scrollTop,
      width: target.width,
      height: target.height,
    };
    // Panel height can resize its sidebar without moving the tabs. Keep the
    // current indicator animation in that case; only real geometry changes reset it.
    if (
      !withMotion &&
      Object.entries(next).every(
        ([key, value]) =>
          Math.abs(Number.parseFloat(indicator.style[key]) - value) < 0.1,
      )
    )
      return;
    stop(indicator);
    Object.entries(next).forEach(([key, value]) => {
      indicator.style[key] = `${value}px`;
    });
    if (withMotion && before.width && before.height) {
      animate(
        indicator,
        [
          {
            transform: `translate(${before.left - target.left}px,${before.top - target.top}px) scale(${before.width / target.width},${before.height / target.height})`,
          },
          { transform: "translate(0,0) scale(1,1)" },
        ],
        { duration: 320 },
      );
    }
  }
  function prepareIndicators() {
    document.querySelectorAll('[role="tablist"]').forEach((list) => {
      const indicator = document.createElement("span");
      indicator.className = "tab-indicator";
      indicator.setAttribute("aria-hidden", "true");
      list.prepend(indicator);
      indicators.set(list, indicator);
      list.classList.add("tab-motion-ready");
      moveIndicator(list, false);
    });
    const refresh = () =>
      indicators.forEach((_, list) => moveIndicator(list, false));
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(refresh);
      indicators.forEach((_, list) => observer.observe(list));
    } else window.addEventListener("resize", refresh, { passive: true });
  }

  function enterHero() {
    [
      ".hero h1",
      ".hero-description",
      ".hero-actions",
      ".hero-requirement",
      ".hero-badges",
    ].forEach((selector, index) => {
      animate(
        document.querySelector(selector),
        [{ transform: "translateY(12px)" }, { transform: "translateY(0)" }],
        { duration: 600, delay: index * 65 },
      );
    });
    animate(
      document.querySelector(".wave-trace"),
      [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
      { duration: 1400, delay: 120 },
    );
  }
  function enterWorkflow(step, index) {
    const delay = window.matchMedia("(min-width: 1101px)").matches
      ? index * 100
      : 0;
    step.dataset.motionEntered = "true";
    animate(
      step,
      [{ transform: "translateY(10px)" }, { transform: "translateY(0)" }],
      { duration: 450, delay },
    );
    animate(
      step.querySelector(".step-number"),
      [
        { transform: "scale(.86)" },
        { transform: "scale(1.08)", offset: 0.65 },
        { transform: "scale(1)" },
      ],
      { duration: 450, delay },
    );
    animate(
      step.querySelector(".model-schematic .silicon"),
      [{ transform: "translateY(6px)" }, { transform: "translateY(0)" }],
      { duration: 550, delay: 120 },
    );
  }

  document.addEventListener("fdtd:tab-change", (event) => {
    const { list, panel } = event.detail;
    moveIndicator(list, true);
    animate(
      panel,
      [{ transform: "translateY(5px)" }, { transform: "translateY(0)" }],
      { duration: 220 },
    );
  });
  document.addEventListener("fdtd:copied", (event) => {
    animate(
      event.detail.button,
      [
        { transform: "translateY(0)" },
        { transform: "translateY(1px)", offset: 0.4 },
        { transform: "translateY(0)" },
      ],
      { duration: 220 },
    );
  });
  document.addEventListener("fdtd:menu-toggle", (event) => {
    if (event.detail.open)
      animate(
        event.detail.navigation,
        [{ transform: "translateY(-6px)" }, { transform: "translateY(0)" }],
        { duration: 180 },
      );
    else stop(event.detail.navigation);
  });
  document.getElementById("theme-toggle").addEventListener("click", (event) => {
    animate(
      event.currentTarget.querySelector("svg"),
      [{ transform: "rotate(-35deg)" }, { transform: "rotate(0)" }],
      { duration: 320 },
    );
  });
  const history = document.querySelector(".history");
  history?.addEventListener("toggle", () => {
    stop(history);
    if (!history.open || !canAnimate()) return;
    const fullHeight = history.getBoundingClientRect().height;
    const summaryHeight = history
      .querySelector("summary")
      .getBoundingClientRect().height;
    history.style.overflow = "hidden";
    animate(
      history,
      [{ height: `${summaryHeight}px` }, { height: `${fullHeight}px` }],
      { duration: 280 },
      () => {
        history.style.overflow = "";
      },
    );
  });

  control.addEventListener("click", () => {
    manuallyPaused = !manuallyPaused;
    try {
      localStorage.setItem(
        "fdtd-motion",
        manuallyPaused ? "paused" : "running",
      );
    } catch {}
    updatePreference();
  });
  preference.addEventListener("change", updatePreference);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAll();
    updateWaveVisibility();
  });

  (document.fonts?.ready || Promise.resolve()).then(() => {
    requestAnimationFrame(() => {
      ready = true;
      document
        .querySelectorAll(".wave-rings ellipse")
        .forEach((ring, index) => {
          ring.style.setProperty("--wave-delay", `${index * 0.8 - 6.4}s`);
        });
      page.classList.add("motion-ready");
      control.hidden = false;
      updatePreference();
      prepareIndicators();
      enterHero();
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(
          (entries) => {
            artworkVisible = entries[0].isIntersecting;
            updateWaveVisibility();
          },
          { threshold: 0.1 },
        ).observe(artwork);
        const steps = [...document.querySelectorAll(".case-step")];
        const flowObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              enterWorkflow(entry.target, steps.indexOf(entry.target));
              flowObserver.unobserve(entry.target);
            });
          },
          { threshold: 0.18 },
        );
        steps.forEach((step) => flowObserver.observe(step));
      } else {
        artworkVisible = true;
        updateWaveVisibility();
      }
    });
  });
})();
