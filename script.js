(function () {
  document.querySelectorAll('a[href^="http"]').forEach(function (link) {
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setupRevealMotion() {
    const groups = [
      { selector: ".page-hero > *", effect: "up", stagger: true },
      { selector: ".feature-section", effect: "up", stagger: true },
      { selector: ".capability-card", effect: "scale", stagger: true },
      { selector: ".audience-list > div", effect: "right", stagger: true },
      { selector: ".support-item", effect: "up", stagger: true },
      { selector: ".shop-panel", effect: "up", stagger: true },
      { selector: ".shop-category", effect: "scale", stagger: true },
      { selector: ".goods-card", effect: "up", stagger: true },
      { selector: ".pay-method", effect: "scale", stagger: true },
      { selector: ".download-panel", effect: "up", stagger: true },
      { selector: ".download-card", effect: "up", stagger: true },
      { selector: ".step-list > div", effect: "up", stagger: true },
      { selector: ".download-support", effect: "up", stagger: true },
      { selector: ".release-grid > div", effect: "scale", stagger: true },
      { selector: ".release-card", effect: "up", stagger: true },
      { selector: ".merchant-content > *", effect: "left", stagger: true },
      { selector: ".shop-actions > *", effect: "left", stagger: true }
    ];

    const seen = new WeakSet();
    const revealItems = [];

    groups.forEach(function (group) {
      const nodes = Array.from(document.querySelectorAll(group.selector));
      nodes.forEach(function (node, index) {
        if (seen.has(node)) return;
        seen.add(node);
        node.classList.add("reveal-item");
        if (group.effect && group.effect !== "up") {
          node.dataset.reveal = group.effect;
        }
        if (group.stagger) {
          node.style.setProperty("--reveal-delay", String(Math.min(index * 70, 420)) + "ms");
        }
        revealItems.push(node);
      });
    });

    if (!revealItems.length) return;

    document.body.classList.add("motion-ready");

    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.14
    });

    revealItems.forEach(function (item) {
      observer.observe(item);
    });
  }

  setupRevealMotion();

  document.querySelectorAll(".shop-category, .goods-card").forEach(function (card) {
    card.addEventListener("click", function () {
      const group = card.classList.contains("shop-category") ? ".shop-category" : ".goods-card";
      document.querySelectorAll(group).forEach(function (item) {
        item.classList.remove(group === ".shop-category" ? "active" : "selected");
      });
      card.classList.add(group === ".shop-category" ? "active" : "selected");
    });
  });

  const timeline = document.querySelector(".timeline");
  const pagination = document.querySelector(".release-pagination");
  const filterButtons = Array.from(document.querySelectorAll(".release-filter [data-filter]"));

  if (timeline && pagination) {
    const pageSize = Number(timeline.dataset.pageSize) || 5;
    const cards = Array.from(timeline.querySelectorAll(".release-card"));
    const params = new URLSearchParams(window.location.search);
    let currentFilter = params.get("type") || "all";
    let currentPage = Math.max(1, Number(params.get("page")) || 1);

    function filteredCards() {
      return cards.filter(function (card) {
        return currentFilter === "all" || card.dataset.category === currentFilter;
      });
    }

    function updateUrl() {
      const next = new URL(window.location.href);
      if (currentPage > 1) {
        next.searchParams.set("page", String(currentPage));
      } else {
        next.searchParams.delete("page");
      }
      if (currentFilter !== "all") {
        next.searchParams.set("type", currentFilter);
      } else {
        next.searchParams.delete("type");
      }
      window.history.replaceState({}, "", next);
    }

    function renderPagination(totalPages) {
      pagination.innerHTML = "";
      pagination.hidden = totalPages <= 1;
      if (totalPages <= 1) return;

      const prev = document.createElement("button");
      prev.type = "button";
      prev.textContent = "上一页";
      prev.disabled = currentPage === 1;
      prev.addEventListener("click", function () {
        currentPage -= 1;
        render();
      });
      pagination.appendChild(prev);

      for (let index = 1; index <= totalPages; index += 1) {
        const page = document.createElement("button");
        page.type = "button";
        page.textContent = String(index);
        page.className = index === currentPage ? "active" : "";
        page.setAttribute("aria-label", "第 " + index + " 页");
        page.addEventListener("click", function () {
          currentPage = index;
          render();
        });
        pagination.appendChild(page);
      }

      const next = document.createElement("button");
      next.type = "button";
      next.textContent = "下一页";
      next.disabled = currentPage === totalPages;
      next.addEventListener("click", function () {
        currentPage += 1;
        render();
      });
      pagination.appendChild(next);
    }

    function render() {
      const activeCards = filteredCards();
      const totalPages = Math.max(1, Math.ceil(activeCards.length / pageSize));
      currentPage = Math.min(Math.max(1, currentPage), totalPages);

      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      cards.forEach(function (card) {
        card.hidden = true;
      });
      activeCards.slice(start, end).forEach(function (card) {
        card.hidden = false;
      });

      filterButtons.forEach(function (button) {
        const active = button.dataset.filter === currentFilter;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });

      renderPagination(totalPages);
      updateUrl();
    }

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        currentFilter = button.dataset.filter || "all";
        currentPage = 1;
        render();
      });
    });

    render();
  }

  const canvas = document.getElementById("tint-plate");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  let tick = 0;
  let frame = 0;

  function channel(base, offset, value) {
    return Math.max(0, Math.min(255, Math.floor(base + offset * value)));
  }

  function draw() {
    for (let x = 0; x < 32; x += 1) {
      for (let y = 0; y < 32; y += 1) {
        const dx = x - 16;
        const dy = y - 16;
        const wave = Math.sin((dx * dx + dy * dy) / 68 + tick);
        const sweep = Math.cos((x - y) / 4.8 + tick * 1.12);
        const r = channel(214, 32, Math.cos((x * x - y * y) / 205 + tick * .82));
        const g = channel(222, 34, wave);
        const b = channel(232, 28, Math.sin((x + y) / 6.4 + tick * .72) + sweep * .22);
        ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        ctx.fillRect(x, y, 1, 1);
      }
    }

    if (!reduceMotion) {
      tick += 0.018;
      frame = window.requestAnimationFrame(draw);
    }
  }

  draw();

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      window.cancelAnimationFrame(frame);
    } else if (!reduceMotion) {
      frame = window.requestAnimationFrame(draw);
    }
  });

  window.addEventListener("pagehide", function () {
    window.cancelAnimationFrame(frame);
  });
})();
