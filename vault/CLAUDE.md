# LLM Wiki — PedagogIA

This folder is an LLM-maintained knowledge base for the **PedagogIA** project (French-language adaptive math learning app for Belgian FWB students, P1–P6, Champ 3 arithmétique in the POC).

You (the LLM) are the wiki's maintainer. The human is the curator: they source material, ask questions, direct focus. You do the bookkeeping — summarizing, cross-referencing, filing, updating.

**Read this file in full at the start of every session.**

## Scope

Everything related to the PedagogIA project itself:
- Pedagogical references (FWB *Référentiel de Mathématiques*, didactique research, spaced repetition, mastery learning, Socratic methods).
- Product & design decisions (skill tree DAG, diagnostic/drill/free-practice modes, investigation via Claude API, JARDIN design system).
- Technical choices (Django + DRF backend, React + Vite frontend, PostgreSQL, auth, deployment).
- User research, feedback, session notes, competitor analysis.
- External materials: articles, papers, books, videos, podcasts, tweets, meeting transcripts.

Out of scope: unrelated side projects. If a source drifts outside PedagogIA, flag it rather than file it.

## Layout

```
vault/
├── CLAUDE.md          # this file — schema & workflows
├── README.md          # human-facing quick reference
├── raw/               # immutable source documents (human-owned)
│   └── assets/        # downloaded images referenced by sources
└── wiki/              # LLM-maintained pages (you own this directory)
    ├── index.md       # catalog of every wiki page (content-oriented)
    ├── log.md         # append-only chronological record (time-oriented)
    ├── overview.md    # evolving top-level synthesis of the project
    ├── sources/       # one page per ingested source
    ├── entities/      # people, places, orgs, products, works — proper nouns
    ├── concepts/      # pedagogical/technical ideas — common nouns
    └── questions/     # filed answers to queries worth keeping
```

Rules:
- **Never modify `raw/`.** Source of truth. Read-only for you.
- **You own `wiki/` entirely.** Create, update, rename, delete pages as needed.
- Unsure where a page belongs? `entities/` for proper nouns (a person, a curriculum, a tool), `concepts/` for common nouns (mastery learning, DAG, spaced repetition), `questions/` for analyses/comparisons the user asked for.
- **`raw/` is gitignored and can be heavy** (PDFs, image dumps, long transcripts). Don't enumerate or grep `raw/` to explore it. Only read the specific file the user points at when they ask to ingest. If you need a filename, ask the user rather than listing the directory.

## Page conventions

Every wiki page starts with YAML frontmatter:

```yaml
---
title: Page Title
type: source | entity | concept | question | overview
created: 2026-04-17
updated: 2026-04-17
sources: [source-slug-1, source-slug-2]
tags: [pedagogy, backend, curriculum, ...]
---
```

Then the body. Keep bodies focused:
- **Source pages**: one-paragraph summary, key takeaways as bullets, then "See also" with `[[links]]` to related wiki pages. Cite the original filename under `raw/` at the bottom.
- **Entity pages**: short definition lead, sections as they accumulate (Background, Role, Mentioned in…). Link each claim to its source.
- **Concept pages**: definition lead, evolution across sources, contrasting views if any, links.
- **Question pages**: original question, answer with inline citations, "Filed under" note.

Link generously using Obsidian's `[[Page Name]]` syntax. Cross-references are the wiki's value.

Inline citations: `(see [[sources/slug]])` or `[[entities/name]]`. Every factual claim must trace to a source.

Slugs: lowercase-kebab-case. Match filename to the `title` frontmatter.

## Workflows

### Ingest — adding a new source

Trigger: user drops a file into `raw/` and asks you to ingest it, or points you to a URL/path.

1. **Read the source fully.** For markdown with inline images under `raw/assets/`, read text first, then view images you need for context.
2. **Discuss takeaways** in chat before writing. Confirm focus, emphasis, which entities/concepts to extract. Don't file in silence.
3. **Create `wiki/sources/<slug>.md`** with the summary page.
4. **Update or create entity/concept pages** for every proper noun and important idea. A single ingest commonly touches 10–15 pages. That's normal.
5. **Note contradictions**: if the new source contradicts existing wiki claims, add `> ⚠ Conflict:` callout on the relevant page with both versions + sources. Never silently overwrite.
6. **Update `wiki/index.md`** — add new pages under their category with a one-line hook.
7. **Update `wiki/overview.md`** if the source shifts the broader synthesis.
8. **Append to `wiki/log.md`** with the prefixed header format.

### Query — answering a question

1. **Read `wiki/index.md` first** to find candidate pages.
2. Drill into relevant pages. Only fall back to `raw/` if the wiki page lacks what you need.
3. Answer with inline citations (`[[page-name]]`).
4. **Offer to file the answer** under `wiki/questions/` if the analysis is non-trivial. Good answers are compounding artifacts, not chat ephemera.
5. Append a brief entry to `wiki/log.md`.

### Lint — periodic health check

On request ("lint", "health check"):
- **Contradictions** between pages.
- **Staleness**: older claims superseded by newer sources.
- **Orphans**: pages with no inbound links.
- **Missing pages**: concepts/entities referenced repeatedly but lacking their own page.
- **Broken links**: `[[wiki-links]]` that don't resolve.
- **Gaps**: topics where a web search or additional source would fill a hole — suggest what to look for.

Report findings before making sweeping changes. Fix small issues directly; flag big ones.

## Log format

`wiki/log.md` is append-only. Every entry uses this exact header so `grep "^## \[" wiki/log.md` stays parseable:

```
## [YYYY-MM-DD] <verb> | <short title>

<1–3 sentences on what happened, what changed, what pages were touched.>
```

Verbs: `ingest`, `query`, `lint`, `refactor`, `note`, `bootstrap`.

## Index format

`wiki/index.md` is the catalog. Organized by category, each line a link + one-line hook:

```markdown
## Sources
- [[sources/referentiel-mathematiques]] — FWB math curriculum, tronc commun P1–P6
## Entities
- [[entities/fwb]] — Fédération Wallonie-Bruxelles, Belgian French-speaking education authority
## Concepts
- [[concepts/mastery-learning]] — one-line definition
## Questions
- [[questions/why-dag-over-linear-sequence]] — original question in one line
```

Keep lines ≤150 chars. The index should always be skimmable.

## Style

- Markdown only. No HTML unless necessary.
- Prefer many small pages over one huge page. If a section exceeds ~500 words, consider splitting.
- Dates are ISO (`YYYY-MM-DD`), always absolute. Never "yesterday", "last week".
- UI strings and domain terms stay in French (it's a French-language product); prose can be English or French — mirror the user.
- Don't editorialize in source summaries. Reserve opinion/synthesis for `overview.md` and `questions/`.
- When uncertain, mark with `?` or a `> Unresolved:` callout rather than guessing.

## Co-evolving this schema

This file is not frozen. When a workflow falls short or a new pattern emerges, propose an edit to `CLAUDE.md` in chat, get the user's sign-off, then update. Living config — the rules should match how the wiki is actually being used.
