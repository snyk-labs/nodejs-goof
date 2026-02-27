# Todo Workspace & Automation API

Base URL: `/api`. All endpoints require a **current user**: set the `X-User-Id` header (e.g. to an email or user id) or use session-based login. Unauthenticated requests receive `401`.

---

## Authentication

- **Header:** `X-User-Id: your-user-id-or-email`
- **Session:** If you have logged in via the app (e.g. `/login`), the session user is used when the header is not set.

---

## Workspaces

### Create workspace

`POST /api/workspaces`

**Body:**

```json
{
  "name": "My Workspace",
  "slug": "my-workspace"
}
```

- `slug` is optional; if omitted it is derived from `name` (URL-safe, lowercase). Must be unique.

**Response:** `201` + workspace object (`id`, `name`, `slug`, `createdAt`, `settings`). Caller becomes **owner**.

---

### List workspaces

`GET /api/workspaces`

Returns workspaces the current user is a member of, with `role` per workspace.

**Response:**

```json
{
  "workspaces": [
    {
      "id": "...",
      "name": "My Workspace",
      "slug": "my-workspace",
      "createdAt": "...",
      "settings": {},
      "role": "owner"
    }
  ]
}
```

---

### Get one workspace

`GET /api/workspaces/:id`

Members only. `:id` is the workspace ObjectId.

**Response:** Workspace object.

---

### Update workspace

`PATCH /api/workspaces/:id`

**Body:** `name` (string), `settings` (object). Owner or admin only.

**Response:** Updated workspace object.

---

### Add member

`POST /api/workspaces/:id/members`

**Body:**

```json
{
  "user": "user@example.com",
  "role": "member"
}
```

- `role`: `admin` | `member` | `viewer`. Owner or admin only.

**Response:** `201` + `{ id, workspace, user, role }`.

---

### Remove member

`DELETE /api/workspaces/:id/members/:userId`

Owner or admin only. Owner cannot remove themselves (transfer ownership first).

**Response:** `204`.

---

## Workspace-scoped Todos

All under `GET/POST /api/workspaces/:workspaceId/todos` and `GET/PATCH/DELETE /api/workspaces/:workspaceId/todos/:id`. Require workspace membership; viewers can only read.

### List todos

`GET /api/workspaces/:workspaceId/todos`

**Query:**

| Param       | Type   | Description                                      |
|------------|--------|--------------------------------------------------|
| `page`     | number | Page (default 1)                                 |
| `limit`    | number | Page size (default 20, max 100)                  |
| `sort`     | string | `updated_at`, `-updated_at`, `due_date`, `-due_date`, `priority`, `-priority` |
| `priority` | string | `low` \| `medium` \| `high`                     |
| `tags`     | string | Comma-separated; todos must have all tags        |
| `dueBefore`| ISO8601| due_date < value                                 |
| `dueAfter` | ISO8601| due_date > value                                 |
| `search`   | string | Plain text search in content                     |

**Response:**

```json
{
  "todos": [
    {
      "id": "...",
      "content": "...",
      "due_date": "...",
      "priority": "high",
      "tags": ["a", "b"],
      "updated_at": "...",
      "workspace": "..."
    }
  ],
  "meta": { "total": 42, "page": 1, "limit": 20 }
}
```

---

### Create todo

`POST /api/workspaces/:workspaceId/todos`

**Body:**

```json
{
  "content": "Task description",
  "due_date": "2025-12-31T23:59:59.000Z",
  "priority": "high",
  "tags": ["urgent", "work"]
}
```

- `content` required; `due_date`, `priority`, `tags` optional.

**Response:** `201` + todo object.

---

### Get one todo

`GET /api/workspaces/:workspaceId/todos/:id`

**Response:** Todo object.

---

### Update todo (partial)

`PATCH /api/workspaces/:workspaceId/todos/:id`

**Body:** Any of `content`, `due_date`, `priority`, `tags`.

**Response:** Updated todo object.

---

### Delete todo

`DELETE /api/workspaces/:workspaceId/todos/:id`

Soft delete (sets `deleted_at`). Response: `204`.

---

## Audit log

### List audit events

`GET /api/workspaces/:workspaceId/audit`

**Query:**

| Param          | Type   | Description                    |
|----------------|--------|--------------------------------|
| `action`       | string | e.g. `todo.created`           |
| `resourceType` | string | `todo` \| `workspace` \| `member` |
| `actor`        | string | User id                        |
| `from`         | ISO8601| createdAt >= from              |
| `to`           | ISO8601| createdAt <= to                |
| `page`         | number | Default 1                      |
| `limit`        | number | Default 50, max 100            |

**Response:**

```json
{
  "events": [
    {
      "id": "...",
      "workspace": "...",
      "actor": "user@example.com",
      "action": "todo.created",
      "resourceType": "todo",
      "resourceId": "...",
      "details": {},
      "ip": "...",
      "createdAt": "..."
    }
  ],
  "meta": { "total": 100, "page": 1, "limit": 50 }
}
```

Newest first.

---

## Webhooks

Owner or admin only.

### Create webhook

`POST /api/workspaces/:workspaceId/webhooks`

**Body:**

```json
{
  "url": "https://example.com/webhook",
  "secret": "optional-secret-for-hmac",
  "events": ["todo.created", "todo.updated"],
  "active": true
}
```

- `events`: array of event names. Default: all (`todo.created`, `todo.updated`, `todo.deleted`, `workspace.updated`, `member.added`).
- `secret`: if omitted, a random secret is generated (returned only at creation; store it).

**Response:** `201` + `{ id, url, events, active, createdAt }`. Secret is not returned in list/get.

---

### List webhooks

`GET /api/workspaces/:workspaceId/webhooks`

**Response:** `{ webhooks: [ { id, url, events, active, createdAt, lastFailure } ] }`.

---

### Delete webhook

`DELETE /api/workspaces/:workspaceId/webhooks/:id`

**Response:** `204`.

---

### Webhook delivery

Outgoing POST body:

```json
{
  "event": "todo.created",
  "resourceType": "todo",
  "resourceId": "...",
  "workspaceId": "...",
  "data": { ... },
  "timestamp": "2025-02-20T12:00:00.000Z"
}
```

Header: `X-Webhook-Signature: sha256=<hmac-hex>` (HMAC-SHA256 of the raw JSON body using the webhook secret). Timeout 15s; retries up to 3 with backoff. Payload capped at 100kb.

---

## Automation rules

Owner or admin only. Max 50 rules per workspace; max 5 actions per rule.

### Create rule

`POST /api/workspaces/:workspaceId/rules`

**Body:**

```json
{
  "name": "High priority reminder",
  "enabled": true,
  "trigger": "todo.created",
  "schedule": "0 9 * * *",
  "conditions": [
    { "field": "priority", "op": "eq", "value": "high" },
    { "field": "tags", "op": "contains", "value": "urgent" },
    { "field": "due_date", "op": "before", "value": "2025-12-31" }
  ],
  "actions": [
    { "type": "send_webhook", "url": "https://example.com/notify", "secret": "optional" },
    { "type": "update_todos", "updates": { "priority": "high" } }
  ]
}
```

- **trigger:** `schedule` | `todo.created` | `todo.updated`. For `schedule`, `schedule` must be a valid cron expression (e.g. `0 9 * * *` = 9am daily).
- **conditions:** array of `{ field, op, value }`. Supported: `eq`, `neq`, `in`, `contains` (for tags), `before`/`after` (for due_date).
- **actions:** `send_webhook` (POST to URL with context) or `update_todos` (bulk update todos matching conditions, limit 100).

**Response:** `201` + rule object.

---

### List rules

`GET /api/workspaces/:workspaceId/rules`

**Response:** `{ rules: [ ... ] }`.

---

### Get one rule

`GET /api/workspaces/:workspaceId/rules/:id`

---

### Update rule

`PATCH /api/workspaces/:workspaceId/rules/:id`

**Body:** Any of `name`, `enabled`, `schedule`, `conditions`, `actions`.

---

### Delete rule

`DELETE /api/workspaces/:workspaceId/rules/:id`

**Response:** `204`.

---

## Error responses

- `400`: Validation failed; body includes `error` and optionally `details` (express-validator format).
- `401`: Authentication required.
- `403`: Forbidden (e.g. not a member, or insufficient role).
- `404`: Resource not found.
- `409`: Conflict (e.g. slug already exists, user already member).
