/* ================= the swinging toy ================= */
const swing = new THREE.Group(); swing.position.copy(PIVOT); scene.add(swing);
const RIBBON = 1.55;
// a thin golden thread: two fine strands twisted together, with a little loop over the twig
const threadMat = new THREE.MeshPhysicalMaterial({ color: 0xe6bf62, metalness: 1, roughness: .22, clearcoat: .6, clearcoatRoughness: .1, envMapIntensity: 1.6 });
const ribbon = new THREE.Group(); swing.add(ribbon); ribbon.material = threadMat;
for (const ph of [0, Math.PI]) {
  const pts = []; for (let i = 0; i <= 120; i++) { const t = i / 120, a = ph + t * 70; pts.push(new THREE.Vector3(Math.cos(a) * .0065, .05 - t * (RIBBON + .1), Math.sin(a) * .0065)); }
  ribbon.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, .0055, 6, false), threadMat));
}
const knot = new THREE.Mesh(new THREE.TorusGeometry(.045, .007, 8, 28), threadMat); knot.position.set(0, .02, 0); knot.rotation.y = Math.PI / 2; swing.add(knot);
const holder = new THREE.Group(); holder.position.y = -RIBBON; swing.add(holder);
const toy = new THREE.Group(); holder.add(toy);

