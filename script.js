(function () {
  document.querySelectorAll('a[href^="http"]').forEach(function (link) {
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });

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

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  let tick = 0;
  let frame = 0;

  function channel(base, offset, value) {
    return Math.max(0, Math.min(255, Math.floor(base + offset * value)));
  }

  function draw() {
    for (let x = 0; x < 36; x += 1) {
      for (let y = 0; y < 36; y += 1) {
        const dx = x - 18;
        const dy = y - 18;
        const wave = Math.sin((dx * dx + dy * dy) / 84 + tick);
        const r = channel(214, 32, Math.cos((x * x - y * y) / 260 + tick));
        const g = channel(222, 34, wave);
        const b = channel(232, 28, Math.sin((x + y) / 8 + tick / 2));
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
