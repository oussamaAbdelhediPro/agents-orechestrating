# Explained: `.github/instructions/typescript.instructions.md`

**Purpose:** A file-scoped instruction file that applies TypeScript rules **only** to `.ts` files. Unlike `copilot-instructions.md`, this one is conditionally activated based on which file the user is editing.

---

## Full File

```markdown
---
applyTo: "**/*.ts"
---

# TypeScript Code Standards

## Types
- Always define explicit return types on functions
- Use `interface` for object shapes, `type` for unions/intersections
- Never use `as any` — use `unknown` + type narrowing instead
- Prefer `readonly` for properties that shouldn't change after construction

## Async
- All async functions must return `Promise<T>` — no implicit `Promise<unknown>`
- Use `Promise.all()` for independent async operations
- Propagate errors upward — don't swallow them with empty catch blocks

## Imports
- Use ES module imports (`import ... from ...`)
- Group: Node.js built-ins → third-party → local
- No default imports from local modules

## Express Specifics
- Type route handler params: `Request<Params, ResBody, ReqBody, ReqQuery>`
- Type `req.body` explicitly — don't rely on `any`
- Use `Response<ApiResponse<T>>` for typed responses
```

---

## Line-by-Line Explanation

### Frontmatter Block

```yaml
---
applyTo: "**/*.ts"
---
```

**`applyTo`** is the key field that makes this a *file-scoped* instruction.

- `**/*.ts` is a glob pattern — matches any `.ts` file anywhere in the workspace
- When you're editing a `.ts` file, Copilot loads this file on top of `copilot-instructions.md`
- When you're editing a `.json`, `.md`, or `.test.js` file, this file is ignored

**Why have separate file-scoped instructions?**
`copilot-instructions.md` applies to everything — docs, config files, markdown, JSON. You don't want TypeScript-specific rules cluttering responses when Copilot is helping you write a README. File-scoped files solve this.

---

### `## Types` block

**`- Always define explicit return types on functions`**
TypeScript can infer return types, but inference can be surprising (e.g., `Promise<void>` vs `Promise<undefined>`). Explicit types act as documentation and catch mistakes early. Copilot will add `: Task[]` or `: Promise<Task>` to every function it generates.

**`- Use interface for object shapes, type for unions/intersections`**
This is a team convention choice. Both `interface` and `type` can describe objects, but mixing them causes inconsistency. The rule: `interface Task { ... }` for plain objects, `type Status = 'todo' | 'done'` for unions.

**`- Never use as any — use unknown + type narrowing`**
`as any` disables all type checking. `unknown` forces you to check the type before using the value. The rule prevents unsafe casts like `const id = req.param.id as any`.

**`- Prefer readonly for properties that shouldn't change`**
`readonly` signals immutability to other developers and prevents accidental mutations. Copilot will add `readonly` to interface properties like IDs and timestamps.

---

### `## Async` block

**`- All async functions must return Promise<T> — no implicit Promise<unknown>`**
Implicit `unknown` can happen when a function early-returns `undefined` in one branch. By requiring explicit `Promise<T>` annotation, this is caught at the type level, not at runtime.

**`- Use Promise.all() for independent async operations`**
Performance guidance. If two async calls don't depend on each other's results, running them in sequence wastes time. Copilot will prefer `await Promise.all([...])` over sequential `await` calls.

**`- Propagate errors upward — don't swallow with empty catch`**
```ts
// BAD (swallows error):
try { ... } catch (e) {}

// GOOD (propagates up):
try { ... } catch (e) { throw e; }
```
This ensures errors reach the Express error handler rather than causing silent failures.

---

### `## Imports` block

**`- Use ES module imports`**
The project uses `"module": "commonjs"` in tsconfig but TypeScript syntax (`import`) throughout. This rule enforces the modern syntax over `require()`.

**`- Group: Node.js built-ins → third-party → local`**
Import ordering is a common style convention (also enforced by ESLint rules like `import/order`). Grouping makes it immediately obvious which imports are external vs internal.

**`- No default imports from local modules`**
Matches the rule in `copilot-instructions.md`. Reinforced here specifically for TypeScript files because Copilot's default behavior when generating a class is to use `export default class ...`.

---

### `## Express Specifics` block

**`- Type route handler params: Request<Params, ResBody, ReqBody, ReqQuery>`**
Express's `Request` type is generic with 4 type parameters. Without typing, `req.params.id` is `string`, `req.body` is `any`. With typing:
```ts
router.patch('/:id', async (req: Request<{ id: string }, {}, UpdateTaskDto>, res) => {
  // req.params.id is string (typed)
  // req.body is UpdateTaskDto (typed)
})
```

**`- Type req.body explicitly — don't rely on any`**
`req.body` defaults to `any` in Express. This rule ensures Copilot always declares the expected shape explicitly.

**`- Use Response<ApiResponse<T>> for typed responses`**
`ApiResponse<T>` is a generic wrapper type (like `{ data: T }` or `{ error: string }`). Typing the response object ensures `res.json()` only accepts the correct shape.

---

## Key Takeaway: Layering

This file demonstrates **layered instructions**:
- `copilot-instructions.md` → global rules for the whole project
- `typescript.instructions.md` (with `applyTo: "**/*.ts"`) → TypeScript-specific rules, only active for `.ts` files

You can have multiple `.instructions.md` files for different file types (`.test.ts`, `*.json`, `*.md`, etc.), each with their own `applyTo` glob.
