---
name: pedagogia-wiki
description: Interact with the PedagogIA LLM-maintained knowledge base at `vault/`. Use this skill whenever the user says "ingest this", "add to the wiki", "add to the knowledge base", "file this", "check the wiki", "lint the wiki", "what does the wiki say about X", or drops a file into `vault/raw/`. Also use it — even without explicit wiki vocabulary — whenever the user asks a question whose answer likely lives in accumulated project knowledge rather than the codebase: FWB curriculum / *Référentiel de Mathématiques*, didactique pedagogy, spaced repetition, mastery learning, Socratic method, skill tree / DAG rationale, JARDIN design philosophy, product/UX decisions, user research, competitor notes, team decisions, external articles or papers about adaptive learning. The wiki is the *why / what-if* layer; the repo's code is the *how*. Skipping this skill when a wiki page exists means re-deriving knowledge the user has already curated.
---

# PedagogIA Wiki

An LLM-maintained, human-curated knowledge base for the PedagogIA project. The human drops sources into `raw/`; you summarize, cross-reference, and file them into `wiki/`. Over time the wiki becomes a compounding synthesis of everything that informs the project.

Location: `vault/` (inside the Obsidian vault checked into the repo).

```
vault/
├── CLAUDE.md          # schema & workflows — the authoritative reference
├── README.md          # human quick reference
├── raw/               # immutable source documents (never edit)
│   └── assets/        # downloaded images
└── wiki/              # LLM-owned pages
    ├── index.md       # catalog of every page (skimmable)
    ├── log.md         # append-only chronological record
    ├── overview.md    # evolving top-level synthesis
    ├── sources/       # one page per ingested source
    ├── entities/      # proper nouns (people, orgs, works, tools)
    ├── concepts/      # common nouns (mastery learning, DAG, …)
    └── questions/     # filed answers to non-trivial queries
```

## First thing, always

**Read `vault/CLAUDE.md` in full** at the start of any wiki interaction. It defines the page conventions, YAML frontmatter, linking style, log/index formats, and is the source of truth for all workflows. The rest of this skill is a shortcut — that file is the spec.

Then skim `vault/wiki/index.md` to see what's already in the wiki. This avoids creating duplicate entity/concept pages.

## Three workflows

### 1. Ingest — a new source arrives

Trigger phrases: *"ingest this"*, *"add to the wiki"*, *"add to the knowledge base"*, *"file this"*, *"process this source"*, or the user simply dropping a file into `raw/` and asking you to look at it.

Before writing anything, read the source fully and **discuss takeaways in chat**. The user is interactive and wants to steer emphasis before pages are committed. Filing in silence is a failure mode — the synthesis is where the human adds value.

Then the standard ingest sequence (detail in the wiki's `CLAUDE.md`):

1. Create `wiki/sources/<slug>.md` — one-paragraph summary, bullet takeaways, "See also" with `[[links]]`, filename citation at the bottom.
2. Create or update entity pages for every proper noun the source introduces or discusses (people, curricula, tools, organizations, works).
3. Create or update concept pages for important ideas (common nouns).
4. If the new source contradicts existing claims, add a `> ⚠ Conflict:` callout with both versions and their sources — never silently overwrite.
5. Update `wiki/index.md` with one-line hooks for every new page.
6. Update `wiki/overview.md` if the source meaningfully shifts the top-level synthesis.
7. Append an entry to `wiki/log.md` using the exact header format: `## [YYYY-MM-DD] ingest | <short title>`.

A single ingest routinely touches 10–15 pages. That's the expected shape.

### 2. Query — answering a question from the wiki

Trigger: any domain question where the answer might already be filed — or an explicit *"what does the wiki say about X"*, *"check the wiki for Y"*.

1. **Read `wiki/index.md` first** to find candidate pages. The index is designed to be skimmable.
2. Drill into the relevant pages. Fall back to `raw/` only if the wiki page lacks detail.
3. Answer with inline citations using Obsidian link syntax (`[[page-name]]`). Every factual claim should trace to a source page.
4. **Offer to file non-trivial answers** as `wiki/questions/<slug>.md`. This is the compounding move — explorations shouldn't disappear into chat history. Ask once; don't pester.
5. Append a brief `## [YYYY-MM-DD] query | <short title>` entry to `wiki/log.md`.

### 3. Lint — periodic health check

Trigger: *"lint the wiki"*, *"health check"*, *"is the wiki ok"*.

Report findings before making sweeping changes:
- **Contradictions** between pages
- **Staleness** — older claims superseded by newer sources
- **Orphans** — pages with no inbound links
- **Missing pages** — concepts/entities referenced on several pages but without their own page
- **Broken links** — `[[wiki-links]]` that don't resolve
- **Gaps** — topics where a web search or new source would fill a hole; suggest what to look for

Fix small things directly (dead links, typos, stale dates). Surface big restructures for user sign-off first.

## Conventions at a glance

Every wiki page starts with YAML frontmatter (`title`, `type`, `created`, `updated`, `sources`, `tags`). Slugs are `lowercase-kebab-case` and match the `title`. Dates are ISO (`YYYY-MM-DD`), always absolute. UI strings and domain vocabulary stay in French (it's a French product); prose mirrors the user's language.

Don't editorialize in source summaries — save opinion and synthesis for `overview.md` and `questions/`. When uncertain, mark with `?` or a `> Unresolved:` callout rather than guessing.

The full spec (frontmatter fields, page body shapes, exact log header, index format) lives in `vault/CLAUDE.md`. Read it.

## Domain-question mode (no explicit wiki verb)

When the user asks a domain question without saying "wiki" — e.g., *"remind me why we chose a DAG over a linear sequence"*, *"what does the FWB curriculum say about P3 division"*, *"summarize our thinking on gamification"* — still start by reading `wiki/index.md`. If a relevant page exists, cite it. If one doesn't and the question is substantive, answer from general knowledge and **offer to create the page** so the next similar question is cheaper.

The wiki only compounds if you feed it. Every query is a chance to grow it.

## Co-evolving the schema

The wiki's `CLAUDE.md` is not frozen. If a workflow falls short or a new pattern emerges, propose an edit to it in chat, get the user's sign-off, then update. Same for this skill — if the triggering or the workflow shortcuts drift out of sync with real use, fix them.
