
/* ================= materials ================= */
function canvasTex(cv, srgb) { const t = new THREE.CanvasTexture(cv); if (srgb) t.encoding = THREE.sRGBEncoding; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); t.wrapS = THREE.RepeatWrapping; return t; }
function makeMaterials(cv) {
  const map = canvasTex(cv.color, true), bump = canvasTex(cv.bump, false), metalMap = canvasTex(cv.metal, false), roughMap = canvasTex(cv.rough, false);
  const textures = [map, bump, metalMap, roughMap];
  const c0 = new THREE.Color(state.colors[0]);
  const m = state.material;
  if (m === 'clear') {
    const shell = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0xffffff).lerp(c0, .08), transmission: 1, thickness: .9, ior: 1.52, roughness: 0, metalness: 0, clearcoat: 1, clearcoatRoughness: .02, attenuationColor: c0, attenuationDistance: 6, specularIntensity: 1, envMapIntensity: 1.8, iridescence: .25, iridescenceIOR: 1.3, side: THREE.FrontSide });
    const paintLayer = new THREE.MeshPhysicalMaterial({ map, bumpMap: bump, bumpScale: 3, transparent: true, roughness: .55, metalness: 0, clearcoat: .3, clearcoatRoughness: .2, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, depthWrite: false, envMapIntensity: .5 });
    return { shell, paintLayer, textures };
  }
  const presets = {
    shiny: { metalness: .85, clearcoat: 1, clearcoatRoughness: .04, envMapIntensity: 1.5, metalnessMap: metalMap, bumpScale: 1.8 },
    metal: { metalness: 1, envMapIntensity: 1.25, metalnessMap: metalMap, bumpScale: 2.4 },
    wood: { metalness: 0, clearcoat: .15, clearcoatRoughness: .5, envMapIntensity: .6, bumpScale: 3 },
    textile: { metalness: 0, sheen: 1, sheenColor: new THREE.Color(0xffffff), sheenRoughness: .6, envMapIntensity: .45, bumpScale: 3.5 },
    ceramic: { metalness: 0, clearcoat: .9, clearcoatRoughness: .08, envMapIntensity: 1, bumpScale: 2 },
    plastic: { metalness: 0, clearcoat: .35, clearcoatRoughness: .25, envMapIntensity: .85, bumpScale: 2.5 }
  };
  const mat = new THREE.MeshPhysicalMaterial(Object.assign({ map, bumpMap: bump, roughness: 1, roughnessMap: roughMap }, presets[m]));
  if (mat.clearcoat > 0) mat.clearcoatMap = metalMap; // sugar sprinkles stay matte under the glossy coat
  return { solid: mat, textures };
}

/* ================= gold glitter: flakes that catch the light, brightest where the pointer is ================= */
const glitterMat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uSize: { value: .045 }, uScale: { value: 500 }, uSee: { value: 0 },
    uL1: { value: new THREE.Vector3(-4, 6, 7).normalize() }, uL2: { value: new THREE.Vector3(5, 1, 5).normalize() },
    uPL: { value: new THREE.Vector3(0, 0, 2.6) }, uPLi: { value: 0 } },
  vertexShader: `
    attribute vec3 aN; attribute vec4 aR;
    uniform float uSize, uScale, uTime, uSee, uPLi; uniform vec3 uL1, uL2, uPL;
    varying float vS; varying float vVis; varying float vPh;
    void main(){
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vec3 gn = normalize(mat3(modelMatrix) * aN);
      vec3 n = normalize(mat3(modelMatrix) * normalize(aN + aR.xyz * 0.9));
      vec3 V = normalize(cameraPosition - wp.xyz);
      float facing = dot(gn, V);
      vec3 R = reflect(-V, n);
      vec3 Lp = normalize(uPL - wp.xyz);
      float s = pow(max(dot(R, uL1), 0.0), 70.0) * 0.9 + pow(max(dot(R, uL2), 0.0), 70.0) * 0.5;
      s += uPLi * 2.6 * pow(max(dot(R, Lp), 0.0), 50.0);
      s += 0.25 * pow(0.5 + 0.5 * sin(uTime * 2.4 + aR.w * 61.0), 20.0);
      float vis = facing > 0.0 ? 1.0 : uSee * 0.5;
      vS = s * vis; vVis = vis; vPh = aR.w;
      vec4 mv = viewMatrix * wp;
      gl_Position = projectionMatrix * mv;
      gl_PointSize = vis < 0.01 ? 0.0 : uSize * (0.6 + min(s, 2.2) * 1.25) * uScale / -mv.z;
    }`,
  fragmentShader: `
    varying float vS; varying float vVis; varying float vPh;
    void main(){
      vec2 c = gl_PointCoord - 0.5; float d = length(c);
      float core = smoothstep(0.5, 0.0, d);
      float rays = max(smoothstep(0.06, 0.0, abs(c.x)) * smoothstep(0.5, 0.0, abs(c.y)), smoothstep(0.06, 0.0, abs(c.y)) * smoothstep(0.5, 0.0, abs(c.x)));
      vec3 gold = mix(vec3(0.85, 0.58, 0.2), vec3(1.0, 0.86, 0.52), fract(vPh * 7.0));
      float base = 0.16 * pow(core, 2.0) * vVis;
      float spark = vS * (pow(core, 3.0) * 1.2 + rays * 0.9 * step(0.4, vS));
      float a = clamp(base + spark, 0.0, 1.0);
      if (a < 0.01) discard;
      gl_FragColor = vec4(gold * base + mix(gold, vec3(1.0, 0.97, 0.88), 0.55) * spark, a);
    }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
});
function buildGlitter(geos, maskCanvas) {
  if (!state.glitter || state.glitAmount <= 0) return null;
  const N = Math.round(150 + state.glitAmount * 4200);
  const md = state.glitWhere === 'sprinkles' ? maskCanvas.getContext('2d').getImageData(0, 0, maskCanvas.width, maskCanvas.height) : null;
  const tris = []; let total = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), ab = new THREE.Vector3(), ac = new THREE.Vector3();
  geos.forEach(g => {
    const pos = g.attributes.position, idx = g.index; const cnt = idx ? idx.count : pos.count;
    for (let i = 0; i < cnt; i += 3) {
      const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
      a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2);
      const area = ab.subVectors(b, a).cross(ac.subVectors(c, a)).length() / 2; if (area <= 0) continue;
      total += area; tris.push([g, i0, i1, i2, total]);
    }
  });
  if (!tris.length) return null;
  const r = rng(hashState() ^ 0x9e37), P = [], Nn = [], R4 = [];
  const n0 = new THREE.Vector3(), n1 = new THREE.Vector3(), n2 = new THREE.Vector3(), p = new THREE.Vector3(), nn = new THREE.Vector3();
  let guard = 0;
  while (P.length / 3 < N && guard++ < N * 8) {
    const t = r() * total; let lo = 0, hi = tris.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (tris[mid][4] < t) lo = mid + 1; else hi = mid; }
    const [g, i0, i1, i2] = tris[lo]; const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
    let u = r(), v = r(); if (u + v > 1) { u = 1 - u; v = 1 - v; } const w = 1 - u - v;
    if (md && uv) {
      const tu = uv.getX(i0) * w + uv.getX(i1) * u + uv.getX(i2) * v, tv = uv.getY(i0) * w + uv.getY(i1) * u + uv.getY(i2) * v;
      const px = Math.min(md.width - 1, Math.max(0, Math.floor(((tu % 1) + 1) % 1 * md.width))), py = Math.min(md.height - 1, Math.max(0, Math.floor((1 - tv) * md.height)));
      if (md.data[(py * md.width + px) * 4] < 128) continue;
    }
    a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2);
    n0.fromBufferAttribute(nor, i0); n1.fromBufferAttribute(nor, i1); n2.fromBufferAttribute(nor, i2);
    p.set(0, 0, 0).addScaledVector(a, w).addScaledVector(b, u).addScaledVector(c, v);
    nn.set(0, 0, 0).addScaledVector(n0, w).addScaledVector(n1, u).addScaledVector(n2, v).normalize();
    p.addScaledVector(nn, .006);
    P.push(p.x, p.y, p.z); Nn.push(nn.x, nn.y, nn.z); R4.push(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1, r());
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute('aN', new THREE.Float32BufferAttribute(Nn, 3));
  geo.setAttribute('aR', new THREE.Float32BufferAttribute(R4, 4));
  glitterMat.uniforms.uSee.value = state.material === 'clear' ? 1 : 0;
  const pts = new THREE.Points(geo, glitterMat); pts.frustumCulled = false; pts.renderOrder = 5;
  return pts;
}

// gold glitter flakes along the hanging thread
(function threadGlitter() {
  const n = 260, P = [], N = [], R = [];
  for (let i = 0; i < n; i++) { const t = Math.random(), a = Math.random() * TAU; P.push(Math.cos(a) * .011, .05 - t * (RIBBON + .1), Math.sin(a) * .011); N.push(Math.cos(a), (Math.random() - .5) * .6, Math.sin(a)); R.push(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random()); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aN', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aR', new THREE.Float32BufferAttribute(R, 4));
  const pts = new THREE.Points(g, glitterMat); pts.frustumCulled = false; pts.scale.set(1, 1, 1); swing.add(pts);
})();

/* ================= assemble the toy ================= */
const capMat = new THREE.MeshPhysicalMaterial({ color: 0xd9c39a, metalness: 1, roughness: .28, envMapIntensity: 1.3 });
let disposables = [];
function rebuild() {
  disposables.forEach(d => d.dispose()); disposables = [];
  while (toy.children.length) toy.remove(toy.children[0]);
  const built = buildGeometry(state.shape);
  const geos = built.geos;
  const box = new THREE.Box3(); geos.forEach(g => { g.computeBoundingBox(); box.union(g.boundingBox); });
  const size = box.getSize(new THREE.Vector3()), centre = box.getCenter(new THREE.Vector3());
  const scl = Math.min(2.25 / size.y, 2.0 / size.x);
  const mtx = new THREE.Matrix4().makeScale(scl, scl, scl).multiply(new THREE.Matrix4().makeTranslation(state.shape === 'cane' ? 0 : -centre.x, -centre.y, -centre.z));
  geos.forEach(g => { g.applyMatrix4(mtx); g.computeBoundingBox(); g.computeBoundingSphere(); });
  const tmpMeshes = geos.map(g => new THREE.Mesh(g, new THREE.MeshBasicMaterial()));
  const rc = new THREE.Raycaster(new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, -1, 0));
  const hits = rc.intersectObjects(tmpMeshes); const topY = hits.length ? hits[0].point.y : box.max.y * scl;
  const capH = built.cap ? .24 : .14;
  const offset = -(topY + capH - .02);
  geos.forEach(g => g.translate(0, offset, 0));
  const cv = paint(built.spec);
  const mats = makeMaterials(cv); disposables.push(...mats.textures, ...geos);
  geos.forEach(g => {
    if (mats.solid) toy.add(new THREE.Mesh(g, mats.solid));
    else { const s = new THREE.Mesh(g, mats.shell); const p = new THREE.Mesh(g, mats.paintLayer); p.renderOrder = 2; toy.add(s, p); }
  });
  disposables.push(mats.solid || mats.shell, mats.paintLayer || { dispose() {} });
  const ringY = -.04;
  if (built.cap) {
    const capGeo = new THREE.CylinderGeometry(.12, .15, .18, 48, 1, true); const cp = capGeo.attributes.position; const t3 = new THREE.Vector3();
    for (let i = 0; i < cp.count; i++) { t3.fromBufferAttribute(cp, i); if (t3.y < 0) { const a = Math.atan2(t3.z, t3.x); const k = 1 + .08 * Math.max(0, Math.cos(a * 16)); t3.x *= k; t3.z *= k; t3.y -= .03 * Math.max(0, Math.cos(a * 16)); } cp.setXYZ(i, t3.x, t3.y, t3.z); }
    capGeo.computeVertexNormals();
    const cap = new THREE.Mesh(capGeo, capMat); cap.position.y = ringY - .13; toy.add(cap);
    const lid = new THREE.Mesh(new THREE.CircleGeometry(.12, 32), capMat); lid.rotation.x = -Math.PI / 2; lid.position.y = ringY - .04; toy.add(lid);
    disposables.push(capGeo, lid.geometry);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.065, .016, 12, 32), capMat); ring.position.y = ringY + .02; toy.add(ring); disposables.push(ring.geometry);
  const glit = buildGlitter(geos, cv.mask); if (glit) { toy.add(glit); disposables.push(glit.geometry); }
  tmpMeshes.forEach(m => m.material.dispose());
  pickables = toy.children.filter(o => o.isMesh);
  updateSpec();
}

/* ================= swing physics, pointer light, zoom ================= */
const phys = { a: 0, av: 0, b: 0, bv: 0, yaw: 0, yv: 0, drag: false, target: 0, lastX: 0 };
const view = { zoom: 1, zoomTarget: 1, base: 11 };
let pickables = [];
const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hitP = new THREE.Vector3();
function pointerWorld(x, y) {
  const rect = canvas.getBoundingClientRect(); ndc.set(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera); raycaster.ray.intersectPlane(plane, hitP); return hitP;
}
const pointers = new Map(); let pinch = null, downAt = null, hintGone = false;
function goneHint() { if (!hintGone) { hintGone = true; document.getElementById('hint').setAttribute('data-gone', ''); } }
function setZoom(z) { view.zoomTarget = Math.max(.34, Math.min(1.1, z)); }
canvas.addEventListener('pointerdown', e => {
  closePop();
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  canvas.setPointerCapture(e.pointerId);
  if (pointers.size === 2) { // start a pinch, drop any drag
    phys.drag = false; canvas.classList.remove('grabbing');
    const [p1, p2] = [...pointers.values()]; pinch = { d: Math.hypot(p1.x - p2.x, p1.y - p2.y), z: view.zoomTarget }; return;
  }
  const p = pointerWorld(e.clientX, e.clientY).clone();
  aimLight(p);
  const hit = raycaster.intersectObjects(pickables, false).length > 0;
  const centre = new THREE.Vector3(); toy.getWorldPosition(centre); centre.y -= 1.1;
  if (!hit && p.distanceTo(centre) > 1.5) return;
  phys.drag = true; phys.lastX = p.x; downAt = { t: performance.now(), x: e.clientX, y: e.clientY };
  canvas.classList.add('grabbing'); setTarget(p); goneHint();
});
canvas.addEventListener('pointermove', e => {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && pointers.size >= 2) { const [p1, p2] = [...pointers.values()]; setZoom(pinch.z * pinch.d / Math.max(20, Math.hypot(p1.x - p2.x, p1.y - p2.y))); goneHint(); return; }
  const p = pointerWorld(e.clientX, e.clientY); aimLight(p);
  if (!phys.drag) return;
  setTarget(p); phys.yv += (p.x - phys.lastX) * 2.2; phys.lastX = p.x;
});
function release(e) {
  pointers.delete(e.pointerId); if (pointers.size < 2) pinch = null;
  if (e.pointerType !== 'mouse' && pointers.size === 0) lightAim.on = 0;
  if (!phys.drag) return; phys.drag = false; canvas.classList.remove('grabbing');
  if (downAt && performance.now() - downAt.t < 250 && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 6) { phys.yv += 5; phys.av += .5; phys.bv += .3; }
  else phys.bv += (Math.random() - .5) * .6;
}
canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') lightAim.on = 0; });
canvas.addEventListener('wheel', e => { e.preventDefault(); setZoom(view.zoomTarget * Math.exp(e.deltaY * (e.ctrlKey ? .01 : .0015))); goneHint(); }, { passive: false });
function aimLight(p) { lightAim.x = p.x; lightAim.y = p.y; lightAim.on = 1; }
function setTarget(p) { phys.target = Math.max(-1.25, Math.min(1.25, Math.atan2(p.x - PIVOT.x, PIVOT.y - p.y))); }
canvas.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') { phys.av -= .7; e.preventDefault(); } if (e.key === 'ArrowRight') { phys.av += .7; e.preventDefault(); }
  if (e.key === ' ' || e.key === 'Enter') { phys.yv += 5; e.preventDefault(); }
  if (e.key === '+' || e.key === '=') setZoom(view.zoomTarget / 1.25); if (e.key === '-') setZoom(view.zoomTarget * 1.25);
});
document.getElementById('zin').addEventListener('click', () => setZoom(view.zoomTarget / 1.3));
document.getElementById('zout').addEventListener('click', () => setZoom(view.zoomTarget * 1.3));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function step(dt, t) {
  const g = 9.8 / (RIBBON + 1.2);
  if (phys.drag) phys.av += (90 * (phys.target - phys.a) - 13 * phys.av) * dt;
  else phys.av += (-g * Math.sin(phys.a) - .32 * phys.av + (reduceMotion ? 0 : .025 * Math.sin(t * .7))) * dt;
  phys.bv += (-g * Math.sin(phys.b) - .45 * phys.bv) * dt;
  phys.yv += (-1.1 * phys.yaw - .22 * phys.yv + (reduceMotion ? 0 : .04 * Math.sin(t * .45))) * dt;
  phys.a += phys.av * dt; phys.b += phys.bv * dt; phys.yaw += phys.yv * dt;
  swing.rotation.z = phys.a; swing.rotation.x = phys.b; toy.rotation.y = phys.yaw;
}

/* ================= loop & sizing ================= */
function resize() {
  const w = window.innerWidth, h = window.innerHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  view.base = w / h < .85 ? 11 + (.85 - w / h) * 9 : 11;
  camera.updateProjectionMatrix();
  glitterMat.uniforms.uScale.value = h * renderer.getPixelRatio() / 2 / Math.tan(camera.fov * Math.PI / 360);
}
window.addEventListener('resize', resize); resize();
const clock = new THREE.Clock(); let acc = 0;
const headProbe = new THREE.Vector3(), headEl = document.querySelector('.head'); let lastHeadTop = -1;
const toyCentre = new THREE.Vector3(), restTarget = new THREE.Vector3(0, .55, 0), lookAt = new THREE.Vector3(0, .55, 0);
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  acc += dt; while (acc > 1 / 240) { step(1 / 240, t); acc -= 1 / 240; }
  // zoom: move the camera in and, as it gets closer, follow the toy so it stays in view
  view.zoom += (view.zoomTarget - view.zoom) * Math.min(1, dt * 8);
  toy.localToWorld(toyCentre.set(0, -1.15, 0));
  const follow = Math.max(0, Math.min(1, (1 - view.zoom) / .6));
  const want = restTarget.clone().lerp(toyCentre, follow);
  lookAt.lerp(want, Math.min(1, dt * 10));
  camera.position.set(lookAt.x, lookAt.y, view.base * view.zoom);
  camera.lookAt(lookAt);
  // pointer light eases toward the pointer and fades in/out
  pointerLight.position.x += (lightAim.x - pointerLight.position.x) * Math.min(1, dt * 14);
  pointerLight.position.y += (lightAim.y - pointerLight.position.y) * Math.min(1, dt * 14);
  pointerLight.position.z = 1.4 + 1.6 * view.zoom;
  pointerLight.intensity += (lightAim.on * 26 * (.5 + .5 * view.zoom) - pointerLight.intensity) * Math.min(1, dt * 6);
  glitterMat.uniforms.uPL.value.copy(pointerLight.position);
  glitterMat.uniforms.uPLi.value = pointerLight.intensity / 26;
  glitterMat.uniforms.uTime.value = t;
  toy.getWorldPosition(toyCentre); shadow.position.x = toyCentre.x * 1.15 + .45; shadow.position.y = toyCentre.y - 1.25; shadow.scale.setScalar(1 + Math.abs(phys.a) * .2);
  // keep the heading just under the branch, whatever the screen shape or zoom
  headProbe.set(0, 1.7, 0).project(camera);
  const hy = (1 - headProbe.y) / 2 * window.innerHeight;
  const topPx = Math.max(16, Math.round(hy + 8));
  if (topPx !== lastHeadTop) { lastHeadTop = topPx; headEl.style.top = topPx + 'px'; headEl.style.opacity = topPx > window.innerHeight * .45 ? 0 : 1; }
  renderer.render(scene, camera);
});

