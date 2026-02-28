# Explained: `.github/prompts/feature.prompt.md`

**Purpose:** A reusable prompt template that users invoke with `/feature` to trigger the full orchestration pipeline. This is the entry point for the entire Copilot multi-agent workflow.

---

## Full File

```markdown
---
mode: agent
agent: Orchestrator
tools: [agent, read, search, edit, run]
---

Implement a new feature for the Task Manager API using the full agent orchestration pipeline.

Feature to implement: ${input:feature_description:Describe the feature (e.g., "Add PATCH /tasks/:id endpoint for partial updates")}

## Instructions for Orchestrator

Follow your standard workflow:
1. Analyze the feature request
2. Present the implementation plan to the user for confirmation
3. Delegate implementation to the Implementer agent
4. Delegate review to the Reviewer agent
5. Report completion with a summary of changes

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

### Frontmatter

```yaml
---
mode: agent
agent: Orchestrator
tools: [agent, read, search, edit, run]
---
```

**`mode: agent`**
Activates agent mode for this prompt. Without this, Copilot runs the prompt as a standard chat completion. With `mode: agent`, Copilot knows this prompt will involve tool use and multi-turn interactions.

**`agent: Orchestrator`**
Routes this prompt directly to the Orchestrator agent. When a user types `/feature`, Copilot doesn't just paste the prompt into the default chat context — it *activates the Orchestrator agent*, which loads the Orchestrator's system prompt, tool whitelist, and agent whitelist.

This is the connection between the prompt file and the agent ecosystem. Without this line, the prompt would run in a default agent context without any of the orchestration setup.

**`tools: [agent, read, search, edit, run]`**
The tool set for this prompt session. Notice this includes `run` — even though the Orchestrator agent file doesn't have `run` in its own tools list. When a prompt file specifies tools, it can *extend* the agent's default tool set for that specific invocation.

Why add `run` here? The prompt needs to support the full pipeline, including allowing the Implementer's `npm run build` check to flow through the orchestration.

---

### The Main Prompt Body

```
Implement a new feature for the Task Manager API using the full agent orchestration pipeline.
```

This is the instruction given to the Orchestrator when the prompt is invoked. It establishes intent and activates the full pipeline workflow.

---

### `${input:feature_description:...}`

```
Feature to implement: ${input:feature_description:Describe the feature (e.g., "Add PATCH /tasks/:id endpoint for partial updates")}
```

This is a **Copilot input variable**. Its anatomy:

```
${input: name : placeholder_text }
         ↑          ↑
    variable    shown in the
     name       input dialog
```

When a user triggers `/feature`, Copilot shows an input dialog with the placeholder text:
> "Describe the feature (e.g., 'Add PATCH /tasks/:id endpoint for partial updates')"

The user types their feature description, and it's inserted at `${input:feature_description}` in the prompt before sending to the Orchestrator.

**Why use an input variable instead of asking the Orchestrator to prompt for it?**
1. **UX clarity** — The user sees a proper dialog, not an ambiguous "what feature?" message buried in chat
2. **Reliability** — The input is captured before the agent starts, not mid-conversation
3. **Reusability** — The same prompt file works for any feature — you don't need to edit the file, just fill in the dialog

---

### `## Instructions for Orchestrator`

```markdown
Follow your standard workflow:
1. Analyze the feature request
2. Present the implementation plan to the user for confirmation
3. Delegate implementation to the Implementer agent
4. Delegate review to the Reviewer agent
5. Report completion with a summary of changes
```

This is an explicit workflow reminder embedded in every `/feature` invocation. It might seem redundant (the Orchestrator agent file already has this workflow), but it serves an important purpose:

**Context reinforcement**. When the Orchestrator is activated via a prompt, it may not always have perfect recall of its agent file's detailed instructions. The prompt body repeating the key steps acts as a reminder and ensures consistent behavior.

---

### `## Feature Requirements`

```markdown
The feature should:
- Follow the existing API conventions (JSON responses, proper status codes)
- Include input validation in the utils layer
- Have full test coverage (happy path + error cases)
- Pass TypeScript compilation with zero errors
- Follow all code standards from project instructions
```

These are the acceptance criteria that every feature *must* meet before the Orchestrator reports completion. This list is passed through the entire pipeline:
- The Planner uses it to know what to cover in the plan
- The Implementer uses it as a checklist when coding
- The Reviewer uses it to verify the implementation against the spec
- The Orchestrator uses it to decide whether to report DONE or CHANGES REQUIRED

---

## Key Takeaway: Prompt Files as Entry Points

The `.prompt.md` file is the **public interface** of the entire agent system. Users only know about `/feature` — they don't know about Planner, Implementer, Reviewer, or the orchestration workflow.

From the user's perspective:
1. Type `/feature`
2. Fill in the description
3. Watch it get done

From the system's perspective:
1. Prompt routes to Orchestrator
2. Orchestrator delegates to Planner, Implementer, Reviewer
3. Results aggregated and reported back

The prompt file hides all the complexity behind a simple command.

**Comparison to OpenCode:**
OpenCode's equivalent is `.opencode/commands/feature.md`. The key difference is `$ARGUMENTS` vs `${input:}` — OpenCode passes everything after `/feature` as a single string, while Copilot shows a named input dialog. OpenCode's approach is faster to type; Copilot's approach is clearer for new users.
