
/* ================= UI: Arc toolbar with upward dropdown menus, Arc slider and Arc colour picker (ported to plain JS) ================= */
const $ = id => document.getElementById(id);
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function el(tag, cls, attrs = {}, kids = []) {
  const n = document.createElement(tag); if (cls) n.className = cls;
  for (const k in attrs) { if (attrs[k] === false || attrs[k] == null) continue; n.setAttribute(k, attrs[k] === true ? '' : attrs[k]); }
  (Array.isArray(kids) ? kids : [kids]).forEach(c => c != null && n.append(c)); return n;
}
const svg = (inner, size = 16, extra = '') => { const s = document.createElement('span'); s.style.display = 'inline-flex'; s.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${inner}</svg>`; return s; };
const ICON = {
  chevron: () => svg('<path d="m6 15 6-6 6 6"/>', 15),
  check: () => svg('<path d="M20 6 9 17l-5-5"/>', 15),
  close: () => svg('<path d="M18 6 6 18M6 6l12 12"/>', 16),
  pipette: () => svg('<path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z"/>', 16),
  plus: () => svg('<path d="M12 5v14M5 12h14"/>', 15),
  shape: () => svg('<rect x="9.5" y="2" width="5" height="3.5" rx="1"/><circle cx="12" cy="14" r="7.5"/>', 16),
  material: () => svg('<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>', 16),
  sprinkles: () => svg('<path d="m8 2.5 1.4 2.9 3.1.4-2.3 2.2.6 3.1L8 9.6l-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z"/><path d="M17 5.5 19.5 4"/><path d="M8 18.5 6 20.5"/><circle cx="17.5" cy="17" r="2.5"/>', 16),
  glitter: () => svg('<path d="M9.94 14.06A2 2 0 0 0 8.5 12.62L2.37 11.04a.5.5 0 0 1 0-.96L8.5 8.5a2 2 0 0 0 1.44-1.44l1.58-6.14a.5.5 0 0 1 .96 0L14.06 7.06A2 2 0 0 0 15.5 8.5l6.13 1.58a.5.5 0 0 1 0 .96L15.5 12.62a2 2 0 0 0-1.44 1.44l-1.58 6.13a.5.5 0 0 1-.96 0z"/><path d="M20 2v4M22 4h-4"/>', 16, 'style="color: var(--gold)"')
};
const cssColor = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/* ---------- a critically damped spring (Arc's "morph": visualDuration .3, no bounce) ---------- */
function spring(get, set, target, vd = .3, done) {
  const root = TAU / (vd * 1.2), k = root * root, c = 2 * root; let v = 0, last = performance.now(), id;
  if (reducedMotion()) { set(target); done && done(); return () => {}; }
  const tick = now => { const dt = Math.min(.032, (now - last) / 1000); last = now; const x = get(); const a = -k * (x - target) - c * v; v += a * dt; const nx = x + v * dt; set(nx);
    if (Math.abs(nx - target) < .002 && Math.abs(v) < .02) { set(target); done && done(); return; } id = requestAnimationFrame(tick); };
  id = requestAnimationFrame(tick); return () => cancelAnimationFrame(id);
}

/* ---------- rolling digits (Arc slider readout) ---------- */
function rollingNumber() {
  const root = el('span', 'roll', { 'aria-hidden': 'true' }); let shape = '';
  return { root, set(text) {
    const key = text.replace(/\d/g, '0');
    if (key !== shape) { shape = key; root.innerHTML = ''; [...text].forEach(ch => { if (/\d/.test(ch)) { const col = el('span', 'col'); const reel = el('span'); for (let d = 0; d < 10; d++) reel.append(el('b', '', {}, String(d))); col.append(reel); root.append(col); } else root.append(el('span', '', {}, ch)); }); }
    let i = 0; [...text].forEach(ch => { if (/\d/.test(ch)) { const reel = root.querySelectorAll('.col > span')[i++]; reel.style.transform = `translateY(${-Number(ch) * 1.4}em)`; } });
  } };
}

/* ---------- Arc slider ---------- */
function Slider({ label, value, min = 0, max = 100, step = 1, format = v => String(v), fill, onChange }) {
  const span = max - min, largeStep = Math.max(step, Math.round(span / 10));
  const id = 'sl-' + Math.random().toString(36).slice(2, 8);
  const root = el('div', 'slider'); if (fill) root.style.setProperty('--slider-fill', fill);
  const readout = rollingNumber();
  const head = el('div', 'sl-head', {}, [el('span', 'sl-label', { id }, label), el('span', 'readout', {}, readout.root)]);
  const fillEl = el('div', 'fill'), track = el('div', 'track', {}, fillEl);
  const thumb = el('div', 'thumb', { role: 'slider', tabindex: '0', 'aria-labelledby': id, 'aria-valuemin': min, 'aria-valuemax': max, 'aria-orientation': 'horizontal', 'data-thumb': '' });
  const bubble = el('div', 'bubble', { 'aria-hidden': 'true' });
  const thumbs = el('div', 'thumbs', {}, [thumb, bubble]);
  const control = el('div', 'control', {}, [track, thumbs]);
  root.append(head, control);
  let val = value, vis = (value - min) / span * 100, stop = () => {};
  const snap = x => Math.min(max, Math.max(min, Math.round((x - min) / step) * step + min));
  const draw = () => {
    const p = Math.max(0, Math.min(100, vis));
    fillEl.style.clipPath = `inset(0 ${100 - p}% 0 0)`; thumb.style.left = p + '%';
    const w = thumbs.clientWidth || 1, bw = bubble.offsetWidth || 40, x = p / 100 * w;
    bubble.style.left = Math.max(bw / 2 - 11, Math.min(w - bw / 2 + 11, x)) + 'px';
  };
  const setVal = (v, emit) => {
    if (v === val && !emit) return; val = v; const t = format(v);
    readout.set(t); bubble.textContent = t; thumb.setAttribute('aria-valuenow', v); thumb.setAttribute('aria-valuetext', t);
    if (emit) onChange && onChange(v);
  };
  setVal(value); val = value; readout.set(format(value)); bubble.textContent = format(value);
  requestAnimationFrame(draw);
  const pctAt = e => { const r = track.getBoundingClientRect(); return (e.clientX - r.left) / (r.width || 1) * 100; };
  let drag = null;
  control.addEventListener('pointerdown', e => {
    if (e.button !== 0) return; e.preventDefault(); stop(); control.setPointerCapture(e.pointerId); thumb.focus({ preventScroll: true });
    root.setAttribute('data-dragging', ''); drag = { samples: [{ p: pctAt(e), t: e.timeStamp }] };
    const p = pctAt(e); stop = spring(() => vis, x => { vis = x; draw(); }, Math.max(0, Math.min(100, p)), .2); setVal(snap(min + p / 100 * span), true);
  });
  control.addEventListener('pointermove', e => {
    if (!drag) return; stop(); const p = pctAt(e); drag.samples.push({ p, t: e.timeStamp }); if (drag.samples.length > 5) drag.samples.shift();
    vis = Math.max(-4, Math.min(104, p)); draw(); setVal(snap(min + p / 100 * span), true);
  });
  const end = e => {
    if (!drag) return; const s = drag.samples, a = s[0], b = s[s.length - 1]; drag = null; root.removeAttribute('data-dragging');
    const dt = (b.t - a.t) / 1000, vel = dt > .008 && e.timeStamp - b.t < 60 ? (b.p - a.p) / dt : 0;
    const target = snap(min + Math.max(0, Math.min(100, vis + vel * .099)) / 100 * span);   // a little momentum, then snap to a step
    setVal(target, true); stop = spring(() => vis, x => { vis = x; draw(); }, (target - min) / span * 100, .3);
  };
  control.addEventListener('pointerup', end); control.addEventListener('pointercancel', end);
  thumb.addEventListener('keydown', e => {
    let v = val; const big = e.shiftKey ? largeStep : step;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v += big; else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v -= big;
    else if (e.key === 'PageUp') v += largeStep; else if (e.key === 'PageDown') v -= largeStep; else if (e.key === 'Home') v = min; else if (e.key === 'End') v = max; else return;
    e.preventDefault(); e.stopPropagation(); v = snap(v); setVal(v, true); stop(); stop = spring(() => vis, x => { vis = x; draw(); }, (v - min) / span * 100, .2);
  });
  return { root, set(v) { setVal(v); vis = (v - min) / span * 100; draw(); } };
}

/* ---------- colour maths (HSV, RGB, HSL, OKLCH; no library, like Arc's picker) ---------- */
const hexToRgb3 = h => { const n = parseInt(h.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgbToHex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
function hsvToRgb(h, s, v) { const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); }; return [f(5) * 255, f(3) * 255, f(1) * 255]; }
function rgbToHsv(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) { h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return [h, mx ? d / mx : 0, mx]; }
function rgbToHsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; let h = 0, s = 0; if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return [h, s, l]; }
function hslToRgb(h, s, l) { const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0) * 255, f(8) * 255, f(4) * 255]; }
const lin = c => { c /= 255; return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); };
const delin = c => 255 * (c <= .0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - .055);
function rgbToOklch(r, g, b) {
  const R = lin(r), G = lin(g), B = lin(b);
  const l = Math.cbrt(.4122214708 * R + .5363325363 * G + .0514459929 * B), m = Math.cbrt(.2119034982 * R + .6806995451 * G + .1073969566 * B), s = Math.cbrt(.0883024619 * R + .2817188376 * G + .6299787005 * B);
  const L = .2104542553 * l + .793617785 * m - .0040720468 * s, A = 1.9779984951 * l - 2.428592205 * m + .4505937099 * s, Bb = .0259040371 * l + .7827717662 * m - .808675766 * s;
  let h = Math.atan2(Bb, A) * 180 / Math.PI; if (h < 0) h += 360; return [L, Math.hypot(A, Bb), h];
}
function oklchToRgb(L, C, h) {
  const A = C * Math.cos(h * Math.PI / 180), B = C * Math.sin(h * Math.PI / 180);
  const l = (L + .3963377774 * A + .2158037573 * B) ** 3, m = (L - .1055613458 * A - .0638541728 * B) ** 3, s = (L - .0894841775 * A - 1.291485548 * B) ** 3;
  return [delin(4.0767416621 * l - 3.3077115913 * m + .2309699292 * s), delin(-1.2684380046 * l + 2.6097574011 * m - .3413193965 * s), delin(-.0041960863 * l - .7034186147 * m + 1.707614701 * s)];
}
function parseColor(text) {
  const t = text.trim().toLowerCase(); let m;
  if ((m = t.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/))) { let x = m[1]; if (x.length === 3) x = [...x].map(c => c + c).join(''); return hexToRgb3('#' + x); }
  const nums = s => s.split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
  if ((m = t.match(/^rgba?\((.+)\)$/))) { const [r, g, b] = nums(m[1]); if ([r, g, b].every(Number.isFinite)) return [r, g, b]; }
  if ((m = t.match(/^hsla?\((.+)\)$/))) { const [h, s, l] = nums(m[1].replace(/%/g, '')); if ([h, s, l].every(Number.isFinite)) return hslToRgb(h, s / 100, l / 100); }
  if ((m = t.match(/^oklch\((.+)\)$/))) { let [L, C, h] = nums(m[1]); if (/%/.test(m[1].split(/[\s,]+/)[0])) L /= 100; if ([L, C, h].every(Number.isFinite)) return oklchToRgb(L, C, h); }
  return null;
}
function formatColor(rgb, fmt) {
  const [r, g, b] = rgb;
  if (fmt === 'rgb') return `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;
  if (fmt === 'hsl') { const [h, s, l] = rgbToHsl(r, g, b); return `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`; }
  if (fmt === 'oklch') { const [L, C, h] = rgbToOklch(r, g, b); return `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${Math.round(h)})`; }
  return rgbToHex(r, g, b);
}

/* ---------- Arc colour picker: a swatch that grows into the picker (here it grows upward, out of the swatch) ---------- */
const PRESET_SWATCHES = ['#8E1B22', '#C99A3C', '#1F4D3A', '#1B2A4A', '#FFFFFF', '#F4CDE8'];
let openPicker = null;
function ColorPicker({ name, value, onChange }) {
  const chipFill = el('span'); const chip = el('span', 'chip', { 'aria-hidden': 'true' }, chipFill);
  const hexText = el('span', 'cp-hex');
  const trigger = el('button', 'cp-trigger', { type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false' }, [chip, el('span', 'cp-text', {}, [el('span', 'cp-name', {}, name), hexText])]);
  let hex = value.toUpperCase();
  const paintTrigger = () => { chipFill.style.background = hex; hexText.textContent = hex; trigger.setAttribute('aria-label', `${name} colour, ${hex}`); };
  paintTrigger();
  trigger.addEventListener('click', e => { e.stopPropagation(); openPicker && openPicker.trigger === trigger ? openPicker.close() : open(); });
  function open() {
    openPicker && openPicker.close(true);
    let [h, s, v] = rgbToHsv(...hexToRgb3(hex)); let fmt = 'hex';
    const floatEl = el('div', 'cp-float', { role: 'dialog', 'aria-label': `${name} colour` });
    const panel = el('div', 'cp-panel'); floatEl.append(panel);
    // head sits at the bottom, exactly where the swatch was, so the panel visibly grows out of it
    const hChipFill = el('span'), hChip = el('span', 'chip', { 'aria-hidden': 'true' }, hChipFill), hHex = el('span', 'cp-hex');
    const actions = el('div', 'cp-actions');
    if (window.EyeDropper) { const eye = el('button', 'icon-btn', { type: 'button', 'aria-label': 'Pick a colour from the screen' }, ICON.pipette()); eye.addEventListener('click', async () => { try { const r = await new window.EyeDropper().open(); setRgb(hexToRgb3(r.sRGBHex), true); } catch (err) {} }); actions.append(eye); }
    const closeBtn = el('button', 'icon-btn', { type: 'button', 'aria-label': 'Close' }, ICON.close()); closeBtn.addEventListener('click', () => api.close()); actions.append(closeBtn);
    const head = el('div', 'cp-head', {}, [hChip, el('span', 'cp-text', {}, [el('span', 'cp-name', {}, name), hHex]), actions]);
    const areaThumb = el('div', 'cp-thumb', { role: 'slider', tabindex: '0', 'aria-roledescription': '2D slider', 'aria-label': 'Saturation and brightness' });
    const area = el('div', 'cp-area', {}, areaThumb);
    const hueThumb = el('div', 'cp-thumb', { role: 'slider', tabindex: '0', 'aria-label': 'Hue', 'aria-valuemin': '0', 'aria-valuemax': '360' });
    const hue = el('div', 'cp-slider cp-hue', {}, hueThumb);
    const formatBtn = el('button', 'cp-format', { type: 'button', 'aria-label': 'Change colour format' }, 'HEX');
    const input = el('input', 'cp-input', { type: 'text', spellcheck: 'false', autocomplete: 'off', 'aria-label': `${name} colour value` });
    const field = el('div', 'cp-field', {}, [formatBtn, input]);
    const swatchList = el('div', 'cp-swatches', { role: 'listbox', 'aria-label': 'Saved colours', 'aria-orientation': 'horizontal' });
    const body = el('div', 'cp-body', {}, [area, hue, field, swatchList]);
    body.style.padding = '14px 14px 4px'; panel.style.paddingBottom = '0'; panel.append(body, head);
    const render = (typed) => {
      const rgb = hsvToRgb(h, s, v); hex = rgbToHex(...rgb);
      panel.style.setProperty('--picker-hue', `hsl(${h} 100% 50%)`); panel.style.setProperty('--picker-opaque', hex);
      areaThumb.style.left = s * 100 + '%'; areaThumb.style.top = (1 - v) * 100 + '%';
      areaThumb.setAttribute('aria-valuetext', `Saturation ${Math.round(s * 100)}%, brightness ${Math.round(v * 100)}%`);
      hueThumb.style.left = h / 360 * 100 + '%'; hueThumb.style.setProperty('--thumb-fill', `hsl(${h} 100% 50%)`); hueThumb.setAttribute('aria-valuenow', Math.round(h)); hueThumb.setAttribute('aria-valuetext', `${Math.round(h)} degrees`);
      hChipFill.style.background = hex; hHex.textContent = hex;
      if (!typed) input.value = formatColor(rgb, fmt);
      swatchList.querySelectorAll('.cp-swatch').forEach(b => b.setAttribute('aria-selected', String(b.dataset.c === hex)));
      paintTrigger(); onChange(hex);
    };
    const setRgb = (rgb, from) => { const n = rgbToHsv(...rgb); if (n[1] > 0) h = n[0]; s = n[1]; v = n[2]; render(from === 'typed'); };
    const drag2d = (elm, fn) => { elm.addEventListener('pointerdown', e => { e.preventDefault(); elm.setPointerCapture(e.pointerId); elm.setAttribute('data-active', ''); fn(e); const mv = ev => fn(ev), up = () => { elm.removeAttribute('data-active'); elm.removeEventListener('pointermove', mv); elm.removeEventListener('pointerup', up); }; elm.addEventListener('pointermove', mv); elm.addEventListener('pointerup', up); }); };
    drag2d(area, e => { const r = area.getBoundingClientRect(); s = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); v = 1 - Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)); render(); areaThumb.focus({ preventScroll: true }); });
    drag2d(hue, e => { const r = hue.getBoundingClientRect(); h = Math.max(0, Math.min(359.9, (e.clientX - r.left) / r.width * 360)); render(); hueThumb.focus({ preventScroll: true }); });
    areaThumb.addEventListener('keydown', e => { const d = e.shiftKey ? .1 : .01; if (e.key === 'ArrowLeft') s -= d; else if (e.key === 'ArrowRight') s += d; else if (e.key === 'ArrowUp') v += d; else if (e.key === 'ArrowDown') v -= d; else return; e.preventDefault(); e.stopPropagation(); s = Math.max(0, Math.min(1, s)); v = Math.max(0, Math.min(1, v)); render(); });
    hueThumb.addEventListener('keydown', e => { const d = e.shiftKey || e.key.startsWith('Page') ? 10 : 1; if (e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'PageDown') h -= d; else if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'PageUp') h += d; else if (e.key === 'Home') h = 0; else if (e.key === 'End') h = 359; else return; e.preventDefault(); e.stopPropagation(); h = (h + 360) % 360; render(); });
    const FORMATS = ['hex', 'rgb', 'hsl', 'oklch'];
    formatBtn.addEventListener('click', () => { fmt = FORMATS[(FORMATS.indexOf(fmt) + 1) % FORMATS.length]; formatBtn.textContent = fmt.toUpperCase(); render(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); const rgb = parseColor(input.value); if (rgb) { field.removeAttribute('data-invalid'); setRgb(rgb); } else { field.removeAttribute('data-invalid'); void field.offsetWidth; field.setAttribute('data-invalid', ''); } }
      if (e.key === 'Escape' && input.value !== formatColor(hsvToRgb(h, s, v), fmt)) { e.stopPropagation(); input.value = formatColor(hsvToRgb(h, s, v), fmt); field.removeAttribute('data-invalid'); }
    });
    input.addEventListener('input', () => field.removeAttribute('data-invalid'));
    const drawSwatches = () => {
      swatchList.innerHTML = '';
      const add = el('button', 'icon-btn', { type: 'button', 'aria-label': 'Save this colour' }, ICON.plus()); add.style.cssText = 'width:30px;height:30px;border:1px dashed var(--border-strong);border-radius:50%';
      add.addEventListener('click', () => { if (!savedSwatches.includes(hex)) { savedSwatches.unshift(hex); savedSwatches.length = Math.min(savedSwatches.length, 6); } drawSwatches(); render(); });
      swatchList.append(add);
      savedSwatches.forEach(c => { const f = el('span'); f.style.background = c; const b = el('button', 'cp-swatch', { type: 'button', role: 'option', 'data-c': c, 'aria-label': c, 'aria-selected': String(c === hex) }, el('span', 'chip', {}, f)); b.addEventListener('click', () => setRgb(hexToRgb3(c))); swatchList.append(b); });
    };
    drawSwatches();
    document.body.append(floatEl); render();
    // place: bottom-left corner on the swatch, kept inside the screen
    const tr = trigger.getBoundingClientRect(), pw = panel.offsetWidth, ph = panel.offsetHeight;
    const left = Math.max(12, Math.min(window.innerWidth - pw - 12, tr.left - 1)), bottom = Math.max(12, window.innerHeight - tr.bottom - 1);
    floatEl.style.left = left + 'px'; floatEl.style.bottom = bottom + 'px';
    const ox = tr.left - 1 - left, startClip = `inset(${ph - tr.height - 2}px ${Math.max(0, pw - tr.width - 2 - ox)}px 0px ${ox}px round 22px)`;
    panel.style.transition = 'none'; panel.style.clipPath = startClip; void panel.offsetWidth;
    panel.style.transition = ''; panel.style.clipPath = 'inset(0 0 0 0 round 20px)';
    trigger.setAttribute('aria-expanded', 'true'); trigger.style.visibility = 'hidden';
    setTimeout(() => areaThumb.focus({ preventScroll: true }), 30);
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); api.close(); } };
    floatEl.addEventListener('keydown', onKey);
    const api = { trigger, floatEl, close(instant) {
      if (openPicker !== api) return; openPicker = null; trigger.setAttribute('aria-expanded', 'false');
      const done = () => { floatEl.remove(); trigger.style.visibility = ''; };
      if (instant || reducedMotion()) { done(); } else { panel.style.clipPath = startClip; floatEl.inert = true; setTimeout(done, 220); }
      if (!instant) trigger.focus({ preventScroll: true });
    } };
    openPicker = api;
  }
  return { root: trigger, set(c) { hex = c.toUpperCase(); paintTrigger(); } };
}
const savedSwatches = PRESET_SWATCHES.slice();

/* ---------- Arc dropdown menu (opens upward from its trigger, one highlight glides between items) ---------- */
let openMenu = null;
function Trigger({ icon, aria, build, label }) {
  const labelOuter = el('span', 'label'); const labelInner = el('span', 'in');
  labelOuter.append(labelInner);
  const btn = el('button', 'trigger', { type: 'button', 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'data-state': 'closed', 'aria-label': aria, title: aria },
    [el('span', 'triggerIcon', { 'aria-hidden': 'true' }, icon), labelOuter, el('span', 'chevron', { 'aria-hidden': 'true' }, ICON.chevron())]);
  let current = null;
  const setLabel = text => {
    if (text === current) return; const first = current === null; current = text;
    const from = labelOuter.offsetWidth;
    const next = el('span', first ? '' : 'in', {}, text); labelOuter.innerHTML = ''; labelOuter.append(next);
    if (first || reducedMotion() || !from) { labelOuter.style.width = ''; return; }
    // the width springs from the old text to the new, then goes back to auto so late font loads never clip it
    labelOuter.style.width = from + 'px'; const to = next.scrollWidth;
    requestAnimationFrame(() => { labelOuter.style.width = to + 'px'; });
    clearTimeout(labelOuter._t); labelOuter._t = setTimeout(() => { labelOuter.style.width = ''; }, 360);
  };

  btn.addEventListener('click', e => { e.stopPropagation(); if (openMenu && openMenu.btn === btn) closeMenu(); else showMenu(btn, build, e.detail === 0); });
  btn.addEventListener('keydown', e => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); showMenu(btn, build, true); } });
  return { btn, setLabel };
}
function showMenu(btn, build, keyboard) {
  closeMenu(true);
  const menu = el('div', 'menu', { tabindex: '-1', 'data-state': 'opening', 'data-side': 'top' });
  const hl = el('span', 'highlight', { 'aria-hidden': 'true' }); menu.append(hl);
  const ctx = { menu, close: () => closeMenu(), items: [] };
  build(ctx);
  document.body.append(menu); document.body.setAttribute('data-menu', '');
  const r = btn.getBoundingClientRect(), w = menu.offsetWidth;
  const left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + r.width / 2 - w / 2));
  menu.style.left = left + 'px'; menu.style.bottom = (window.innerHeight - r.top + 6) + 'px';
  menu.style.transformOrigin = `${r.left + r.width / 2 - left}px 100%`;
  [...menu.querySelectorAll('.item')].forEach((it, i) => it.style.setProperty('--i', i));
  btn.setAttribute('data-state', 'open'); btn.setAttribute('aria-expanded', 'true');
  requestAnimationFrame(() => requestAnimationFrame(() => menu.setAttribute('data-state', 'open')));
  // highlight: glides for the pointer, jumps for the keyboard
  let pointer = false, shown = false, clearT = 0;
  const place = (item, glide) => { clearTimeout(clearT); glide ? hl.setAttribute('data-glide', '') : hl.removeAttribute('data-glide'); const grid = item.classList.contains('tile'); hl.style.left = grid ? '0px' : ''; hl.style.right = grid ? 'auto' : ''; hl.style.width = grid ? item.offsetWidth + 'px' : ''; hl.style.transform = `translate(${grid ? item.offsetLeft : 0}px, ${item.offsetTop}px)`; hl.style.height = item.offsetHeight + 'px'; hl.style.opacity = 1; shown = true; };
  menu.addEventListener('pointermove', e => { pointer = true; const it = e.target.closest('.item'); if (it && document.activeElement !== it) it.focus({ preventScroll: true }); });
  menu.addEventListener('keydown', () => { pointer = false; }, true);
  menu.addEventListener('focusin', e => { const it = e.target.closest('.item'); if (it) place(it, pointer && shown); else { clearT = setTimeout(() => { hl.style.opacity = 0; shown = false; }, pointer ? 70 : 0); } });
  menu.addEventListener('pointerleave', () => { if (menu.contains(document.activeElement) && document.activeElement.classList.contains('item')) menu.focus({ preventScroll: true }); });
  menu.addEventListener('keydown', e => {
    const items = [...menu.querySelectorAll('.item:not([aria-disabled="true"])')]; const i = items.indexOf(document.activeElement);
    const inGrid = document.activeElement && document.activeElement.classList.contains('tile');
    const cols = inGrid ? Number(document.activeElement.parentElement.dataset.cols || 5) : 1;
    if (inGrid && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); const tiles = [...document.activeElement.parentElement.children]; const j = tiles.indexOf(document.activeElement); tiles[(j + (e.key === 'ArrowRight' ? 1 : -1) + tiles.length) % tiles.length].focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); items[Math.min(items.length - 1, i + cols) === i ? 0 : Math.min(items.length - 1, i + cols)]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[i - cols < 0 ? (i <= 0 ? items.length - 1 : 0) : i - cols]?.focus(); }
    else if (e.key === 'Home') { e.preventDefault(); items[0]?.focus(); }
    else if (e.key === 'End') { e.preventDefault(); items[items.length - 1]?.focus(); }
    else if (e.key === 'Escape') { e.preventDefault(); closeMenu(); }
    else if (e.key === 'Tab') { closeMenu(true); }
    else if (e.key.length === 1 && /\S/.test(e.key) && e.target.classList.contains('item')) { const k = e.key.toLowerCase(); const start = Math.max(i, 0); for (let n = 1; n <= items.length; n++) { const it = items[(start + n) % items.length]; if ((it.getAttribute('aria-label') || it.textContent).trim().toLowerCase().startsWith(k)) { it.focus(); break; } } }
  });
  openMenu = { btn, menu };
  const first = menu.querySelector('.item[aria-checked="true"]') || menu.querySelector('.item, [role="slider"], .cp-trigger');
  setTimeout(() => (keyboard && first ? first : menu).focus({ preventScroll: true }), 20);
}
function closeMenu(instant) {
  if (!openMenu) return; const { btn, menu } = openMenu; openMenu = null;
  openPicker && openPicker.close(true);
  btn.setAttribute('data-state', 'closed'); btn.setAttribute('aria-expanded', 'false'); document.body.removeAttribute('data-menu');
  if (instant) { menu.remove(); return; }
  menu.setAttribute('data-state', 'closed'); setTimeout(() => menu.remove(), 110);
  if (menu.contains(document.activeElement) || document.activeElement === document.body) btn.focus({ preventScroll: true });
}
document.addEventListener('pointerdown', e => {
  if (openPicker && !openPicker.floatEl.contains(e.target) && !openPicker.trigger.contains(e.target)) { openPicker.close(true); if (openMenu && openMenu.menu.contains(e.target)) return; }
  if (openMenu && !openMenu.menu.contains(e.target) && !openMenu.btn.contains(e.target) && !(openPicker && openPicker.floatEl.contains(e.target))) closeMenu(true);
});
window.addEventListener('resize', () => closeMenu(true));
// a radio pick keeps the menu open and just moves the selection
function markOnly(it) { it.parentElement.querySelectorAll('[role="menuitemradio"]').forEach(x => x.setAttribute('aria-checked', String(x === it))); }
function tileItem(parent, ctx, { label, icon, role, checked, onSelect, keepOpen }) {
  const it = el('button', 'item tile', { type: 'button', role, tabindex: '-1', 'aria-checked': String(!!checked), 'aria-label': label, title: label }, el('span', 'icon', { 'aria-hidden': 'true' }, icon));
  it.addEventListener('click', () => { onSelect(it); if (!keepOpen) ctx.close(); });
  parent.append(it); return it;
}
function tileGrid(ctx, cols) { const g = el('div', 'tile-grid', { 'data-cols': cols }); g.style.gridTemplateColumns = `repeat(${cols}, 44px)`; ctx.menu.append(g); return g; }
function menuItem(ctx, { label, icon, role = 'menuitem', checked, onSelect, keepOpen }) {
  const it = el('button', 'item', { type: 'button', role, tabindex: '-1', 'aria-checked': role === 'menuitem' ? null : String(!!checked) },
    [icon ? el('span', 'icon', { 'aria-hidden': 'true' }, icon) : null, el('span', 'text', {}, label), role !== 'menuitem' ? el('span', 'check', { 'aria-hidden': 'true' }, ICON.check()) : null]);
  it.addEventListener('click', () => { onSelect(it); if (!keepOpen) ctx.close(); });
  ctx.menu.append(it); return it;
}

/* ---------- the five menus ---------- */
const iconColour = () => cssColor('--text-secondary') || '#666';
function shapeIcon(k) { const c = el('canvas', '', { width: 48, height: 48 }); drawSilhouette(c, k, iconColour()); return c; }
function sprinkleIcon(k) {
  const c = el('canvas', '', { width: 48, height: 48 }), x = c.getContext('2d');
  const sz = { dot: 15, star: 20, heart: 19, triangle: 19, flower: 18, moon: 17, square: 16, cross: 19, jimmy: 21, diamond: 20 }[k];
  x.translate(24, 24); x.scale(sz, sz); if (k === 'jimmy') x.rotate(Math.PI * .42); x.fillStyle = iconColour(); x.fill(sprinklePath(k)); return c;
}
const shapeT = Trigger({ icon: ICON.shape(), aria: 'Shape', build(ctx) {
  ctx.menu.setAttribute('role', 'menu'); ctx.menu.setAttribute('aria-label', 'Ornament shape');
  ctx.menu.style.minWidth = '0'; const g = tileGrid(ctx, 5);
  SHAPES.forEach(([k, label]) => tileItem(g, ctx, { label, icon: shapeIcon(k), role: 'menuitemradio', checked: state.shape === k, keepOpen: true, onSelect: it => { state.shape = k; markOnly(it); changed(true); phys.av += .45; phys.yv += 1.5; } }));
} });
const matT = Trigger({ icon: ICON.material(), aria: 'Material', build(ctx) {
  ctx.menu.setAttribute('role', 'menu'); ctx.menu.setAttribute('aria-label', 'Surface material');
  MATERIALS.forEach(([k, label, bg]) => { const i = el('i'); i.style.background = bg; menuItem(ctx, { label, icon: i, role: 'menuitemradio', checked: state.material === k, keepOpen: true, onSelect: it => { state.material = k; markOnly(it); changed(); } }); });
} });
const dotsEl = el('span', 'dots');
const palT = Trigger({ icon: dotsEl, aria: 'Palette', build(ctx) {
  ctx.menu.setAttribute('role', 'dialog'); ctx.menu.setAttribute('aria-label', 'Palette'); ctx.menu.style.width = 'min(17rem, calc(100vw - 24px))';
  const row = el('div', 'cp-row');
  state.colors.forEach((c, i) => row.append(ColorPicker({ name: i ? `Sprinkle ${i}` : 'Toy', value: c, onChange: hex => { state.colors[i] = hex; changed(); syncTriggers(); } }).root));
  ctx.menu.append(row, el('p', 'menu-note', {}, 'The toy colour fills the surface. Sprinkles use the other four.'));
} });
const sprT = Trigger({ icon: ICON.sprinkles(), aria: 'Sprinkles', build(ctx) {
  ctx.menu.setAttribute('role', 'menu'); ctx.menu.setAttribute('aria-label', 'Sprinkle shapes'); ctx.menu.style.minWidth = '0';
  const g = tileGrid(ctx, 5);
  SPRINKLES.forEach(([k, label]) => tileItem(g, ctx, { label, icon: sprinkleIcon(k), role: 'menuitemcheckbox', checked: state.sprinkles.has(k), keepOpen: true,
    onSelect: it => { state.sprinkles.has(k) ? state.sprinkles.delete(k) : state.sprinkles.add(k); it.setAttribute('aria-checked', String(state.sprinkles.has(k))); changed(); syncTriggers(); } }));
  ctx.menu.append(el('div', 'separator', { role: 'separator' }));
  const sec = el('div', 'menu-section'); sec.append(Slider({ label: 'How many', value: Math.round(state.density * 100), format: v => v + '%', onChange: v => { state.density = v / 100; changed(); } }).root);
  ctx.menu.append(sec);
  if (state.shape === 'cane') ctx.menu.append(el('p', 'menu-note', {}, 'A hook stick gets stripes in your colours instead of sprinkles.'));
} });
const glitT = Trigger({ icon: ICON.glitter(), aria: 'Gold glitter', build(ctx) {
  ctx.menu.setAttribute('role', 'dialog'); ctx.menu.setAttribute('aria-label', 'Gold glitter'); ctx.menu.style.width = 'min(18rem, calc(100vw - 24px))';
  const sec = el('div', 'menu-section');
  sec.append(Slider({ label: 'Gold glitter', value: Math.round((state.glitter ? state.glitAmount : 0) * 100), format: v => v + '%', fill: 'var(--gold)',
    onChange: v => { state.glitAmount = v / 100; state.glitter = v > 0; changed(); syncTriggers(); } }).root);
  ctx.menu.append(sec, el('p', 'menu-note', {}, 'Move over the toy to see the flakes catch the light.'));
} });

/* ---------- drawing pad: Arc signature pad, without the signature parts (no baseline, signer or export) ---------- */
const ICON2 = {
  pen: () => svg('<path d="M12 20h9"/><path d="M16.38 3.62a1 1 0 0 1 3 3L7.37 18.64a2 2 0 0 1-.86.5l-2.87.84a.5.5 0 0 1-.62-.62l.84-2.87a2 2 0 0 1 .5-.86z"/>', 16),
  undo: () => svg('<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>', 17),
  redo: () => svg('<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>', 17),
  clear: () => svg('<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>', 17),
  dice: () => svg('<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M16 8h.01"/><path d="M8 8h.01"/><path d="M8 16h.01"/><path d="M16 16h.01"/><path d="M12 12h.01"/>', 16)
};
function InkPad() {
  const root = el('div', 'inkpad');
  const hint = el('span', 'ink-hint', {}, 'Draw your message');
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = document.createElementNS(NS, 'svg'); svgEl.setAttribute('viewBox', `0 0 ${PAD_W} ${PAD_H}`); svgEl.setAttribute('aria-hidden', 'true');
  const g = document.createElementNS(NS, 'g'); const live = document.createElementNS(NS, 'path'); svgEl.append(g, live);
  const sweep = el('span', 'ink-sweep', { 'aria-hidden': 'true' });
  const status = el('p', 'srOnly', { role: 'status', 'aria-live': 'polite' });
  const pad = el('div', 'ink-surface', { tabindex: '0', role: 'img', 'aria-roledescription': 'drawing pad', 'aria-label': 'Message pad' }, [hint, el('div', 'ink-layer', {}, svgEl), sweep]);
  pad.style.background = 'var(--surface)';
  const history = { past: [], future: [] };
  const fill = c => (INK_COLOURS[c] || INK_COLOURS.gold).hex;
  // white ink gets a hairline edge so it stays visible on the plain pad
  const outlineWhite = (node, c) => { if (c === 'white') { node.setAttribute('stroke', 'var(--border-strong)'); node.setAttribute('stroke-width', '1'); } else { node.removeAttribute('stroke'); } };
  const redraw = () => {
    g.innerHTML = '';
    state.ink.strokes.forEach(st => { const pth = document.createElementNS(NS, 'path'); pth.setAttribute('d', outlinePath(strokeOutline(st.points, { size: INK_WIDTHS[st.width], simulatePressure: !st.points.some(q => q.p > 0), taperStart: INK_WIDTHS[st.width] * 1.5, taperEnd: INK_WIDTHS[st.width] * 5, last: true }))); pth.setAttribute('fill', fill(st.color)); outlineWhite(pth, st.color); g.append(pth); });
    hint.style.opacity = state.ink.strokes.length ? 0 : 1;
    undoB.disabled = !history.past.length; redoB.disabled = !history.future.length; clearB.disabled = !state.ink.strokes.length;
    pad.setAttribute('aria-label', `Message pad, ${state.ink.strokes.length} stroke${state.ink.strokes.length === 1 ? '' : 's'}`);
  };
  const commit = next => { history.past.push(state.ink.strokes); if (history.past.length > 60) history.past.shift(); history.future = []; state.ink.strokes = next; redraw(); changed(); syncTriggers(); };
  const toPad = e => { const r = pad.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * PAD_W, y: (e.clientY - r.top) / r.height * PAD_H }; };
  let cur = null;
  pad.addEventListener('pointerdown', e => {
    if (cur || (e.pointerType === 'mouse' && e.button !== 0)) return; e.preventDefault(); e.stopPropagation();
    pad.focus({ preventScroll: true }); try { pad.setPointerCapture(e.pointerId); } catch (err) {} pad.setAttribute('data-drawing', '');
    const { x, y } = toPad(e), pen = e.pointerType === 'pen' && e.pressure > 0;
    cur = { id: e.pointerId, stamp: e.timeStamp, stroke: { color: state.ink.color, width: 'bold', points: [{ x, y, p: pen ? e.pressure : -1, t: 0 }] } };
    live.setAttribute('fill', fill(state.ink.color)); outlineWhite(live, state.ink.color); paintLive();
  });
  pad.addEventListener('pointermove', e => {
    if (!cur || cur.id !== e.pointerId) return;
    const list = typeof e.getCoalescedEvents === 'function' && e.getCoalescedEvents().length ? e.getCoalescedEvents() : [e];
    for (const smp of list) { const { x, y } = toPad(smp), pen = smp.pointerType === 'pen' && smp.pressure > 0; const pts = cur.stroke.points; pts.push({ x, y, p: pen ? smp.pressure : -1, t: Math.max(pts[pts.length - 1].t, smp.timeStamp - cur.stamp) }); }
    paintLive();
  });
  const up = e => { if (!cur || cur.id !== e.pointerId) return; const st = cur.stroke; cur = null; live.setAttribute('d', ''); pad.removeAttribute('data-drawing'); commit([...state.ink.strokes, st]); status.textContent = `Stroke added. ${state.ink.strokes.length} in the message.`; };
  pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up);
  function paintLive() { const st = cur.stroke; live.setAttribute('d', outlinePath(strokeOutline(st.points, { size: INK_WIDTHS[st.width], simulatePressure: !st.points.some(q => q.p > 0), taperStart: INK_WIDTHS[st.width] * 1.5, taperEnd: 0, last: false }))); }
  function undo() { if (!history.past.length) return; history.future.push(state.ink.strokes); state.ink.strokes = history.past.pop(); redraw(); changed(); syncTriggers(); status.textContent = 'Undone.'; }
  function redo() { if (!history.future.length) return; history.past.push(state.ink.strokes); state.ink.strokes = history.future.pop(); redraw(); changed(); syncTriggers(); status.textContent = 'Redone.'; }
  function clear() {
    if (!state.ink.strokes.length) return; const done = () => { commit([]); svgEl.style.clipPath = ''; sweep.removeAttribute('data-on'); status.textContent = 'Message cleared. Undo brings it back.'; };
    if (reducedMotion()) return done();
    sweep.style.transition = 'none'; sweep.style.transform = 'translateX(0)'; svgEl.style.transition = 'none'; svgEl.style.clipPath = 'inset(0 0 0 0)'; void sweep.offsetWidth;
    sweep.setAttribute('data-on', ''); sweep.style.transition = ''; svgEl.style.transition = ''; sweep.style.transform = 'translateX(100%)'; svgEl.style.clipPath = 'inset(0 0 0 100%)';
    setTimeout(done, 580);
  }
  pad.addEventListener('keydown', e => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.stopPropagation(); e.shiftKey ? redo() : undo(); }
    else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); e.stopPropagation(); redo(); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); e.stopPropagation(); clear(); }
  });
  // toolbar: ink colour and nib width are radio groups with a roving tabindex, then undo, redo and clear
  const choice = (label, options, get, set, render) => {
    const grp = el('div', 'ink-choice', { role: 'radiogroup', 'aria-label': label });
    const draw = () => grp.querySelectorAll('.ink-opt').forEach(b => { const on = b.dataset.v === get(); b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
    options.forEach(([v, name]) => { const b = el('button', 'ink-opt', { type: 'button', role: 'radio', 'data-v': v, 'aria-label': name, title: name }, render(v)); b.addEventListener('click', () => { set(v); draw(); }); grp.append(b); });
    grp.addEventListener('keydown', e => { if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return; e.preventDefault(); e.stopPropagation(); const bs = [...grp.children], i = bs.findIndex(b => b.dataset.v === get()); const n = bs[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length]; set(n.dataset.v); draw(); n.focus(); });
    draw(); return grp;
  };
  const colours = choice('Ink colour', [['gold', 'Gold ink'], ['silver', 'Silver ink'], ['white', 'White ink'], ['black', 'Black ink'], ['red', 'Red ink'], ['green', 'Green ink'], ['blue', 'Blue ink'], ['pink', 'Pink ink']], () => state.ink.color, v => { state.ink.color = v; }, v => { const sw = el('span', 'ink-swatch'); sw.style.background = fill(v); return sw; });
  const iconBtn = (label, icon, fn) => { const b = el('button', 'icon-btn ink-icon', { type: 'button', 'aria-label': label, title: label }, icon); b.addEventListener('click', fn); return b; };
  const undoB = iconBtn('Undo', ICON2.undo(), undo), redoB = iconBtn('Redo', ICON2.redo(), redo), clearB = iconBtn('Clear', ICON2.clear(), clear);
  const bar = el('div', 'ink-bar', {}, [el('div', 'ink-group', {}, [colours]), el('div', 'ink-group', {}, [undoB, redoB, clearB])]);
  root.append(pad, bar, status);
  if (state.shape === 'cane') root.append(el('p', 'menu-note', {}, 'A hook stick is too thin for a message. Pick another shape to see it.'));
  redraw();
  return root;
}
const penT = Trigger({ icon: ICON2.pen(), aria: 'Message', build(ctx) {
  ctx.menu.setAttribute('role', 'dialog'); ctx.menu.setAttribute('aria-label', 'Draw a message'); ctx.menu.style.width = 'min(26rem, calc(100vw - 24px))';
  const sec = el('div', 'menu-section'); sec.append(InkPad()); ctx.menu.append(sec);
} });

/* ---------- Surprise me: a random toy (the drawn message stays) ---------- */
const SURPRISE_PALETTES = [
  ['#8E1B22', '#FFFFFF', '#F7CF5E', '#7FCF7E', '#F4CDE8'], ['#1F4D3A', '#FFFFFF', '#E2553A', '#F7CF5E', '#F6C8C2'], ['#1B2A4A', '#E9D8A6', '#FFFFFF', '#77D3C9', '#C99A3C'],
  ['#C2185B', '#FFFFFF', '#FDF0C6', '#5AA9F8', '#F7CF5E'], ['#F5EFE6', '#E2553A', '#2A9D8F', '#F2A154', '#7E57F0'], ['#C99A3C', '#8E1B22', '#FFFFFF', '#1F4D3A', '#F4CDE8'],
  ['#2E5D87', '#FFFFFF', '#CDE5FB', '#F7CF5E', '#E05BB5'], ['#6E3B1F', '#FFFFFF', '#E2553A', '#7FCF7E', '#F7CF5E']
];
const surpriseBtn = el('button', 'trigger surprise', { type: 'button', 'aria-label': 'Surprise me', title: 'Surprise me' }, [el('span', 'triggerIcon', { 'aria-hidden': 'true' }, ICON2.dice()), el('span', 'label', {}, el('span', '', {}, 'Surprise me'))]);
surpriseBtn.addEventListener('click', () => {
  const pick = a => a[(Math.random() * a.length) | 0];
  state.shape = pick(state.ink.strokes.length ? SHAPES.filter(x => x[0] !== 'cane') : SHAPES)[0]; state.material = pick(MATERIALS)[0]; state.colors = pick(SURPRISE_PALETTES).slice();
  state.sprinkles = new Set(SPRINKLES.map(x => x[0]).sort(() => Math.random() - .5).slice(0, 1 + ((Math.random() * 3) | 0)));
  state.density = Math.round(25 + Math.random() * 60) / 100; state.glitAmount = Math.random() < .2 ? 0 : Math.round(25 + Math.random() * 65) / 100; state.glitter = state.glitAmount > 0;
  closeMenu(true); changed(true); phys.av += .6; phys.yv += 3;
  const ic = surpriseBtn.querySelector('.triggerIcon'); ic.classList.remove('spin'); void ic.offsetWidth; ic.classList.add('spin');
});
$('toolbar').append(penT.btn, el('span', 'tb-divider', { 'aria-hidden': 'true' }), shapeT.btn, matT.btn, palT.btn, sprT.btn, glitT.btn, el('span', 'tb-divider', { 'aria-hidden': 'true' }), surpriseBtn);
function syncTriggers() {
  penT.setLabel(state.ink.strokes.length ? 'Message' : 'Add message');
  shapeT.setLabel(SHAPES.find(s => s[0] === state.shape)[1]);
  matT.setLabel(MATERIALS.find(m => m[0] === state.material)[1]);
  palT.setLabel('Palette');
  dotsEl.innerHTML = ''; state.colors.forEach(c => { const i = el('i'); i.style.background = c; dotsEl.append(i); });
  const n = state.sprinkles.size; sprT.setLabel(state.shape === 'cane' ? 'Stripes' : n ? `${n} sprinkle${n === 1 ? '' : 's'}` : 'No sprinkles');
  glitT.setLabel(state.glitter && state.glitAmount > 0 ? `Glitter ${Math.round(state.glitAmount * 100)}%` : 'No glitter');
}
function updateSpec() {
  const shape = SHAPES.find(s => s[0] === state.shape)[1], mat = MATERIALS.find(m => m[0] === state.material)[1];
  const spr = state.sprinkles.size && state.shape !== 'cane' ? ', sprinkles' : '';
  $('spec').textContent = `${mat} ${shape.toLowerCase()}${spr}${state.glitter && state.glitAmount > 0 ? ', gold glitter' : ''}`;
  syncTriggers();
}
function closePop() { closeMenu(true); }
let pending = 0;
function changed(now) { clearTimeout(pending); pending = setTimeout(rebuild, now ? 0 : 90); }

/* ---------- follow the viewer's light or dark theme in the 3D scene ---------- */
function applyTheme() { paintBackdrop(cssColor('--background') || '#ffffff'); }
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
applyTheme();

/* ---------- Save image: the toy as a PNG, through the viewer's download prompt ---------- */
let toastT = 0;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3000); }
const saveBtn = el('button', 'btn', { type: 'button', 'aria-label': 'Save image', title: 'Save image' }, [el('span', 'ic', { 'aria-hidden': 'true' }, svg('<path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/>', 16)), el('span', '', {}, 'Save image')]);
$('actions').append(saveBtn);
saveBtn.addEventListener('click', async () => {
  const downloads = window.claude?.use ? await window.claude.use('downloads') : null;
  renderer.render(scene, camera);
  const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  if (!blob) return toast('Could not make the image. Try again.');
  if (!downloads) {   // outside claude.ai (for example on GitHub Pages) a plain browser download works
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'my-tree-toy.png'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    return toast('Image saved');
  }
  try { await downloads.save({ filename: 'my-tree-toy.png', data: blob }); toast('Image saved'); }
  catch (e) { if (e && e.code !== 'declined') toast('The image was not saved.'); }
});

syncTriggers();
rebuild(); phys.av = .35; phys.yv = 1.2;
})();
</script>
