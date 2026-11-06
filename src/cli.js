#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { build } from './build.js';

const USAGE = `Usage: md-reader <input.md> [options]

Options:
  -o, --out <file>   Output file (default: input name with .html)
      --title <name> Title for the cover and browser tab (default: the H1)
      --lang <code>  Document language, used for hyphenation (default: en)
      --fragment     Omit <!doctype>, <html> and <head>, for hosts that add their own
  -h, --help         Show this help
`;

function fail(message) {
  process.stderr.write(`md-reader: ${message}\n\n${USAGE}`);
  process.exit(1);
}

let args;
try {
  args = parseArgs({
    allowPositionals: true,
    options: {
      out: { type: 'string', short: 'o' },
      title: { type: 'string' },
      lang: { type: 'string', default: 'en' },
      fragment: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h' },
    },
  });
} catch (e) {
  fail(e.message);
}
const { values, positionals } = args;
if (values.help) {
  process.stdout.write(USAGE);
  process.exit(0);
}
if (positionals.length !== 1) fail('expected exactly one input file');

const input = path.resolve(positionals[0]);
const out = path.resolve(values.out ?? input.replace(/\.(md|markdown|mdown)$/i, '') + '.html');
if (out === input) fail('output would overwrite the input');

let source;
try {
  source = await readFile(input, 'utf8');
} catch (e) {
  fail(`cannot read ${positionals[0]}: ${e.code ?? e.message}`);
}

const { html, warnings, stats } = build(source, {
  baseDir: path.dirname(input),
  title: values.title,
  lang: values.lang,
  fragment: values.fragment,
  fallbackTitle: path.basename(input).replace(/\.[^.]+$/, ''),
});
for (const w of warnings) process.stderr.write(`warning: ${w}\n`);
await writeFile(out, html);
process.stdout.write(
  `${path.relative(process.cwd(), out) || out}: ${stats.sections} sections, ${stats.figures} figures, ${Math.round(html.length / 1024)} KB\n`
);
