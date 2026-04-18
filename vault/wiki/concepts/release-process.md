---
title: Release process
type: concept
created: 2026-04-18
updated: 2026-04-18
sources: []
tags: [infra, deployment, versioning, ci]
---

How a change gets from a PR to a tagged release in prod. Every merge to `main` is a release — one human-chosen semver version, one git tag, one GHCR versioned image, one GitHub Release. Paired with the auto-deploy pipeline described in [[concepts/prod-stack]].

## Policy

- **Scheme:** semver, `vMAJOR.MINOR.PATCH`. Pre-1.0 during POC; MAJOR bump is a deliberate milestone, not automatic.
- **One release per main merge.** No "batched" releases. If a PR is merged, it ships.
- **Version is chosen by the human, not derived.** CI *can* derive a version via `git describe` for unlabeled builds, but every commit that lands on main must be explicitly tagged.
- **Ask before merging.** Claude must ask the user which version to bump to *before* merging any PR into main. Never guess.

## Bump heuristics

| Change | Bump |
|---|---|
| bugfix, doc, chore, infra tweak | `PATCH` (`0.1.0 → 0.1.1`) |
| new user-visible feature, new API endpoint | `MINOR` (`0.1.0 → 0.2.0`) |
| breaking change (API contract, DB schema requiring migration coordination, UX shift) | `MAJOR` (`0.x.y → 1.0.0`) once we're past POC |

## Flow

1. **PR is green and approved.**
2. **Claude asks the user:** *"Current version is `vA.B.C`. What should this merge ship as? Suggest `vA.B.(C+1)` — it's a bugfix / Suggest `vA.(B+1).0` — it's a feature."*
3. **User confirms the version.**
4. **Merge PR to main** (`gh pr merge --squash` or equivalent). The normal `deploy.yml` pipeline builds `:latest` and the `:sha-<short>` image and deploys to prod.
5. **Tag the merge commit:**
   ```bash
   git checkout main && git pull
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```
6. **Verify:**
   - `release.yml` creates a GitHub Release with auto-generated notes.
   - `deploy.yml` (build job only, no redeploy) pushes a `:vX.Y.Z` image to GHCR.
   - `/api/health/` on prod returns the new version once the pipeline has finished the main-push deploy.
   - Sentry starts grouping events under the new release.

## Where the version shows up

- **Source of truth:** the git tag on the merge commit.
- **Bakeries (build time):**
  - `APP_VERSION` build-arg → backend image `ENV APP_VERSION` → `django.conf.settings.APP_VERSION`.
  - `VITE_APP_VERSION` build-arg → Vite bundle → `import.meta.env.VITE_APP_VERSION`.
  - Same value feeds Sentry `release` on both sides.
- **Surfaces (runtime):**
  - `GET /api/health/` → `{"status": "ok", "version": "vX.Y.Z"}`
  - Welcome / Serre screen footer — discreet monospace line, `data-testid="app-version"`.
  - GHCR image tags: `:latest`, `:sha-<short>`, and `:vX.Y.Z`.

## Edge cases

- **Forgot to tag after merging.** Tag the merge commit retroactively; `release.yml` + tagged image will still fire. The `latest` image in GHCR will already be the same commit, so no prod drift.
- **Hotfix on top of an older tag.** Tag the new merge commit with the next PATCH — tags are forward-only, never reused.
- **Accidentally tagged the wrong commit.** Don't force-push a tag. Create the next PATCH on the right commit and note the skipped version in the GitHub Release notes.
- **PR merged outside the usual flow (manual CLI push, rebase merge).** Same rule: ask for the version, tag the resulting main tip.

## See also

- [[concepts/prod-stack]] — how a deploy actually reaches the server
- [[concepts/edge-security]] — Cloudflare + Caddy in front of the deployed version
- `docs/architecture.md` §CI/CD — repo-side map of workflows
- `.github/workflows/deploy.yml`, `.github/workflows/release.yml` — the pipelines themselves
