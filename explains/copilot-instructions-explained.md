# Explained: `.github/copilot-instructions.md`

**Purpose:** This file is automatically loaded by GitHub Copilot for every conversation in the workspace. You don't need to reference it manually — Copilot reads it on every request.

---

## Full File

```markdown
# Task Manager API — Copilot Instructions

## Project Overview
This is a TypeScript Express REST API for managing tasks.
- Runtime: Node.js 18+
- Framework: Express 4
- Testing: Jest + Supertest
- Language: TypeScript (strict mode)

## Architecture
- `src/models/` — TypeScript interfaces and types
- `src/services/` — Business logic, in-memory Map store
- `src/routes/` — Express route handlers
- `src/utils/` — Helper functions (validation, etc.)
- `tests/` — Jest integration tests

## Code Standards
- Use strict TypeScript — no `any` types
- Export named exports, not default exports
- Use `async/await`, not callbacks or `.then()`
- All route handlers must have try/catch error handling

## API Conventions
- All responses are JSON
- Success responses: `{ data: ... }`
- Error responses: `{ error: "message" }` with appropriate HTTP status
- Use HTTP status codes correctly: 200, 201, 400, 404, 409, 422

## When Adding Features
1. Update the model/interface first
2. Add service method
3. Add route handler
4. Add tests
```

---

## Line-by-Line Explanation

### `# Task Manager API — Copilot Instructions`
Sets the document title. Not strictly required, but good practice — it helps Copilot understand this file is intentionally an instructions document, not accidental stale content.

---

### `## Project Overview` block
Provides the essential technology stack. Copilot uses this to:
- Choose the right imports (`express`, not `fastify`)
- Use the Node.js 18 API set (e.g., `structuredClone`, top-level await is available)
- Know that Jest is the test runner (so it won't suggest Mocha/Vitest syntax)

**Why list the framework version?** Express 4 and Express 5 have different error handler signatures. Being explicit prevents Copilot from using the wrong API.

---

### `## Architecture` block
Maps folder names to their roles. This is one of the highest-value sections — it tells Copilot *where to look* and *where to put new code*.

Without this, Copilot might create a `controllers/` folder, or put business logic directly in route handlers. With it, Copilot knows the canonical `routes → services → models` pattern used here.

---

### `## Code Standards` block

**`- Use strict TypeScript — no `any` types`**
Prevents Copilot from typing function parameters as `any` when it's uncertain. Instead it will reach for `unknown` + type narrowing, or ask for clarification.

**`- Export named exports, not default exports`**
Enforces consistency. Copilot defaults to `export default` for classes and components; this line overrides that habit.

**`- Use async/await, not callbacks or .then()`**
Express route handlers are callback-based under the hood. This rule ensures generated code stays consistent with the project style — no mixed `.then().catch()` chains.

**`- All route handlers must have try/catch`**
Critical for an Express API. Without try/catch, an unhandled error in an async handler results in an unhandled rejection (Node.js crash or hanging request). This makes the requirement explicit.

---

### `## API Conventions` block

**`- All responses are JSON`**
Prevents Copilot from generating `res.send("OK")` or `res.sendFile(...)`.

**`- Success responses: { data: ... }`**
Standardizes the response envelope. Copilot will wrap results in `{ data: result }` instead of returning raw objects.

**`- Error responses: { error: "message" }`**
Standardizes error shape. Copilot will use `res.status(400).json({ error: "..." })` instead of assorted formats.

**The HTTP status code list (200, 201, 400, 404, 409, 422)**
This is subtle but powerful. By listing 409 (conflict) and 422 (unprocessable entity), you tell Copilot these specific codes exist in the project. Without this, Copilot might use 400 for everything, whereas the project differentiates "bad input" (422) from "resource already exists" (409).

---

### `## When Adding Features` block
This is an **ordered workflow**. Copilot respects numbered lists as sequencing instructions.

By listing model → service → route → test in that order, you enforce the proper dependency direction:
1. You can't write a route without a service method
2. You can't write a service method without a type
3. Tests come last (integration tests, not TDD here)

This prevents Copilot from jumping straight to writing the route handler before the service layer exists.

---

## Key Takeaway: Scope of Effect

This file applies to **all** Copilot interactions across the entire workspace. It's the baseline. The file-scoped `.instructions.md` files and individual `.agent.md` files *add* to this — they don't replace it.

Think of it as: `copilot-instructions.md` = team handbook. `*.instructions.md` = role-specific guides. `.agent.md` = individual job descriptions.
