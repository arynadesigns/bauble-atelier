/* ================= geometry ================= */
function latheGeometry(shapeKey) {
  const prof = PROFILES[shapeKey](); const segs = 128;
  const geo = new THREE.LatheGeometry(prof, segs, Math.PI, TAU);
  const pos = geo.attributes.position, uv = geo.attributes.uv, v3 = new THREE.Vector3();
  const disp = { pinecone: (p, u, v) => { const f1 = (u * 16 + v * 10) % 1, f2 = ((u * 16 - v * 10) % 1 + 1) % 1; const cell = Math.sin(Math.PI * f1) * Math.sin(Math.PI * f2); const s = 1 + .085 * Math.pow(cell, .6) * Math.sin(Math.PI * Math.min(1, v * 1.1)); p.x *= s; p.z *= s; },
    icicle: (p, u, v) => { const s = 1 + .14 * Math.max(0, Math.cos(5 * u * TAU + v * 18)); p.x *= s; p.z *= s; },
    reflector: (p) => { const len = p.length(); const th = Math.acos(Math.max(-1, Math.min(1, p.z / len))); const T = .78; if (th < T) { const k = 1 - th / T; const flute = 1 + .3 * Math.cos(14 * Math.atan2(p.y, p.x)) * (1 - k); const d = .36 * Math.pow(k, .9) * flute; p.multiplyScalar(1 - d); } } }[shapeKey];
  if (disp) {
    for (let i = 0; i < pos.count; i++) { v3.fromBufferAttribute(pos, i); disp(v3, uv.getX(i), uv.getY(i)); pos.setXYZ(i, v3.x, v3.y, v3.z); }
    geo.computeVertexNormals();
    const n = prof.length, nrm = geo.attributes.normal; // stitch the seam at the back
    for (let j = 0; j < n; j++) { const a = j, b = segs * n + j; const x = nrm.getX(a) + nrm.getX(b), y = nrm.getY(a) + nrm.getY(b), z = nrm.getZ(a) + nrm.getZ(b); const l = Math.hypot(x, y, z) || 1; nrm.setXYZ(a, x / l, y / l, z / l); nrm.setXYZ(b, x / l, y / l, z / l); }
  }
  // texture spec: physical stretch so symbols stay round
  let Lp = 0; for (let i = 1; i < prof.length; i++) Lp += prof[i].distanceTo(prof[i - 1]);
  const W = 3072, H = 1536;
  const rAt = v => { const f = v * (prof.length - 1), i = Math.floor(f), t = f - i; const a = prof[Math.min(i, prof.length - 1)], b = prof[Math.min(i + 1, prof.length - 1)]; return Math.max(.05, a.x + (b.x - a.x) * t); };
  const spec = { kind: 'lathe', w: W, h: H, ppw: H / Lp, rAt, Lp, baseSize: H * .25 * (2.2 / Lp) * (shapeKey === 'icicle' ? .8 : 1), stretch: v => (Lp / H) / (TAU * rAt(v) / W), symScale: shapeKey === 'icicle' ? .6 : shapeKey === 'pinecone' ? .55 : 1 };
  if (shapeKey === 'reflector') spec.avoid = (x, y) => Math.hypot((x - W / 2) / 1.4, y - H / 2) < H * .32;
  if (shapeKey === 'drop') spec.avoid = (x, y) => Math.hypot((x - W / 2) / 1.2, y - H * .58) < H * .2;
  if (shapeKey === 'bell') spec.avoid = (x, y) => Math.abs(x - W / 2) < W * .05 && y > H * .62;
  return { geos: [geo], spec, cap: true };
}
function planarGeometry(shapeKey) {
  const shapes = shapeOutlines(shapeKey);
  const bevel = .2, opts = { depth: .12, bevelEnabled: true, bevelThickness: .2, bevelSize: bevel, bevelOffset: 0, bevelSegments: 7, curveSegments: 40 };
  if (shapeKey === 'snowflake') Object.assign(opts, { bevelThickness: .07, bevelSize: .035, bevelSegments: 3, depth: .06 });
  const geo = new THREE.ExtrudeGeometry(shapes, opts); geo.translate(0, 0, -opts.depth / 2);
  let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9; shapes.forEach(s => s.getPoints(40).forEach(p => { mnx = Math.min(mnx, p.x); mxx = Math.max(mxx, p.x); mny = Math.min(mny, p.y); mxy = Math.max(mxy, p.y); }));
  const b = opts.bevelSize; mnx -= b; mny -= b; mxx += b; mxy += b; const bw = mxx - mnx, bh = mxy - mny;
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - mnx) / bw, (pos.getY(i) - mny) / bh);
  uv.needsUpdate = true;
  const W = 2048, H = Math.round(2048 * bh / bw);
  const toCanvas = (x, y) => [(x - mnx) / bw * W, (1 - (y - mny) / bh) * H];
  // silhouette for symbol placement
  const sil = document.createElement('canvas'); sil.width = W; sil.height = H; const sc = sil.getContext('2d'); sc.fillStyle = '#fff';
  shapes.forEach(s => { sc.beginPath(); s.getPoints(60).forEach((p, i) => { const [x, y] = toCanvas(p.x, p.y); i ? sc.lineTo(x, y) : sc.moveTo(x, y); }); sc.closePath(); sc.fill(); });
  const sd = sc.getImageData(0, 0, W, H).data;
  const inside = (x, y) => { const xi = x | 0, yi = y | 0; if (xi < 0 || yi < 0 || xi >= W || yi >= H) return false; return sd[(yi * W + xi) * 4 + 3] > 200; };
  const spec = { kind: 'planar', w: W, h: H, ppw: W / bw, toCanvas, inside, baseSize: W * .26 / (bw / 2.2) * (shapeKey === 'snowflake' ? .5 : 1), symScale: shapeKey === 'snowflake' ? .5 : 1 };
  if (shapeKey === 'house') spec.avoid = (x, y) => { const [, yr] = toCanvas(0, .12); return y < yr; };
  if (shapeKey === 'ginger') spec.avoid = (x, y) => { const [cx, cy] = toCanvas(0, .62), [ex] = toCanvas(.42, .62); return Math.hypot(x - cx, y - cy) < ex - cx || Math.abs(x - cx) < (ex - cx) * .3; };
  return { geos: [geo], spec };
}
function candyGeometry() {
  const body = new THREE.LatheGeometry(spline([[0, -.72], [.32, -.6], [.47, -.3], [.5, 0], [.47, .3], [.32, .6], [0, .72]], 48), 96, Math.PI, TAU);
  body.rotateZ(Math.PI / 2);
  const wrapProf = spline([[.12, 0], [.1, .08], [.16, .2], [.3, .42], [.42, .56], [.001, .58]], 32);
  const geos = [body];
  for (const side of [-1, 1]) {
    const g = new THREE.LatheGeometry(wrapProf, 96, 0, TAU); const pos = g.attributes.position, uv = g.attributes.uv, v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) { v3.fromBufferAttribute(pos, i); const s = 1 + .16 * Math.cos(12 * uv.getX(i) * TAU) * Math.min(1, uv.getY(i) * 1.6); v3.x *= s; v3.z *= s; pos.setXYZ(i, v3.x, v3.y, v3.z); }
    g.computeVertexNormals(); g.rotateZ(side * -Math.PI / 2); g.translate(side * .66, 0, 0); geos.push(g);
  }
  return { geos, spec: { kind: 'lathe', w: 2048, h: 1024, ppw: 1024 / 1.6, baseSize: 1024 * .16, stretch: () => 1.4, symScale: .5 }, cap: false };
}
function caneGeometry() {
  const path = new THREE.CatmullRomCurve3(canePoints());
  const geo = new THREE.TubeGeometry(path, 260, .11, 28, false);
  const ends = [path.getPointAt(0), path.getPointAt(1)].map(p => { const s = new THREE.SphereGeometry(.11, 24, 16); s.translate(p.x, p.y, p.z); const uv = s.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, 0, .5); return s; });
  return { geos: [geo, ...ends], spec: { kind: 'tube', w: 2048, h: 256 }, cap: false };
}
function buildGeometry(shapeKey) {
  if (PROFILES[shapeKey]) return latheGeometry(shapeKey);
  if (shapeKey === 'candy') return candyGeometry();
  if (shapeKey === 'cane') return caneGeometry();
  return planarGeometry(shapeKey);
}

