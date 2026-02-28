# Explained: `.opencode/agents/implementer.md`

**Purpose:** The coding subagent. Takes a structured plan and writes all the code — models, services, routes, tests.

---

## Full File

```markdown
---
name: Implementer
description: Implements code changes based on a detailed implementation plan
mode: subagent
model: anthropic/claude-sonnet-4-5
temperature: 0.2
tools:
  bash: false
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
mode: subagent
model: anthropic/claude-sonnet-4-5
temperature: 0.2
tools:
  bash: false
---
```

**`model: anthropic/claude-sonnet-4-5`**
The Implementer explicitly uses Sonnet (the default model from `opencode.json`). This makes the override explicit — even though it matches the default, declaring it here makes it clear this agent intentionally uses the more capable model.

Code generation is the most complex task in the pipeline:
- Multiple files with interdependencies
- TypeScript generics and types
- Express routing patterns
- Test assertions

Claude Haiku (used by Planner/Reviewer) would struggle with complex TypeScript code generation. Sonnet is the right tool here.

---

**`temperature: 0.2`**

Slightly higher than the Planner's 0.1. Why?

Code generation benefits from a small amount of variation:
- Variable naming: `taskData` vs `payload` vs `body` — minor preferences
- Loop style: `for...of` vs `forEach` — stylistic equivalent choices
- Small structural variations while staying correct

However, it's still very low (0.2 out of 1.0). You don't want the implementer being "creative" with the architecture or inventing new patterns. It should follow the plan with minor stylistic freedom.

---

**`tools:` block**

```yaml
tools:
  bash: false
```

Only **one tool blocked**: `bash`.

Unlike the Planner (which blocks `bash`, `write`, and `edit`), the Implementer only blocks `bash`. This means:
- `write` is **allowed** — can create new files
- `edit` is **allowed** — can modify existing files
- `read` is **allowed** — can read files
- `search` is **allowed** — can search the codebase
- Running build/lint: handled through the `edit` tool by writing scripts, or not done at all

**Wait — but the system prompt says "run `npm run build`" — how does that work without `bash`?**

This is the key difference from the Copilot Implementer. The Copilot Implementer has the `run` tool explicitly. The OpenCode Implementer does NOT have `bash`.

The `npm run build` instruction in the system prompt is an **aspirational rule** — if bash were available, the agent would run it. Without bash, the agent relies on TypeScript knowledge to write correct code without execution verification.

This is a **trade-off**: less verification capability in exchange for a tighter security boundary. The Reviewer (which can run `npm test` via a separate mechanism) provides the final verification layer.

---

**Why no `bash` for the Implementer?**

Allowing `bash` for the Implementer would mean an LLM can run arbitrary shell commands while editing your codebase. Risks:
- Accidentally running `rm -rf` 
- Installing unexpected packages
- Making git commits prematurely

The Reviewer runs tests (read-only operation). The Implementer only *writes* code. Clean separation of write-code vs. run-code.

---

### System Prompt — Key Differences from Copilot Version

The system prompt is nearly identical to Copilot's, with one notable rule:

**`Do NOT run the tests yourself — the Reviewer will validate the implementation`**

In both tools this rule exists, but for different reasons:
- **Copilot**: The implementer has the `run` tool. The rule is a behavioral constraint.
- **OpenCode**: The implementer *lacks* `bash`. The rule is documenting a design decision.

The OpenCode version enforces this through tool absence + convention. The Copilot version enforces only through convention (the rule in the prompt).

---

## Key Takeaway: `bash: false` vs. Not Having `run`

| Aspect | Copilot Implementer | OpenCode Implementer |
|--------|--------------------|--------------------|
| File editing | `edit` tool | `write`/`edit` (not blocked) |
| TypeScript build check | `run` tool → `npm run build` | Cannot execute (bash: false) |
| Test execution | Convention: "don't run tests" | Physically impossible |
| Security | Behavioral rule | Hard capability block |

OpenCode's approach is more secure (hard block on bash) at the cost of less self-verification. Copilot's approach is more flexible (implementer can verify compile) at the cost of relying on a behavioral rule for test execution.

Neither approach is strictly better — they represent different trade-offs in the security vs. capability spectrum.
