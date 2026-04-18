---
name: deploy
description: Ship the current branch to prod — merge the open PR into `main` (after confirming CI is green and the user is ready), then tag the resulting merge commit with a user-chosen semver version so GHCR gets a `:vX.Y.Z` image and a GitHub Release is created. Use this skill whenever the user says "deploy", "deploy this", "ship it", "ship this", "let's deploy", "release this", "cut a release", "push to prod", "go to prod", "merge and tag", "release it", or any French variant ("déploie", "on déploie", "met en prod", "release-moi ça", "tag et merge"). Also worth using proactively right after a PR has been reviewed and approved and the user signals they're ready to move on. This skill exists because PedagogIA's release policy — one semver tag per main merge, chosen by the human, never auto-derived — is easy to forget, and because the ordering (confirm CI → confirm version → merge → pull → tag → push tag) has a couple of non-obvious steps (tag must land on the merge commit, not the feature tip; main push auto-deploys but tag push does not) that drift if re-derived each time.
---

# Deploy — merge + tag a release

This skill executes PedagogIA's release flow end-to-end: merge the current branch's PR into `main`, then tag the resulting merge commit with a human-chosen semver version. The **why** behind this policy — every main merge is a release, version chosen by the human — lives in [`vault/wiki/concepts/release-process.md`](../../../vault/wiki/concepts/release-process.md). Read that if you need to explain the policy; this skill is the *how*.

The golden path is: confirm CI → propose version → merge → pull main → tag → push tag → verify. Five shell commands, one question to the user. Don't skip the question.

## Preflight — check where we are

Run these in parallel. The combination tells you exactly which branch of the flow to take.

```bash
git branch --show-current
git status --short
gh pr status --json number,title,state,mergeable,mergeStateStatus,headRefName,url,isDraft,statusCheckRollup
git tag --list --sort=-v:refname | head -5
git log --oneline origin/main..HEAD 2>/dev/null | head -5
```

Interpret:

- **Current branch is `main`.** The user probably means "tag the current HEAD as a release" — skip the merge phase entirely, jump to *Ask for the version*. Confirm with them first ("You're on main with nothing to merge — do you want to tag `HEAD` as a release?").
- **Current branch is a feature branch with an open PR (`currentBranch` in `gh pr status`).** Standard path. Continue below.
- **No PR open.** Stop. Ask the user whether they want to open a PR first (`gh pr create`) or push to main directly (they won't — the repo workflow is PR-based).
- **Current branch is a feature branch with no PR and no upstream.** Same — stop and ask.
- **Dirty working tree.** Stop. Surface the uncommitted files and ask whether to commit, stash, or abort. Never merge or tag with a dirty tree; the merge commit would be fine but a dirty tag can silently go into `git describe --dirty` output.

## Confirm the PR is mergeable

From the `gh pr status` payload, check:

- `state` = `OPEN` (not `MERGED`, not `CLOSED`)
- `isDraft` = `false` — if true, ask the user whether to mark ready (`gh pr ready <N>`) or abort
- `mergeable` = `MERGEABLE` — if `CONFLICTING`, stop; conflicts are not this skill's job
- `mergeStateStatus` = `CLEAN` or `HAS_HOOKS` or `UNSTABLE` — green CI. If `BLOCKED` (required review missing) or `BEHIND` (needs rebase), surface it and ask.
- `statusCheckRollup` — every check's `conclusion` should be `SUCCESS` or `NEUTRAL`. If anything is `FAILURE` / `CANCELLED` / `IN_PROGRESS`, report which check and stop. Don't merge over red or yellow.

If CI is still running, ask the user whether to wait (`gh pr checks <N> --watch`) or abort. Don't block for more than a minute without checking in with them — merges under time pressure are exactly when people ship bad stuff.

## Ask for the version

This is the one mandatory human step. The skill must not pick a version on its own.

1. Find the latest release tag: `git tag --list 'v*' --sort=-v:refname | head -1`. Call it `vA.B.C`. If no tags exist, the repo is pre-release — suggest **`v0.1.0`**.
2. Read the PR title + body and the commits to form a one-line opinion on bump size:
   - PATCH (`vA.B.(C+1)`) — bugfix, infra tweak, doc, chore, CI change, dependency bump without behaviour change.
   - MINOR (`vA.(B+1).0`) — new user-visible feature, new API endpoint, new exercise type, new screen.
   - MAJOR (`v(A+1).0.0`) — breaking API, DB schema change needing coordination, intentional UX overhaul. Stay in `0.x.y` during POC; `1.0.0` is a deliberate milestone.
3. Present all three options with your recommendation and reasoning, then ask. Example:

   ```
   Current: v0.3.2. This PR wires Sentry + adds an /api/health/ version field —
   new observability feature, no breaking change.

   - v0.3.3 (patch) — if you'd rather not bump minor for infra
   - v0.4.0 (minor) — my pick: new user-visible surface (version in footer) + new release flow
   - v1.0.0 (major) — not this one; stay pre-1.0 for POC

   Ship as v0.4.0?
   ```

4. **Wait for the user to confirm.** Don't proceed on silence. If they propose a different version, use theirs.

## Merge

Default to squash merge — matches the repo's history (`(#134)` suffix style on existing main commits).

```bash
gh pr merge <N> --squash --delete-branch
```

Use `--delete-branch` unless the user explicitly wants to keep the branch (rare; maybe for long-lived refactor branches). Don't pass `--admin` — don't bypass branch protection.

If the merge fails:
- **Protected branch rejection** — the user lacks merge permission right now. Stop; don't suggest `--admin`.
- **Checks not passing at merge time** — GitHub sometimes re-evaluates; report the flapping check, don't retry in a loop.

## Land on main and tag

```bash
git checkout main
git pull --ff-only
git log -1 --format='%H %s'          # sanity-check: the merge commit is on top
git tag vX.Y.Z
git push origin vX.Y.Z
```

A few subtleties worth knowing:

- **Tag the merge commit, not the feature tip.** After `git pull --ff-only` on main, `HEAD` is the squash commit — that's the right target. `git tag` with no ref tags HEAD, which is what we want.
- **No `-a`, no signing.** Lightweight tags are what `release.yml` expects (`--verify-tag` works with lightweight).
- **Never force-push a tag.** If you tagged the wrong commit, create the next PATCH on the right one and note the skip in the release notes. Tags are forward-only.
- **Can't checkout main here?** If `.claude/worktrees/bugfix` (or any other worktree) already has `main` checked out, `git checkout main` fails. Run the pull + tag + push from that worktree instead (`git -C .claude/worktrees/bugfix ...`). Don't detach HEAD just to work around it.

## Verify (optional but nice)

After the tag push, two workflows should be running. A quick glance reassures the user without you having to SSH anywhere.

```bash
gh run list --limit 5
gh run watch <run-id>   # only if they want to wait
```

What to expect:
- `Deploy` workflow (build job only on tag push) — pushes `:vX.Y.Z` image to GHCR. The `deploy` job is gated on `github.ref_type == 'branch'` so it **doesn't** redeploy from the tag; the main-push deploy that fired on merge is what actually shipped to prod.
- `Release` workflow — creates the GitHub Release with auto-generated notes.
- Prod check (only if the user asks): `curl -s https://collegia.be/api/health/ | jq` — the `version` field should now be `vX.Y.Z` once the main-push deploy has finished (takes ~2–4 minutes from merge).

## Closing the loop

One-sentence summary to the user when done:

> Shipped `vX.Y.Z`. PR #N merged → main deploy in progress → tag pushed → GH Release + `:vX.Y.Z` image building.

Then stop. Don't volunteer "what's next" unless they ask — let them pick the next thread.

## Edge cases worth calling out

- **Several PRs open against main, only one is "this" one.** Use the PR tied to the current branch (`gh pr status --json ... .currentBranch`). If ambiguous, ask.
- **User runs this from a stale worktree.** After `git fetch origin`, if the current branch is already merged upstream (PR state `MERGED`), skip the merge and jump straight to tagging the existing main tip — but confirm first, because they may have meant something different.
- **Someone else merged between your preflight and your merge.** `gh pr merge` will fail with a helpful message; pull and retry with a fresh preflight. Don't loop.
- **User asks for a version that already exists.** `git push origin vX.Y.Z` will reject. Ask them to pick a different one; don't try to move the existing tag.
- **User wants to skip tagging "just this once".** Push back gently — the whole point of the policy is that every main merge gets a tag. Only skip if they override explicitly; note that the merged commit will show up as `v(previous)-N-g<sha>` in `git describe` until someone tags it.
- **Pre-1.0, big infra PR feels like it deserves a MINOR bump even though nothing user-facing changed.** That's a judgment call — surface the tension ("no user-visible change, but the infra surface area is substantial — MINOR or PATCH?") and let them decide.

## Why this skill exists, in one paragraph

The release policy is new and load-bearing: every deployed commit in prod gets a human-chosen semver tag, mapping 1-to-1 to Sentry releases and GitHub Releases. Without a skill to codify the flow, the easy failure modes are (1) merging without asking for a version, (2) tagging the feature-branch tip instead of the main merge commit, (3) trying to redeploy from the tag push (the `deploy` job is gated for a reason), and (4) forgetting to push the tag after creating it. Each one costs ten minutes of "why didn't that fire?" the next day. This skill is here to make the right thing the default thing.
