---
name: logbook
description: Operate against a logbook MCP server with the correct task lifecycle, need-info reply cycle, hook scaffolding, and one-task-at-a-time workflow. Use this skill when the user asks to work with logbook tasks, status transitions, hook setup, or session startup behavior.
license: Complete terms in LICENSE.txt
---

# Logbook

Use this skill when working with a logbook MCP server. The server already exposes
tool schemas; this skill defines the operating rules and lifecycle contract.

## Start Of Session

1. Call `task.current` before anything else.
2. If it returns a task, read `title`, `description`, and `definition_of_done`.
3. If it returns nothing, call `task.list` with `{ "status": "todo" }`, choose the
   highest-value item, then call `task.update` with `{ "new_status": "in_progress" }`.

## Tool Use Rules

- Always check `ok` before reading `data` from any MCP response.
- On `ok: false`, surface `error.message` and stop that call path.
- Do not duplicate tool input schemas in this skill.
- Use `task.update` for lifecycle transitions.
- Use `task.edit` only for metadata changes such as `title`, `description`,
  `definition_of_done`, or `estimation`.

## One Task At A Time

- Only one task may be `in_progress` for the session.
- Before starting a different task, move the current one to `need_info`,
  `blocked`, or `pending_review`, or provide the required justification comment.

## Status Transitions

| From | To | Comment required? | Notes |
|------|----|-------------------|-------|
| `backlog` | `todo` | No | Grooming only |
| `todo` | `in_progress` | No | Sets `in_progress_since` |
| `in_progress` | `need_info` | Yes | Blocking question for the user |
| `need_info` | `in_progress` | Yes | Answer every open question |
| `in_progress` | `blocked` | Yes | External blocker, not a question |
| `blocked` | `in_progress` | Yes | Describe how the blocker was resolved |
| `in_progress` | `pending_review` | No | Triggers reviewer spawn |
| `pending_review` | `in_progress` | Yes | Reviewer issues only; never self-approve |
| `pending_review` | `done` | Yes | Reviewer approval only |

## Need-Info Cycle

When a task is in `need_info`:

1. Read every comment with `kind: "need_info"` that has no reply.
2. Answer all open questions.
3. Call `task.update` with `new_status: "in_progress"` and a comment whose `reply`
   field contains the answers.

Never return to `in_progress` with an empty or placeholder reply.

## Review Flow

When `definition_of_done` is satisfied:

1. Call `task.update` with `new_status: "pending_review"`.
2. Do not mark the task `done` yourself.
3. Wait for the reviewer to either return the task to `in_progress` with issues or
   move it to `done`.

## Creating Tasks

Use `task.create` when you discover work that is not yet tracked. Supply a
specific, verifiable `definition_of_done`, plus matching `project` and
`milestone` values for the current work context. Use a Fibonacci estimation value
(`1`, `2`, `3`, `5`, `8`, or `13`) when setting or revising effort.

## Hook Scaffolding

Hooks live at:

```text
.logbook/hooks/<id>/
├── config.json
└── script.ts
```

`config.json` must define:

- `id`
- `event`
- `command`
- Optional `condition`
- Optional `timeoutMs`

The supported event today is `task.status_changed`. Hook scripts receive:

- `LOGBOOK_TASK_ID`
- `LOGBOOK_OLD_STATUS`
- `LOGBOOK_NEW_STATUS`
- `LOGBOOK_SESSION_ID`
- `LOGBOOK_TASKS_FILE`

Guard against missing values and exit `0` when the hook should skip work.

### Minimal Script Shape

```typescript
#!/usr/bin/env bun
const taskId = process.env["LOGBOOK_TASK_ID"] ?? ""
if (taskId === "") process.exit(0)

process.exit(0)
```

## Canonical Tool IDs

Treat these dotted lowercase IDs as the source of truth:

- `task.create`, `task.get`, `task.list`, `task.current`, `task.update`,
  `task.edit`, `task.assign.session`, `task.assign.model`,
  `task.assign.phase-model`, `task.estimate`
- `epic.create`, `epic.get`, `epic.list`, `epic.update`, `epic.delete`
- `story.create`, `story.get`, `story.list`, `story.update`, `story.delete`
- `context.create`, `context.get`, `context.list`, `context.update`,
  `context.delete`, `context.attach`, `context.detach`, `context.search`
- `sync.linear.pull`, `sync.linear.push`, `sync.linear.status`,
  `sync.conflicts.list`, `sync.conflicts.resolve`
- `workspace.init`, `workspace.status`
- `hook.list`, `hook.run`
- `plugin.list`

## Non-Goals

- Do not document MCP input schemas.
- Do not document Linear or GitHub sync internals.
- Do not add CLI flag references.
