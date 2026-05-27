---
date: 2026-05-27
topic: fork-sync-and-actions-bump
project: nodejs-goof
---

# Fork Sync And Actions Bump

## TL;DR
Resolved merge conflicts on stalled sync-fork PR #183 (head was on upstream `snyk-labs`, so original PR was unfixable — replaced with #201). Then audited every GitHub Actions workflow, bumped deprecated action versions (v1/v2 → v4, codeql v1/v2 → v3) across 19 files in PR #202. Initialized local Claude memory and a full CLAUDE.md.

## What Was Worked On
- **PR #183 conflict resolution** — diagnosed conflicts in [Dockerfile](Dockerfile) and [docker-compose.yml](docker-compose.yml); discovered the PR head was on `snyk-labs/nodejs-goof:main` (not the fork), making direct push impossible.
- **Replacement PR #201** — closed #183, opened #201 (`main` → `master`) from a fork-owned branch carrying the merged + resolved commit; merged.
- **GitHub Actions audit** — identified deprecated action versions causing auto-failures (`actions/upload-artifact@v2` hard-deprecated, `checkout@v1/v2`, `codeql-action@v1/v2`, floating `@master` pins).
- **PR #202** — sweep-bumped action majors across 19 workflows in one mechanical commit. Hit an OAuth `workflow` scope issue on push; resolved via `gh auth setup-git`.
- **`/init-memory` skill run** — fresh init since no prior global memory existed. Wrote `memory/project_purpose.md` and `memory/fork_sync_pattern.md`, indexed in `memory/MEMORY.md`.
- **`/init-docs` skill run** — expanded `CLAUDE.md` from a one-line stub into a full doc. README.md left untouched (it's the canonical demo walkthrough).

## What Changed
| File | Change |
|------|--------|
| `Dockerfile` | merged — kept local `LABEL` + `imagemagick`, kept `node:18.13.0` (via PR #201) |
| `docker-compose.yml` | merged — fixed `mongo3` typo back to `mongo:3` (via PR #201) |
| `.github/workflows/*.yml` (19 files) | bumped action versions to current stable majors (PR #202) |
| `memory/MEMORY.md` | created |
| `memory/project_purpose.md` | created |
| `memory/fork_sync_pattern.md` | created |
| `CLAUDE.md` | expanded from stub to full project doc |
| `sessions/` | directory created (first session file) |

## Key Decisions
- **Closed #183 instead of trying to update it.** When a sync-fork PR's head is on the upstream repo, you can't push fixes to it. Opening a fresh PR from a fork-owned branch is the only path forward.
- **Used `image: mongo:3` (not `mongo3`).** The typo on master was clearly broken; the upstream form is the correct one and matches the README's "MongoDB 3 is known to work" note.
- **Kept local Dockerfile additions** (`LABEL`, `imagemagick`) — these are intentional demo-specific tweaks, not noise.
- **Did not bump `snyk/actions/*@master`.** Floating-master pins are intentional for this demo repo (always show latest Snyk Action behavior). Other action pins bumped to v4/v3 for stability.
- **Did not rewrite README.md.** Upstream content is accurate and load-bearing for demos. Targeted updates to CLAUDE.md instead.

## Open Threads
- [ ] **Create `.claude/settings.local.json`** with `{ "autoMemoryDirectory": "memory" }` — auto-mode classifier blocked the write. Without it, `autoMemoryDirectory` isn't active.
- [ ] **Add `.gitignore` exception** for `.claude/settings.local.json` if the setting should travel with the repo — global gitignore (`~/.config/git/ignore`) currently blocks it.
- [ ] **Restart Claude Code** after creating settings.local.json so `autoMemoryDirectory` takes effect.
- [ ] **Commit the staged memory files and CLAUDE.md** — currently staged but not committed.
- [ ] **Verify PR #202 CI passes** — `UNSTABLE` status was just pending checks at PR creation time.
- [ ] **Consider bumping `snyk/actions@0.3.0`** in [.github/workflows/snyk.yml](.github/workflows/snyk.yml) — flagged but left alone in #202.

## References
- PR #183 (closed) — original sync-fork with unreachable upstream head
- PR #201 (merged) — replacement sync-fork with conflicts resolved
- PR #202 (open) — GitHub Actions version bumps
- [memory/fork_sync_pattern.md](../memory/fork_sync_pattern.md) — durable record of the cross-fork PR + `workflow` scope gotchas
- [memory/project_purpose.md](../memory/project_purpose.md) — fork purpose + demo conventions
