// Essência Serrana — página do ateliê: menu (tablet e celular) e o logo que acompanha o mouse em camadas.
(() => {
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;

  // Menu button: the menu drops down from the top; Escape or a link closes it.
  const menuBtn = document.querySelector("[data-menu-button]");
  const nav = document.getElementById("site-nav");
  const setMenu = (open) => { nav.classList.toggle("is-open", open); menuBtn.setAttribute("aria-expanded", String(open)); };
  menuBtn?.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  nav?.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); menuBtn.focus(); } });

  // Depth: the frame and the logo drift against the pointer at different depths (lerp 0.06).
  const fig = document.querySelector("[data-depth]");
  if (fig && !reduced && finePointer) {
    const layers = [...fig.querySelectorAll("[data-depth-layer]")];
    // The serra behind the page drifts least, the far plane of the same depth.
    const scenery = document.querySelector("[data-scenery]");
    if (scenery) { scenery.dataset.depthLayer = "0.5"; layers.push(scenery); }
    let tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener("pointermove", (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; });
    const tick = () => {
      cx = lerp(cx, tx, 0.06); cy = lerp(cy, ty, 0.06);
      layers.forEach((l) => {
        const d = parseFloat(l.dataset.depthLayer);
        l.style.transform = `translate3d(${(-cx * 14 * d).toFixed(2)}px, ${(-cy * 10 * d).toFixed(2)}px, 0)`;
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
})();
