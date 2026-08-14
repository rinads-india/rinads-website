(function () {
  const burger = document.querySelector(".burger");
  const overlay = document.querySelector(".menu-overlay");
  const menu = document.getElementById("mobile-menu");
  const mobileLinks = menu ? menu.querySelectorAll("a") : [];

  function closeMenu() {
    if (!burger || !overlay || !menu) return;
    burger.setAttribute("aria-expanded", "false");
    overlay.hidden = true;
    menu.hidden = true;
    document.body.classList.remove("menu-open");
  }

  function openMenu() {
    if (!burger || !overlay || !menu) return;
    burger.setAttribute("aria-expanded", "true");
    overlay.hidden = false;
    menu.hidden = false;
    document.body.classList.add("menu-open");
  }

  if (burger) {
    burger.addEventListener("click", () => {
      const expanded = burger.getAttribute("aria-expanded") === "true";
      if (expanded) closeMenu();
      else openMenu();
    });
  }

  if (overlay) {
    overlay.addEventListener("click", closeMenu);
  }

  mobileLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) closeMenu();
  });

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function formatValue(value, decimals, suffix) {
    const fixed = value.toFixed(decimals);
    return suffix === "/7" ? `${Math.round(value)}/7` : `${fixed}${suffix}`;
  }

  function animateStat(stat, index) {
    const target = parseFloat(stat.dataset.target || "0");
    const suffix = stat.dataset.suffix || "";
    const decimals = parseInt(stat.dataset.decimals || "0", 10);
    const valueEl = stat.querySelector(".stat-value");
    if (!valueEl || stat.dataset.counted === "true") return;

    stat.dataset.counted = "true";
    const duration = 1500 + index * 80;
    const startOffset = 480 + index * 90;
    const start = performance.now() + startOffset;

    function frame(now) {
      const elapsed = now - start;
      if (elapsed < 0) {
        requestAnimationFrame(frame);
        return;
      }
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = target * eased;
      valueEl.textContent = formatValue(current, decimals, suffix);
      if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  const stats = document.querySelectorAll(".stat");
  if (stats.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const stat = entry.target;
          const index = Array.from(stats).indexOf(stat);
          animateStat(stat, index);
          observer.unobserve(stat);
        });
      },
      { threshold: 0.25 }
    );
    stats.forEach((stat) => observer.observe(stat));
  } else {
    stats.forEach((stat, index) => animateStat(stat, index));
  }
})();
