/* ================= renderer & scene ================= */
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.physicallyCorrectLights = true;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, .1, 60);
camera.position.set(0, .55, 11);
const camTarget = new THREE.Vector3(0, .55, 0);
camera.lookAt(camTarget);

// soft studio environment for reflections
(function buildEnv() {
  const env = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ color: 0x8a7f74, side: THREE.BackSide }));
  env.add(room);
  const box = (w, h, x, y, z, c) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m); };
  box(10, 6, -8, 8, 9, 0xffffff); box(6, 10, 10, 2, 6, 0xfff1dc); box(14, 4, 0, 12, -6, 0xf4efe8); box(5, 5, -10, -2, -6, 0xffe2b8); box(18, 6, 0, -12, 4, 0xd8cfc4);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(env, .035).texture;
})();
scene.add(new THREE.HemisphereLight(0xfff6ea, 0x8f8478, .9));
const key = new THREE.DirectionalLight(0xfff3e2, 2.0); key.position.set(-4, 6, 7); scene.add(key);
const fill = new THREE.DirectionalLight(0xf2f6ff, .8); fill.position.set(5, 1, 5); scene.add(fill);
const rim = new THREE.DirectionalLight(0xffffff, 1.2); rim.position.set(3, 4, -6); scene.add(rim);

// backdrop (an object, so clear glass can see through to it); repainted to match the page background in light and dark
const backdropCanvas = document.createElement('canvas'); backdropCanvas.width = backdropCanvas.height = 512;
const backdropTex = new THREE.CanvasTexture(backdropCanvas); backdropTex.encoding = THREE.sRGBEncoding;
(function () { const m = new THREE.Mesh(new THREE.PlaneGeometry(40, 26), new THREE.MeshBasicMaterial({ map: backdropTex, toneMapped: false })); m.position.set(0, .5, -5); scene.add(m); })();
let sceneIsDark = false;
function paintBackdrop(css) {
  const c = backdropCanvas.getContext('2d'); c.fillStyle = '#ffffff'; c.fillStyle = css; c.fillRect(0, 0, 512, 512);
  const [r, g, b] = c.getImageData(256, 256, 1, 1).data; sceneIsDark = (r * .299 + g * .587 + b * .114) < 110;
  const gr = c.createRadialGradient(256, 210, 30, 256, 260, 380); gr.addColorStop(0, sceneIsDark ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,0)'); gr.addColorStop(.7, 'rgba(0,0,0,0)'); gr.addColorStop(1, sceneIsDark ? 'rgba(0,0,0,.25)' : 'rgba(60,45,30,.06)');
  c.fillStyle = gr; c.fillRect(0, 0, 512, 512); backdropTex.needsUpdate = true;
  if (typeof shadow !== 'undefined') shadow.material.opacity = sceneIsDark ? .55 : .22;
  renderer.toneMappingExposure = sceneIsDark ? 1.12 : 1.0;
}
const shadowTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'); const g = c.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(60,45,35,.55)'); g.addColorStop(1, 'rgba(60,45,35,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(cv); })();
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, toneMapped: false, opacity: .22 }));
shadow.position.z = -4.9; scene.add(shadow);

// fir branch
const PIVOT = new THREE.Vector3(0, 3.02, 0.05);
function buildProceduralBranch() {   // used only if the branch model cannot load
  const g = new THREE.Group(); scene.add(g);
  const bark = new THREE.MeshStandardMaterial({ color: 0x5a3b26, roughness: .9 });
  const main = new THREE.CatmullRomCurve3([new THREE.Vector3(-7, 3.95, -.8), new THREE.Vector3(-3.5, 3.45, -.35), new THREE.Vector3(-.6, 3.12, 0), new THREE.Vector3(1.6, 3.08, .1), new THREE.Vector3(3.6, 3.3, -.2), new THREE.Vector3(5.2, 3.7, -.5)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(main, 120, .05, 8), bark));
  const r = rng(7), twigs = [main];
  for (let i = 0; i < 26; i++) {
    const t = .04 + i / 26 * .92, p = main.getPointAt(t), tan = main.getTangentAt(t);
    const side = i % 2 ? 1 : -1, len = .7 + r() * .8;
    const dir = new THREE.Vector3(tan.x * .6, (r() - .3) * .6 * side + .25, side * (.5 + r() * .6)).normalize();
    const end = p.clone().addScaledVector(dir, len), mid = p.clone().lerp(end, .5).add(new THREE.Vector3(0, .06, 0));
    const c = new THREE.CatmullRomCurve3([p, mid, end]); twigs.push(c);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 12, .018, 5), bark));
  }
  const needleGeo = new THREE.CylinderGeometry(.008, .016, 1, 4); needleGeo.translate(0, .5, 0);
  const needleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .65, metalness: 0 });
  const count = 5200, inst = new THREE.InstancedMesh(needleGeo, needleMat, count);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), col = new THREE.Color();
  const greens = [0x2c4433, 0x35523c, 0x26402f, 0x3d5e45, 0x2f4a36];
  let n = 0;
  twigs.forEach((curve, ci) => {
    const steps = ci === 0 ? 700 : 150;
    for (let k = 0; k < steps && n < count; k++) {
      const t = (k + r()) / steps, p = curve.getPointAt(t), tan = curve.getTangentAt(t);
      const around = r() * TAU, perp = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
      const up = new THREE.Vector3().crossVectors(perp, tan).normalize();
      const radial = perp.clone().multiplyScalar(Math.cos(around)).addScaledVector(up, Math.sin(around));
      const dir = radial.multiplyScalar(.85).addScaledVector(tan, .55).normalize();
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      const L = (ci === 0 ? .5 : .42) * (1 - .45 * Math.pow(t, 3)) * (.75 + r() * .45);
      s.set(1, L, 1); m4.compose(p, q, s); inst.setMatrixAt(n, m4);
      col.setHex(greens[(r() * greens.length) | 0]).convertSRGBToLinear(); inst.setColorAt(n, col); n++;
    }
  });
  inst.count = n; g.add(inst);
}


// a warm light that follows the pointer, so glitter and raised sprinkles catch it like the card's foil
const pointerLight = new THREE.PointLight(0xfff0d6, 0, 0, 2); pointerLight.position.set(0, 0, 2.6); scene.add(pointerLight);
const lightAim = { x: -.6, y: .9, on: 0 };

/* ---- snow: settles on the upward-facing parts of the needles and twigs ---- */
function addSnow(m, amount) {
  m.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSnowN; varying vec3 vSnowP;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvSnowN = normalize(mat3(modelMatrix) * objectNormal); vSnowP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vSnowN; varying vec3 vSnowP;\nfloat snowHash(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }')
      .replace('#include <map_fragment>', '#include <map_fragment>\n{ float up = vSnowN.y > 0.0 ? vSnowN.y : -vSnowN.y * 0.45; float n = snowHash(floor(vSnowP * 16.0)); float s = smoothstep(0.32, 0.78, up + (n - 0.5) * 0.4) * ' + amount.toFixed(2) + '; diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.96, 0.97, 1.0), s); }');
  };
  m.needsUpdate = true;
}
// little clumps of snow resting on top of the twigs
function addSnowClumps(wood, holder) {
  const pos = wood.geometry.attributes.position, nor = wood.geometry.attributes.normal; if (!nor) return;
  const nm = new THREE.Matrix3().getNormalMatrix(wood.matrixWorld), v = new THREE.Vector3(), n = new THREE.Vector3(), picks = [];
  for (let i = 0; i < pos.count; i += 2) { n.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize(); if (n.y < .72) continue; v.fromBufferAttribute(pos, i).applyMatrix4(wood.matrixWorld); if (Math.abs(v.x) > 5.2) continue; picks.push(v.clone()); }
  if (!picks.length) return;
  const r = rng(31), count = Math.min(260, picks.length);
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshPhysicalMaterial({ color: 0xf7f8fb, roughness: .85, sheen: .5, sheenColor: new THREE.Color(0xffffff), envMapIntensity: .6 }), count);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const p = picks[(r() * picks.length) | 0].clone(); const k = .035 + r() * .07; p.y += k * .45;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * TAU); s.set(k * (1.3 + r()), k * .55, k * (1 + r() * .6)); m4.compose(p, q, s); mesh.setMatrixAt(i, m4);
  }
  scene.add(mesh);
}

/* ---- the fir branch: a real 3D model ("Christmas Ornaments" by ed62, CC BY 4.0) with its ornaments removed ---- */
(function loadBranch() {
  if (!THREE.GLTFLoader) return buildProceduralBranch();
  fetch('branch.json').then(r => { if (!r.ok) throw new Error('branch'); return r.json(); }).then(j => {
    const bin = atob(j.glb), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    new THREE.GLTFLoader().parse(u8.buffer, '', gltf => {
      const model = gltf.scene; const holder = new THREE.Group(); holder.add(model); scene.add(holder);
      let wood = null;
      model.traverse(o => {
        if (!o.isMesh) return;
        const m = o.material, name = (m && m.name) || '';
        if (/leaves/.test(name)) { m.alphaTest = .5; m.transparent = false; m.side = THREE.DoubleSide; m.color = new THREE.Color(.62, .86, .66); m.roughness = .7; }
        if (/trunk/.test(name)) { m.color = new THREE.Color(.75, .68, .62); }
        if (/trunk/.test(name)) wood = o;
        if (m.map) m.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
        m.envMapIntensity = .55;
        if (/leaves|trunk/.test(name)) addSnow(m, /leaves/.test(name) ? .8 : .95);
      });
      // lay the branch across the top of the view: its longest side runs left to right
      holder.updateMatrixWorld(true);
      let box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3());
      if (size.z > size.x) holder.rotation.y = Math.PI / 2;
      holder.updateMatrixWorld(true); box = new THREE.Box3().setFromObject(holder); size = box.getSize(new THREE.Vector3());
      const k = 9.5 / Math.max(size.x, .001); holder.scale.setScalar(k); holder.updateMatrixWorld(true);
      box = new THREE.Box3().setFromObject(holder); const ctr = box.getCenter(new THREE.Vector3());
      holder.position.sub(ctr); holder.updateMatrixWorld(true);
      // find the twig nearest the middle and hang the ribbon from it
      let hang = null;
      if (wood) {
        const pos = wood.geometry.attributes.position, v = new THREE.Vector3(); let best = Infinity;
        for (let i = 0; i < pos.count; i += 3) { v.fromBufferAttribute(pos, i).applyMatrix4(wood.matrixWorld); const d = Math.abs(v.x) + Math.abs(v.z) * .6 + Math.max(0, -v.y) * .2; if (d < best) { best = d; hang = v.clone(); } }
      }
      if (!hang) hang = new THREE.Vector3(0, box.min.y + size.y * .35, 0);
      holder.position.add(PIVOT.clone().sub(hang)).add(new THREE.Vector3(0, .02, 0)); holder.updateMatrixWorld(true);
      holder.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      if (wood) addSnowClumps(wood, holder);
    }, buildProceduralBranch);
  }).catch(buildProceduralBranch);
})();
