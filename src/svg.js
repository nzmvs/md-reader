const COLOR_PROPS = ['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color'];
const NAMED = { white: '#ffffff', black: '#000000' };
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function normalizeColor(value) {
  const v = value.trim().toLowerCase();
  if (NAMED[v]) return NAMED[v];
  if (!HEX.test(v)) return null;
  return v.length === 4 ? '#' + [...v.slice(1)].map(c => c + c).join('') : v;
}

const tokenFor = hex => `--svg-${hex.slice(1)}`;
const PROPS = COLOR_PROPS.join('|');

function rewriteStyle(style, colors) {
  return style.replace(
    new RegExp(`(^|[;{\\s])(${PROPS})\\s*:\\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|white|black)\\b`, 'g'),
    (m, pre, prop, val) => {
      const hex = normalizeColor(val);
      if (!hex) return m;
      colors.add(hex);
      return `${pre}${prop}:var(${tokenFor(hex)})`;
    }
  );
}

function rewriteTag(tag, colors) {
  const decls = [];
  let out = tag.replace(new RegExp(`\\s(${PROPS})\\s*=\\s*"([^"]*)"`, 'g'), (m, prop, val) => {
    const hex = normalizeColor(val);
    if (!hex) return m;
    colors.add(hex);
    decls.push(`${prop}:var(${tokenFor(hex)})`);
    return '';
  });
  const style = out.match(/\sstyle\s*=\s*"([^"]*)"/);
  if (style) {
    const merged = [...decls, rewriteStyle(style[1], colors)].filter(Boolean).join(';');
    out = out.replace(style[0], ` style="${merged}"`);
  } else if (decls.length) {
    out = out.replace(/\s*(\/?)>$/, ` style="${decls.join(';')}"$1>`);
  }
  return out;
}

const attr = (tag, name) => (tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`)) || [])[1];

/**
 * Prepare an SVG file for inlining: strip the prolog and scripts, let it scale to its
 * container, namespace its ids, and route every literal color through a CSS custom
 * property so the page can give it a dark-theme value.
 */
export function inlineSvg(source, { label, idPrefix, colors }) {
  let s = source
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .trim();

  const open = s.match(/<svg\b[^>]*>/i);
  if (!open) throw new Error('no <svg> element');
  let root = open[0];
  const w = attr(root, 'width'), h = attr(root, 'height');
  if (!attr(root, 'viewBox') && w && h) root = root.replace(/^<svg/i, `<svg viewBox="0 0 ${parseFloat(w)} ${parseFloat(h)}"`);
  root = root.replace(/\s(width|height)\s*=\s*"[^"]*"/g, '');
  const cls = attr(root, 'class');
  root = cls ? root.replace(/\sclass="[^"]*"/, ` class="${cls} dg"`) : root.replace(/^<svg/i, '<svg class="dg"');
  if (!attr(root, 'role')) root = root.replace(/^<svg/i, '<svg role="img"');
  if (!attr(root, 'aria-label') && label) root = root.replace(/^<svg/i, `<svg aria-label="${label.replace(/"/g, '&quot;')}"`);
  s = s.slice(0, open.index) + root + s.slice(open.index + open[0].length);

  for (const [, id] of [...s.matchAll(/\sid="([^"]+)"/g)]) {
    s = s
      .replaceAll(`id="${id}"`, `id="${idPrefix}${id}"`)
      .replaceAll(`url(#${id})`, `url(#${idPrefix}${id})`)
      .replaceAll(`href="#${id}"`, `href="#${idPrefix}${id}"`);
  }

  s = s.replace(/<[a-zA-Z][\w:-]*\b[^>]*>/g, tag => rewriteTag(tag, colors));
  s = s.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, a, css, b) => a + rewriteStyle(css, colors) + b);
  return s;
}

function hexToHsl(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

// Dark theme: flip lightness onto the range between the dark sheet and near-white,
// keeping hue and saturation. White maps to the sheet itself, so a diagram's own
// background disappears into the page in both themes.
const DARK_FLOOR = 0.11;
const DARK_CEIL = 0.93;
export function darkValue(hex) {
  const [h, s, l] = hexToHsl(hex);
  const l2 = DARK_FLOOR + (1 - l) * (DARK_CEIL - DARK_FLOOR);
  return `hsl(${h.toFixed(1)} ${(s * 100).toFixed(1)}% ${(l2 * 100).toFixed(1)}%)`;
}

export function colorTokensCss(colors) {
  if (!colors.size) return '';
  const list = [...colors].sort();
  const light = list.map(c => `${tokenFor(c)}: ${c === '#ffffff' ? 'var(--sheet)' : c};`).join(' ');
  const dark = list.filter(c => c !== '#ffffff').map(c => `${tokenFor(c)}: ${darkValue(c)};`).join(' ');
  return `:root { ${light} }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ${dark} } }
:root[data-theme="dark"] { ${dark} }`;
}
