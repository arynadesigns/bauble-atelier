
/* ================= textures ================= */
/* ---- the drawn message: Arc signature-pad ink (pad units 600 x 260), fitted onto the toy's front ---- */
const PAD_W = 600, PAD_H = 260;
const INK_COLOURS = { gold: { hex: '#D6AC4E', metal: true }, silver: { hex: '#C9CDD2', metal: true }, white: { hex: '#FFFFFF' }, black: { hex: '#17171A' }, red: { hex: '#C62828' }, green: { hex: '#2E7D4F' }, blue: { hex: '#2F5FD0' }, pink: { hex: '#E86AA6' } };
const INK_WIDTHS = { fine: 3.4, medium: 5.6, bold: 8.4 };
function inkBox(strokes) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  strokes.forEach(s => s.points.forEach(p => { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }));
  const pad = 12; return { x: x0 - pad, y: y0 - pad, w: Math.max(30, x1 - x0 + pad * 2), h: Math.max(20, y1 - y0 + pad * 2) };
}
// Returns where the message goes on the texture: the biggest box of the drawing's shape that fits the toy's front, so odd shapes get a smaller message.
function inkPlacement(spec) {
  const strokes = state.ink.strokes; if (!strokes.length || spec.kind === 'tube') return null;
  const b = inkBox(strokes), aspect = b.h / b.w, { w, h } = spec;
  if (spec.kind === 'planar') {
    let sx = 0, sy = 0, n = 0; for (let y = 0; y < h; y += 12) for (let x = 0; x < w; x += 12) if (spec.inside(x, y)) { sx += x; sy += y; n++; }
    if (!n) return null; const cx = sx / n, cy = sy / n;
    const fits = k => { const hw = k, hh = k * aspect; for (let i = 0; i <= 8; i++) for (let j = 0; j <= 4; j++) if (!spec.inside(cx - hw + 2 * hw * i / 8, cy - hh + 2 * hh * j / 4)) return false; return true; };
    let lo = 0, hi = w * .45; for (let it = 0; it < 18; it++) { const mid = (lo + hi) / 2; fits(mid) ? lo = mid : hi = mid; }
    const hw = lo * .9, hh = hw * aspect; if (hw < 8) return null;
    return { cx, cy, sx: 2 * hw / b.w, sy: 2 * hw / b.w, rot: 0, b, box: [cx - hw, cy - hh, cx + hw, cy + hh] };
  }
  if (!spec.rAt) { // candy: the body lies on its side, so the writing runs along its length
    const pxLen = spec.ppw, pxRound = w / (TAU * .5);
    let len = .95, around = len * aspect; if (around > .75) { len *= .75 / around; around = .75; }
    const cx = w / 2, cy = h / 2;
    return { cx, cy, sx: len * pxLen / b.w, sy: around * pxRound / b.h, rot: Math.PI / 2, b, box: [cx - around * pxRound / 2, cy - len * pxLen / 2, cx + around * pxRound / 2, cy + len * pxLen / 2] };
  }
  // round toys: centre on the widest part of the front
  let vc = .5, rm = 0; for (let v = .25; v <= .75; v += .01) { const r = spec.rAt(v); if (r > rm) { rm = r; vc = v; } }
  let ww = 1.25 * rm, wh = ww * aspect; const maxH = Math.min(.42 * spec.Lp, 1.1 * rm); if (wh > maxH) { ww *= maxH / wh; wh = maxH; }
  const pxX = w / (TAU * rm), pxY = h / spec.Lp, cx = w / 2, cy = (1 - vc) * h;
  return { cx, cy, sx: ww * pxX / b.w, sy: wh * pxY / b.h, rot: 0, b, box: [cx - ww * pxX / 2, cy - wh * pxY / 2, cx + ww * pxX / 2, cy + wh * pxY / 2] };
}
function inkPathOf(stroke) { return new Path2D(outlinePath(strokeOutline(stroke.points, { size: INK_WIDTHS[stroke.width] || 5.6, simulatePressure: !stroke.points.some(p => p.p > 0), taperStart: (INK_WIDTHS[stroke.width] || 5.6) * 1.5, taperEnd: (INK_WIDTHS[stroke.width] || 5.6) * 5, last: true }))); }
function drawInk(ctx, pl, spec) {
  const { b } = pl; const paths = state.ink.strokes.map(s => ({ s, path: inkPathOf(s) }));
  for (const [key, c] of Object.entries(ctx)) {
    c.save(); c.translate(pl.cx, pl.cy); if (pl.rot) c.rotate(pl.rot); c.scale(pl.sx, pl.sy); c.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
    for (const { s, path } of paths) {
      const ic = INK_COLOURS[s.color] || INK_COLOURS.gold;
      c.fillStyle = key === 'C' ? ic.hex : key === 'B' ? '#e6e6e6' : key === 'MT' ? (ic.metal ? '#ffffff' : '#000000') : key === 'RG' ? (ic.metal ? 'rgb(64,64,64)' : 'rgb(110,110,110)') : '#000';
      if (key === 'M') continue;
      c.fill(path);
    }
    c.restore();
  }
}
/* stroke outline, ported from Arc's signature pad (getStrokeOutline / outlineToPath) */
function strokeOutline(input, { size, thinning = .62, streamline = .42, simulatePressure = true, taperStart = 0, taperEnd = 0, last = true }) {
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, n) => [a[0] * n, a[1] * n];
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const norm = a => { const l = Math.hypot(a[0], a[1]); return l ? [a[0] / l, a[1] / l] : [0, 0]; }, perp = a => [a[1], -a[0]], dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const rotAround = (p, c, r) => { const s = Math.sin(r), co = Math.cos(r), px = p[0] - c[0], py = p[1] - c[1]; return [px * co - py * s + c[0], px * s + py * co + c[1]]; };
  const easeOut = t => t * (2 - t);
  const head = input[0]; if (!head) return [];
  const usePen = !simulatePressure && input.some(p => p.p > 0);
  const pts = []; let prev = [head.x, head.y], length = 0;
  const start = { at: prev, pressure: usePen ? head.p : .5, length: 0, vector: [1, 0] }; pts.push(start);
  for (let i = 1; i < input.length; i++) { const smp = input[i], raw = [smp.x, smp.y]; const at = i === input.length - 1 && last ? raw : lerp(prev, raw, 1 - streamline); const d = dist(at, prev); if (d < .4) continue; length += d; pts.push({ at, pressure: usePen ? smp.p : .5, length, vector: norm(sub(prev, at)) }); prev = at; }
  if (pts[1]) start.vector = pts[1].vector; const total = length;
  if (pts.length === 1) { const r = Math.max(.6, size * (.5 - thinning * (.5 - start.pressure)) * .9); return Array.from({ length: 18 }, (_, i) => add(start.at, mul([Math.cos(i / 18 * TAU), Math.sin(i / 18 * TAU)], r))); }
  const left = [], right = []; let pressure = start.pressure, prevVector = start.vector;
  for (let i = 0; i < pts.length; i++) {
    const point = pts[i];
    if (!usePen) { const step = i === 0 ? 0 : dist(point.at, pts[i - 1].at); const speed = Math.min(1, step / size); pressure = Math.min(1, pressure + (Math.min(1, 1 - speed) - pressure) * speed * .3); } else pressure = point.pressure;
    let radius = Math.max(.25, size * (.5 - thinning * (.5 - pressure)));
    const ts = taperStart ? easeOut(Math.min(1, point.length / taperStart)) : 1, te = taperEnd && last ? easeOut(Math.min(1, (total - point.length) / taperEnd)) : 1;
    radius = Math.max(.12 * size, radius * Math.min(ts, te));
    const next = pts[i + 1] ? pts[i + 1].vector : point.vector; const offset = mul(perp(lerp(next, point.vector, .5)), radius);
    if (i > 0 && i < pts.length - 1 && dot(point.vector, next) < -.2) { const corner = mul(perp(prevVector), radius); for (let t = 0; t <= 1; t += 1 / 12) { left.push(rotAround(sub(point.at, corner), point.at, Math.PI * t)); right.push(rotAround(add(point.at, corner), point.at, -Math.PI * t)); } }
    else { left.push(sub(point.at, offset)); right.push(add(point.at, offset)); }
    prevVector = point.vector;
  }
  const cap = (center, from, to, away) => { const out = [], r = dist(center, from), st = Math.atan2(from[1] - center[1], from[0] - center[0]), mid = st + Math.PI / 2, sign = dot([Math.cos(mid), Math.sin(mid)], away) >= 0 ? 1 : -1; for (let k = 1; k < 12; k++) { const a = st + sign * Math.PI * k / 12; out.push([center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r]); } out.push(to); return out; };
  const end = pts[pts.length - 1];
  const endCap = cap(end.at, left[left.length - 1], right[right.length - 1], mul(end.vector, -1)), startCap = cap(start.at, right[0], left[0], start.vector);
  return [...left, ...endCap, ...right.reverse(), ...startCap];
}
function outlinePath(points) {
  if (points.length < 3) return ''; const r = v => Math.round(v * 100) / 100;
  let d = `M${r(points[0][0])} ${r(points[0][1])} Q`;
  for (let i = 0; i < points.length; i++) { const [x0, y0] = points[i], [x1, y1] = points[(i + 1) % points.length]; d += `${r(x0)} ${r(y0)} ${r((x0 + x1) / 2)} ${r((y0 + y1) / 2)} `; }
  return d + 'Z';
}

function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function shade(h, k) { const [r, g, b] = hexToRgb(h); const f = v => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); return `rgb(${f(r)},${f(g)},${f(b)})`; }
const BASE_ROUGH = { clear: .45, shiny: .08, metal: .3, wood: .68, textile: 1, ceramic: .14, plastic: .3 };

function makeCanvases(w, h) {
  const mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  return { color: mk(), mask: mk(), bump: mk(), metal: mk(), rough: mk() };
}

// spec: {kind:'planar'|'lathe'|'tube', w, h, ppw (pixels per world unit), toCanvas?, inside?, avoid?, stretch?(v), symScale?}
function paint(spec) {
  const { w, h } = spec, cv = makeCanvases(w, h);
  const C = cv.color.getContext('2d'), M = cv.mask.getContext('2d'), B = cv.bump.getContext('2d'), MT = cv.metal.getContext('2d'), RG = cv.rough.getContext('2d');
  const cols = state.colors, clear = state.material === 'clear', mat = state.material;
  const r = rng(hashState());
  const g8 = v => { const n = Math.round(v * 255); return `rgb(${n},${n},${n})`; };
  if (!clear) { C.fillStyle = cols[0]; C.fillRect(0, 0, w, h); }
  M.fillStyle = '#000'; M.fillRect(0, 0, w, h);
  B.fillStyle = '#808080'; B.fillRect(0, 0, w, h);
  MT.fillStyle = '#fff'; MT.fillRect(0, 0, w, h);
  RG.fillStyle = g8(BASE_ROUGH[mat]); RG.fillRect(0, 0, w, h);
  if (mat === 'wood' && !clear) {
    for (let i = 0; i < 220; i++) { const y = r() * h, amp = 4 + r() * 18, k = r(); C.strokeStyle = `rgba(60,35,15,${.05 + r() * .12})`; B.strokeStyle = `rgba(0,0,0,${.15 + r() * .2})`; C.lineWidth = B.lineWidth = 1 + r() * 4; for (const ctx of [C, B]) { ctx.beginPath(); for (let x = 0; x <= w; x += 16) ctx.lineTo(x, y + Math.sin(x / w * TAU * (1 + k * 3) + k * 9) * amp); ctx.stroke(); } }
  }
  if (mat === 'textile') {
    const step = Math.max(3, Math.round(w / 420));
    for (let x = 0; x < w; x += step) { C.fillStyle = (x / step) % 2 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.07)'; C.fillRect(x, 0, 1, h); B.fillStyle = (x / step) % 2 ? '#9a9a9a' : '#666'; B.fillRect(x, 0, 1, h); }
    for (let y = 0; y < h; y += step) { C.fillStyle = (y / step) % 2 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)'; C.fillRect(0, y, w, 1); B.fillStyle = (y / step) % 2 ? 'rgba(170,170,170,.5)' : 'rgba(80,80,80,.5)'; B.fillRect(0, y, w, 1); }
  }
  const details = DETAILS[state.shape]; if (details) details({ C, M, B, MT, w, h, cols, clear, spec, r });

  // sprinkles
  const ink = inkPlacement(spec);
  const kinds = [...state.sprinkles];
  const palette = clear ? cols : cols.slice(1);
  if (state.shape !== 'cane' && kinds.length) {
    const base = .15 * spec.ppw;                       // a sprinkle about 0.15 units wide on a 2.25-unit toy
    const target = Math.round((spec.kind === 'planar' ? 18 + state.density * 150 : 30 + state.density * 280) * (spec.symScale || 1));
    const placed = [];
    for (let tries = 0; tries < target * 40 && placed.length < target; tries++) {
      const px = r() * w, py = r() * h;
      if (spec.inside && !spec.inside(px, py)) continue;
      if (spec.avoid && spec.avoid(px, py)) continue;
      if (ink && px > ink.box[0] && px < ink.box[2] && py > ink.box[1] && py < ink.box[3]) continue;
      const kind = kinds[(r() * kinds.length) | 0];
      const sz = base * SPRINKLE_SIZE[kind] * (.85 + r() * .3);
      let sx = sz, sy = sz;
      if (spec.kind === 'lathe') { const v = 1 - py / h; if (v < .1 || v > .9) continue; sx = sz * spec.stretch(v); if (sx > w * .2) continue; }
      if (placed.some(p => Math.hypot((p.x - px) / ((p.sx + sx) / 2), (p.y - py) / ((p.sy + sy) / 2)) < .95)) continue;
      placed.push({ x: px, y: py, sx, sy });
      const path = sprinklePath(kind), col = palette[(r() * palette.length) | 0], rot = r() * TAU;
      const xs = spec.kind === 'lathe' ? [px - w, px, px + w] : [px];
      for (const x of xs) {
        const tf = ctx => { ctx.save(); ctx.translate(x, py); ctx.scale(sx / 2, sy / 2); ctx.rotate(rot); };
        // colour: flat sugar colour with a soft top-left highlight and a darker lower edge
        tf(C); C.fillStyle = col; C.fill(path);
        C.save(); C.clip(path); const gr = C.createLinearGradient(-1, -1, 1, 1); gr.addColorStop(0, 'rgba(255,255,255,.16)'); gr.addColorStop(.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.14)'); C.fillStyle = gr; C.fillRect(-1.2, -1.2, 2.4, 2.4); C.restore(); C.restore();
        tf(M); M.fillStyle = '#fff'; M.fill(path); M.restore();
        tf(B); B.fillStyle = '#f2f2f2'; B.fill(path); B.restore();
        tf(MT); MT.fillStyle = '#000'; MT.fill(path); MT.restore();
        tf(RG); RG.fillStyle = g8(.62); RG.fill(path); RG.restore();
      }
    }
    // sugar crystals on the sprinkles
    const md = M.getImageData(0, 0, w, h).data, n = Math.round(w * h / 160);
    for (let i = 0; i < n; i++) {
      const x = (r() * w) | 0, y = (r() * h) | 0; if (md[(y * w + x) * 4] < 128) continue;
      const s = 1 + r() * 1.6; C.fillStyle = r() < .5 ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.1)'; C.fillRect(x, y, s, s);
      B.fillStyle = r() < .5 ? '#ffffff' : '#c8c8c8'; B.fillRect(x, y, s, s);
    }
  }
  if (ink) drawInk({ C, B, MT, RG, M }, ink, spec);
  // soften the bump so sprinkle edges read as rounded bevels
  const blurred = document.createElement('canvas'); blurred.width = w; blurred.height = h; const BB = blurred.getContext('2d');
  BB.filter = `blur(${Math.max(1.5, w / 900)}px)`; BB.drawImage(cv.bump, 0, 0); cv.bump = blurred;
  return cv;
}
