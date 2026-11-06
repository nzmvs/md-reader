# md-reader

Turns one long Markdown file into a single self-contained HTML page that reads like a book: one page per screen, two columns per page, turned sideways. One column on phones. Light and dark themes follow the system.

The reader has a cover with a generated table of contents and page numbers, a Contents drawer, a progress bar with one segment per section, adjustable text size, copy buttons on prompts and code, and full-screen views for figures, wide code and tables. It remembers your place.

## Usage

Requires Node 20 or later.

```sh
pnpm install
node src/cli.js path/to/guide.md                 # writes path/to/guide.html
node src/cli.js guide.md -o reader.html --title "Agentic Engineering"
node src/cli.js guide.md --fragment              # no <!doctype>/<head>, for claude.ai artifacts
```

| Option | Default | |
| --- | --- | --- |
| `-o, --out <file>` | input name with `.html` | Output path |
| `--title <name>` | the first H1 | Cover title and browser tab |
| `--lang <code>` | `en` | Document language, used for hyphenation |
| `--fragment` | off | Omit the document head for hosts that add their own |

Local images are embedded, so the output has no outside files. Remote images stay as URLs and produce a warning.

## How Markdown maps to the reader

| Markdown | Reader |
| --- | --- |
| `# Title: Subtitle` | Cover title, with the subtitle as the line above it |
| `## Contents` followed by a list of `#` links | Dropped; the reader generates its own contents |
| Text before the first `##` | Front matter on the cover |
| `## Part 3: The five steps` | New section on a new page, labelled "Part 3" (also Chapter, Section, Step, Lesson, Unit) |
| `![alt](file.svg "Caption")` alone in a paragraph | Numbered figure: a full page in the front matter, an opening page at the start of a section, column width elsewhere |
| `**Prompt: plan the work**` followed by `> ...` | Card with a label, heading and Copy button; `[slots]` are highlighted |
| Fenced code | Language label and Copy button; `markdown` and `yaml` wrap, others scroll |
| Two-column table under `## Glossary` | Definition list whose entries never split |

Heading ids follow GitHub and Gitea, so existing `#anchor` links work. SVG figures are inlined and every fixed color is routed through a CSS variable with a dark-theme counterpart.

[`examples/conventions.md`](examples/conventions.md) documents each rule in detail and is the example input:

```sh
pnpm example    # writes examples/conventions.html
```

## Development

```sh
pnpm test
```

| File | |
| --- | --- |
| `src/cli.js` | Argument parsing and file I/O |
| `src/build.js` | Markdown to runs (cover, figure pages, sections) and the final page |
| `src/svg.js` | SVG inlining and dark-theme colors |
| `src/template.html` | Styles and the reader script; pagination happens in the browser with CSS columns |
