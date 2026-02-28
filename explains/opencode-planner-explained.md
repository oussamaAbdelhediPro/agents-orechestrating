# Explained: `.opencode/agents/planner.md`

**Purpose:** The read-only planning subagent. Analyzes feature requirements and produces a structured implementation plan — identical conceptual role to Copilot's `planner.agent.md`.

---

## Full File

```markdown
---
name: Planner
description: Analyzes feature requests and creates detailed implementation plans
mode: subagent
model: anthropic/claude-haiku-4-5
temperature: 0.1
tools:
  bash: false
  write: false
  edit: false
---

You are a software architect and technical planner for a TypeScript Express API project.

Your ONLY job is to analyze requirements and produce a structured implementation plan. You do NOT write code, create files, or make any changes.

## Your Output Format

Always produce a plan in this exact structure:

### Implementation Plan

**Feature:** [name of feature]
**Estimated complexity:** [Low / Medium / High]
**Files to modify:**
- `src/models/task.model.ts` — [what changes]
- `src/services/task.service.ts` — [what changes]
- `src/routes/tasks.routes.ts` — [what changes]
- `src/utils/validation.ts` — [what changes if any]
- `tests/tasks.test.ts` — [what tests to add]

**Implementation steps:**
1. [First step]
2. [Second step]
...

**Edge cases to handle:**
- [Edge case 1]
- [Edge case 2]

**API contract:**
- Method: [HTTP method]
- Path: `/tasks/[path]`
- Request body: `{ field: type }`
- Success response: `{ data: ... }` with status [code]
- Error responses: `{ error: "..." }` with status [code]

## Rules
- Do not write actual code — describe changes in plain English
- Always check existing files before planning (use read tool)
- Identify ALL files that need changes, not just the obvious ones
- Flag any breaking changes
- If requirements are ambiguous, state your assumptions explicitly
```

---

## Line-by-Line Explanation

### Frontmatter

```yaml
---
name: Planner
description: Analyzes feature requests and creates detailed implementation plans
mode: subagent
model: anthropic/claude-haiku-4-5
temperature: 0.1
tools:
  bash: false
  write: false
  edit: false
---
```

**`name: Planner`**
The identifier used when the orchestrator calls this agent. In OpenCode, the orchestrator calls it via `Task("Planner", ...)` or by using `@planner` syntax. The `name` field in the frontmatter must match the filename (the file is `planner.md` and the name is `Planner`).

---

**`mode: subagent`**
This is a critical OpenCode-specific concept. Two modes exist:
- `mode: primary` — the main interactive agent; the user talks to this directly
- `mode: subagent` — a specialist agent; only invoked by another agent (never directly by the user)

The planner is `subagent` because:
- Users never call it directly
- It only activates when the orchestrator delegates a planning task to it
- It runs in its own sandboxed context, produces output, and returns

Compare with Copilot's `user-invokable: false` — same concept, different key name.

---

**`model: anthropic/claude-haiku-4-5`**

The planner uses **Claude Haiku** instead of the default **Claude Sonnet** (configured in `opencode.json`).

**Why?** Cost optimization. The planning task is:
- Read-only (doesn't need to execute anything complex)
- Analytical (well-suited to Haiku's capabilities)
- Output: structured text (not complex reasoning)

Haiku is significantly cheaper per token than Sonnet. Using Haiku for the planner and reviewer (simple text analysis tasks) while reserving Sonnet for the implementer (complex code generation) optimizes the cost/performance ratio of the entire pipeline.

This model-per-agent flexibility doesn't exist in Copilot — all Copilot agents use whatever model the user has configured globally.

---

**`temperature: 0.1`**

Low temperature (range: 0.0–1.0). Closer to 0 = more deterministic, closer to 1 = more creative.

**Why 0.1 for the planner?**
Planning requires **consistency and precision**, not creativity. Given the same feature request, the planner should produce almost the same plan every time. High temperature would produce different plans on each invocation, making the system unpredictable.

Compare with the Implementer (temperature: 0.2) — slightly higher because code generation benefits from some variety (different ways to name a variable, structure a function), but still low for correctness.

---

**`tools:` block**

```yaml
tools:
  bash: false
  write: false
  edit: false
```

This uses **blacklist syntax** — explicitly blocking specific tools. Everything not listed is allowed.

The planner blocks:
- `bash` — no shell commands
- `write` — no file creation
- `edit` — no file modification

What's implicitly allowed (by not being blocked):
- `read` — reading files
- `search` — searching the codebase
- `grep` — pattern matching in files

**Why blacklist instead of whitelist?**
OpenCode agents default to having many tools available. For read-heavy agents (planner, reviewer) it's simpler to block the dangerous ones (write/edit/bash) than to enumerate the safe ones.

Compare with Copilot's `tools: [read, search]` which is a **whitelist** — only the listed tools are available. Both approaches achieve the same result (read-only agent), but through opposite mechanisms.

**Tradeoff:**
- Whitelist (Copilot): explicit, safe — new tools don't accidentally become available
- Blacklist (OpenCode): convenient — you only need to enumerate what to block

---

### System Prompt

The system prompt content is identical to the Copilot Planner. Same structured output format, same rules.

This is intentional — the Planner's job is the same regardless of which AI coding tool is orchestrating it. The output format (Implementation Plan with Files, Steps, Edge Cases, API Contract) is tool-agnostic.

---

## Key Takeaway: Model Selection is per Agent

The most unique feature of this file is `model: anthropic/claude-haiku-4-5`. OpenCode lets every agent run on a *different model*. This enables a cost-efficient tiered architecture:

| Agent | Model | Why |
|-------|-------|-----|
| Planner | Claude Haiku | Read-only, analytical, cheap |
| Implementer | Claude Sonnet | Complex code generation, needs capability |
| Reviewer | Claude Haiku | Read-only, analytical, cheap |
| Orchestrator | Claude Sonnet (default) | Coordination logic, moderate complexity |

Real-world parallel: you hire interns (cheaper) for research tasks and seniors (expensive) for design and implementation. Same concept applied to AI agents.
