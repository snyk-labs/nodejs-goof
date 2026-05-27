# CLAUDE.md

## Overview
This is a personal fork (`snyk-schmidtty/nodejs-goof`) of `snyk-labs/nodejs-goof` — Snyk's deliberately-vulnerable Node.js demo app. Used for Snyk product demos, customer enablement, and exercising every Snyk scanner (SAST/SCA/IaC/Container/SBOM). **Vulnerabilities here are intentional — never "fix" them as part of unrelated work.**

## Commands
| Command | Description |
|---------|-------------|
| `npm install` | Install deps. Many are deliberately old/vulnerable. |
| `npm start` | Run the app on `:3001` (sets `NODE_OPTIONS=--openssl-legacy-provider`). Requires Mongo 3 on `:27017`. |
| `npm run dev` | Same as `start` but via `nodemon`. |
| `npm run build` | Browserify jQuery into `public/js/bundle.js`. |
| `npm run cleanup` | Wipe TODOs from the local Mongo DB. |
| `npm test` | Runs `snyk test` (SCA scan), not unit tests. |
| `docker-compose up --build` | App + Mongo 3 + MySQL 5 via Compose. |
| `docker run --rm -p 27017:27017 mongo:3` | Standalone Mongo 3 for local dev. |

No real test suite exists — `npm test` invokes Snyk CLI.

## Architecture
```
app.js                  # Express entrypoint; session config has hardcoded secret (intentional)
routes/                 # HTTP handlers — most named vulns live here
  index.js              #   login (NoSQL inj), /admin (open redirect + XSS), /account_details (code inj)
views/                  # EJS / Handlebars templates — unescaped output is part of the demo
public/                 # Static assets, jQuery bundle
exploits/               # Step-by-step exploit recipes per vuln class — load-bearing for demos
tests/                  # Includes hardcoded creds that Snyk Code flags as InTest/Mock
mongoose-db.js          # Mongoose 4.2.4 (vulnerable) connection
typeorm-db.js           # TypeORM connection (MySQL path)
mongoose-injection-demo*.js  # Vulnerable + fixed pair for NoSQL injection demo
xss-example*.js         # Vulnerable + fixed pair for XSS demo
.github/workflows/      # ~20 workflows, one per Snyk scanner variant — demo CI surface
memory/                 # Claude project memory (see below)
```

## Key Files
- [package.json](package.json) — pinned-old deps are the point; do not bump unless explicitly demoing a fix.
- [Dockerfile](Dockerfile) — `FROM node:18.13.0` plus local `LABEL` for `goof-github`. Upstream commentary references `node:6-stretch` for older vuln demos.
- [docker-compose.yml](docker-compose.yml) — pins `mongo:3` (anything newer breaks the old Mongoose driver).
- [.snyk](.snyk) — Snyk policy file; ignores/patches drive what `snyk test` reports.
- [exploits/](exploits/) — canonical demo scripts; treat as documentation, not test fixtures.
- [README.md](README.md) — upstream demo walkthrough; covers every intentional vuln.

## Conventions
- **Vulnerabilities are intentional.** Hardcoded `keyboard cat` session secret, `mongo:3`, old packages, raw `<%- %>` template output — all on purpose.
- **`snyk/actions/*@master`** pins in workflows are intentional (always demo latest behavior). Other action pins (`actions/checkout`, `actions/upload-artifact`, `github/codeql-action/*`) follow current stable majors — see [memory/fork_sync_pattern.md](memory/fork_sync_pattern.md) for the `workflow` scope gotcha when pushing changes.
- **Sync-fork PRs** from `snyk-labs` arrive with `head` on the upstream repo, which means you can't push conflict resolutions to them. The pattern: resolve locally, push to a fork-owned branch, open a new PR. See [memory/fork_sync_pattern.md](memory/fork_sync_pattern.md).
- **Demo artifacts** (`results.sarif`, `Snyk_CLI_output.txt`, `spdx.json`, `*_DepGraph.json`, the various `.Dockerfile` variants) are deliberately committed for show-and-tell — don't prune.

## Memory
Claude memory lives in `memory/` at the repo root, configured via `autoMemoryDirectory: "memory"` in `.claude/settings.local.json`. Index: [memory/MEMORY.md](memory/MEMORY.md).
