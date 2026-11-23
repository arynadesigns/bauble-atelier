// painted details per shape
const DETAILS = {
  house({ C, M, B, spec, cols, clear }) {
    const T = spec.toCanvas;
    const [x0, y0] = T(-.75, .8), [x1, y1] = T(.75, .1);
    C.fillStyle = clear ? cols[1] : cols[1]; C.beginPath(); const roof = [[-.72, .1], [0, .8], [.35, .45], [.35, .68], [.5, .68], [.5, .3], [.72, .1]]; roof.forEach(([x, y], i) => { const [a, b] = T(x, y); i ? C.lineTo(a, b) : C.moveTo(a, b); }); C.closePath(); C.fill();
    for (let k = 0; k < 6; k++) { C.strokeStyle = 'rgba(255,255,255,.35)'; C.lineWidth = 3; const [a, b] = T(-.6 + k * .04, .12 + k * .1); const [c2, d2] = T(.6 - k * .04, .12 + k * .1); C.beginPath(); C.moveTo(a, b); C.lineTo(c2, d2); C.stroke(); }
    const door = (x, y, ww, hh, col) => { const [a, b] = T(x - ww / 2, y + hh), [c2, d2] = T(x + ww / 2, y); C.fillStyle = col; C.fillRect(a, b, c2 - a, d2 - b); M.fillStyle = '#fff'; M.fillRect(a, b, c2 - a, d2 - b); B.fillStyle = '#c8c8c8'; B.fillRect(a, b, c2 - a, d2 - b); };
    door(0, -.72, .28, .48, cols[2]);
    for (const x of [-.36, .36]) { door(x, -.2, .24, .24, cols[3]); const [a, b] = T(x, -.2), [, d2] = T(x, .04); C.fillStyle = cols[4]; C.fillRect(a - 2, d2, 4, b - d2); const [e, f] = T(x - .12, -.08), [g] = T(x + .12, -.08); C.fillRect(e, f - 2, g - e, 4); }
  },
  ginger({ C, M, B, spec }) {
    const T = spec.toCanvas, ic = '#FFF7EC';
    const dot = (x, y, rr, col) => { const [a, b] = T(x, y); const [c2] = T(x + rr, y); for (const [ctx, cc] of [[C, col], [M, '#fff'], [B, '#e0e0e0']]) { ctx.fillStyle = cc; ctx.beginPath(); ctx.arc(a, b, c2 - a, 0, TAU); ctx.fill(); } };
    dot(-.13, .7, .055, ic); dot(.13, .7, .055, ic);
    const [sx, sy] = T(0, .62), [ex] = T(.16, .62); C.strokeStyle = ic; C.lineWidth = (ex - sx) * .3; C.lineCap = 'round'; C.beginPath(); C.arc(sx, sy - (ex - sx) * .4, ex - sx, .6, Math.PI - .6); C.stroke();
    dot(0, .1, .07, state.colors[2]); dot(0, -.12, .07, state.colors[3]); dot(0, -.34, .07, state.colors[4]);
    const zig = (pts) => { C.strokeStyle = ic; C.lineWidth = 6; C.beginPath(); pts.forEach(([x, y], i) => { const [a, b] = T(x, y); i ? C.lineTo(a, b) : C.moveTo(a, b); }); C.stroke(); };
    zig([[-.66, .02], [-.62, .16], [-.58, .02], [-.54, .17], [-.5, .03]]); zig([[.5, .03], [.54, .17], [.58, .02], [.62, .16], [.66, .02]]);
    zig([[-.36, -.78], [-.3, -.7], [-.24, -.8], [-.18, -.72], [-.13, -.82]]); zig([[.13, -.82], [.18, -.72], [.24, -.8], [.3, -.7], [.36, -.78]]);
  },
  reflector({ C, M, B, w, h, cols }) {
    const cx = w / 2, cy = h / 2, R = h * .25;
    for (const ctx of [C]) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, cols[3]); g.addColorStop(.35, cols[2]); g.addColorStop(.75, cols[1]); g.addColorStop(1, cols[0]);
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, R * 1.4, R, 0, 0, TAU); ctx.fill();
      for (let i = 0; i < 14; i++) { ctx.save(); ctx.translate(cx, cy); ctx.scale(1.4, 1); ctx.rotate(i / 14 * TAU); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.ellipse(R * .55, 0, R * .32, R * .08, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = cols[3]; ctx.beginPath(); ctx.ellipse(cx, cy, R * .3, R * .22, 0, 0, TAU); ctx.fill();
    }
    M.fillStyle = '#fff'; M.beginPath(); M.ellipse(cx, cy, R * .45, R * .32, 0, 0, TAU); M.fill();
  },
  pinecone({ C, w, h, cols, clear }) {
    const bands = clear ? [cols[1], cols[2], cols[3]] : [cols[0], cols[0], cols[1], cols[2], cols[3]];
    const g = C.createLinearGradient(0, 0, 0, h); bands.forEach((c, i) => g.addColorStop(i / (bands.length - 1), c));
    C.globalAlpha = clear ? .55 : 1; C.fillStyle = g; C.fillRect(0, 0, w, h); C.globalAlpha = 1;
    C.strokeStyle = 'rgba(255,255,255,.35)'; C.lineWidth = 3;
    for (let k = -30; k < 30; k++) { C.beginPath(); C.moveTo(k * w / 14, 0); C.lineTo(k * w / 14 + h * 1.55, h); C.stroke(); C.beginPath(); C.moveTo(k * w / 14, 0); C.lineTo(k * w / 14 - h * 1.55, h); C.stroke(); }
  },
  drop({ C, M, B, w, h, cols }) {
    const cx = w / 2, cy = h * .58, R = h * .07;
    C.strokeStyle = cols[4]; C.lineWidth = h * .012;
    for (let i = 0; i < 8; i++) { C.beginPath(); C.ellipse(cx, cy, R * 2.6, R * 2.1, i / 8 * Math.PI, 0, TAU); C.stroke(); }
    const g = C.createRadialGradient(cx - R * .3, cy - R * .3, 1, cx, cy, R * 1.4); g.addColorStop(0, '#fff'); g.addColorStop(.25, cols[2]); g.addColorStop(1, shade(cols[2], -.45));
    C.fillStyle = g; C.beginPath(); C.ellipse(cx, cy, R * 1.5, R * 1.15, 0, 0, TAU); C.fill();
    M.fillStyle = '#fff'; M.beginPath(); M.ellipse(cx, cy, R * 1.5, R * 1.15, 0, 0, TAU); M.fill();
    B.fillStyle = '#fff'; B.beginPath(); B.ellipse(cx, cy, R * 1.5, R * 1.15, 0, 0, TAU); B.fill();
    C.fillStyle = cols[1]; C.fillRect(0, h * .2, w, h * .03); C.fillRect(0, h * .78, w, h * .02);
  },
  bell({ C, B, MT, w, h, cols }) {
    const cx = w / 2, sy = h * .78;
    C.fillStyle = '#1b1410'; B.fillStyle = '#202020'; MT.fillStyle = '#000';
    for (const ctx of [C, B, MT]) { ctx.beginPath(); ctx.ellipse(cx, sy - h * .06, w * .012, h * .045, 0, 0, TAU); ctx.fill(); ctx.fillRect(cx - w * .004, sy - h * .06, w * .008, h * .14); }
    C.fillStyle = cols[1]; C.fillRect(0, h * .495, w, h * .012);
  },
  icicle({ C, w, h, cols, clear }) {
    const g = C.createLinearGradient(0, h, 0, 0); g.addColorStop(0, shade(cols[0], .55)); g.addColorStop(1, cols[0]);
    if (!clear) { C.fillStyle = g; C.fillRect(0, 0, w, h); }
  },
  candy({ C, w, h, cols }) {
    for (let k = -20; k < 40; k++) { C.fillStyle = cols[1 + (((k % 3) + 3) % 3)]; C.beginPath(); const x = k * w / 18; C.moveTo(x, 0); C.lineTo(x + w / 36, 0); C.lineTo(x + w / 36 + h * .9, h); C.lineTo(x + h * .9, h); C.closePath(); C.fill(); }
  },
  cane({ C, w, h, cols }) {
    const period = w / 22;
    for (let k = -30; k < 60; k++) { const x = k * period; C.fillStyle = cols[1]; C.beginPath(); C.moveTo(x, 0); C.lineTo(x + period * .42, 0); C.lineTo(x + period * .42 + h * .8, h); C.lineTo(x + h * .8, h); C.closePath(); C.fill(); C.fillStyle = cols[2]; C.beginPath(); C.moveTo(x + period * .55, 0); C.lineTo(x + period * .64, 0); C.lineTo(x + period * .64 + h * .8, h); C.lineTo(x + period * .55 + h * .8, h); C.closePath(); C.fill(); }
  }
};

