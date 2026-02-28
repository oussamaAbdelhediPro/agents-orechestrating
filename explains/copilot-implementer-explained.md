# Explained: `.github/agents/implementer.agent.md`

**Purpose:** The coding workhorse. Takes a structured plan from the Planner and writes all the code — models, services, routes, tests.

---

## Full File

```markdown
---
name: Implementer
description: Implements code changes based on a detailed implementation plan
tools: [edit, read, search, run]
user-invokable: false
---

You are an expert TypeScript developer implementing changes to a Node.js Express API.

You receive a structured implementation plan and your job is to execute it precisely.

## Implementation Process

1. **Read first** — before editing any file, read its current content
2. **Follow the plan** — implement exactly what the plan specifies
3. **One file at a time** — complete each file before moving to the next
4. **Verify as you go** — after implementing each file, run `npm run build` to check for TypeScript errors

## Code Standards (enforce strictly)

- No `any` types — use proper TypeScript generics or `unknown`
- Named exports only (`export const`, `export function`, `export interface`)
- Every async function has explicit `Promise<T>` return type
- All route handlers have try/catch with `res.status(500).json({ error: 'Internal server error' })`
- Validation happens in utils, not in route handlers directly

## File Implementation Order

Always implement in this order (respects dependencies):
1. `src/models/task.model.ts` — interfaces and types first
2. `src/utils/validation.ts` — validation functions (depend on models)
3. `src/services/task.service.ts` — business logic (depends on models)
4. `src/routes/tasks.routes.ts` — route handlers (depend on services and validation)
5. `tests/tasks.test.ts` — integration tests (test the full stack)

## Testing Requirements

- Add tests for the happy path (valid input, expected response)
- Add tests for each error case (missing fields, invalid UUID, wrong status, etc.)
- Tests use `supertest` against the Express app directly
- Do NOT run the tests yourself — the Reviewer will validate the implementation

## Self-Check Before Finishing

Run `npm run build` and confirm zero TypeScript errors before reporting done.
```

---

## Line-by-Line Explanation

### Frontmatter

```yaml
---
name: Implementer
description: Implements code changes based on a detailed implementation plan
tools: [edit, read, search, run]
user-invokable: false
---
```

**`tools: [edit, read, search, run]`**
This is the biggest tool-set in the system. Four tools granted:
- `edit` — can create and modify files (the planner and reviewer don't have this)
- `read` — can read existing files (needed to understand what to change)
- `search` — can search the codebase (needed to find usages, related code)
- `run` — **can execute terminal commands** — specifically for `npm run build` to type-check

The `run` tool is deliberately absent from the Planner and Reviewer. The Implementer needs it to verify TypeScript compilation. Granting it to read-only agents would be unnecessary and risky.

**`user-invokable: false`**
Same as Planner — users go through the orchestrator. This prevents someone from calling `@Implementer add a delete endpoint` without a plan, which would skip the analysis phase.

---

### `## Implementation Process`

**`1. Read first — before editing any file, read its current content`**
This is a critical guard. Without reading first, the implementer might:
- Overwrite existing code instead of extending it
- Duplicate already-existing types
- Miss existing functions it should be calling

**`2. Follow the plan — implement exactly what the plan specifies`**
The implementer is not supposed to improve the plan or make architectural decisions. It executes. This separation of concerns (planner decides, implementer executes) prevents the implementer from going rogue or gold-plating.

**`3. One file at a time — complete each file before moving to the next`**
Prevents half-finished states. If you edit model and service but then context runs out, you have broken code. Completing each file fully before moving on produces checkpoints.

**`4. Verify as you go — run npm run build after each file`**
TypeScript is the first safety net. Running the build after each file catches type errors *before* they accumulate. It's much easier to fix one error from one file than 10 errors spread across 4 files.

---

### `## Code Standards` block

These repeat and reinforce the rules from `copilot-instructions.md`. Why repeat them?

The implementer agent is loaded in a specific orchestration context — it may not have the full context of the global instructions file. Repeating the critical rules here ensures they're never forgotten in the heat of implementation.

**`Validation happens in utils, not in route handlers directly`**
This is the most architectural rule. Without it, Copilot might inline validation logic directly in the route handler:
```ts
// BAD (inline validation)
router.post('/', async (req, res) => {
  if (!req.body.title) return res.status(400).json({ error: 'Title required' })
  ...
})

// GOOD (utils validation)
router.post('/', async (req, res) => {
  const error = validateCreateTask(req.body)
  if (error) return res.status(422).json({ error })
  ...
})
```

---

### `## File Implementation Order`

The order is not arbitrary — it follows the **dependency graph**:
1. Models have no local dependencies (they're just types)
2. Validation depends on model types (to validate against them)
3. Service depends on model types (to work with Task objects)
4. Routes depend on services (to call business logic) and validation
5. Tests depend on everything (they test the full stack)

If you implement routes before models, TypeScript won't compile. This order eliminates circular dependency compile errors.

---

### `## Testing Requirements`

**`Add tests for the happy path (valid input, expected response)`**
The minimum test: does the feature work when given valid data?

**`Add tests for each error case`**
Error tests are what catch bugs in production. Missing required fields, invalid IDs, wrong enum values — each error case maps to a code path that needs coverage.

**`Tests use supertest against the Express app directly`**
This clarifies the test architecture: integration tests (HTTP level) not unit tests. `supertest` makes actual HTTP calls to the app without starting a real server.

**`Do NOT run the tests yourself — the Reviewer will validate the implementation`**
This is a key orchestration rule. The implementer writes tests but doesn't run them. The reviewer runs them. This separation ensures the reviewer's feedback is independent.

The `run` tool is granted so the implementer can run `npm run build` (TypeScript compilation check), but the convention is to leave test execution to the Reviewer.

---

### `## Self-Check Before Finishing`

**`Run npm run build and confirm zero TypeScript errors before reporting done`**
The implementer signs off only after a clean build. This ensures the orchestrator receives deliverables that at least compile, even if they have logical errors the reviewer will catch.

---

## Key Takeaway: Tools vs. Conventions

The Implementer shows the relationship between **enforced boundaries** (tools whitelist) and **behavioral conventions** (system prompt rules):

- `tools: [edit, read, search, run]` — what it *can* do (hardware limit)
- "Do NOT run the tests" — what it *should* do (software convention)

Tool limits can't be broken. Prompt conventions rely on the model following instructions. For critical trust boundaries (like preventing the planner from editing files), use tool limits. For workflow conventions (like "implementer doesn't run tests"), a prompt rule is sufficient because the cost of violation is low.
