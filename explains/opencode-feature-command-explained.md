# Explained: `.opencode/commands/feature.md`

**Purpose:** A custom slash command that provides the user with a pre-filled prompt template for requesting new features through the orchestration pipeline.

---

## Full File

```markdown
---
description: Implement a new feature using the full agent orchestration pipeline
---

Implement a new feature for the Task Manager API using the full agent orchestration pipeline.

Feature to implement: $ARGUMENTS

## Instructions for Orchestrator

Follow your standard workflow:
1. Analyze the feature request above
2. Use the Planner agent to create an implementation plan
3. Present the plan to the user for confirmation before proceeding
4. Use the Implementer agent to write the code
5. Use the Reviewer agent to verify the implementation
6. Report completion with a summary of all changes made

## Feature Requirements

The feature should:
- Follow the existing API conventions (JSON responses, proper status codes)
- Include input validation in the utils layer
- Have full test coverage (happy path + error cases)
- Pass TypeScript compilation with zero errors
- Follow all code standards from project instructions
```

---

## Line-by-Line Explanation

### File Location

`.opencode/commands/feature.md`

The filename determines the command name. Because the file is `feature.md`, the command is `/feature`. Users type:
```
/feature Add PATCH /tasks/:id endpoint for partial updates
```

If you renamed the file to `add-endpoint.md`, the command would become `/add-endpoint`. No registration needed — the filename is the command name.

---

### Frontmatter

```yaml
---
description: Implement a new feature using the full agent orchestration pipeline
---
```

Only one field: `description`. This text appears in OpenCode's command picker when users browse available commands. It tells users what the command does before they invoke it.

**What's notably absent:**

Unlike Copilot's `feature.prompt.md`, this frontmatter has no:
- `agent:` — no explicit agent routing
- `mode:` — no mode specification
- `tools:` — no tool specification

**Why?** In OpenCode, commands are sent to the **currently active primary agent** — which is always the Orchestrator (because `mode: primary` is set). There's no need to specify routing because the routing is implied by the `mode: primary` architecture.

Compare with Copilot:
```yaml
---
mode: agent
agent: Orchestrator    # ← must explicitly route to orchestrator
tools: [agent, read, search, edit, run]  # ← must list tools
---
```

OpenCode's approach is simpler because the primary agent concept handles routing automatically. Copilot requires explicit routing because any agent can be invoked.

---

### `$ARGUMENTS`

```
Feature to implement: $ARGUMENTS
```

`$ARGUMENTS` is OpenCode's argument injection mechanism. Everything typed after `/feature` becomes the value of `$ARGUMENTS`.

```
User types:  /feature Add soft-delete with archive endpoint
             ↓
$ARGUMENTS = "Add soft-delete with archive endpoint"
             ↓
Final prompt: "Feature to implement: Add soft-delete with archive endpoint"
```

**Comparison with Copilot's `${input:feature_description}`:**

| | OpenCode `$ARGUMENTS` | Copilot `${input:feature_description}` |
|--|--|--|
| UX | Type everything inline after the command | Shows a named input dialog |
| Speed | Faster to type | Requires extra UI interaction |
| Clarity | Clean for experienced users | Clearer for first-time users |
| Multiple inputs | One string, no separation | Can have multiple named inputs |

OpenCode's `$ARGUMENTS` is a single blob — everything after the command name. It's simple and fast. Copilot's `${input:name:placeholder}` shows a labeled dialog with placeholder text. For workshop participants learning the system, Copilot's approach is more guided; for daily developer use, `$ARGUMENTS` is faster.

---

### `## Instructions for Orchestrator`

```markdown
Follow your standard workflow:
1. Analyze the feature request above
2. Use the Planner agent to create an implementation plan
3. Present the plan to the user for confirmation before proceeding
4. Use the Implementer agent to write the code
5. Use the Reviewer agent to verify the implementation
6. Report completion with a summary of all changes made
```

The 6-step workflow is injected into every `/feature` invocation. This is identical in purpose to Copilot's prompt body — it reminds the Orchestrator of its workflow every time a feature is requested.

**Why repeat the workflow here when the Orchestrator's agent file already has it?**
Context reinforcement. The orchestrator's system prompt is loaded once at session start. The command body is injected fresh with each invocation. Having the workflow in both places ensures the orchestrator follows it consistently.

---

### `## Feature Requirements`

This acceptance criteria list is passed to the Orchestrator with every `/feature` invocation. It feeds through the entire pipeline:

1. **Orchestrator** reads requirements → confirms it understands what "done" means
2. **Planner** sees requirements → includes them in the implementation plan
3. **Implementer** sees requirements (via plan) → validates code against them
4. **Reviewer** sees requirements (via plan) → uses them as review criteria
5. **Orchestrator** reports completion → can confirm requirements were met

Embedding requirements in the command ensures they're never forgotten, even in long multi-turn orchestration sessions.

---

### No `agent:` Routing — A Design Difference

The most architecturally interesting aspect of this file is what it *doesn't* have.

Copilot's prompt file must explicitly say `agent: Orchestrator` because Copilot's agent system is opt-in — by default, a prompt runs in a generic agent context.

OpenCode's command system inherits from the `mode: primary` design — the orchestrator is *always* the active agent. Commands are always sent to the primary agent. There's nothing to route.

**Consequence:** In OpenCode, if you wanted a command that goes to a *different* agent (say, directly to the Implementer for quick edits), you'd need to either:
- Change the primary agent
- Use a workaround

In Copilot, you could create a second prompt file with `agent: Implementer` and it would route directly. Copilot's explicit routing is more flexible; OpenCode's implicit routing is simpler.

---

## Key Takeaway: Convention vs. Configuration

This file demonstrates OpenCode's "convention over configuration" approach to commands:

| | Convention (OpenCode) | Configuration (Copilot) |
|--|--|--|
| Command name | Filename | File path (conventional) |
| Agent routing | Always → primary agent | `agent: OrchestratorName` |
| Tool access | Inherited from primary | Declared in frontmatter |
| Arguments | `$ARGUMENTS` (one blob) | `${input:name:placeholder}` (named) |

OpenCode reduces boilerplate by relying on conventions. Copilot gives more control through explicit configuration. Both approaches work — the choice reflects team preferences around explicitness vs. simplicity.
