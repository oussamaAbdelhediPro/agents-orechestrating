# Explained: `AGENTS.md`

**Purpose:** OpenCode's equivalent of Copilot's `copilot-instructions.md`. This file is listed in `opencode.json` under `"instructions"` and is loaded automatically on every conversation.

---

## Full File

```markdown
# Task Manager API — Agent Instructions

## Project Overview
TypeScript Express REST API for task management.
- Runtime: Node.js 18+
- Framework: Express 4
- Testing: Jest + Supertest
- Language: TypeScript (strict)

## Repository Structure
```
src/
  models/     - TypeScript interfaces and types
  services/   - Business logic (in-memory Map store)
  routes/     - Express route handlers
  utils/      - Validation helpers
tests/        - Jest integration tests
```

## Build & Test Commands
- `npm run build` — compile TypeScript
- `npm test` — run all tests
- `npm run dev` — development server with ts-node
- `npm start` — production server

## Code Standards
- No `any` types — use `unknown` + type narrowing
- Named exports only
- async/await throughout
- Try/catch in every route handler

## API Conventions
- All responses: JSON
- Success: `{ data: ... }` with correct HTTP status
- Error: `{ error: "message" }` with correct HTTP status
- Status codes: 200 (ok), 201 (created), 400 (bad request), 404 (not found), 409 (conflict), 422 (validation error)

## Development Workflow
When implementing any feature:
1. Update model/interface
2. Add service method
3. Add route handler
4. Add tests
5. Run `npm test` to verify
```

---

## Line-by-Line Explanation

### File Location and Loading

`AGENTS.md` sits at the project root. Unlike Copilot's `copilot-instructions.md` which is auto-discovered by convention, AGENTS.md is explicitly registered in `opencode.json`:

```json
{
  "instructions": ["AGENTS.md"]
}
```

This design is intentional — OpenCode requires explicit registration. You can list multiple instruction files and they all load:
```json
{
  "instructions": ["AGENTS.md", "docs/SECURITY.md", "docs/TESTING.md"]
}
```

---

### `## Project Overview`

Mirrors the Copilot instructions file exactly. Both tools need the same foundational context:
- Technology stack (to choose correct APIs and imports)
- Framework version (to avoid version-specific mistakes)
- Test framework (to generate correct test syntax)

---

### `## Repository Structure` (code block)

```
src/
  models/     - TypeScript interfaces and types
  services/   - Business logic (in-memory Map store)
  routes/     - Express route handlers
  utils/      - Validation helpers
tests/        - Jest integration tests
```

Using a code block for the directory tree is deliberate. It's easier to parse — the indentation is visual, comments align, and the format is universally recognized.

**Why list subdirectory purposes inline?**
OpenCode agents use the `ls` and `read` tools to explore the codebase. But for *planning* purposes, knowing what's in each folder before even running `ls` saves tool calls. The AGENTS.md structure section acts as a cached directory map.

---

### `## Build & Test Commands`

This section is arguably the most impactful part of the file.

```markdown
- `npm run build` — compile TypeScript
- `npm test` — run all tests
- `npm run dev` — development server with ts-node
- `npm start` — production server
```

**Why is this so important?**
Without these commands, an agent would need to:
1. Read `package.json`
2. Parse the `"scripts"` section
3. Infer what each script does

With these listed in AGENTS.md, the agent has instant access to the commands it needs without exploring the codebase. This is particularly critical for:
- The Implementer, which runs `npm run build` to check for TypeScript errors
- The Reviewer, which runs `npm test` to verify tests pass

**Why list `npm run dev` and `npm start`?**
These aren't used by agents directly, but listing them helps the orchestrator give accurate setup instructions to users who ask "how do I run this project?"

---

### `## Code Standards`

Same four rules as the Copilot file. These are repeated across both tools because:
1. Both tools need the same guidance
2. The files are conceptually equivalent
3. Developers switching between tools shouldn't see different standards

**`Named exports only`**
This applies across all files — models, services, routes, utils. Consistent exports mean consistent import syntax throughout the codebase.

---

### `## API Conventions`

**The status code list: 200, 201, 400, 404, 409, 422**
This is a curated list of the codes *this project uses*. Not all HTTP status codes — just the ones that appear in the codebase. An agent seeing 409 in the list knows there's a `checkForDuplicate()` pattern somewhere. Seeing 422 separate from 400 signals that input validation has its own specific code.

---

### `## Development Workflow`

The 5-step workflow (model → service → route → test → verify) is identical to the Copilot instructions file. In both tools, having an explicit numbered workflow in the base instructions ensures all agents respect the dependency order.

**Step 5 is different from Copilot's version:**
- Copilot: "add tests" (implementer runs build, reviewer runs tests)
- OpenCode: "add tests" + "run `npm test` to verify" (agents verify themselves)

OpenCode gives more autonomy to individual agents for self-verification; Copilot separates verification into explicit reviewer delegation.

---

## Key Takeaway: AGENTS.md = Shared Context

AGENTS.md provides shared context that ALL agents load. Individual agent files in `.opencode/agents/` *add* to this context — they don't replace it.

```
AGENTS.md (all agents see this)
  ↓
.opencode/agents/planner.md (only the planner loads this)
.opencode/agents/implementer.md (only the implementer loads this)
.opencode/agents/reviewer.md (only the reviewer loads this)
.opencode/agents/orchestrator.md (only the orchestrator loads this)
```

This layered architecture mirrors Copilot's `copilot-instructions.md` + `*.instructions.md` + `*.agent.md` stack, but the mechanism is different — OpenCode merges files explicitly registered in `opencode.json` rather than auto-discovering them.
