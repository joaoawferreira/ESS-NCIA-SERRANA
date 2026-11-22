// Essência Serrana — galeria. Cada sala prende a sua parede na tela; rolar para baixo leva a parede
// para o lado, 1:1 com a rolagem. As peças ficam em escala relativa, penduradas por dois fios.
(() => {
  const root = document.documentElement;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const pad = (n) => String(n).padStart(2, "0");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const touch = navigator.maxTouchPoints > 0 && !finePointer;
  const phone = matchMedia("(max-width: 599px)");
  const narrow = matchMedia("(max-width: 899px)");

  // Smooth scroll: Lenis, lerp 0.1; up/down and sideways both walk the gallery.
  let lenis = null;
  if (window.Lenis && !reduced && !touch) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, gestureOrientation: "both" });
    const loop = (t) => { lenis.raf(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  const scrollToY = (y) => (lenis ? lenis.scrollTo(y) : scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" }));

  // Rooms: a sticky pin holds the wall and the light.
  const chapters = [...document.querySelectorAll("[data-chapter]")];
  const rooms = chapters.map((ch) => {
    const wall = ch.querySelector("[data-wall]");
    const pin = document.createElement("div");
    pin.className = "wall-pin";
    const light = document.createElement("div");
    light.className = "light";
    wall.before(pin);
    pin.append(wall, light);
    return { ch, wall, pin, light, head: ch.querySelector(".chapter-head"), bench: wall.querySelector(".bench"),
      works: [...wall.querySelectorAll("[data-work]")], travel: 0, top: 0 };
  });
  const works = rooms.flatMap((r) => r.works);
  const total = works.length;

  // Two strings per work, at 30% and 70% of its top edge, from the top of the screen.
  const NS = "http://www.w3.org/2000/svg";
  works.forEach((w) => {
    w._btn = w.querySelector(".work-open");
    w._img = w._btn.querySelector("img");
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "strings");
    svg.setAttribute("aria-hidden", "true");
    svg.append(document.createElementNS(NS, "line"), document.createElementNS(NS, "line"));
    w._btn.prepend(svg);
    w._strings = svg;
  });
  const drawStrings = (r) => {
    const pinTop = r.pin.getBoundingClientRect().top;
    r.works.forEach((w) => {
      const wd = w._btn.offsetWidth;
      const top = w._btn.getBoundingClientRect().top - pinTop;
      if (!wd || top <= 0) return;
      const len = top + 3;
      Object.assign(w._strings.style, { left: "0px", top: `${-top}px`, width: `${wd}px`, height: `${len}px` });
      w._strings.setAttribute("viewBox", `0 0 ${wd} ${len}`);
      [0.3, 0.7].forEach((f, i) => {
        const l = w._strings.children[i];
        l.setAttribute("x1", f * wd); l.setAttribute("y1", 0);
        l.setAttribute("x2", f * wd); l.setAttribute("y2", len);
      });
    });
  };

  // Sizes: 1 inch = 1% of the viewport height, times the room's scale; the largest ease toward the room.
  const soft = (x, cap) => { const k = 0.72 * cap; return x <= k ? x : k + (cap - k) * (1 - Math.exp(-(x - k) / (cap - k))); };

  // Minimap: one mark per work, its height by size; the marks light as their work comes into view.
  const map = document.querySelector("[data-minimap]");
  const buildMap = () => {
    map.innerHTML = "";
    rooms.forEach((r, ri) => {
      if (ri) { const g = document.createElement("span"); g.className = "mm-gap"; map.append(g); }
      r.works.forEach((w) => {
        const a = document.createElement("a");
        a.setAttribute("role", "link"); a.tabIndex = 0; a.draggable = false;
        a.setAttribute("aria-label", `${w.dataset.title}, ${w.dataset.index} de ${total}`);
        a.style.height = `${clamp((parseFloat(w.dataset.inches) || 20) * 0.45, 6, 22)}px`;
        const lit = document.createElement("i"); lit.className = "mm-lit"; a.append(lit);
        w._lit = lit; w._on = -1; w._mark = a;
        a.addEventListener("click", (e) => { e.preventDefault(); goTo(w, r); });
        a.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goTo(w, r); } });
        map.append(a);
      });
    });
  };
  const goTo = (w, r) => {
    const x = w.offsetLeft + w._btn.offsetLeft + w._btn.offsetWidth / 2 - innerWidth / 2;
    scrollToY(r.top + clamp(x, 0, r.travel));
  };

  const layout = () => {
    const h = innerHeight, vw = innerWidth;
    const rem = parseFloat(getComputedStyle(root).fontSize) || 16;
    const navW = narrow.matches ? 0 : document.querySelector("[data-shell]").offsetWidth;
    const shellBox = document.querySelector("[data-shell]").getBoundingClientRect();
    const barBottom = shellBox.height < h * 0.5 ? shellBox.bottom : 0;
    const mapTop = map.getBoundingClientRect().top;
    const isPhone = phone.matches;
    rooms.forEach((r) => {
      const headroom = barBottom ? barBottom + 1.4 * rem : h * 0.08;
      // Rooms are scaled up on desktop (1.5x) and a little less on a phone (1.3x).
      const scale = parseFloat(isPhone ? r.ch.dataset.scalePhone : r.ch.dataset.scale) || (isPhone ? 1.3 : 1.5);
      const ppi = h / 100;                                            // 1 inch of work = 1% of the view
      const labelW = isPhone ? 0 : 12.5 * rem + 1.15 * rem;
      const maxW = isPhone ? vw - 2.5 * rem : vw - navW - 2 * clamp(vw * 0.032, 1.25 * rem, 4 * rem) - labelW;
      const gap = parseFloat(getComputedStyle(r.wall).columnGap) || 60;
      const drop = isPhone ? parseFloat(getComputedStyle(r.works[0]).rowGap) || 18 : 0;
      // Phone: the labels' bottom keeps a little air above the map.
      r.wall.style.paddingBottom = isPhone ? `${Math.round(h - mapTop + 1.75 * rem)}px` : "";
      const floor = parseFloat(getComputedStyle(r.wall).paddingBottom) || h * 0.25;
      const size = (labelH) => {
        r.works.forEach((w) => {
          const room = h - floor - headroom - (isPhone ? labelH + drop : 0);
          const inches = parseFloat(w.dataset.inches) || 20, ratio = parseFloat(w.dataset.ratio) || 0.75;
          let ht = Math.max(soft(ppi * inches * scale, room), h * 0.1);
          let wd = ht * ratio;
          if (wd > maxW) { wd = maxW; ht = wd / ratio; }
          w._btn.style.width = `${Math.round(wd)}px`;
          w._img.style.aspectRatio = String(ratio);
          w.style.width = isPhone ? `${Math.round(wd)}px` : "";
          // Phone: the label is centred under its work and may reach 24px into each gap.
          w.querySelector(".work-label").style.maxWidth = isPhone ? `${Math.round(wd + gap - 12)}px` : "";
        });
      };
      if (isPhone) {
        // Every label in a room takes the height of the tallest, so the works keep one floor line.
        r.wall.style.removeProperty("--label-h");
        size(7 * rem);
        const tallest = () => Math.max(0, ...r.works.map((w) => w.querySelector(".work-label").scrollHeight));
        size(tallest());
        r.wall.style.setProperty("--label-h", `${tallest()}px`);
      } else {
        r.wall.style.removeProperty("--label-h");
        size(0);
      }
      // A room ends when its last work stands in the middle of a phone; elsewhere, at the wall's end.
      const last = r.works[r.works.length - 1];
      r.travel = isPhone || touch
        ? Math.max(0, last.offsetLeft + last._btn.offsetLeft + last._btn.offsetWidth / 2 - vw / 2)
        : Math.max(0, r.wall.scrollWidth - vw);
      r.ch.style.height = `${r.travel + h}px`;
      r.pin.style.height = `${h}px`;
    });
    rooms.forEach((r) => { r.top = r.ch.getBoundingClientRect().top + scrollY; });
    rooms.forEach((r) => {
      // The bench: centred under the room's words, a little above the map.
      const groundY = mapTop - 1.75 * rem;
      if (r.bench && r.head) {
        const t = r.head.querySelector(".chapter-title").getBoundingClientRect();
        const n = (r.head.querySelector(".chapter-note") || r.head.querySelector(".chapter-count")).getBoundingClientRect();
        const left = Math.min(t.left, n.left), right = Math.max(t.right, n.right);
        let bw = Math.min(vw * (phone.matches ? 0.62 : narrow.matches ? 0.3 : 0.18), 260);
        const headBottom = r.head.getBoundingClientRect().bottom - r.ch.getBoundingClientRect().top;
        bw = Math.min(bw, (groundY - headBottom - 1.5 * rem) * 5);
        r.bench.style.display = bw < 90 ? "none" : "";
        const wl = r.pin.getBoundingClientRect().left;
        Object.assign(r.bench.style, { width: `${bw}px`, left: `${(left + right) / 2 - bw / 2 - wl}px`, bottom: `${h - groundY}px` });
      }
    });
    measure();
    update();
    rooms.forEach(drawStrings);
  };

  // Each scroll step works from positions measured once per layout: no forced layout while moving.
  const measure = () => {
    rooms.forEach((r) => {
      r._shown = null;
      r.wall.style.transform = "";
      const pinTop = r.pin.getBoundingClientRect().top;
      r.works.forEach((w) => {
        const b = w._btn.getBoundingClientRect();
        w._room = r; w._x = w.offsetLeft + w._btn.offsetLeft; w._w = w._btn.offsetWidth;
        w._y0 = b.top - pinTop; w._y1 = b.bottom - pinTop;
      });
    });
  };

  const whereNum = document.querySelector("[data-where-num]");
  const whereChapter = document.querySelector("[data-where-chapter]");
  const pagerNum = document.querySelector("[data-pager-num]");
  const end = document.querySelector(".gallery-end");
  let lastBest = null, activeRoom = null;
  const update = () => {
    const y = scrollY, vw = innerWidth, vh = innerHeight;
    let active = rooms[0];
    rooms.forEach((r) => {
      const into = clamp(y - r.top, 0, r.travel);
      r._into = into;
      r._pinTop = y < r.top ? r.top - y : y > r.top + r.travel ? r.top + r.travel - y : 0;
      if (r._shown !== into) { r._shown = into; r.wall.style.transform = `translate3d(${-into}px, 0, 0)`; }
      if (y >= r.top - vh * 0.5) active = r;
    });
    const ground = active.ch.dataset.ground;
    if (root.dataset.ground !== ground) root.dataset.ground = ground;
    if (active !== activeRoom) { activeRoom = active; pagerNum.textContent = pad(rooms.indexOf(active) + 1); }

    let best = works[0], bd = Infinity;
    for (const w of works) {
      const r = w._room;
      if (!r) continue;
      const left = w._x - r._into, right = left + w._w, top = r._pinTop + w._y0, bottom = r._pinTop + w._y1;
      const inView = bottom > 0 && top < vh;
      const d = Math.abs((left + right) / 2 - vw / 2) + (inView ? 0 : 1e5);
      if (d < bd) { bd = d; best = w; }
      const on = inView ? Math.round(clamp((Math.min(right, vw) - Math.max(left, 0)) / Math.max(w._w, 1), 0, 1) * 50) / 50 : 0;
      if (on !== w._on) { w._on = on; w._lit.style.opacity = on; }
    }
    const last = rooms[rooms.length - 1];
    if (bd >= 1e5) best = y >= last.top ? works[works.length - 1] : lastBest || works[0];
    if (best !== lastBest) {
      lastBest = best;
      whereNum.textContent = pad(best.dataset.index);
      whereChapter.textContent = best.closest("[data-chapter]").dataset.chapter;
    }
  };
  addEventListener("scroll", update, { passive: true });

  // Keep the visitor in the same room and the same share of its walk across a resize.
  let pend = 0, laidW = innerWidth, laidH = innerHeight;
  const relayout = (e) => {
    // On a phone the browser bar sliding in or out changes the height a little: not a new layout.
    if (e?.type === "resize" && touch && innerWidth === laidW && Math.abs(innerHeight - laidH) < 160) return;
    laidW = innerWidth; laidH = innerHeight;
    const y0 = scrollY, k = rooms.findIndex((r) => y0 >= r.top - 2 && y0 <= r.top + r.travel + 2);
    const share = k >= 0 ? (y0 - rooms[k].top) / Math.max(1, rooms[k].travel) : null;
    cancelAnimationFrame(pend);
    pend = requestAnimationFrame(() => {
      layout();
      if (e?.type === "resize" && share !== null) { scrollTo(0, Math.round(rooms[k].top + share * rooms[k].travel)); update(); }
    });
  };
  addEventListener("resize", relayout);
  document.fonts?.ready.then(relayout);
  addEventListener("load", relayout);
  buildMap();
  layout();

  // Room pager and arrow keys.
  document.querySelectorAll("[data-room-step]").forEach((b) => b.addEventListener("click", () => {
    const i = rooms.indexOf(activeRoom ?? rooms[0]) + Number(b.dataset.roomStep);
    if (i < 0) return scrollToY(0);
    if (i >= rooms.length) return scrollToY(document.documentElement.scrollHeight - innerHeight);
    scrollToY(rooms[i].top);
  }));
  document.querySelectorAll("[data-to-top]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); scrollToY(0); }));
  let keyTo = null;
  addEventListener("keydown", (e) => {
    if (!["ArrowRight", "ArrowLeft"].includes(e.key) || e.metaKey || e.ctrlKey || e.altKey) return;
    e.preventDefault();
    const from = keyTo !== null && Math.abs(keyTo - scrollY) > 2 ? keyTo : scrollY;
    keyTo = clamp(from + (e.key === "ArrowRight" ? 1 : -1) * innerHeight * 0.18, 0, document.documentElement.scrollHeight - innerHeight);
    scrollToY(keyTo);
  });

  // The light follows the hand (lerp 0.08) and settles on the work you point at; that work lifts 6px.
  if (finePointer && !reduced) {
    const st = { x: innerWidth / 2, y: innerHeight * 0.45, tx: innerWidth / 2, ty: innerHeight * 0.45 };
    addEventListener("pointermove", (e) => { st.tx = e.clientX; st.ty = e.clientY; });
    const tick = () => {
      st.x = lerp(st.x, st.tx, 0.08); st.y = lerp(st.y, st.ty, 0.08);
      rooms.forEach((r) => { r.light.style.setProperty("--lx", `${st.x}px`); r.light.style.setProperty("--ly", `${st.y}px`); });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    works.forEach((w) => {
      const btn = w._btn, wall = w.closest("[data-wall]");
      btn.addEventListener("pointerenter", () => {
        const b = btn.getBoundingClientRect();
        st.tx = b.left + b.width / 2; st.ty = b.top + b.height * 0.4;
        btn.classList.add("is-focus"); wall.classList.add("has-focus");
        btn.animate([{ transform: "translateY(0)" }, { transform: "translateY(-6px)" }], { duration: 450, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" });
      });
      btn.addEventListener("pointerleave", () => {
        btn.classList.remove("is-focus"); wall.classList.remove("has-focus");
        btn.animate([{ transform: "translateY(-6px)" }, { transform: "translateY(0)" }], { duration: 380, easing: "ease-out", fill: "forwards" });
      });
    });
  }

  // The signature lights up when you reach the very end, and fades as you start back up.
  if (end) {
    const mark = document.createElement("span");
    Object.assign(mark.style, { position: "absolute", left: 0, bottom: 0, width: "1px", height: "24px", pointerEvents: "none" });
    end.append(mark);
    new IntersectionObserver(([e]) => end.classList.toggle("is-signed", e.isIntersecting)).observe(mark);
  }

  // Menu button (tablets and phones): the menu drops down from the top; Escape or a link closes it.
  const menuBtn = document.querySelector("[data-menu-button]");
  const nav = document.getElementById("site-nav");
  const setMenu = (open) => { nav.classList.toggle("is-open", open); menuBtn.setAttribute("aria-expanded", String(open)); };
  menuBtn?.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  nav?.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); menuBtn.focus(); } });
  narrow.addEventListener?.("change", () => setMenu(false));

  // Touch (phones and tablets): any swipe walks the gallery. Sideways or down goes onward, up goes back.
  // The walk follows the finger snugly, a flick glides on and slows gently, and if you come to rest
  // between two rooms the step finishes in the direction you were going.
  if (touch && !reduced) {
    const stage = document.getElementById("stage");
    root.classList.add("walk-touch");
    let target = scrollY, current = scrollY, vel = 0, raf = 0, dragging = false, lastDir = 1, samples = [];
    const max = () => document.documentElement.scrollHeight - innerHeight;
    const turns = () => {
      const out = []; let y = 0;
      rooms.forEach((r) => { if (r.top - y > 0.5 && y > 0) out.push([y, r.top]); y = r.top + r.travel; });
      if (max() - y > 0.5) out.push([y, max()]);
      return out;
    };
    const turnAt = (p) => turns().find(([a, b]) => p > a + 0.5 && p < b - 0.5);
    const loop = (now) => {
      const dt = Math.min(now - (loop.t || now), 40) || 16; loop.t = now;
      if (!dragging && Math.abs(vel) > 0.004) {
        target = clamp(target + vel * dt, 0, max());
        vel *= Math.pow(0.965, dt / 16);
        if (target <= 0 || target >= max()) vel = 0;
      } else if (!dragging && vel !== 0) {
        vel = 0;
        const t = turnAt(target);
        if (t) target = lastDir > 0 ? t[1] : t[0];
      }
      current += (target - current) * (1 - Math.pow(dragging ? 0.6 : 0.86, dt / 16));
      if (Math.abs(target - current) < 0.3 && vel === 0) current = target;
      scrollTo(0, Math.round(current));
      update();
      if (dragging || current !== target || vel !== 0) raf = requestAnimationFrame(loop);
      else { raf = 0; loop.t = 0; }
    };
    const run = () => { if (!raf) raf = requestAnimationFrame(loop); };
    let sx = 0, sy = 0, lx = 0, ly = 0, axis = null;
    stage.addEventListener("touchstart", (e) => {
      if (e.touches.length > 1) return;
      const t = e.touches[0]; sx = lx = t.clientX; sy = ly = t.clientY; axis = null;
      if (!raf) target = current = scrollY;
      vel = 0; samples = [];
    }, { passive: true });
    stage.addEventListener("touchmove", (e) => {
      if (e.touches.length > 1 || e.target.closest(".gallery-end")) return;
      const t = e.touches[0], dx = t.clientX - lx, dy = t.clientY - ly;
      lx = t.clientX; ly = t.clientY;
      if (!axis) {
        if (Math.max(Math.abs(t.clientX - sx), Math.abs(t.clientY - sy)) < 6) return;
        axis = Math.abs(t.clientX - sx) >= Math.abs(t.clientY - sy) ? "x" : "y"; dragging = true; vel = 0;
      }
      e.preventDefault();
      const d = -(axis === "x" ? dx : dy) * 1.15;
      if (d) lastDir = Math.sign(d);
      target = clamp(target + d, 0, max());
      const now = performance.now();
      samples.push([now, target]); while (samples.length && now - samples[0][0] > 100) samples.shift();
      run();
    }, { passive: false });
    const release = () => {
      if (!dragging) return;
      dragging = false;
      const now = performance.now();
      while (samples.length && now - samples[0][0] > 100) samples.shift();
      const a = samples[0], b = samples[samples.length - 1];
      vel = samples.length > 1 ? (b[1] - a[1]) / Math.max(b[0] - a[0], 16) : 0;
      if (now - (b?.[0] || 0) > 80) vel = 0;               // the finger had stopped
      vel = clamp(vel * 1.1, -6, 6);
      if (vel) lastDir = Math.sign(vel);
      if (!vel) vel = 0.0041 * lastDir;                    // still let a rest between rooms finish its step
      run();
    };
    stage.addEventListener("touchend", release);
    stage.addEventListener("touchcancel", release);
  }

  // A work opens on Instagram for now (no viewer yet).
  works.forEach((w) => w._btn.addEventListener("click", () => window.open("https://www.instagram.com/essenciaserrana/", "_blank", "noopener")));
})();
