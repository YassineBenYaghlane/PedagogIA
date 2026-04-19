---
name: project-status
description: Produce a concise "where are we" report for the PedagogIA repo — current worktree + branch, anything dirty that should be cleaned before new work starts, state of the other worktrees, open PRs with CI status, open issues grouped by theme, and a prioritized devops-flavored pick of what to tackle next. Use this skill whenever the user asks "what's the status", "what's happening", "what's left to do", "what should we tackle", "où on en est", "fais le point", "check the issues", "what's on fire", or opens a new session with a generic "catch me up" — even if they don't mention git, PRs, or issues explicitly. Also worth using proactively at the start of a session if the user's first message is ambiguous about what to work on, since a 10-second status pass often answers "what next" better than guessing. This skill exists because status reports drift without structure — you end up dumping raw `gh issue list` output, missing uncommitted files from prior sessions, forgetting to check the other worktrees, or skipping the "should we clean git first" question the user actually cares about.
---

# Project status report

The point of this skill is a report the user can read in ten seconds and act on. Four parts, in this order, no more:

1. **Where we are** — cwd, branch, sync with `origin/main`
2. **Anything to clean first** — uncommitted files, stale branches, other worktrees with work-in-progress
3. **In flight** — open PRs with CI status
4. **What to tackle** — grouped open issues + one recommended pick with rationale

Keep it terse. Lists and one-liners beat prose. The user is almost always asking this to decide what to do next, not to read an essay.

## How to gather the data

Run these in parallel — they don't depend on each other and the whole pass should finish in one round-trip:

```bash
# Location + local state
pwd
git branch --show-current
git status --short
git log --oneline origin/main..HEAD     # unpushed commits, if any
git log --oneline HEAD..origin/main     # un-pulled commits, if any

# Other worktrees — one line per worktree, plus a quick dirty check
git worktree list
# For each worktree path reported above:
git -C <path> status -sb

# GitHub side
gh pr list --state open
gh issue list --limit 40 --state open
```

If a PR shows up, fetch its check rollup too — a PR that's green and unreviewed is a different action item than one with failing CI:

```bash
gh pr view <N> --json state,isDraft,mergeable,reviewDecision,statusCheckRollup \
  -q '{state, draft: .isDraft, mergeable, review: .reviewDecision,
       checks: [.statusCheckRollup[] | {name, status: .status, conclusion: .conclusion}]}'
```

Batch all of the above into one parallel tool-call block. Don't read files, don't run tests, don't open the dev stack. This skill is read-only and fast.

## How to write the report

### 1. Where we are
Two or three lines. Cwd, branch, whether local is ahead/behind of `origin/main`. If the cwd is a worktree under `.claude/worktrees/<name>/`, say so — it changes which ports are in play and whether `run-app` needs shifted `.env`.

### 2. Anything to clean first
This is the section the user actually acts on before new work. Don't just list dirty files — classify them:

- **Stray edits on `main`** — uncommitted changes sitting on the main branch. Almost always need to be committed to a feature branch, stashed, or discarded. Show the diff summary and a one-line guess at what they are (skim the diff if the filenames are ambiguous).
- **Unpushed commits** — local commits ahead of `origin/main`. Mention the count and subjects.
- **Other worktrees with uncommitted work** — cross-checkout rot. Surface them so the user doesn't lose work when they eventually delete a worktree.
- **Stale worktrees** — worktrees whose branch is already merged into `main`. Candidates for `git worktree remove`, but **do not remove them yourself** — ask.

If everything is clean, say "nothing to clean" and move on. Don't pad.

### 3. In flight
One line per open PR: `#N title — branch — CI status — review status`. If CI is failing or the PR is a draft, say so explicitly — those are the ones the user might want to unblock before opening new work.

### 4. What to tackle
Group the open issues by theme so the user can see the shape of the backlog at a glance. Typical PedagogIA themes:

- **Bugs** (label `bug`) — user-facing regressions, usually highest priority
- **Infra / devops** (label `infra`) — prod hardening, monitoring, staging, CI
- **Backend** (label `backend`, `database`, `ai`)
- **Frontend / UX** (label `frontend`, `ux`, `skill-tree`)
- **Content** (label `skill-tree` combined with backend, exercise templates)

Inside each group, list at most 4–5 issues, `#N title`. If the backlog is huge, surface the oldest and the newest and say "N more" rather than dumping all of them.

Then finish with **one recommended pick** and the rationale in a sentence. The user asked a "devops" flavored question so bias toward user-facing bugs and prod hardening when choosing. Good heuristics:

- Open bug labeled `bug` → almost always first. Users notice these.
- Prod-security issues (`/admin/` hardening, fail2ban, WAF) that pair up → batch them.
- Monitoring before more features — you can't tell if new work regresses prod without it.
- Big refactors (`refactor` label) → only suggest these when the backlog is quiet, because they block other work.

Phrase the pick as a proposal, not a decision: "My pick: #98 first (user-facing bug), then #100 + #101 together. Want me to start there?" The user should be able to redirect in one word.

## What not to include

- Don't enumerate every commit in `git log` — the user asked for status, not history.
- Don't run the test suite, lint, or the dev stack. Status is read-only. If the user wants CI insight, the PR check rollup already has it.
- Don't include raw tool output (full tables from `gh issue list`) in the final message — digest it first.
- Don't write a closing summary paragraph. The recommended pick is the ending.

## Edge cases

- **No open issues** — say so and suggest the user file one, or point at closed-recently issues for context.
- **Dirty files that look like skill/tooling work** (paths under `.claude/skills/`, `.claude/worktrees/`, `design/`) — flag them separately from code changes. These are often in-progress meta-work the user may want to keep, not dirt to discard.
- **Detached HEAD or branch not tracking `origin`** — surface loudly. This usually means a mid-rebase or a checkout that went sideways.
- **User asks in French** ("fais le point", "où on en est") — answer in French, keep the same structure.
