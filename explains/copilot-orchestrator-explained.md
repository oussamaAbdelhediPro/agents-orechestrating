# Explained: `.github/agents/orchestrator.agent.md`

**Purpose:** The coordinator. This is the only agent users interact with directly. It breaks work into phases and delegates each phase to the appropriate subagent.

---

## Full File

```markdown
---
name: Orchestrator
description: Coordinates feature development by orchestrating Planner, Implementer, and Reviewer agents
tools: [agent, read, search, edit]
agents: [Planner, Implementer, Reviewer]
user-invokable: true
---

You are a senior engineering lead who coordinates feature development by delegating to specialist agents.

You NEVER implement code directly. You plan, delegate, and review.

## Your Agents

- **Planner** — Analyzes requirements and creates implementation plans
- **Implementer** — Writes code based on plans
- **Reviewer** — Reviews code for correctness and quality

## Orchestration Workflow

When given a feature request, follow these steps:

### Step 1: Understand the Request
- Read the current codebase structure if needed
- Ask clarifying questions if the feature is ambiguous
- Do NOT proceed to planning until requirements are clear

### Step 2: Delegate to Planner
```
@Planner Please analyze this feature request and create an implementation plan:
[feature description]
```

### Step 3: Review the Plan
- Read the plan carefully
- Verify it covers all necessary files
- Check for missing edge cases
- If the plan is incomplete, ask Planner to revise it

### Step 4: Delegate to Implementer
```
@Implementer Please implement the following plan:
[paste the full plan from Planner]
```
Wait for implementation to complete before proceeding.

### Step 5: Review the Implementation
After Implementer reports done, delegate to Reviewer:
```
@Reviewer Please review the implementation. The plan was:
[paste the plan]
```

### Step 6: Handle Review Feedback
- If **APPROVED**: Report success to user
- If **CHANGES REQUIRED** with CRITICAL/MAJOR issues:
  ```
  @Implementer Please address these issues from the code review:
  [paste CRITICAL and MAJOR issues from review]
  ```
  Then re-run Reviewer.
- Limit to 2 revision cycles maximum.

### Step 7: Report to User
Summarize what was built, which files were changed, and confirm tests pass.

## Rules
- Never implement code yourself (no file edits directly)
- Always present the plan to the user before implementation starts — ask for confirmation
- If stuck in a revision loop after 2 cycles, escalate to the user
- Keep the user informed at each phase transition
```

---

## Line-by-Line Explanation

### Frontmatter

```yaml
---
name: Orchestrator
description: Coordinates feature development by orchestrating Planner, Implementer, and Reviewer agents
tools: [agent, read, search, edit]
agents: [Planner, Implementer, Reviewer]
user-invokable: true
---
```

**`tools: [agent, read, search, edit]`**
Four tools, with one that's unique to the orchestrator: `agent`.

- `agent` — the tool that enables *calling other agents*. Without this, an agent cannot delegate work to other agents. This is what makes the orchestrator an orchestrator.
- `read` — to read existing files when understanding the codebase
- `search` — to search for relevant context
- `edit` — can make small edits directly (like stubbing a file or making a quick fix after review)

**Why does the orchestrator have `edit` if the rule is "never implement code"?**
The `edit` tool is available for minor interventions — like creating a placeholder file, updating a config value, or making a tiny fix that doesn't warrant a full Implementer cycle. The *convention* is not to use it for feature implementation, but the capability exists for edge cases.

**`agents: [Planner, Implementer, Reviewer]`**
This whitelist tells Copilot which agents this orchestrator is allowed to invoke. It's a second layer of access control — the orchestrator can only talk to these three agents, even though other agents might exist in `.github/agents/`.

**`user-invokable: true`**
Unique among the four agents — only the Orchestrator is `true`. Users trigger it with `@Orchestrator add a PATCH endpoint`. All other agents are `false` — they only run when the Orchestrator calls them.

---

### `You NEVER implement code directly.`

The first constraint in the system prompt. The orchestrator has the `edit` tool, so physically it *could* edit files. This rule prevents it from doing so for feature implementation.

**Why restrict behavior with a prompt rule when you could just remove the `edit` tool?**
Because the orchestrator sometimes needs `edit` for minor tasks (see above). The distinction is: `edit` is available for coordination overhead, not for implementing features. Prompt rules express nuanced behavioral constraints that tool whitelists can't capture.

---

### `## Your Agents` block

A reference card. The orchestrator knows the full name and purpose of each subagent. This section isn't operational — it's context that helps the orchestrator make good delegation decisions.

---

### `## Orchestration Workflow`

Seven steps that map to the Plan → Implement → Review cycle.

**Step 1: Understand the Request**
- `Ask clarifying questions if the feature is ambiguous` — the orchestrator is the only agent that talks to the user. It must resolve ambiguity before passing requirements to the planner. If the planner gets an unclear requirement, it will produce a vague plan.
- `Do NOT proceed to planning until requirements are clear` — explicit gate.

**Step 2: Delegate to Planner**
The prompt template shows exact syntax:
```
@Planner Please analyze this feature request and create an implementation plan:
```
This `@Agent` syntax is how agents call other agents in Copilot. The orchestrator passes the feature description as context.

**Step 3: Review the Plan**
The orchestrator doesn't blindly pass the plan to the implementer. It reads it first and validates:
- Does it cover all files?
- Are edge cases listed?
- If incomplete, ask Planner to revise.

This prevents bad plans from becoming bad code.

**Step 4: Delegate to Implementer**
`@Implementer Please implement the following plan: [paste the full plan]`
The full plan is passed verbatim. The implementer needs the plan details — file list, steps, API contract. Don't just say "implement it."

**`Wait for implementation to complete before proceeding.`**
Agents run asynchronously internally. The orchestrator must explicitly wait for the implementer to finish before starting the review phase.

**Step 5: Delegate to Reviewer**
`@Reviewer Please review the implementation. The plan was: [paste the plan]`
The reviewer gets the plan *too*, not just the code. The plan describes the intended behavior — the reviewer needs it to verify the implementation matches the specification.

**Step 6: Handle Review Feedback**
The decision tree:
- APPROVED → done
- CHANGES REQUIRED → re-invoke Implementer with the specific issues, then re-run Reviewer
- **`Limit to 2 revision cycles maximum`** — prevents infinite loops. After 2 failed cycles, the orchestrator escalates to the user rather than spiraling.

**Step 7: Report to User**
The orchestrator is responsible for the user-facing summary: what was built, which files changed, confirmation that tests pass. Users don't read the full agent conversation — they get this summary.

---

### `## Rules`

**`Always present the plan to the user before implementation starts — ask for confirmation`**
Human-in-the-loop checkpoint. The plan is shown to the user, who can veto or redirect before any code is written. This is a safety valve — if the planner misunderstood the requirement, the user catches it here.

**`If stuck in a revision loop after 2 cycles, escalate to the user`**
Defines the escape hatch. Without this, the system could loop: Implementer writes code → Reviewer finds issues → Implementer re-writes → Reviewer still finds issues → ... indefinitely.

---

## Key Takeaway: The `agent` Tool

The `agent` tool is what makes Copilot capable of multi-agent orchestration. Without it declared in the tools list, an agent's `@OtherAgent` calls are ignored. It's the "delegation capability" — and only the Orchestrator needs it.

Compare this to OpenCode, where the orchestrator uses `mode: primary` and calls subagents using a different mechanism (`/feature`, or `Task(...)` syntax). Same concept, different API.
