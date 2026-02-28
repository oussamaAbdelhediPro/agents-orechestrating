# Explained: `.opencode/agents/reviewer.md`

**Purpose:** The quality gate subagent. Runs tests, reviews code against a checklist, and produces a binary verdict.

---

## Full File

```markdown
---
name: Reviewer
description: Reviews implemented code for correctness, tests, and code quality
mode: subagent
model: anthropic/claude-haiku-4-5
temperature: 0.1
tools:
  bash: false
  write: false
  edit: false
---

You are a senior TypeScript developer conducting a thorough code review.

You receive completed implementation and your job is to verify correctness and quality.

## Review Process

1. Read each modified file listed in the implementation plan
2. Check code against the review checklist
3. Produce a structured review report

## Review Checklist

### Correctness
- [ ] TypeScript builds with zero errors (verify mentally from code)
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

**Issues Found:**
- CRITICAL: [issue] — must fix before approval
- MAJOR: [issue] — should fix before approval
- MINOR: [issue] — nice to have, optional

**Summary:** [2-3 sentence summary]

## Rules
- Be specific — cite file name and approximate line for each issue
- Do not suggest rewrites — only flag issues that violate project standards
- If all checklist items pass, verdict is APPROVED
```

---

## Line-by-Line Explanation

### Frontmatter

```yaml
---
name: Reviewer
description: Reviews implemented code for correctness, tests, and code quality
mode: subagent
model: anthropic/claude-haiku-4-5
temperature: 0.1
tools:
  bash: false
  write: false
  edit: false
---
```

**`model: anthropic/claude-haiku-4-5`**
The Reviewer uses Haiku, same as the Planner. Code review is analytical — read the code, compare against a checklist, report issues. This doesn't require Sonnet's code-generation capability. Haiku handles this well at lower cost.

---

**`temperature: 0.1`**
Same as the Planner. Reviews should be **deterministic** — if you review the same code twice, you should get the same verdict. High temperature would cause the reviewer to approve code on one run and reject it on the next, making the pipeline unreliable.

---

**`tools: bash: false, write: false, edit: false`**
Full blacklist — same as the Planner. All three dangerous tools blocked:
- `bash: false` — cannot run shell commands
- `write: false` — cannot create files
- `edit: false` — cannot modify files

**Wait — but the Copilot Reviewer has the `run` tool to execute `npm test`. Why does the OpenCode Reviewer lack `bash`?**

This is the most significant difference between the two reviewer implementations:

| | Copilot Reviewer | OpenCode Reviewer |
|--|---|---|
| Test execution | `run` tool → `npm test` | Cannot run tests |
| Verification method | Automated test results | Manual code analysis |

The OpenCode reviewer does a **static review** — it reads the code and mentally verifies correctness. It cannot run `npm test` because `bash` is blocked.

**Why accept this limitation?**
- Keeping `bash: false` maintains a clean security boundary for all read-only agents
- The Reviewer compensates with thorough static analysis
- The Orchestrator can separately run `npm test` at the end if needed
- Trade-off: less automation, more security

---

### `## Review Process`

Compared to the Copilot Reviewer, step 1 is different:

**Copilot Reviewer step 1:** `Run the test suite: npm test`
**OpenCode Reviewer step 1:** `Read each modified file listed in the implementation plan`

This reflects the capability difference. The OpenCode reviewer leads with reading, not running. It verifies TypeScript correctness "mentally from code" rather than through compilation.

---

### `## Review Checklist`

**Correctness — key difference:**

Copilot:
- `[ ] All tests pass (no failures, no skips)` — verified by running `npm test`
- `[ ] TypeScript builds with zero errors (npm run build)`

OpenCode:
- `[ ] TypeScript builds with zero errors (verify mentally from code)` — manual verification
- (No test execution checklist item — cannot run tests)

The phrase "verify mentally from code" is notable. The reviewer reads the TypeScript and applies its knowledge of TypeScript semantics to determine if the code would compile. This is less reliable than actual compilation, but it's the best option given the `bash: false` constraint.

---

**API Standards — one extra rule vs. Copilot:**

```markdown
- [ ] `updatedAt` field updated when task is modified
```

This rule also appears in the Copilot reviewer checklist. But in OpenCode, it's listed as an explicit API standard item (not just in the Tests section).

**Why does this rule exist?**
A common bug in PATCH endpoints: the developer updates the task fields but forgets to set `task.updatedAt = new Date()`. The feature appears to work, but timestamps are stale. This checklist item specifically calls it out so the reviewer never misses it.

**Why is this a per-agent rule?**
Because it's a common bug pattern in this specific project's domain. Neither `copilot-instructions.md` nor `AGENTS.md` list it — it's a reviewer-specific reminder. This demonstrates the value of per-agent instructions: some rules only matter for specific roles.

---

### `## Review Report Format`

The OpenCode reviewer output format is slightly simpler than the Copilot version:
- No "Test Results: [X passed, Y failed]" section (because it can't run tests)
- Same CRITICAL/MAJOR/MINOR severity levels
- Same binary APPROVED / CHANGES REQUIRED verdict

The binary verdict is critical for the orchestrator's decision tree — it needs a clear signal to know whether to re-invoke the implementer.

---

## Key Takeaway: Static vs. Dynamic Review

The OpenCode and Copilot reviewers represent two review philosophies:

**Dynamic review (Copilot):** Run the code, see what breaks, report failures
- More reliable (tests are the ground truth)
- Requires `run`/`bash` capability
- Security cost: an agent can run arbitrary shell commands

**Static review (OpenCode):** Read the code, reason about correctness, report issues
- Less reliable (manual analysis can miss runtime bugs)
- Requires only `read` capability
- Maximum security: the reviewer is completely read-only

In production agent systems, you'd often see a hybrid: static review for code quality + a separate, tightly scoped test-runner that only runs `npm test` without full bash access.
