# Architecture: Workspaces, Audit, Webhooks, and Rules

## Overview

The Todo Workspace & Automation layer adds multi-tenant workspaces, an audit log, outbound webhooks, and an automation rule engine. Events flow from API mutations → audit → webhooks and into the rule engine.

## Workspaces

- **Workspace**: name, URL-safe `slug`, settings (JSON). One workspace can have many members and many todos.
- **WorkspaceMember**: links a user (by string id/email) to a workspace with a role: `owner`, `admin`, `member`, or `viewer`.
- **Todo**: optional `workspace` (ObjectId). Todos without a workspace remain global/default for backward compatibility.
- **Auth**: “Current user” is taken from the `X-User-Id` header or from the session. All workspace and todo endpoints enforce membership/role where needed.

## Audit

- **AuditEvent**: workspace, actor (user id), action (e.g. `todo.created`, `workspace.updated`, `member.added`), resourceType (todo | workspace | member), resourceId, details (JSON), ip, createdAt.
- Each mutation (todo CRUD, workspace update, member add/remove) creates an audit event via `services/audit.js`. The audit API exposes a paginated, filterable list per workspace.
- Optional retention: `scripts/audit-retention.js [days]` deletes events older than the given days (default 90).

## Webhooks

- **Webhook**: workspace, url, secret (for HMAC), events (array of event names), active flag.
- On each audited event (or a defined subset), the app enqueues a delivery in an **in-memory queue** in `services/webhook-delivery.js`.
- A **worker** (same process, triggered when the queue is drained) POSTs to the webhook URL with a JSON body and `X-Webhook-Signature: sha256=<hmac-hex>`. Timeout 15s; payload capped at 100kb. Retries up to 3 times with backoff. Last failure is stored on the Webhook document (and optionally in WebhookDelivery for history).

## Rules (automation)

- **Rule**: workspace, name, enabled, trigger (`schedule` | `todo.created` | `todo.updated`), schedule (cron expression), conditions (JSON array), actions (JSON array).
- **Condition evaluator** (in `services/rule-engine.js`): given a todo or context, evaluates conditions (field eq/neq/in, due_date before/after, tags contains).
- **Action executor**: `send_webhook` — POST to a URL with context; `update_todos` — bulk update todos matching the same conditions (with a limit, e.g. 100).
- **Execution:**
  - On `todo.created` / `todo.updated`, the workspace-todos route calls the rule engine to find rules with that trigger, evaluate conditions, and run actions (fire-and-forget).
  - **Cron:** `node-cron` runs every minute. For each rule with `trigger: schedule`, the engine checks whether the rule’s cron expression fires in the current minute; if so, it runs conditions against todos and executes actions.

## Event flow (summary)

1. **API** (e.g. create/update/delete todo, update workspace, add/remove member) runs in route handlers.
2. **Audit**: Route handlers (or shared helpers) call `audit.createEvent(...)` after the mutation.
3. **Webhooks**: The same code path (or a post-audit hook) calls `webhookDelivery.notifyWebhooks(workspaceId, event, payload)`, which enqueues deliveries for active webhooks subscribed to that event.
4. **Rules**: For todo create/update, the route calls `ruleEngine.runRulesForTodo(workspaceId, trigger, todo, cb)`. For schedule triggers, the cron job in the rule engine runs every minute and executes matching rules.

All new REST handlers live under `routes/` (workspaces.js, workspace-todos.js, audit.js, webhooks.js, rules.js), and business logic is in `services/` (audit.js, webhook-delivery.js, rule-engine.js, workspace-auth.js).
