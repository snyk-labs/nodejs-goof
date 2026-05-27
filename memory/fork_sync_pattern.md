---
name: fork-sync-pattern
description: Gotcha when fixing merge conflicts on "sync-fork" PRs in this repo
metadata:
  type: project
---

GitHub's "Sync fork" button sometimes opens a PR whose **head is on `snyk-labs/nodejs-goof`** (upstream), not on `snyk-schmidtty/nodejs-goof`. When that PR has conflicts, you can't push fixes — you don't own the head.

**Why:** Discovered during the PR #183 → #201 episode (2026-05-27). The head was `snyk-labs:main`, base was `snyk-schmidtty:master`. Local conflict resolution had to be re-pushed as a *new* PR from a fork-owned branch.

**How to apply:** Before resolving conflicts on a sync-fork PR, check `gh api repos/snyk-schmidtty/nodejs-goof/pulls/<N> --jq '.head.repo.full_name'`. If it's `snyk-labs/...`, the right workflow is: merge upstream locally, push the merge commit to a branch on `snyk-schmidtty`, close the original PR, open a new PR from that branch → master.

Also note: pushing to files under `.github/workflows/` requires the OAuth token to have the `workflow` scope. If `git push` fails with "refusing to allow an OAuth App to create or update workflow", run `gh auth setup-git` to refresh the credential helper (the `gh` token already has the scope, but the git helper may be using an older cached cred).
