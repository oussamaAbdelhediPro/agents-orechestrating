# Explained: `.github/agents/reviewer.agent.md`

**Purpose:** A read-only quality gate. Runs the tests, reads the code, and produces a structured review with a binary verdict (APPROVED or CHANGES REQUIRED).

---

## Full File

```markdown
---
name: Reviewer
description: Reviews implemented code for correctness, tests, and code quality
tools: [read, search, run]
user-invokable: false
---

You are a senior TypeScript developer conducting a thorough code review.

You receive completed implementation and your job is to verify correctness and quality.

## Review Process

1. Run the test suite: `npm test`
2. Read each modified file listed in the implementation plan
3. Check code against the review checklist
4. Produce a structured review report

## Review Checklist

### Correctness
- [ ] All tests pass (no failures, no skips)
- [ ] TypeScript builds with zero errors (`npm run build`)
- [ ] The feature works as specified in the plan
- [ ] Edge cases from the plan are handled

### Code Quality
- [ ] No `any` types introduced
- [ ] No code duplication (DRY)
- [ ] Functions are small and focused (< 30 lines)
- [ ] Error handling is consistent with project patterns

### API Standards
- [ ] Correct HTTP status codes used
- [ ] Response shape matches `{ data: ... }` or `{ error: "..." }`
- [ ] Input validation in utils layer, not inline
- [ ] UUID validation on params that should be UUIDs
- [ ] `updatedAt` field updated when task is modified

### Tests
- [ ] Happy path covered
- [ ] All error cases covered
- [ ] Tests are independent (no shared state between tests)
- [ ] Tests use descriptive names

## Review Report Format

Always output in this format:

**Verdict: APPROVED** or **Verdict: CHANGES REQUIRED**

**Test Results:** [X passed, Y failed]

**Issues Found:**
- CRITICAL: [issue] — must fix before approval
- MAJOR: [issue] — should fix before approval
- MINOR: [issue] — nice to have, optional

**Summary:** [2-3 sentence summary]

## Rules
- Run tests FIRST, before reading any code
- If tests fail, list CRITICAL issues for each failure
- Be specific — cite file name and line number for each issue
- Do not suggest rewrites — only flag issues that violate project standards
```

---

## Line-by-Line Explanation

### Frontmatter

```yaml
---
name: Reviewer
description: Reviews implemented code for correctness, tests, and code quality
tools: [read, search, run]
user-invokable: false
---
```

**`tools: [read, search, run]`**
Three tools — same as the Implementer minus `edit`. Notice:
- `run` is present — the reviewer must run `npm test` to verify tests pass
- `edit` is absent — the reviewer *cannot* change code. This is the key constraint.

Without the `edit` tool, the reviewer is forced to report issues rather than silently fix them. This produces a clear feedback loop that the implementer (or orchestrator) can act on.

**Why does the reviewer need `run` but the planner doesn't?**
The planner only analyzes requirements — it doesn't need to execute anything. The reviewer needs to verify tests actually pass, which requires running `npm test`. A code review without test execution is incomplete.

---

### `## Review Process`

**`1. Run the test suite: npm test`**
Tests first. Before reading a single line of code, run the tests. Why? Because:
- A failing test immediately tells you *what's wrong* without reading everything
- Test names describe expected behavior, giving you a map of the specification
- If all tests pass, the review can focus on code quality rather than correctness

**`2. Read each modified file listed in the implementation plan`**
The reviewer reads *exactly* the files the implementer touched (as listed in the plan). It doesn't re-read unchanged files. This keeps the review focused.

**`3. Check code against the review checklist`**
The checklist provides structure. Without it, reviewers tend to focus on stylistic issues (naming, formatting) and miss behavioral issues (missing validation, wrong status code).

---

### `## Review Checklist`

The checklist is divided into four categories:

**Correctness** — Does it work?
- Tests pass → automated verification
- TypeScript builds → compile-time check
- Feature works as specified → spec compliance
- Edge cases handled → robustness

**Code Quality** — Is it clean?
- No `any` types → type safety
- No duplication → DRY principle
- Functions < 30 lines → single responsibility
- Consistent error handling → predictability

**API Standards** — Does it follow project conventions?
This section is the most project-specific. It includes:
- **`UUID validation on params that should be UUIDs`** — every route with `:id` must validate that the ID is actually a UUID format before using it
- **`updatedAt field updated when task is modified`** — a common bug is forgetting to update timestamps on PATCH operations

**Tests** — Are the tests good tests?
- `Tests are independent (no shared state between tests)` — shared state causes flaky tests where test pass/fail depends on execution order

---

### `## Review Report Format`

**`Verdict: APPROVED` or `Verdict: CHANGES REQUIRED`**
Binary outcome. No "mostly approved" or "approved with reservations." The orchestrator needs a clear signal to know whether to re-invoke the implementer or proceed.

**`CRITICAL / MAJOR / MINOR` severity levels**
Three severity tiers:
- **CRITICAL** — must fix before approval (test failure, security hole, data corruption risk)
- **MAJOR** — should fix (API contract violation, missing error handling)
- **MINOR** — optional (naming, minor style inconsistency)

The orchestrator uses these levels to decide whether to re-invoke the implementer. CRITICAL and MAJOR → request changes. MINOR-only → can approve anyway.

**`cite file name and line number for each issue`**
Forces specificity. "The validation is wrong" is useless feedback. "In `src/routes/tasks.routes.ts` line 42, the status validation uses `==` instead of `===`" is actionable.

---

### `## Rules`

**`Run tests FIRST, before reading any code`**
Reinforced in the Rules section (it's also step 1 of the process). Double emphasis signals criticality.

**`Do not suggest rewrites — only flag issues that violate project standards`**
The reviewer's job is quality gating, not architectural refactoring. If the code works and follows project conventions, it passes — even if the reviewer would have written it differently. This prevents scope creep and endless stylistic debates.

---

## Key Takeaway: Tool Absence as Architecture

The Reviewer deliberately **lacks** the `edit` tool. This is a design choice, not an oversight.

If the reviewer could edit files:
- Errors might be silently fixed without the implementer learning from them
- The implementer and reviewer would enter a silent collaborative state
- The orchestrator wouldn't know changes were made
- The feedback loop (plan → implement → review → re-implement) would collapse

By removing `edit`, every issue must be communicated explicitly in the review report, maintaining the clean separation between implementation and quality assurance phases.
