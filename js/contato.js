// Essência Serrana — janela de contato (como a da referência): abre pelo "Contato", fecha pelo ×, por fora ou Esc.
(() => {
  const modal = document.getElementById("contato");
  if (!modal) return;
  let lastFocus = null;
  const open = (from) => {
    lastFocus = from || document.activeElement;
    document.getElementById("site-nav")?.classList.remove("is-open");
    document.querySelector("[data-menu-button]")?.setAttribute("aria-expanded", "false");
    modal.hidden = false;
    document.documentElement.classList.add("has-modal");
    modal.querySelector(".modal-actions a")?.focus();
  };
  const close = () => {
    if (modal.hidden) return;
    modal.hidden = true;
    document.documentElement.classList.remove("has-modal");
    lastFocus?.focus?.();
  };
  document.querySelectorAll("[data-open-contato]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); open(b); }));
  modal.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
  modal.querySelectorAll(".modal-actions a").forEach((a) => a.addEventListener("click", () => setTimeout(close, 0)));
  addEventListener("keydown", (e) => {
    if (modal.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key !== "Tab") return;                      // keep the focus inside the window
    const items = [...modal.querySelectorAll("a, button:not(.modal-backdrop)")];
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
})();
