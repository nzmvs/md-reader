# Prior art

Checked 2026-11-06. Repository facts (licence, release, last commit) come from the GitHub API on that date. Claims about how a project paginates come from its source code or official docs, linked inline.

## Short answer

The technique is not new, but the product mostly is. Paginating reflowable HTML with fixed-height CSS columns and moving the strip sideways is the standard method in browser e-book engines (epub.js, foliate-js, Readium CSS, Bibi, Monocle, calibre). NLM's PubReader used a near-identical setup for long articles in 2012: multiple columns per screen, a column rule, and translateX by page width plus gap. The closest Markdown tools are the Obsidian plugin **MD Reader** (same name, same column technique, one or two pages per screen, but it runs inside Obsidian and writes no file) and **mkbooks** (a Python CLI that builds a CSS-column reader from Markdown chapters, but outputs HTML plus separate CSS and JS). Nothing found turns one Markdown file into one book-styled HTML file with md-reader's authoring conventions.

## Comparison

| Project | Takes in | Outputs | Paginates on screen, and how | Columns per page | Single file | Licence | Last release / commit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **md-reader** | One Markdown file | One HTML page, or a fragment | Fixed-height CSS columns per section; strip moved with `translate3d` | 2; 1 when the reading area is under 680px | Yes (web fonts load from Google Fonts) | None declared | n/a |
| MD Reader (Obsidian plugin) | Obsidian notes; imports FB2, EPUB, TXT to Markdown | View inside Obsidian | CSS columns, `column-fill: auto`, translateX by spread width plus gap | 1 or 2 (each column is a page) | No | MIT | 2.1.0, 2026-09-27 |
| mkbooks | Markdown chapters plus `mkbooks.yml` | Reader HTML + `reader.css` + `reader.js`; print HTML/PDF via Paged.js | CSS columns per chapter, translateX by section width | 1, or 2 in spread mode | No (3 files) | MIT per README; no licence file | 0.1.0, 2026-03-23 |
| PubReader (NLM) | HTML converted from JATS XML | JS and CSS applied to an article page | CSS columns (`column-width: 4in`, `column-count: auto`, column rule), translateX | As many 4in columns as fit | No | Public domain | Archived; last commit 2018-06-21 |
| NovelReader | Pasted text, EPUB, Markdown | Web app that exports a standalone HTML file | JS: measures block heights, splits paragraphs | 1 | Yes (exported file) | None declared | Last commit 2026-06-03 |
| paginated-markdown-demo | One Markdown file (Vite build) | Demo site | Flexbox `column wrap` with scroll-snap; `scrollBy` | 1 | No | None declared | Last commit 2022-06-02 |
| foliate-js | EPUB, MOBI, KF8, FB2, CBZ, PDF | JS library | CSS columns in an iframe; container `scrollLeft` | Up to `max-column-count` (default 2) | No | MIT | No releases; last commit 2026-05-01 |
| epub.js | EPUB | JS library | CSS columns in an iframe; container scrolled | 1, or 2 when wide enough for a spread | No | BSD-2-Clause | npm 0.3.93, 2022-02-16; last commit 2026-03-24 |
| Readium CSS / Thorium Web | EPUB | Stylesheets; web reader app | CSS columns on `:root`; app sets column count | 1 by default; app sets 2 | No | BSD-3-Clause | CSS v2.0.5, 2026-05-13; Thorium Web v1.7.0, 2026-10-07 |
| Bibi | EPUB, or a YAML list of HTML files ("Zine") | Web app folder | CSS columns per spine item | 1, or 2 half-width columns in landscape spreads | No | MIT | v1.2.0, 2020-07-05; last commit 2021-07-25 |
| Monocle | HTML in a container, or a book data object | JS library | CSS columns, column width = page width | 1 | No | MIT | Tag v3.2.0; unmaintained since 2015 |
| calibre E-book viewer | E-books | Desktop app | CSS columns on `body`, scrolled by column | Setting, else `floor(width / 35em)`, 1 to 20 | No | GPL-3.0 | Active; last commit 2026-11-06 |
| Treesaver | HTML articles plus grid templates | JS library | JS: fills column elements by measuring blocks | Per grid template | No | GitHub reports GPL-2.0; README says MIT or GPLv2 | Tag 0.10.0; last commit 2013-06-10 |
| Vivliostyle CLI + Viewer | Markdown (VFM), HTML, EPUB, webpub | PDF, EPUB, webpub; preview in Viewer web app | Own JS layout engine for CSS Paged Media | Per author CSS; Viewer shows single page or spread | No | AGPL-3.0 | vivliostyle.js v2.46.0, 2026-11-03; CLI v11.4.0, 2026-10-19 |
| Paged.js | HTML plus Paged Media CSS | Pages rendered in the browser; PDF via pagedjs-cli | JS chunker into page boxes; no page-turning UI found | Per author CSS | n/a | MIT | npm 0.4.3, 2023-07-06 (0.5.0-beta.2, 2024-10-04); last commit 2026-10-20 |
| Bindery | HTML | Pages in the browser: preview, print, flipbook views | JS flow via `regionize` | Per author CSS | n/a | MIT | v2.3.6, 2021-01-10; archived |
| BookJS | HTML | Print pages | CSS Regions (experimental) | n/a | n/a | AGPL-3.0 | Last push 2018-08-17 |
| mdBook | Markdown chapters | Static site, one HTML per chapter, plus a print page | No (scrolls) | 1 | No | MPL-2.0 | v0.5.4, 2026-07-06 |
| HonKit | Markdown or AsciiDoc | Static site; PDF, EPUB, MOBI | No | 1 | No | Apache-2.0 | v6.2.5, 2026-10-23 |
| Bookdown | R Markdown | GitBook-style site; EPUB, PDF | No | 1 | Possible (`split_by: none`) | GPL-3.0 | v0.48, 2026-08-28 |
| Quarto books | Markdown, notebooks | Quarto website; PDF, EPUB, Word, Typst | No | 1 | Not for HTML books (unverified) | MIT | v1.12.0, 2026-11-02 |
| Pandoc | Markdown and many others | HTML, EPUB 3, many others | No (HTML scrolls; EPUB needs a reader) | 1 | Yes, `--embed-resources --standalone` | GPL-2.0 | 3.13, 2026-10-26 |
| Marp CLI | Markdown split by `---` | HTML deck, PDF, PPTX | Slides split by the author; no reflow | n/a | One `.html` per deck (asset inlining unverified) | MIT | v4.5.1, 2026-09-06 |

## Projects

### MD Reader (Obsidian plugin)

- Renders a note into fixed-size pages turned sideways by swipe, tap zones, arrow keys, wheel or buttons, with a single page or a two-page spread ([README](https://github.com/mrrepac/obsidian-md-reader/blob/main/README.md)).
- Same technique as md-reader: JS sets `column-width` to the page width, CSS sets `column-fill: auto` ("otherwise columns balance and pagination breaks"), the page count comes from `scrollWidth`, and pages turn with `translateX(-page * stride)` ([main.js L1788-1879](https://github.com/mrrepac/obsidian-md-reader/blob/main/main.js#L1788-L1879), [styles.css L124-133](https://github.com/mrrepac/obsidian-md-reader/blob/main/styles.css#L124-L133)).
- Restores position from a short text quote with surrounding context, falling back to a percentage; renders long files in blocks sized from measured layout time; adds search, bookmarks, quotes and a scrubbable progress bar ([README](https://github.com/mrrepac/obsidian-md-reader/blob/main/README.md)).
- Runs only inside Obsidian and produces no shareable file.

### mkbooks

- Python CLI: "Turn Markdown chapters into a beautiful, paginated book you can read in the browser or export as PDF", with single and spread layouts, swipe, keys and saved progress ([PyPI](https://pypi.org/project/mkbooks/), [repo](https://github.com/blasferna/mkbooks)).
- The reader is "CSS multi-column based page-flip navigation"; spread mode uses "two columns per page" with the gap as the centre gutter, and pages turn with `translateX(-(page * W))` ([reader.js L1-4, L274-339](https://github.com/blasferna/mkbooks/blob/main/src/mkbooks/templates/reader.js#L274-L339)). Spread is chosen when `innerWidth >= 768` ([L424](https://github.com/blasferna/mkbooks/blob/main/src/mkbooks/templates/reader.js#L424)).
- Writes `{reader}.html` plus `reader.css` and `reader.js`, and a separate print build rendered with Paged.js ([builder.py L64-144](https://github.com/blasferna/mkbooks/blob/main/src/mkbooks/builder.py#L64-L144)).
- Closest in shape to md-reader (CLI, Markdown in, CSS-column reader out), but multi-file, multi-chapter and configured through YAML.

### PubReader (NLM/NCBI)

- JS and CSS "for rendering journal articles in a PubReader view"; public domain; archived ([README](https://github.com/ncbi/PubReader/blob/master/README.md)).
- Article gets `column-width: 4in; column-count: auto; column-gap: 60px; column-rule: 1px solid #ccc` at full height ([jr.pagemanager.css L19-34](https://github.com/ncbi/PubReader/blob/master/css/jr.pagemanager.css#L19-L34)). Page width is the article's inner width plus the column gap, and pages turn by a CSS translate, with animated `scrollLeft` as fallback ([jquery.jr.pagemanager.js L371, L673-707](https://github.com/ncbi/PubReader/blob/master/js/jquery.jr.pagemanager.js#L673-L707)).
- The nearest precedent for md-reader's layout: several columns per screen with a rule between them, not "one column = one page".

### NovelReader

- Single-file web reader for pasted text, EPUB and Markdown that can export a standalone offline HTML file; README notes it is "Vibecoded" ([README](https://github.com/Gustavo1500/NovelReader/blob/master/README.md)).
- Paginates in JS by measuring block heights and splitting paragraphs ([Pagination.js L107-203](https://github.com/Gustavo1500/NovelReader/blob/master/src/js/Pagination.js#L107-L203)). Markdown headings are flattened to plain lines ([FileParser.js L7](https://github.com/Gustavo1500/NovelReader/blob/master/src/js/FileParser.js#L7)).

### foliate-js

- "The paginator uses the same pagination strategy as Epub.js: it uses CSS multi-column", is "a totally standalone module" that can "paginate any content", supports more than two columns, and anchors the view to a `Range`, `Element` or fraction across resizes ([README](https://github.com/johnfactotum/foliate-js/blob/main/README.md#the-paginator)).
- Sets `column-width`, `column-gap`, `column-fill: auto` and a fixed height on the iframe's root; column count is `min(max-column-count, ceil(size / max-inline-size))`; pages turn by setting the container's `scrollLeft` ([paginator.js L309-331, L731, L891-916](https://github.com/johnfactotum/foliate-js/blob/main/paginator.js#L309-L331)).
- Finds the visible range by bisecting text nodes ([paginator.js L63-140](https://github.com/johnfactotum/foliate-js/blob/main/paginator.js#L63-L140)). Used by Readest ([README](https://github.com/readest/readest/blob/main/README.md)).

### epub.js

- `Contents.columns()` sets `column-fill: auto`, `column-gap`, `column-width` and a fixed height inside the section iframe ([contents.js L1050-1102](https://github.com/futurepress/epub.js/blob/master/src/contents.js#L1050-L1102)). The layout uses two columns when spreads are on and the width reaches the minimum spread width ([layout.js L120-139](https://github.com/futurepress/epub.js/blob/master/src/layout.js#L120-L139)). The default manager pages by scrolling the container ([managers/default/index.js](https://github.com/futurepress/epub.js/blob/master/src/managers/default/index.js)).
- Licence is BSD 2-clause ([license](https://github.com/futurepress/epub.js/blob/master/license)). Last npm release 0.3.93 in 2022.

### Readium CSS and Thorium Web

- "Contents are paginated using CSS multicolumns" ([docs L37](https://github.com/readium/css/blob/develop/docs/CSS03-injection_and_pagination.md)), set on `:root` with `column-fill: auto` and full viewport height ([ReadiumCSS-pagination.css](https://github.com/readium/css/blob/develop/css/src/modules/ReadiumCSS-pagination.css)). Pagination is one column by default; for two the app sets `--USER__colCount: 2` ([docs L46-48](https://github.com/readium/css/blob/develop/docs/CSS03-injection_and_pagination.md)).
- Documents engine quirks: single-column width is set to `100%` "for Safari, otherwise it won't fragment content" ([docs L92](https://github.com/readium/css/blob/develop/docs/CSS03-injection_and_pagination.md)); vertical writing must "stick to a single column" ([docs L200-216](https://github.com/readium/css/blob/develop/docs/CSS03-injection_and_pagination.md)).
- Caps media at `--RS__maxMediaHeight: 95vh` with `object-fit: contain` ([ReadiumCSS-safeguards.css L17, L48](https://github.com/readium/css/blob/develop/css/src/modules/ReadiumCSS-safeguards.css)).
- Thorium Web is EDRLab's web reader built on `@readium/css` and `@readium/navigator` ([README](https://github.com/edrlab/thorium-web/blob/develop/README.md)).

### Bibi

- "EPUB Reader on your website", MIT ([README](https://github.com/satorumurmur/bibi/blob/master/README.md)). Also reads a YAML list of HTML files through its Zine extension ([zine.js](https://github.com/satorumurmur/bibi/blob/master/__src/bibi/extensions/zine.js)).
- Applies `column-fill: auto`, `column-width` and `column-gap` per item; in landscape spreads it halves the column length when the half stays wide enough relative to the height ([bibi.heart.js L1564-1572, L1638-1645](https://github.com/satorumurmur/bibi/blob/master/__src/bibi/resources/scripts/bibi.heart.js#L1564-L1572)).

### calibre E-book viewer

- Paged mode "scrolls by column in the inline direction, because by the CSS spec, columns are laid out in the inline direction" ([paged_mode.pyj L3-21](https://github.com/kovidgoyal/calibre/blob/master/src/pyj/read_book/paged_mode.pyj#L3-L21)).
- Columns per screen come from a portrait/landscape setting, else `floor(inline_size / (35 * em))`, clamped to 1..20 ([L180-190](https://github.com/kovidgoyal/calibre/blob/master/src/pyj/read_book/paged_mode.pyj#L180-L190)); column CSS is forced on `body` ([L309](https://github.com/kovidgoyal/calibre/blob/master/src/pyj/read_book/paged_mode.pyj#L309)).

### Monocle and Treesaver (historical)

- Monocle sets `column-width` to the page width with `column-fill: auto` ([columns.js L31-41, L126](https://github.com/joseph/Monocle/blob/master/src/dimensions/columns.js#L31-L41)); its README says it has not been maintained since 2015 ([README](https://github.com/joseph/Monocle/blob/master/README.md)).
- Treesaver lays out "magazine-style" pages in JS: it fills column elements in grid templates by measuring blocks and tracking a break record, not with CSS columns ([README](https://github.com/Treesaver/treesaver/blob/master/README.md), [page.js L370](https://github.com/Treesaver/treesaver/blob/master/src/layout/page.js#L370)).

### Vivliostyle

- CLI typesets "HTML and Markdown documents" (Markdown via VFM) to PDF, EPUB and webpub, and `vivliostyle preview manuscript.md` opens the Vivliostyle Viewer ([getting-started.md](https://github.com/vivliostyle/vivliostyle-cli/blob/main/docs/getting-started.md)).
- Viewer shows a spread automatically when the view area is at least 1.45 times as wide as it is tall; `&spread=` forces either mode ([Viewer docs](https://docs.vivliostyle.org/en/viewer/vivliostyle-viewer/)). It is a hosted or self-hosted web app, not a single file (same source).
- Layout is its own engine, including column layout and balancing ([columns.ts](https://github.com/vivliostyle/vivliostyle.js/blob/master/packages/core/src/vivliostyle/columns.ts)). Keyboard navigation and a text-size control are unverified.
- The only project found that pages Markdown on screen as book pages from a CLI, but page sizes are print sizes (for example A4) and the output is aimed at PDF.

### Paged.js, Bindery, BookJS

- Paged.js polyfills CSS Paged Media and Generated Content "to display paginated content in the browser and to generate print books" ([README](https://github.com/pagedjs/pagedjs/blob/main/README.md)). The README describes the Previewer and chunker but no reading UI, and I found none.
- Bindery "flows content over multiple pages" and offers `flipbook`, `preview` and `print` viewer modes ([README](https://github.com/evnbr/bindery/blob/master/README.md), [constants](https://github.com/evnbr/bindery/blob/master/src/constants/index.ts)); it is archived and points users to Paged.js.
- BookJS paginates for print using CSS Regions, "an experimental feature" ([README](https://github.com/booktype/BookJS/blob/master/README.md)).

### Markdown book generators and slides

- None of mdBook, HonKit, Bookdown, Quarto or Pandoc paginates on screen. mdBook's HTML renderer has a print page that combines all chapters, with an option to insert page breaks between them ([renderer docs](https://rust-lang.github.io/mdBook/format/configuration/renderers.html)). Bookdown splits one HTML file per chapter by default, or a single file with `split_by = "none"` ([bookdown HTML docs](https://pkg.yihui.org/bookdown/html.html)). Quarto HTML books "are actually just a special type of Quarto Website" ([Quarto books](https://quarto.org/docs/books/)). Pandoc `--embed-resources` produces "a standalone HTML file with no external dependencies" ([manual](https://pandoc.org/MANUAL.html)).
- Marp splits slides "by horizontal ruler (e.g. `---`)" ([Marpit docs](https://github.com/marp-team/marpit/blob/main/docs/markdown.md)) and its bespoke HTML template navigates "through keyboard and swipe gesture" ([marp-cli](https://github.com/marp-team/marp-cli)). It overlaps on Markdown in, one HTML file out and sideways navigation, but content does not reflow across pages.
- paginated-markdown-demo is a small demo (a 34-line `index.js`): headings become hard breaks in a `flex-flow: column wrap` container with scroll-snap ([index.css](https://github.com/Iteam1337/paginated-markdown-demo/blob/main/index.css), [index.js](https://github.com/Iteam1337/paginated-markdown-demo/blob/main/index.js)).

## What md-reader adds, and what to borrow

### Not found elsewhere

- One Markdown file to one HTML file from a CLI, with the reader inlined. Pandoc and Bookdown make single files but scroll; NovelReader exports single files but is an app with a one-column JS paginator; mkbooks writes three files.
- Authoring conventions mapped to book furniture: `Part N:` labels, dropping a hand-written Contents list, a cover with generated contents and page numbers, figure plates and openers by position, cards with Copy and `[slot]` highlighting, glossary table to definition list.
- SVG figures inlined with each fixed colour routed through a CSS variable that has a dark-theme value.
- `--fragment` output for hosts that supply their own `<head>`, plus GitHub-compatible heading ids and a URL hash that follows the current heading.
- Caveat: `src/template.html` links Google Fonts, so the page is self-contained except for fonts, which fall back to system faces offline.

### Worth borrowing

- **Column count from text measure, not a pixel breakpoint.** calibre uses `floor(width / 35em)` ([paged_mode.pyj L190](https://github.com/kovidgoyal/calibre/blob/master/src/pyj/read_book/paged_mode.pyj#L190)) and foliate-js uses `ceil(size / max-inline-size)` capped by `max-column-count` ([paginator.js L731](https://github.com/johnfactotum/foliate-js/blob/main/paginator.js#L731)). md-reader switches at 680px, so at the largest text size two columns can get narrow.
- **Aspect ratio for two-up.** Vivliostyle goes to spreads at width ≥ 1.45 × height ([Viewer docs](https://docs.vivliostyle.org/en/viewer/vivliostyle-viewer/)); Bibi checks the half-width column against the height ([bibi.heart.js L1570-1571](https://github.com/satorumurmur/bibi/blob/master/__src/bibi/resources/scripts/bibi.heart.js#L1570-L1571)).
- **Cap inline media height.** Readium caps `img`, `svg` and `video` at `95vh` with `object-fit: contain` ([safeguards](https://github.com/readium/css/blob/develop/css/src/modules/ReadiumCSS-safeguards.css)). md-reader caps code and tables at page height but not `.diagram.inline`.
- **WebKit glyph clipping.** epub.js and foliate-js both set `-webkit-line-box-contain: block glyphs replaced` on the columned root ([epub.js contents.js L1100-1102](https://github.com/futurepress/epub.js/blob/master/src/contents.js#L1100-L1102), [foliate-js paginator.js L331](https://github.com/johnfactotum/foliate-js/blob/main/paginator.js#L331)).
- **Safari single column.** Readium says a single column needs `column-width: 100%` in Safari or content will not fragment ([docs L92](https://github.com/readium/css/blob/develop/docs/CSS03-injection_and_pagination.md)). md-reader uses `column-count: 1` on phones; worth testing on iOS Safari. Whether this still applies is unverified.
- **Position by text, not block index.** The Obsidian plugin stores a short quote with context and falls back to a percentage ([README](https://github.com/mrrepac/obsidian-md-reader/blob/main/README.md)); foliate-js anchors to a `Range` ([paginator.js L441](https://github.com/johnfactotum/foliate-js/blob/main/paginator.js#L441)). md-reader stores a block index, which shifts when the document is rebuilt with edits.
- **Print path.** If PDF output is ever wanted, mkbooks shows the pattern: same Markdown, a separate Paged.js build ([builder.py](https://github.com/blasferna/mkbooks/blob/main/src/mkbooks/builder.py)).
