# PedagogIA Wiki

LLM-maintained knowledge base for the PedagogIA project.

## How to use

1. **Drop sources** into `raw/` (PDFs, markdown articles via Obsidian Web Clipper, meeting notes, screenshots…).
2. **Ask the LLM to ingest** a given file. It will summarize, extract entities/concepts, update the index and log.
3. **Ask questions** against the wiki. The LLM reads `wiki/index.md` first, drills into relevant pages, answers with citations. Non-trivial answers get filed under `wiki/questions/`.
4. **Ask for a lint pass** occasionally — contradictions, orphans, stale claims, gaps.

## Where things live

- `CLAUDE.md` — schema and workflows for the LLM. **Source of truth for conventions.**
- `raw/` — your source documents. **Never edited by the LLM.**
- `wiki/` — LLM-generated pages. Index, log, overview, and topical pages.

## Navigating

- `wiki/overview.md` — top-level synthesis, evolves over time.
- `wiki/index.md` — skimmable catalog of every page.
- `wiki/log.md` — chronological record of every ingest/query/lint.

Open this folder as an Obsidian vault for graph view, backlinks, and hotkeys. Or just read the markdown directly.

## Recent activity

```bash
grep "^## \[" wiki/log.md | tail -10
```
