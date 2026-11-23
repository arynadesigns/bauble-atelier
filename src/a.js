
/* ================= data ================= */
const SHAPES = [
  ['round', 'Round'], ['square', 'Square'], ['heart', 'Heart'], ['tree', 'Tree'], ['star', 'Star'],
  ['ginger', 'Gingerbread'], ['candy', 'Candy'], ['house', 'House'], ['snowflake', 'Snowflake'], ['drop', 'Teardrop'],
  ['pinecone', 'Pine cone'], ['reflector', 'Reflector'], ['icicle', 'Icicle'], ['bell', 'Bell'], ['cane', 'Hook stick']
];
const MATERIALS = [
  ['shiny', 'Shiny glass', 'radial-gradient(circle at 35% 30%, #f3c2cf, #a8384f 55%, #4a1020)'],
  ['clear', 'Clear glass', 'radial-gradient(circle at 35% 30%, #c9cfd1, #6f7678 55%, #3c4244)'],
  ['metal', 'Metal', 'linear-gradient(120deg, #6f6a56, #e9e4d0 40%, #8d866c 55%, #f1ecd8 75%, #77705a)'],
  ['wood', 'Wood', 'repeating-linear-gradient(-20deg, #c99766 0 4px, #a8774a 4px 8px)'],
  ['textile', 'Textile', 'repeating-linear-gradient(45deg, #b77d8a 0 2px, #6e4650 2px 4px)'],
  ['ceramic', 'Ceramic', 'radial-gradient(circle at 35% 30%, #fbfaf6, #dcd8cd 60%, #9d9787)'],
  ['plastic', 'Plastic', 'radial-gradient(circle at 35% 30%, #cfe2dc, #7aa49a 55%, #3e655c)']
];
const SPRINKLES = [
  ['star', 'Star'], ['heart', 'Heart'], ['dot', 'Dot'], ['triangle', 'Triangle'], ['flower', 'Flower'],
  ['moon', 'Moon'], ['diamond', 'Diamond'], ['square', 'Square'], ['cross', 'Cross'], ['jimmy', 'Rod']
];
const PALETTE = [
  ['#1E1E1E', '#7A7A7A', '#E2553A', '#F2A154', '#F7CF5E', '#7FCF7E', '#77D3C9', '#5AA9F8', '#7E57F0', '#E05BB5', '#FFFFFF'],
  ['#B5B5B5', '#DADADA', '#F6C8C2', '#FCE0C6', '#FDF0C6', '#D6F2D9', '#D3F6F2', '#CDE5FB', '#DCD3F8', '#F4CDE8'],
  ['#8E1B22', '#C2185B', '#B9862F', '#E9D8A6', '#1F4D3A', '#2A9D8F', '#1B2A4A', '#2E5D87', '#6E3B1F', '#D9D4CC', '#F5EFE6']
];
const SLOT_NAMES = ['Toy', '1', '2', '3', '4'];

const state = {
  shape: 'round', material: 'shiny',
  colors: ['#8E1B22', '#FFFFFF', '#F7CF5E', '#7FCF7E', '#F4CDE8'],
  sprinkles: new Set(['star', 'dot']),
  density: 0.5, glitter: true, glitAmount: 0.5, glitWhere: 'all',
  ink: { strokes: [], color: 'gold', width: 'bold' }
};

/* ================= random ================= */
function rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashState() { const s = JSON.stringify([state.shape, state.colors, [...state.sprinkles].sort(), state.density]); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/* ================= sprinkles: simple sugar shapes (unit paths, canvas y-down, about -1..1) ================= */
const SPRINKLE_SIZE = { dot: .5, disc: 1.0, cross: .7, star: .78, heart: .72, triangle: .68, flower: .78, moon: .72, square: .58, jimmy: .95, diamond: .66 };
function sprinklePath(key) {
  const p = new Path2D();
  switch (key) {
    case 'dot': case 'disc': p.arc(0, 0, 1, 0, TAU); break;
    case 'star': for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .5 : 1; i ? p.lineTo(Math.cos(a) * r, Math.sin(a) * r) : p.moveTo(Math.cos(a) * r, Math.sin(a) * r); } p.closePath(); break;
    case 'heart': p.moveTo(0, .9); p.bezierCurveTo(-1.15, .05, -.85, -1.05, 0, -.42); p.bezierCurveTo(.85, -1.05, 1.15, .05, 0, .9); break;
    case 'triangle': { const pts = [0, 1, 2].map(i => { const a = -Math.PI / 2 + i * TAU / 3; return [Math.cos(a), Math.sin(a) + .15]; }); const rr = .22;
      for (let i = 0; i < 3; i++) { const [x0, y0] = pts[(i + 2) % 3], [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % 3]; const ax = x1 + (x0 - x1) * rr, ay = y1 + (y0 - y1) * rr, bx = x1 + (x2 - x1) * rr, by = y1 + (y2 - y1) * rr; i ? p.lineTo(ax, ay) : p.moveTo(ax, ay); p.quadraticCurveTo(x1, y1, bx, by); } p.closePath(); break; }
    case 'flower': for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5, x = Math.cos(a) * .52, y = Math.sin(a) * .52; p.moveTo(x + .44, y); p.arc(x, y, .44, 0, TAU); } p.moveTo(.45, 0); p.arc(0, 0, .45, 0, TAU); break;
    case 'moon': p.arc(0, 0, .95, Math.PI * .35, Math.PI * 1.65, false); p.arc(.38, 0, .74, Math.PI * 1.55, Math.PI * .45, true); p.closePath(); break;
    case 'square': p.roundRect ? p.roundRect(-.85, -.85, 1.7, 1.7, .25) : p.rect(-.85, -.85, 1.7, 1.7); break;
    case 'jimmy': p.moveTo(-.85, -.2); p.lineTo(.85, -.2); p.arc(.85, 0, .2, -Math.PI / 2, Math.PI / 2); p.lineTo(-.85, .2); p.arc(-.85, 0, .2, Math.PI / 2, Math.PI * 1.5); p.closePath(); break;
    case 'cross': { const a = .3, b = 1, r = .12; p.moveTo(-a + r, -b); p.lineTo(a - r, -b); p.quadraticCurveTo(a, -b, a, -b + r); p.lineTo(a, -a); p.lineTo(b - r, -a); p.quadraticCurveTo(b, -a, b, -a + r); p.lineTo(b, a - r); p.quadraticCurveTo(b, a, b - r, a); p.lineTo(a, a); p.lineTo(a, b - r); p.quadraticCurveTo(a, b, a - r, b); p.lineTo(-a + r, b); p.quadraticCurveTo(-a, b, -a, b - r); p.lineTo(-a, a); p.lineTo(-b + r, a); p.quadraticCurveTo(-b, a, -b, a - r); p.lineTo(-b, -a + r); p.quadraticCurveTo(-b, -a, -b + r, -a); p.lineTo(-a, -a); p.lineTo(-a, -b + r); p.quadraticCurveTo(-a, -b, -a + r, -b); p.closePath(); break; }
    case 'diamond': p.moveTo(0, -1); p.lineTo(.62, 0); p.lineTo(0, 1); p.lineTo(-.62, 0); p.closePath(); break;
  }
  return p;
}
