/* Code With Me — interactions */
(function () {
  "use strict";

  /* ---------- Sticky header shadow ---------- */
  const header = document.querySelector(".site-header");
  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("site-nav");

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    }
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Stagger sibling cards slightly ---------- */
  document.querySelectorAll(".feature-grid .reveal, .involve-grid .reveal, .events-grid .reveal").forEach(
    (el, i) => {
      el.style.transitionDelay = `${(i % 3) * 70}ms`;
    }
  );

  /* ---------- Hero code typing shimmer (subtle, respects reduced motion) ---------- */
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const codeBody = document.querySelector(".code-body");
  if (codeBody && !reduced) {
    const cursor = document.createElement("span");
    cursor.style.cssText = "display:inline-block;width:8px;height:1em;background:#38bdf8;vertical-align:-0.1em;margin-left:2px;animation:pulse 1.1s steps(2,start) infinite;";
    codeBody.appendChild(cursor);
  }

  /* ---------- Dynamic year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Active nav link on scroll ---------- */
  const sections = ["about", "what-we-do", "events", "partners", "get-involved"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const links = Array.from(document.querySelectorAll(".site-nav .nav-link"));

  if ("IntersectionObserver" in window && sections.length) {
    const navIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            links.forEach((l) =>
              l.style.color = l.getAttribute("href") === `#${entry.target.id}`
                ? "var(--text)"
                : ""
            );
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((s) => navIO.observe(s));
  }
})();
