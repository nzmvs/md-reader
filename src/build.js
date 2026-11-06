import MarkdownIt from 'markdown-it';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { colorTokensCss, inlineSvg } from './svg.js';

const TEMPLATE = readFileSync(new URL('./template.html', import.meta.url), 'utf8');

const WRAP_LANGS = new Set(['markdown', 'md', 'yaml', 'yml']);
const RASTER = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};
const NUMBERED = /^(part|chapter|section|step|lesson|unit)\s+(\d+|[ivxlc]+)\s*[:.–-]\s*(.+)$/i;
const CONTENTS = /^(table of )?contents$/i;
const GLOSSARY = /^(glossary|definitions|terminology|terms)$/i;

export const esc = s =>
  String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** GitHub-style heading slugs, so links written against GitHub or Gitea keep working. */
export function slugger() {
  const seen = new Map();
  return text => {
    const base = text.toLowerCase().trim().replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '').replace(/ /g, '-');
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n ? `${base}-${n}` : base;
  };
}

const inlineText = tok =>
  tok.children.filter(c => c.type === 'text' || c.type === 'code_inline').map(c => c.content).join('');

/** Group the token stream into top-level blocks (a heading, a paragraph, a whole list, ...). */
function blocksOf(tokens) {
  const blocks = [];
  for (let i = 0; i < tokens.length; ) {
    const open = tokens[i];
    let j = i + 1;
    if (open.nesting === 1) for (let depth = 1; depth; j++) depth += tokens[j].nesting;
    blocks.push({ type: open.type.replace(/_open$/, ''), tag: open.tag, open, tokens: tokens.slice(i, j) });
    i = j;
  }
  return blocks;
}

const meaningful = kids => kids.filter(c => c.type !== 'softbreak' && !(c.type === 'text' && !c.content.trim()));

function figureImage(block) {
  if (block.type !== 'paragraph') return null;
  const k = meaningful(block.tokens[1].children);
  if (k.length === 1 && k[0].type === 'image') return k[0];
  if (k.length === 3 && k[0].type === 'link_open' && k[1].type === 'image' && k[2].type === 'link_close') return k[1];
  return null;
}

/** A paragraph that is nothing but bold text, e.g. `**Prompt: write the plan**`. */
function cardLabel(block) {
  if (block.type !== 'paragraph') return null;
  const k = meaningful(block.tokens[1].children);
  if (k.length < 3 || k[0].type !== 'strong_open' || k.at(-1).type !== 'strong_close') return null;
  const mid = k.slice(1, -1);
  if (!mid.every(c => c.type === 'text' || c.type === 'code_inline')) return null;
  return mid.map(c => c.content).join('').trim();
}

function isAnchorList(block) {
  if (!['paragraph', 'bullet_list', 'ordered_list'].includes(block.type)) return false;
  const anchors = block.tokens
    .filter(t => t.type === 'inline')
    .flatMap(t => t.children)
    .filter(c => c.type === 'link_open' && (c.attrGet('href') || '').startsWith('#'));
  return anchors.length >= 2;
}

function shortTitle(alt) {
  let t = alt.split(/[:.](?:\s|$)/)[0].trim();
  if (t.length > 60) t = t.split(',')[0].trim();
  if (t.length > 60) t = t.slice(0, 57).replace(/\s+\S*$/, '') + '…';
  return t;
}

const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

export function build(source, opts = {}) {
  const { baseDir = process.cwd(), lang = 'en', fragment = false, fallbackTitle = 'Document' } = opts;
  const warnings = [];
  const colors = new Set();
  let svgCount = 0;

  function loadImage(src, alt, asFigure) {
    const img = url => `<img src="${esc(url)}" alt="${esc(alt)}">`;
    if (/^(data:|https?:|\/\/)/i.test(src)) {
      if (!src.startsWith('data:')) warnings.push(`remote image kept as a URL: ${src}`);
      return img(src);
    }
    let rel = src.split(/[?#]/)[0];
    try {
      rel = decodeURI(rel);
    } catch {}
    const file = path.resolve(baseDir, rel);
    if (!existsSync(file)) {
      warnings.push(`image not found: ${src}`);
      return img(src);
    }
    const ext = path.extname(file).toLowerCase();
    if (ext === '.svg') {
      const svg = readFileSync(file, 'utf8');
      if (asFigure) return inlineSvg(svg, { label: alt, idPrefix: `svg${++svgCount}-`, colors });
      return img(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
    }
    if (!RASTER[ext]) {
      warnings.push(`unsupported image type: ${src}`);
      return img(src);
    }
    return img(`data:${RASTER[ext]};base64,${readFileSync(file).toString('base64')}`);
  }

  const md = new MarkdownIt({ html: true });
  const codeBlock = (content, lang) =>
    `<div class="code${WRAP_LANGS.has(lang) ? ' wrap' : ''}"><div class="code-bar"><span>${esc(lang || 'text')}</span>` +
    `<button class="copy" type="button">Copy</button><button class="expand" type="button" hidden>Expand</button></div>` +
    `<pre><code>${esc(content.replace(/\n$/, ''))}</code></pre></div>\n`;
  md.renderer.rules.fence = (t, i) => codeBlock(t[i].content, t[i].info.trim().split(/\s+/)[0].toLowerCase());
  md.renderer.rules.code_block = (t, i) => codeBlock(t[i].content, '');
  md.renderer.rules.table_open = () => '<div class="tbl"><div class="tbl-scroll"><table>\n';
  md.renderer.rules.table_close = () =>
    '</table></div><button class="expand" type="button" hidden>Expand table</button></div>\n';
  md.renderer.rules.blockquote_open = () => '<blockquote class="excerpt">\n';
  md.renderer.rules.image = (t, i) => loadImage(t[i].attrGet('src'), t[i].content, false);

  const env = {};
  const tokens = md.parse(source, env);
  const slug = slugger();
  tokens.forEach((t, i) => {
    if (t.type === 'heading_open') t.attrSet('id', slug(inlineText(tokens[i + 1])));
  });
  const render = toks => md.renderer.render(toks, md.options, env);

  // ----- structure: title, front matter, one section per H2 -----
  let h1 = null;
  let current = null;
  let afterContents = false;
  const front = [];
  const sections = [];
  for (const b of blocksOf(tokens)) {
    if (b.type === 'heading') {
      const level = +b.tag.slice(1);
      const text = inlineText(b.tokens[1]).trim();
      if (level === 1 && !h1) {
        h1 = { text, id: b.open.attrGet('id') };
        continue;
      }
      if (level <= 2) {
        afterContents = CONTENTS.test(text);
        current = afterContents ? null : { text, id: b.open.attrGet('id'), blocks: [] };
        if (current) sections.push(current);
        continue;
      }
    }
    if (afterContents) {
      afterContents = false;
      if (isAnchorList(b)) continue;
    }
    (current ? current.blocks : front).push(b);
  }

  let title = opts.title;
  let kicker = '';
  if (!title && h1) [, title, kicker = ''] = h1.text.match(/^(.+?):\s+(.+)$/) || [, h1.text];
  title ||= fallbackTitle;

  for (const s of sections) {
    const m = s.text.match(NUMBERED);
    s.eyebrow = m ? `${capitalize(m[1].toLowerCase())} ${m[2]}` : '';
    s.noun = m ? m[1].toLowerCase() : null;
    s.title = m ? m[3] : s.text;
  }
  const numbered = sections.filter(s => s.noun);
  const noun = numbered.length ? numbered[0].noun + 's' : 'sections';
  const count = numbered.length || sections.length;

  // ----- block renderers -----
  const figNums = new Map();
  function figure(img, cls = '') {
    const src = img.attrGet('src');
    const alt = img.content;
    if (!figNums.has(src)) figNums.set(src, figNums.size + 1);
    const n = figNums.get(src);
    const caption = img.attrGet('title') || shortTitle(alt);
    return (
      `<figure class="diagram${cls}" data-fig="${n}">${loadImage(src, alt, true)}` +
      `<figcaption><span class="fig-n">Figure ${n}</span><span class="fig-t">${esc(caption)}</span>` +
      `<button class="enlarge" type="button">Enlarge</button></figcaption></figure>\n`
    );
  }

  function card(label, quote) {
    const i = label.indexOf(':');
    const tag = i > 0 ? label.slice(0, i).trim() : '';
    const heading = capitalize(i > 0 ? label.slice(i + 1).trim() : label);
    return (
      `<figure class="card"><figcaption>${tag ? `<span class="tag">${esc(tag)}</span>` : ''}` +
      `<span class="ctitle">${esc(heading)}</span><button class="copy" type="button">Copy</button></figcaption>` +
      `<blockquote class="card-body">\n${render(quote.tokens.slice(1, -1))}</blockquote></figure>\n`
    );
  }

  function definitionList(table) {
    const rows = [];
    let inBody = false;
    for (const t of table.tokens) {
      if (t.type === 'tbody_open') inBody = true;
      else if (inBody && t.type === 'tr_open') rows.push([]);
      else if (inBody && t.type === 'inline') rows.at(-1).push(md.renderer.renderInline(t.children, md.options, env));
    }
    return `<dl class="glossary">${rows.map(([term, def = '']) => `<div><dt>${term}</dt><dd>${def}</dd></div>`).join('')}</dl>\n`;
  }

  function renderBlocks(blocks, glossary = false) {
    let html = '';
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const img = figureImage(b);
      const label = !img && cardLabel(b);
      if (img) html += figure(img, ' inline');
      else if (label && blocks[i + 1]?.type === 'blockquote') html += card(label, blocks[++i]);
      else if (glossary && b.type === 'table' && b.tokens.filter(t => t.type === 'th_open').length === 2) html += definitionList(b);
      else html += render(b.tokens);
    }
    return html;
  }

  // ----- runs: each one starts on a fresh page -----
  const runs = [];
  const attrs = (i, s) => `data-part="${i}"` + (s ? ` data-eyebrow="${esc(s.eyebrow)}" data-title="${esc(s.title)}"` : '');
  const flowRun = (a, body, cls = '') =>
    `<section class="run" ${a}><div class="flow${cls}">\n${body}<i class="end"></i></div></section>`;
  const plateRun = (a, body, cls = '') => `<section class="run" ${a}><div class="plate${cls}">\n${body}</div></section>`;

  const coverHead =
    `<header class="cover-head">${kicker ? `<p class="kicker">${esc(kicker)}</p>` : ''}` +
    `<h1 id="${esc(h1?.id || 'top')}">${esc(title)}</h1><p class="cover-meta" id="coverMeta"></p></header>\n`;
  const contents = sections.length
    ? '<nav class="contents" aria-label="Contents"><h2 class="contents-title">Contents</h2><ol id="coverToc"></ol></nav>\n'
    : '';
  runs.push(flowRun(attrs(0), coverHead + renderBlocks(front.filter(b => !figureImage(b))) + contents, ' cover'));
  for (const b of front.filter(figureImage)) runs.push(plateRun(attrs(0), figure(figureImage(b))));

  sections.forEach((s, k) => {
    const a = attrs(k + 1, s);
    let head =
      `<header class="part-head">${s.eyebrow ? `<p class="eyebrow">${esc(s.eyebrow)}</p>` : ''}` +
      `<h2 id="${esc(s.id)}">${esc(s.title)}</h2><p class="part-meta"></p></header>\n`;
    let blocks = s.blocks;
    const fi = blocks.findIndex(figureImage);
    if (fi === 0 || (fi === 1 && blocks[0].type === 'paragraph' && !cardLabel(blocks[0]))) {
      const lead = blocks.slice(0, fi).map(b => render(b.tokens)).join('');
      runs.push(plateRun(a, head + lead + figure(figureImage(blocks[fi])), ' opener'));
      blocks = blocks.slice(fi + 1);
      head = '';
    }
    if (head || blocks.length) runs.push(flowRun(a, head + renderBlocks(blocks, GLOSSARY.test(s.title))));
  });

  const content = runs.join('\n');
  const fill = {
    TITLE: esc(title),
    LANG: esc(lang),
    KEY: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'doc',
    NOUN: noun,
    COUNT: String(count),
    EXTRA_STYLE: colorTokensCss(colors),
    CONTENT: content,
  };
  const page = TEMPLATE.replace(/<!--(TITLE|LANG|KEY|NOUN|COUNT|EXTRA_STYLE|CONTENT)-->/g, (m, k) => fill[k]);
  const html = fragment
    ? page
    : '<!doctype html>\n' +
      `<html lang="${esc(lang)}">\n<head>\n<meta charset="utf-8">\n` +
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
      `${page}\n</html>\n`;

  return { html, warnings, stats: { sections: sections.length, figures: figNums.size } };
}
