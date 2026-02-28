# Explained: `.opencode/agents/orchestrator.md`

**Purpose:** The primary agent — the coordinator that users interact with. Delegates planning, implementation, and review to specialist subagents.

---

## Full File

```markdown
---
name: Orchestrator
description: Coordinates feature development by orchestrating Planner, Implementer, and Reviewer agents
mode: primary
temperature: 0.3
---

You are a senior engineering lead who coordinates feature development by delegating to specialist agents.

You NEVER implement code directly. You plan, delegate, and review.

## Your Specialist Agents

- **Planner** — Analyzes requirements and creates implementation plans
- **Implementer** — Writes code based on plans
- **Reviewer** — Reviews code for correctness and quality

## Orchestration Workflow

When given a feature request, follow these steps:

### Step 1: Understand the Request
- Analyze the feature description
- Ask clarifying questions if the feature is ambiguous
- Do NOT proceed to planning until requirements are clear

### Step 2: Delegate to Planner
Use the Task tool to invoke the Planner:
```
Task("Create an implementation plan for: [feature description]", agent="Planner")
```

### Step 3: Review the Plan
- Read the plan output carefully
- Verify it covers all necessary files
- Check for missing edge cases
- Present the plan summary to the user and ask for confirmation

### Step 4: Delegate to Implementer
```
Task("Implement the following plan: [paste full plan]", agent="Implementer")
```
Wait for completion before proceeding.

### Step 5: Delegate to Reviewer
```
Task("Review this implementation. The spec was: [paste plan]", agent="Reviewer")
```

### Step 6: Handle Review Feedback
- If **APPROVED**: Run `npm test` to do a final verification, then report success
- If **CHANGES REQUIRED**: Re-invoke Implementer with issues, then re-run Reviewer
- Limit to 2 revision cycles, then escalate to user

### Step 7: Report to User
Summarize: what was built, files changed, test results.

## Rules
- Never implement code yourself
- Always show plan to user before implementation starts
- Escalate after 2 failed review cycles
```

---

## Line-by-Line Explanation

### Frontmatter

```yaml
---
name: Orchestrator
description: Coordinates feature development by orchestrating Planner, Implementer, and Reviewer agents
mode: primary
temperature: 0.3
---
```

**`mode: primary`**
This is the defining characteristic of the orchestrator. `mode: primary` means:
- The user talks to this agent directly
- It's the entry point for all interactions
- It persists across turns (maintains conversation history)
- It's the agent that's active when you open OpenCode in this project

Only **one** `primary` agent should exist per project. All others are `subagent` mode.

Compare with Copilot: `user-invokable: true` achieves the same "user-facing" behavior, but with a more specific mechanism (users invoke it with `@Orchestrator`). In OpenCode with `mode: primary`, the orchestrator is *always* the default agent — you don't need to invoke it explicitly.

---

**`temperature: 0.3`**
The highest temperature in the system (planner and reviewer are 0.1, implementer is 0.2). Why higher for the orchestrator?

The orchestrator has the most **conversational** role:
- It asks clarifying questions
- It summarizes results to users
- It writes natural language status updates
- It adapts to user responses

Slight creativity (0.3) makes its responses more natural and varied, rather than robotic and formulaic. This is acceptable because the orchestrator's output is *communication*, not *code* — a small amount of stylistic variation is a feature, not a bug.

---

**No `tools:` block**
The orchestrator has **no tool restrictions in the agent file** because its permissions are set in `opencode.json`:

```json
"agents": {
  "orchestrator": {
    "permission": {
      "bash": "deny",
      "write": "deny",
      "edit": "deny",
      "task.new": "allow",
      "task.list": "allow",
      "task.kill": "allow"
    }
  }
}
```

**Why put orchestrator permissions in `opencode.json` instead of the agent file?**
Two reasons:
1. **Visibility**: `opencode.json` is the first place developers look for project configuration. Security-critical restrictions (like "orchestrator can't edit files") benefit from being visible at the project level.
2. **Enforcement**: Permissions in `opencode.json` are applied at the project config level, not just the agent level. They're harder to accidentally override by editing the agent file.

The agent file handles *behavioral* config (mode, temperature, system prompt). The project config handles *security* config (what the orchestrator can and cannot do to the filesystem).

---

### `## Orchestration Workflow`

**Step 2 — `Task(...)` syntax:**
```
Task("Create an implementation plan for: [feature description]", agent="Planner")
```

This is OpenCode's subagent invocation syntax. Compare with Copilot:
```
@Planner Please analyze this feature request...
```

OpenCode uses a function-call syntax. Copilot uses an `@mention` syntax. Both achieve the same result: routing a message to a specific subagent.

The `agent="Planner"` parameter must match the `name` field in `.opencode/agents/planner.md`.

---

**Step 6 — Final `npm test` by the orchestrator:**

```markdown
If **APPROVED**: Run `npm test` to do a final verification, then report success
```

Wait — the orchestrator has `bash: deny` in `opencode.json`. How can it run `npm test`?

This is a **prompt-level instruction** that assumes the permission block might be relaxed, or that the orchestrator uses the sub-task mechanism to run the test. In practice, this step might be:
- Done by a test-runner subagent
- Skipped (relying on the reviewer's verification)
- Or the orchestrator prompts the user to run tests themselves

This tension between the system prompt instruction and the permission block is realistic — real-world agent systems often have instructions that exceed permissions, and the agent gracefully handles the limitation.

---

### The Missing `task.new` Rule in the Agent File

You'll notice the orchestrator's frontmatter doesn't mention `task.new`. This capability is granted entirely through `opencode.json`. The agent file is clean — it just defines the agent's role and behavior.

This separation of concerns is good architecture:
- Agent file: **who am I and how do I behave?**
- `opencode.json`: **what am I allowed to do?**

---

## Key Takeaway: `mode: primary` vs. `user-invokable: true`

| | OpenCode | Copilot |
|--|--|--|
| User entry point | `mode: primary` — always active | `user-invokable: true` — user calls `@Orchestrator` |
| Subagents | `Task("...", agent="X")` | `@Planner ...` |
| Permissions | `opencode.json` permission block | Tool whitelist in frontmatter |
| Persistence | Active for all turns | Activated per turn |

OpenCode's `mode: primary` is session-level — the orchestrator is always the active agent. Copilot's `user-invokable: true` is invocation-level — the user explicitly activates the orchestrator per request.

The OpenCode approach is better for complex projects where orchestration should always be the default. The Copilot approach is better for simpler projects where users might want to ask questions without triggering the full orchestration pipeline.
