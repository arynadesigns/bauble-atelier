/* ================= shape definitions ================= */
const V2 = (x, y) => new THREE.Vector2(x, y);
function spline(pts, n = 72) { return new THREE.SplineCurve(pts.map(p => V2(p[0], p[1]))).getPoints(n).map(p => V2(Math.max(p.x, 0.001), p.y)); }
function sphereProfile(r, n = 64, ridge = 0) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + i / n * Math.PI; let rr = Math.cos(a) * r; if (ridge) rr += ridge * Math.exp(-Math.pow(Math.sin(a) / .05, 2)); out.push(V2(Math.max(rr, 0.001), Math.sin(a) * r)); }
  return out;
}
const PROFILES = {
  round: () => sphereProfile(1),
  reflector: () => sphereProfile(1),
  bell: () => sphereProfile(.9, 72, .055),
  pinecone: () => spline([[0, -1.25], [.18, -1.0], [.38, -.6], [.55, -.12], [.62, .3], [.57, .66], [.42, .93], [.2, 1.06], [0, 1.09]]),
  drop: () => spline([[0, -1.35], [.06, -1.18], [.25, -.78], [.52, -.22], [.62, .14], [.5, .55], [.28, .86], [.12, 1.02], [0, 1.1]]),
  icicle: () => spline([[0, -1.6], [.05, -1.3], [.14, -.65], [.25, 0], [.33, .6], [.35, .95], [.25, 1.12], [0, 1.18]], 90)
};
function shapeOutlines(key) { // THREE.Shape list for flat (extruded) toys, y-up
  const S = () => new THREE.Shape();
  if (key === 'square') { const s = S(), a = .78, r = .26; s.moveTo(-a + r, -a); s.lineTo(a - r, -a); s.quadraticCurveTo(a, -a, a, -a + r); s.lineTo(a, a - r); s.quadraticCurveTo(a, a, a - r, a); s.lineTo(-a + r, a); s.quadraticCurveTo(-a, a, -a, a - r); s.lineTo(-a, -a + r); s.quadraticCurveTo(-a, -a, -a + r, -a); return [s]; }
  if (key === 'heart') { const s = S(); s.moveTo(0, -.92); s.bezierCurveTo(-.6, -.45, -1.05, -.05, -1, .38); s.bezierCurveTo(-.95, .86, -.35, 1.02, 0, .6); s.bezierCurveTo(.35, 1.02, .95, .86, 1, .38); s.bezierCurveTo(1.05, -.05, .6, -.45, 0, -.92); return [s]; }
  if (key === 'star') { const s = S(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .47 : 1.02; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath(); return [s]; }
  if (key === 'tree') { const s = S(); const pts = [[0, 1.05], [.38, .52], [.22, .52], [.58, 0], [.36, 0], [.78, -.55], [.13, -.55], [.13, -.85], [-.13, -.85], [-.13, -.55], [-.78, -.55], [-.36, 0], [-.58, 0], [-.22, .52], [-.38, .52]]; s.moveTo(...pts[0]); pts.slice(1).forEach(p => s.lineTo(...p)); s.closePath(); return [s]; }
  if (key === 'house') { const s = S(); const pts = [[-.6, -.72], [.6, -.72], [.6, .1], [.72, .1], [.5, .3], [.5, .68], [.35, .68], [.35, .45], [0, .8], [-.72, .1], [-.6, .1]]; s.moveTo(...pts[0]); pts.slice(1).forEach(p => s.lineTo(...p)); s.closePath(); return [s]; }
  if (key === 'ginger') {
    const s = S(); s.moveTo(.22, .31); s.absarc(0, .62, .38, -.953, Math.PI + .953, false);
    s.lineTo(-.3, .25); s.quadraticCurveTo(-.75, .23, -.8, .06); s.quadraticCurveTo(-.8, -.09, -.62, -.09); s.lineTo(-.32, -.05);
    s.lineTo(-.37, -.5); s.quadraticCurveTo(-.52, -.92, -.28, -.97); s.quadraticCurveTo(-.11, -.98, -.06, -.72); s.quadraticCurveTo(0, -.6, .06, -.72);
    s.quadraticCurveTo(.11, -.98, .28, -.97); s.quadraticCurveTo(.52, -.92, .37, -.5); s.lineTo(.32, -.05); s.lineTo(.62, -.09);
    s.quadraticCurveTo(.8, -.09, .8, .06); s.quadraticCurveTo(.75, .23, .3, .25); s.lineTo(.22, .31); return [s];
  }
  if (key === 'snowflake') {
    const out = []; const bar = (x, y, ang, len, w) => { const s = S(); const c = Math.cos(ang), sn = Math.sin(ang), px = -sn * w / 2, py = c * w / 2; s.moveTo(x + px, y + py); s.lineTo(x + c * len + px, y + sn * len + py); s.lineTo(x + c * len - px, y + sn * len - py); s.lineTo(x - px, y - py); s.closePath(); out.push(s); };
    for (let i = 0; i < 6; i++) { const a = Math.PI / 2 + i * Math.PI / 3; bar(0, 0, a, 1, .17); for (const t of [.42, .7]) for (const d of [-1, 1]) bar(Math.cos(a) * t, Math.sin(a) * t, a + d * .8, t === .42 ? .36 : .24, .13); }
    const h = S(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; i ? h.lineTo(Math.cos(a) * .24, Math.sin(a) * .24) : h.moveTo(.24, 0); } h.closePath(); out.push(h); return out;
  }
  return null;
}
function canePoints() { const pts = []; for (let i = 0; i <= 12; i++) pts.push(new THREE.Vector3(.36, -1.25 + i / 12 * 1.65, 0)); for (let i = 1; i <= 24; i++) { const a = i / 24 * Math.PI; pts.push(new THREE.Vector3(Math.cos(a) * .36, .4 + Math.sin(a) * .36, 0)); } pts.push(new THREE.Vector3(-.36, .22, 0)); return pts; }

/* silhouettes for the tiles (y-up polygons) */
function silhouette(key) {
  const outl = shapeOutlines(key); if (outl) return { polys: outl.map(s => s.getPoints(40).map(p => [p.x, p.y])) };
  if (PROFILES[key]) { const pr = PROFILES[key](); const right = pr.map(p => [p.x, p.y]); const left = pr.slice().reverse().map(p => [-p.x, p.y]); return { polys: [right.concat(left)], cap: true }; }
  if (key === 'candy') { const e = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU; e.push([Math.cos(a) * .55, Math.sin(a) * .45]); } return { polys: [e, [[-.5, 0], [-1.05, .42], [-1.05, -.42]], [[.5, 0], [1.05, .42], [1.05, -.42]]] }; }
  if (key === 'cane') return { stroke: canePoints().map(p => [p.x, p.y]), w: .22 };
}
function drawSilhouette(cv, key, col) {
  const c = cv.getContext('2d'), W = cv.width, H = cv.height; c.clearRect(0, 0, W, H);
  const sil = silhouette(key); const all = (sil.polys ? sil.polys.flat() : sil.stroke);
  let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9; all.forEach(([x, y]) => { mnx = Math.min(mnx, x); mxx = Math.max(mxx, x); mny = Math.min(mny, y); mxy = Math.max(mxy, y); });
  // centre the whole icon (cap included) in the tile, at the same size for every shape
  const half = (sil.w || 0) / 2, top = mxy + (sil.cap ? .16 : 0) + half, bot = mny - half, lft = mnx - half, rgt = mxx + half;
  const box = W * .78, sc = Math.min(box / (rgt - lft), box / (top - bot));
  const cx = (lft + rgt) / 2, cy = (top + bot) / 2;
  const tx = x => W / 2 + (x - cx) * sc, ty = y => H / 2 - (y - cy) * sc;
  c.fillStyle = col; c.strokeStyle = col;
  if (sil.polys) sil.polys.forEach(poly => { c.beginPath(); poly.forEach(([x, y], i) => i ? c.lineTo(tx(x), ty(y)) : c.moveTo(tx(x), ty(y))); c.closePath(); c.fill(); });
  else { c.lineWidth = sil.w * sc; c.lineCap = 'round'; c.beginPath(); sil.stroke.forEach(([x, y], i) => i ? c.lineTo(tx(x), ty(y)) : c.moveTo(tx(x), ty(y))); c.stroke(); }
  if (sil.cap) { c.fillRect(W / 2 - sc * .13, ty(mxy) - sc * .16, sc * .26, sc * .17); }
}

