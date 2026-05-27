---
name: project-purpose
description: What this repo is and how it's used in Schmidtty's day job
metadata:
  type: project
---

This is `snyk-schmidtty/nodejs-goof`, a personal fork of `snyk-labs/nodejs-goof` — Snyk's deliberately-vulnerable Node.js demo app. Used for product demos, customer enablement, and testing Snyk SAST/SCA/IaC/Container workflows.

**Why:** Schmidtty is Field CTO at Snyk; this fork carries demo-specific tweaks (e.g. Dockerfile `LABEL` pointing at `goof-github`, extra GitHub Actions workflows for every Snyk scanner variant) on top of upstream.

**How to apply:** Treat custom additions (CI workflows, Dockerfile labels, demo files like `xss-example.js`, `mongoose-injection-demo.js`, `results.sarif`, `Snyk_CLI_output.txt`) as load-bearing — they're the point of the fork. Don't "clean up" demo artifacts. Floating `@master` pins on `snyk/actions/*` are intentional for the demo (always shows latest behavior). See [[fork-sync-pattern]].
