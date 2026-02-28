# Deep Dive into Agent Orchestration
### Track 2 — OpenCode

**Duration:** 1h15 hands-on &nbsp;|&nbsp; **Prerequisites:** [00-introduction.md](./00-introduction.md)

---

## What You Will Build

A four-agent orchestration system using OpenCode:

```
  User prompt: "Add PATCH /tasks/:id with validation and tests"
        │
        ▼
  ┌─────────────────┐
  │   Orchestrator  │  .opencode/agents/orchestrator.md  (primary agent)
  └────────┬────────┘
           │  invokes subagents
     ┌─────┼──────┐
     ▼     ▼      ▼
  Planner Impl. Reviewer
  (subagents — isolated child sessions)
```

---

## How OpenCode Agents Work

OpenCode agents are defined as **Markdown files with YAML frontmatter** placed in `.opencode/agents/` (project-scoped) or `~/.config/opencode/agents/` (global).

```yaml
---
description: Does X       # Required. Shown in UI and used for auto-selection
mode: subagent            # primary | subagent | all
model: anthropic/claude-sonnet-4-5  # Optional model override
tools:
  write: false            # Disable specific tools
  edit: false
  bash: false
temperature: 0.1          # 0.0–1.0
---
System prompt goes here.
```

**Agent modes:**

| Mode | Description |
|------|-------------|
| `primary` | Interactive agents you switch to with `Tab` |
| `subagent` | Background workers invoked by primary agents via `@mention` |
| `all` | Available as both |

**Invoking subagents:**  
From within any agent prompt or instructions, reference a subagent with `@agent-name`.
The subagent runs in a **child session** with an isolated context.

---

## Installation & Setup

If you haven't installed OpenCode yet:

```bash
# Option A — curl (recommended)
curl -fsSL https://opencode.ai/install | bash

# Option B — npm
npm i -g opencode-ai@latest

# Option C — Scoop (Windows)
scoop bucket add anomalyco https://github.com/anomalyco/scoop-bucket
scoop install opencode

# Verify installation
opencode --version
```

### Connect a Provider

```bash
cd workshop/starter-project
opencode
```

Inside the OpenCode TUI, connect your provider:
```
/connect
```

Choose a provider and paste your API key. Recommended free options:
- **Google Gemini** — generous free tier at [aistudio.google.com](https://aistudio.google.com)
- **Anthropic Claude** — [console.anthropic.com](https://console.anthropic.com)
- **GitHub Copilot** — if you have a license, select "GitHub Copilot" and authenticate

---

## Phase 1 — Project Instructions (10 min)

### Step 1.1 — Generate AGENTS.md

Inside the OpenCode TUI (while in `starter-project/` directory):

```
/init
```

OpenCode scans your project and generates an `AGENTS.md` file. Review it, then **replace its contents** with the following tailored instructions:

```markdown
# Task Manager API

A TypeScript/Express REST API for managing tasks.
Source code in `src/`, tests in `tests/`, no database (in-memory Map).

## Project Structure
- `src/models/task.model.ts` — Task type and DTOs
- `src/services/task.service.ts` — Business logic, in-memory store
- `src/routes/tasks.routes.ts` — Express route handlers
- `src/app.ts` — Express app setup
- `tests/tasks.test.ts` — Integration tests

## Code Standards
- TypeScript strict mode — all types must be explicit
- Use `async/await` — no raw callbacks or `.then()` chains
- Named exports only (exception: Express `app`)
- Route handlers are thin — business logic belongs in the service layer
- RESTful status codes: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 404 Not Found

## Validation Rules for Tasks
- `title`: required, string, 1–100 characters
- `description`: optional, string, max 500 characters
- `status`: optional enum — "todo" | "in-progress" | "done"
- `:id` params must be valid UUID v4

## Testing Standards
- Jest + Supertest for integration tests
- Test file pattern: `tests/*.test.ts`
- Every endpoint needs: happy path + 404 + input validation cases
- Test descriptions: imperative mood — "returns 201 when...", "returns 400 when..."

## Build & Test Commands
- `npm run build` — compile TypeScript
- `npm test` — run all tests
- `npm run dev` — start dev server on port 3000
```

> **Checkpoint:** Ask OpenCode `What are the coding standards for this project?` — it should reference the AGENTS.md content.

### Step 1.2 — Create `opencode.json`

Create the file `opencode.json` at the root of `starter-project/`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-5",
  "instructions": [
    "AGENTS.md"
  ],
  "agent": {
    "build": {
      "permission": {
        "bash": "ask"
      }
    }
  }
}
```

This sets the default model and ensures AGENTS.md is always loaded. The `bash: "ask"` permission means OpenCode will ask before running shell commands — good for a workshop.

> **Checkpoint:** Exit and restart OpenCode. Verify the model shown matches your configured model.

---

## Phase 2 — Create Specialized Agents (25 min)

We'll create three subagents — workers responsible for one narrow job each.

First, create the agents folder:

```bash
mkdir -p .opencode/agents
```

### Step 2.1 — The Planner Agent

Create `.opencode/agents/planner.md`:

```markdown
---
description: Analyzes the codebase and produces a detailed, actionable implementation plan
mode: subagent
model: anthropic/claude-haiku-4-5
tools:
  write: false
  edit: false
  patch: false
  bash: false
temperature: 0.1
---
You are the Planner agent. Your ONLY job is to analyze the existing codebase
and produce a detailed, step-by-step implementation plan.

## Rules
- You MUST NOT edit or create any files — you are strictly read-only
- Use the `read`, `grep`, `glob`, and `list` tools to understand the codebase
- Produce a numbered, actionable plan
- For each step, specify the file, the exact change, and the reason
- Flag edge cases and risks

## Output Format

### Summary
One sentence describing the overall change.

### Implementation Steps
1. [File: src/...] What to add/change and why
2. [File: src/...] ...

### Edge Cases
- Edge case 1: how to handle it
- Edge case 2: how to handle it

### Test Cases Required
- Test: description of scenario to test
- Test: ...
```

### Step 2.2 — The Implementer Agent

Create `.opencode/agents/implementer.md`:

```markdown
---
description: Writes clean TypeScript code following the project standards
mode: subagent
model: anthropic/claude-sonnet-4-5
tools:
  bash: false
temperature: 0.2
---
You are the Implementer agent. Your job is to write correct, clean TypeScript code.

## Rules
- Follow ALL standards in AGENTS.md — no exceptions
- Implement exactly what you are asked — do not add unrequested features
- After making changes, verify: does the code compile? (`npm run build`)
- If compilation fails, fix all errors before reporting completion
- Do not write tests unless explicitly told to

## Output Format

After completing implementation:

### Changes Made
- [src/...] Description of change

### Compilation
Status: PASS / FAIL
(If FAIL, list the errors and the fixes applied)
```

### Step 2.3 — The Reviewer Agent

Create `.opencode/agents/reviewer.md`:

```markdown
---
description: Reviews code for correctness, quality, and test coverage
mode: subagent
model: anthropic/claude-sonnet-4-5
tools:
  write: false
  edit: false
  patch: false
  bash: false
temperature: 0.1
---
You are the Reviewer agent. Your job is to critically review code changes.

## Rules
- MUST NOT edit any files — strictly read-only
- Be specific: file paths + line numbers in every finding
- Severity levels: CRITICAL (must fix), MAJOR (should fix), MINOR (suggestion)

## Review Checklist
- [ ] Input validation present for all user-controlled inputs
- [ ] All error paths return correct HTTP status codes
- [ ] TypeScript strict typing — no `any` types
- [ ] No business logic leaking into route handlers
- [ ] Tests cover: happy path, 404, all validation failures
- [ ] Naming is consistent with the rest of the codebase
- [ ] `updatedAt` is updated on mutations

## Output Format

### Review Summary
Overall: APPROVED / NEEDS CHANGES

### Findings
| Severity | File | Line | Issue | Suggestion |
|----------|------|------|-------|------------|
| CRITICAL | ... | ... | ... | ... |

### Missing Tests
- Missing test: scenario description
```

> **Checkpoint — Test each agent individually:**
>
> In the OpenCode TUI, use `@mention` to invoke each agent:
>
> ```
> @planner Analyze src/routes/tasks.routes.ts and plan what needs to improve
> ```
> Verify: returns a structured plan, does NOT create/edit files.
>
> ```
> @reviewer Review the current POST /tasks implementation
> ```
> Verify: returns a review with severity-labelled findings.

---

## Phase 3 — Build the Orchestrator (20 min)

### Step 3.1 — Create the Orchestrator Agent

Create `.opencode/agents/orchestrator.md`:

```markdown
---
description: Coordinates Planner, Implementer, and Reviewer to deliver features end-to-end
mode: primary
model: anthropic/claude-sonnet-4-5
temperature: 0.3
permission:
  bash: deny
  write: deny
  edit: deny
---
You are the Orchestrator. You lead a team of specialized agents to deliver
software features from planning to reviewed, tested code.

You coordinate by delegating to subagents using @mentions.
You NEVER edit files yourself — all file changes go through the Implementer.

## Workflow

For every feature request, follow this exact sequence:

### Step 1 — Plan
Invoke @planner with the feature request and relevant context.
Example:
  @planner [paste the feature request here]
  Context: [describe relevant files and current state]

Wait for the plan before proceeding.

### Step 2 — Implement
Invoke @implementer with the full plan from Step 1.
Example:
  @implementer Please implement the following plan:
  [paste the full plan]
  Standards to follow: AGENTS.md

### Step 3 — Review
Invoke @reviewer on the changes made in Step 2.
Example:
  @reviewer Please review the changes made to implement [feature].
  Files changed: [list files from Implementer's report]

### Step 4 — Iterate (if needed)
If @reviewer reports CRITICAL or MAJOR findings:
- Send findings back to @implementer for fixes
- Re-run @reviewer
- Repeat until APPROVED

### Step 5 — Write Tests
Invoke @implementer to add tests.
Example:
  @implementer Please write tests covering:
  [list test cases from Planner + Reviewer]

### Step 6 — Final Review
Run @reviewer one last time on the test file.

### Step 7 — Report
Summarize:
- All files changed and what was done
- Tests added
- Any MINOR suggestions carried forward

## Rules
- Always wait for a subagent's response before invoking the next
- Always pass sufficient context to each subagent (they have no memory of each other)
- Never skip the review step
- If a subagent's output is unclear, retry with more context before escalating to the user
```

### Step 3.2 — Update `opencode.json` with orchestrator tool permissions

Update `opencode.json` to fine-tune which agents can invoke which subagents:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-5",
  "instructions": [
    "AGENTS.md"
  ],
  "agent": {
    "build": {
      "permission": {
        "bash": "ask"
      }
    },
    "orchestrator": {
      "permission": {
        "task": {
          "*": "allow"
        },
        "bash": "deny",
        "write": "deny",
        "edit": "deny"
      }
    }
  }
}
```

> **Checkpoint:**
> Press `Tab` in the OpenCode TUI to cycle through agents. You should see `orchestrator` in the list.  
> Switch to it and ask: `Describe your workflow` — it should explain the 7-step orchestration process.

---

## Phase 4 — Run the Full Orchestration (15 min)

### Switch to the Orchestrator

In the OpenCode TUI, press `Tab` until you see `orchestrator` in the agent indicator, or type:

```
/agent orchestrator
```

### The Feature Request

Send this prompt to the Orchestrator:

```
Add a PATCH /tasks/:id endpoint to the Task Manager API.

Requirements:
- Allow partial updates: title, description, and/or status can each be updated independently
- Validate all inputs using the same validation rules as POST /tasks
- Return 404 if the task does not exist
- Return 400 for invalid input (with a descriptive error message)
- Return 200 with the updated task on success
- Update the `updatedAt` timestamp on every successful update
- Add full test coverage: happy path, partial update, 404, and all validation failures
```

### What to Observe

- **Child sessions**: as the Orchestrator invokes subagents, you'll see child sessions created
- **Navigation**: use `<Leader>+Right` / `<Leader>+Left` (or your configured keys) to navigate between parent and child sessions
- **Context isolation**: each subagent starts fresh — notice how the Orchestrator must pass full context in each `@mention`

### Verify the Result

```bash
npm run build   # Should pass cleanly
npm test        # All tests should pass

# Manual test — get a real task ID first
curl http://localhost:3000/tasks

# Replace TASK_ID with a real UUID from the list above
curl -X PATCH http://localhost:3000/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}'
# → 200 with updated task

curl -X PATCH http://localhost:3000/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -d '{"title": ""}'
# → 400 with validation error

curl -X PATCH http://localhost:3000/tasks/00000000-0000-0000-0000-000000000000 \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}'
# → 404 not found
```

> **Discussion prompts:**
> - How many subagent invocations did the Orchestrator make?
> - Did the Reviewer find any issues that the Implementer missed?
> - How does the isolated context window of each subagent affect what you must include in each `@mention`?

---

## Phase 5 — Bonus: Custom Slash Command (5 min)

Create a reusable command that triggers the full orchestration workflow.

```bash
mkdir -p .opencode/commands
```

Create `.opencode/commands/feature.md`:

```markdown
---
description: Orchestrate a full Plan → Implement → Review cycle for a new feature
---
You are acting as the Orchestrator. Use your full 7-step workflow to implement
the following feature request:

$ARGUMENTS

Workflow reminder:
1. @planner — analyze and plan
2. @implementer — implement the plan
3. @reviewer — review the implementation
4. Iterate until APPROVED
5. @implementer — write tests
6. @reviewer — final review
7. Report all changes made
```

**Usage:** In any session, type `/feature Add a DELETE /tasks/bulk endpoint` — the defined prompt is sent automatically with your text appended.

---

## Key Files Reference

```
starter-project/
├── AGENTS.md                              ← always-on project context
├── opencode.json                          ← OpenCode configuration
├── .opencode/
│   ├── agents/
│   │   ├── planner.md                     ← read-only planning subagent
│   │   ├── implementer.md                 ← coding subagent
│   │   ├── reviewer.md                    ← read-only review subagent
│   │   └── orchestrator.md               ← coordinator primary agent
│   └── commands/
│       └── feature.md                     ← /feature slash command
└── src/
    ├── models/task.model.ts
    ├── services/task.service.ts
    ├── routes/tasks.routes.ts
    ├── app.ts
    └── index.ts
```

---

## OpenCode TUI Quick Reference

| Key | Action |
|-----|--------|
| `Tab` | Switch between primary agents |
| `<Leader>+Right` | Navigate to child session |
| `<Leader>+Left` | Navigate to parent session |
| `/connect` | Connect a new AI provider |
| `/init` | Generate AGENTS.md for current project |
| `/agent <name>` | Switch to a named agent |
| `/share` | Generate a shareable link to the current session |
| `/undo` | Revert last file changes |
| `Ctrl+C` | Cancel current generation |

---

## Takeaways

- **AGENTS.md** is the primary way to give every agent project context — commit it to Git
- **Subagents in OpenCode** run in isolated child sessions — context must be passed explicitly in every `@mention`
- **Tool permissions** (`write: false`, `edit: false`) enforce agent roles — a "read-only" agent physically cannot edit files
- **Provider-agnostic**: unlike Copilot, you can swap models per agent to optimize cost vs. quality
- **The review loop** is the key quality mechanism — don't skip it even when you're confident in the implementation

---

➡️ Compare your results with the solution in `solutions/opencode/`
