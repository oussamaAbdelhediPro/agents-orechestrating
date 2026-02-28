# Deep Dive into Agent Orchestration
### Track 1 — GitHub Copilot

**Duration:** 1h15 hands-on &nbsp;|&nbsp; **Prerequisites:** [00-introduction.md](./00-introduction.md)

---

## What You Will Build

A four-agent orchestration system inside your VS Code workspace:

```
  User prompt: "Add PATCH /tasks/:id with validation and tests"
        │
        ▼
  ┌─────────────────┐
  │   Orchestrator  │  .github/agents/orchestrator.agent.md
  └────────┬────────┘
           │  delegates to subagents
     ┌─────┼──────┐
     ▼     ▼      ▼
  Planner Impl. Reviewer
  (plan)  (code) (review)
```

---

## How `.agent.md` Files Work

Custom agents are Markdown files with a **YAML frontmatter** block that defines the agent's behavior. Place them in `.github/agents/` in your project root.

```yaml
---
name: My Agent           # Display name
description: Does X      # Shown in the agent picker
tools: ['read', 'search'] # Tools the agent can use
model: claude-3-7-sonnet  # Optional model override
user-invokable: true      # Show in the dropdown?
---
System prompt / instructions for the agent go here.
```

**Key tools:**

| Tool | Description |
|------|-------------|
| `read` | Read file contents |
| `search` | Search the codebase |
| `edit` | Modify files |
| `run` | Execute terminal commands |
| `agent` | Invoke a subagent (enables orchestration) |

---

## Phase 1 — Project Instructions (10 min)

Good agents need a shared understanding of the project. We'll create instruction files that are automatically applied to every Copilot Chat request.

### Step 1.1 — Create always-on project instructions

Create `.github/copilot-instructions.md` at the root of `starter-project/`:

```markdown
# Task Manager API — Copilot Instructions

## Project Overview
This is a TypeScript/Express REST API for managing tasks.
All source code is in `src/`, tests are in `tests/`.
The API uses an in-memory Map as a data store (no database).

## Code Standards
- Use TypeScript strict mode — all types must be explicit
- Use `async/await` — never raw callbacks or `.then()` chains
- Export named exports — avoid default exports except for the Express `app`
- Keep route handlers thin — delegate business logic to the service layer
- Follow RESTful conventions: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 404 Not Found

## Testing Standards
- Use Jest + Supertest for integration tests
- Test file names follow `*.test.ts` pattern placed in `tests/`
- Every endpoint must have: happy path, 404 case, and input validation case
- Test descriptions use imperative mood: "returns 201 when...", "returns 400 when..."

## Validation Rules for Tasks
- `title`: required, string, 1–100 characters
- `description`: optional, string, max 500 characters
- `status`: optional, must be one of: "todo" | "in-progress" | "done"
- `id` params: must be a valid UUID v4 format
```

> **Checkpoint:** Open Copilot Chat (Ctrl+Shift+I), type `What are the coding standards for this project?`. Copilot should reference the rules above.

### Step 1.2 — Create TypeScript-specific file instructions

Create `.github/instructions/typescript.instructions.md`:

```markdown
---
applyTo: "**/*.ts"
---
# TypeScript Conventions

- Always annotate function return types explicitly
- Use `interface` for object shapes, `type` for unions and aliases
- Prefer `readonly` for properties that should not be mutated
- Use `unknown` instead of `any` — narrow types with type guards
- Validate external input before casting to domain types
```

> **Checkpoint:** Open any `.ts` file. In Copilot Chat, ask: `How should I type this function?`. Copilot should now reflect these TypeScript conventions.

---

## Phase 2 — Create Specialized Agents (25 min)

We'll create three worker agents with narrow, focused jobs and restricted tool sets.

### Step 2.1 — The Planner Agent

Create `.github/agents/planner.agent.md`:

```markdown
---
name: Planner
description: Analyzes the codebase and produces a detailed implementation plan
tools: ['read', 'search']
user-invokable: false
---
You are the Planner agent. Your ONLY job is to analyze the codebase and
produce a detailed, actionable implementation plan.

## Rules
- You MUST NOT edit any files — you are read-only
- Produce a numbered step-by-step plan
- For each step, specify: what file to change, what to add/modify, and why
- Reference existing code by file path and line numbers
- Flag any potential edge cases or risks

## Output Format
Return a structured plan in this exact format:

### Summary
One sentence describing the overall change.

### Implementation Steps
1. [File: src/...] Description of change
2. [File: src/...] Description of change
...

### Edge Cases
- Edge case 1
- Edge case 2

### Test Cases Required
- Test: description of test
- Test: description of test
```

### Step 2.2 — The Implementer Agent

Create `.github/agents/implementer.agent.md`:

```markdown
---
name: Implementer
description: Writes code following the implementation plan
tools: ['edit', 'read', 'search', 'run']
user-invokable: false
---
You are the Implementer agent. Your job is to write clean, correct TypeScript code.

## Rules
- Follow ALL instructions in `.github/copilot-instructions.md`
- Implement exactly what the plan specifies — do not add unrequested features
- Write the code, then run `npm run build` to verify it compiles
- If compilation fails, fix the errors before reporting completion
- Do not write tests — that is done by the orchestrator after your work

## Output Format
After completing implementation, respond with:

### Changes Made
- [File: src/...] Description of change

### Compilation
Status: PASS / FAIL
(If FAIL, include error and fix)
```

### Step 2.3 — The Reviewer Agent

Create `.github/agents/reviewer.agent.md`:

```markdown
---
name: Reviewer
description: Reviews code for quality, correctness, and test coverage
tools: ['read', 'search']
user-invokable: false
---
You are the Reviewer agent. Your job is to critically review code changes.

## Rules
- You MUST NOT edit any files — you are read-only
- Be specific: reference file paths and line numbers in every finding
- Assign severity: CRITICAL (must fix), MAJOR (should fix), MINOR (suggestion)

## Review Checklist
- [ ] Input validation: all user inputs validated before use
- [ ] Error handling: all error paths return proper HTTP status codes
- [ ] Type safety: no use of `any`, all types explicit
- [ ] Test coverage: happy path + edge cases covered
- [ ] RESTful conventions followed
- [ ] No business logic in route handlers (delegates to service)
- [ ] Consistent naming with the rest of the codebase

## Output Format
### Review Summary
Overall quality: APPROVED / NEEDS CHANGES

### Findings
| Severity | File | Line | Issue | Suggestion |
|----------|------|------|-------|------------|
| CRITICAL | ... | ... | ... | ... |

### What's Missing
- Missing test: ...
```

> **Checkpoint — Test each agent individually:**
> 1. Open Copilot Chat → select **Planner** from the agent dropdown
> 2. Ask: `Analyze src/routes/tasks.routes.ts and plan what needs to be improved`
> 3. Verify the Planner returns a structured plan and does NOT edit any files
> 4. Repeat with **Reviewer**: `Review the current POST /tasks implementation`

---

## Phase 3 — Build the Orchestrator (20 min)

The orchestrator coordinates the three worker agents in a single workflow.

### Step 3.1 — Create the Orchestrator Agent

Create `.github/agents/orchestrator.agent.md`:

```markdown
---
name: Orchestrator
description: Coordinates Planner, Implementer, and Reviewer to deliver features end-to-end
tools: ['agent', 'read', 'search', 'edit']
agents: ['Planner', 'Implementer', 'Reviewer']
user-invokable: true
---
You are the Orchestrator. You coordinate a team of specialized agents to deliver
software features from planning to reviewed, tested code.

## Workflow

For every feature request, execute this exact sequence:

### Step 1 — Plan (delegate to Planner subagent)
Invoke the Planner subagent with the feature request and full context.
Wait for the plan before proceeding.

### Step 2 — Implement (delegate to Implementer subagent)
Pass the Planner's output to the Implementer subagent.
Include the full implementation plan in your message to the Implementer.
Wait for implementation confirmation and compilation status.

### Step 3 — Review (delegate to Reviewer subagent)
Ask the Reviewer subagent to review the changes made in Step 2.
Specify which files were modified.

### Step 4 — Iterate (if needed)
If the Reviewer returns CRITICAL or MAJOR findings:
- Pass the findings back to the Implementer to fix
- Re-run the Reviewer
- Repeat until the Reviewer returns APPROVED

### Step 5 — Write Tests (delegate to Implementer subagent)
Once the code is approved, ask the Implementer to write tests covering:
- All test cases specified in the original plan
- All test cases identified by the Reviewer

### Step 6 — Final Review
Run the Reviewer one final time on the tests.

### Step 7 — Report
Summarize what was done:
- Files changed
- Tests added
- Any remaining improvement suggestions (MINOR findings)

## Rules
- Always wait for one subagent to complete before invoking the next
- Never edit files yourself — delegate all edits to the Implementer
- Never skip the review step, even if the implementation looks correct
- If a subagent fails or produces unclear output, retry once with more context
```

### Step 3.2 — Add a Handoff (optional quality-of-life improvement)

If you want a guided "Start Review" button after planning, add this to the orchestrator's frontmatter:

```yaml
handoffs:
  - label: "▶ Start full implementation"
    agent: orchestrator
    prompt: "Execute the full Plan → Implement → Review workflow for the feature described above."
    send: false
```

> **Checkpoint:** Open Copilot Chat, select **Orchestrator** from the dropdown. It should appear in the agent list. Ask: `What is your workflow?` — it should describe the 7-step process.

---

## Phase 4 — Run the Full Orchestration (15 min)

You're now ready to run your AI dev team on a real feature request.

### The Feature Request

Open Copilot Chat, select the **Orchestrator** agent, and send this prompt:

```
Add a PATCH /tasks/:id endpoint to the Task Manager API.

Requirements:
- Allow partial updates: title, description, and/or status can be updated independently
- Validate all inputs using the same rules as POST /tasks
- Return 404 if the task does not exist
- Return 400 for invalid input
- Return 200 with the updated task on success
- Update the `updatedAt` timestamp on every successful update
- Add full test coverage: happy path, partial update, 404, and all validation failures
```

### What to Observe

Watch how the Orchestrator:

1. **Invokes the Planner** — you'll see "Running subagent: Planner..."
2. **Receives the plan** — displays it before moving on
3. **Invokes the Implementer** — passes the plan as context
4. **Invokes the Reviewer** — gets a structured review
5. **Iterates** (if there are CRITICAL findings)
6. **Invokes the Implementer** again for tests
7. **Delivers the final summary**

### Verify the Result

```bash
# In starter-project/
npm run build     # Should compile cleanly
npm test          # All tests should pass

# Manual test
curl -X PATCH http://localhost:3000/tasks/PASTE_A_VALID_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}'
# → 200 with updated task

curl -X PATCH http://localhost:3000/tasks/PASTE_A_VALID_ID \
  -H "Content-Type: application/json" \
  -d '{"title": ""}'
# → 400 with validation error
```

> **Discussion prompts:**
> - How many iterations did the orchestrator need before the code was approved?
> - What did the Reviewer catch that the Implementer missed?
> - What would happen if you gave the Orchestrator a much larger feature request?

---

## Phase 5 — Bonus: Reusable Prompt File (5 min)

Create a prompt file to invoke the full orchestration workflow as a slash command.

Create `.github/prompts/feature.prompt.md`:

```markdown
---
name: feature
description: Orchestrate a full Plan → Implement → Review cycle for a new feature
agent: orchestrator
tools: ['agent', 'read', 'search', 'edit']
---
Using the Orchestrator workflow, implement the following feature:

${input:feature_description}

Make sure to:
1. Plan the implementation first (Planner subagent)
2. Implement the code (Implementer subagent)
3. Review for quality and correctness (Reviewer subagent)
4. Write comprehensive tests
5. Produce a final summary of all changes made
```

**Usage:** In any Copilot Chat session, type `/feature` — you'll be prompted to describe the feature, and the full orchestration kicks off automatically.

---

## Key Files Reference

```
starter-project/
├── .github/
│   ├── copilot-instructions.md         ← always-on project context
│   ├── instructions/
│   │   └── typescript.instructions.md  ← TypeScript-specific rules
│   ├── agents/
│   │   ├── planner.agent.md            ← read-only planning subagent
│   │   ├── implementer.agent.md        ← coding subagent
│   │   ├── reviewer.agent.md           ← read-only review subagent
│   │   └── orchestrator.agent.md       ← coordinator (user-facing)
│   └── prompts/
│       └── feature.prompt.md           ← /feature slash command
└── src/
    ├── models/task.model.ts
    ├── services/task.service.ts
    ├── routes/tasks.routes.ts
    ├── app.ts
    └── index.ts
```

---

## Takeaways

- **Instruction files** (`copilot-instructions.md`, `.instructions.md`) shape every response — invest in writing them well
- **Specialized agents** with narrow tool sets are more reliable than one general-purpose agent
- **Subagents run in isolated contexts** — the orchestrator must pass all necessary context explicitly
- **The review loop** catches issues that single-pass generation misses
- **Prompt files** (`/feature`) make orchestration reusable and accessible to the whole team

---

➡️ Compare your results with the solution in `solutions/copilot/`
