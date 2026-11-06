import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { build, slugger } from '../src/build.js';
import { darkValue, inlineSvg } from '../src/svg.js';

const dir = mkdtempSync(path.join(tmpdir(), 'md-reader-'));
writeFileSync(
  path.join(dir, 'box.svg'),
  '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">' +
    '<defs><marker id="m"/></defs><script>alert(1)</script>' +
    '<rect width="200" height="100" fill="#fff"/><path d="M0 0" stroke="#1a202c" marker-end="url(#m)" onclick="x()"/></svg>'
);

const SOURCE = `# Field Notes: A Guide for Testers

## Contents

[One](#part-1-getting-started) | [Two](#part-2-the-loop)

Front matter paragraph.

![Overview: the whole thing](box.svg)

## Part 1: Getting started

Intro with a [link](#part-2-the-loop) and literal $& and $1.

**Prompt: plan the work**

> Plan [system] for [client].

> A plain quote.

\`\`\`yaml
a: <b>
\`\`\`

## Part 2: The loop

Lead paragraph.

![Loop](box.svg "The loop")

Rest of the section.

## Glossary

| Term | Meaning |
| --- | --- |
| Run | A *stretch* of pages. |
`;

const { html, warnings, stats } = build(SOURCE, { baseDir: dir });
const section = id => html.slice(html.indexOf(`id="${id}"`), html.indexOf('</section>', html.indexOf(`id="${id}"`)));

test('splits the H1 into title and kicker', () => {
  assert.match(html, /<title>Field Notes<\/title>/);
  assert.match(html, /<p class="kicker">A Guide for Testers<\/p>/);
  assert.match(html, /<h1 id="field-notes-a-guide-for-testers">Field Notes<\/h1>/);
});

test('drops a hand-written contents list but keeps the front matter', () => {
  assert.doesNotMatch(html, /\[One\]|>One</);
  assert.match(html, /<p>Front matter paragraph\.<\/p>/);
});

test('numbered headings become labelled sections with GitHub ids', () => {
  assert.equal(stats.sections, 3);
  assert.match(html, /data-part="1" data-eyebrow="Part 1" data-title="Getting started"/);
  assert.match(html, /<h2 id="part-2-the-loop">The loop<\/h2>/);
  assert.match(html, /data-noun="parts" data-count="2"/);
});

test('bold label plus blockquote becomes a card; other quotes stay quotes', () => {
  assert.match(html, /<figure class="card"><figcaption><span class="tag">Prompt<\/span><span class="ctitle">Plan the work<\/span>/);
  assert.match(html, /<blockquote class="excerpt">\n<p>A plain quote\.<\/p>/);
});

test('code is escaped and prose languages wrap', () => {
  assert.match(html, /<div class="code wrap"><div class="code-bar"><span>yaml<\/span>/);
  assert.match(html, /a: &lt;b&gt;/);
});

test('figures: front matter gets a plate, a section lead gets an opener plate', () => {
  assert.equal(stats.figures, 1, 'same file reuses its figure number');
  assert.match(html, /<div class="plate">\n<figure class="diagram" data-fig="1">/);
  assert.match(html, /<div class="plate opener">\n<header class="part-head"><p class="eyebrow">Part 2<\/p>/);
  assert.match(html, /<span class="fig-t">Overview<\/span>/);
  assert.match(html, /<span class="fig-t">The loop<\/span>/);
  assert.match(section('part-2-the-loop'), /Lead paragraph/);
});

test('a glossary table becomes a definition list', () => {
  const g = section('glossary');
  assert.match(g, /<dl class="glossary"><div><dt>Run<\/dt><dd>A <em>stretch<\/em> of pages\.<\/dd><\/div><\/dl>/);
  assert.doesNotMatch(g, /<table>/);
});

test('replacement patterns in the content survive templating', () => {
  assert.match(html, /literal \$&amp; and \$1\./);
});

test('SVG colors are themed and the white background maps to the sheet', () => {
  assert.match(html, /--svg-ffffff: var\(--sheet\)/);
  assert.match(html, /stroke:var\(--svg-1a202c\)/);
  assert.equal(warnings.length, 0);
});

test('fragment output has no document head', () => {
  const frag = build('# T\n\ntext', { fragment: true }).html;
  assert.ok(frag.startsWith('<title>T</title>'));
  assert.ok(html.startsWith('<!doctype html>'));
});

test('fonts are embedded, nothing loads from a font host', () => {
  assert.equal(html.match(/@font-face \{ font-family: "[^"]+"; [^}]*src: url\(data:font\/woff2;base64,/g).length, 5);
  assert.doesNotMatch(html, /fonts\.(googleapis|gstatic)\.com/);
});

test('missing images warn instead of failing', () => {
  const r = build('# T\n\n## A\n\n![x](nope.png)\n', { baseDir: dir });
  assert.deepEqual(r.warnings, ['image not found: nope.png']);
});

test('slugger matches GitHub and dedupes', () => {
  const s = slugger();
  assert.equal(s('Part 1: What your job becomes'), 'part-1-what-your-job-becomes');
  assert.equal(s('Git: trunk based, with `worktrees`'), 'git-trunk-based-with-worktrees');
  assert.equal(s('Part 1: What your job becomes'), 'part-1-what-your-job-becomes-1');
});

test('inlineSvg scales, namespaces ids and strips scripts', () => {
  const colors = new Set();
  const out = inlineSvg('<svg width="10" height="5"><g id="a" fill="black"/><use href="#a" onload="x()"/><script>bad()</script></svg>', {
    label: 'A "box"',
    idPrefix: 'p-',
    colors,
  });
  assert.match(out, /^<svg aria-label="A &quot;box&quot;" role="img" class="dg" viewBox="0 0 10 5">/);
  assert.match(out, /id="p-a"/);
  assert.match(out, /href="#p-a"/);
  assert.doesNotMatch(out, /script|onload/);
  assert.deepEqual([...colors], ['#000000']);
});

test('dark values invert lightness and keep hue', () => {
  assert.equal(darkValue('#000000'), 'hsl(0.0 0.0% 93.0%)');
  assert.match(darkValue('#2b6cb0'), /^hsl\(210\.\d /);
});
