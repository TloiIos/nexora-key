/**
 * ============================================================================
 * NEXORA KEY — Scroll Reveal
 * Version: 1.0.0
 *
 * Gan class .reveal cho cac khoi noi dung chinh, roi them .reveal--visible
 * khi chung lot vao khung nhin. Hieu ung duoc dinh nghia trong css/polish.css
 *
 * Neu trinh duyet khong ho tro IntersectionObserver hoac nguoi dung bat
 * "giam chuyen dong", script se hien tat ca ngay lap tuc.
 * ============================================================================
 */

(function () {
  "use strict";

  // Cac phan tu se duoc gan hieu ung xuat hien
  const TARGETS = [
    ".section__header",
    ".section__art",
    ".stat-card",
    ".pkg-card",
    ".feature-card",
    ".faq-item",
    ".checker__card"
  ].join(",");

  function init() {
    const els = document.querySelectorAll(TARGETS);
    if (!els.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Khong ho tro observer hoac nguoi dung muon giam chuyen dong -> hien luon
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(el => el.classList.add("reveal", "reveal--visible"));
      return;
    }

    els.forEach(el => el.classList.add("reveal"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("reveal--visible");
          observer.unobserve(entry.target); // chi chay mot lan
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -60px 0px"
      }
    );

    els.forEach(el => observer.observe(el));

    // Cac the goi license duoc render dong sau khi tai Firebase.
    // Theo doi grid de gan hieu ung cho the moi xuat hien.
    const grid = document.querySelector(".pricing__grid");
    if (grid && "MutationObserver" in window) {
      new MutationObserver(() => {
        grid.querySelectorAll(".pkg-card:not(.reveal)").forEach(card => {
          card.classList.add("reveal");
          observer.observe(card);
        });
      }).observe(grid, { childList: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
