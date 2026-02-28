# Explained: `opencode.json`

**Purpose:** The central configuration file for OpenCode. It declares the default model, loads global instruction files, and sets per-agent tool permissions.

---

## Full File

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-5",
  "instructions": ["AGENTS.md"],
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
}
```

---

## Line-by-Line Explanation

### `"$schema": "https://opencode.ai/config.json"`

Links the file to OpenCode's JSON Schema. This provides:
- **IntelliSense/autocomplete** in editors (VS Code will suggest valid keys)
- **Validation** — if you typo a key, the editor underlines it
- **Documentation** — hovering a key shows its description in supporting editors

This line has no runtime effect. It's purely a developer-experience enhancement.

---

### `"model": "anthropic/claude-sonnet-4-5"`

Sets the **default model** for all sessions. Format: `provider/model-id`.

- `anthropic/` — the LLM provider
- `claude-sonnet-4-5` — the specific model version

This is overridable at the agent level. In `.opencode/agents/planner.md`, you'll see `model: anthropic/claude-haiku-4-5` — which overrides this default for the planner agent, using the cheaper Haiku model for read-only planning tasks.

**Why specify the model here vs. per-agent?**
Default + override pattern:
1. Set a sensible default in `opencode.json`
2. Override only where needed (e.g., cheaper model for simpler agents)

This avoids repeating the model declaration in every agent file — only exceptions need to specify.

---

### `"instructions": ["AGENTS.md"]`

An array of file paths to load as global instructions. Every conversation loads these files.

**Why an array?**
You can add more instruction files over time:
```json
"instructions": ["AGENTS.md", "docs/SECURITY.md", "docs/API-STYLE.md"]
```

Each file is appended to the system context in order. This allows modular instruction management — security rules in one file, API conventions in another, project overview in AGENTS.md.

**Path resolution:** Relative to the project root (where `opencode.json` lives).

---

### `"agents"` block

```json
"agents": {
  "orchestrator": {
    "permission": { ... }
  }
}
```

This is the per-agent configuration section. Keys are agent names (must match the filename without extension in `.opencode/agents/`).

Why only `orchestrator` here and not planner/implementer/reviewer?

The orchestrator is the **most privileged agent** from the user's perspective — it's the one that runs commands and coordinates everything. Its permissions need to be explicitly restricted to prevent it from accidentally or maliciously writing files while orchestrating. The other agents' restrictions are defined in their individual YAML frontmatter.

---

### `"permission"` block

```json
"permission": {
  "bash": "deny",
  "write": "deny",
  "edit": "deny",
  "task.new": "allow",
  "task.list": "allow",
  "task.kill": "allow"
}
```

This is OpenCode's permission system. Three values:
- `"allow"` — permitted without asking
- `"ask"` — permitted but requires user confirmation each time
- `"deny"` — blocked entirely

**`"bash": "deny"`**
The orchestrator cannot run shell commands. This is a hard security boundary. The orchestrator's job is coordination — it should never be modifying the filesystem or running arbitrary code.

Compare: In Copilot, the Orchestrator's `tools` list doesn't include `run`, achieving the same result through tool omission.

**`"write": "deny"` and `"edit": "deny"`**
Two separate permissions for file modification:
- `write` — creating new files
- `edit` — modifying existing files

Both denied. The orchestrator should not touch the filesystem. It delegates all file operations to the Implementer.

**The `bash`/`write`/`edit` deny trio ensures the orchestrator is a pure coordinator** — it talks, but doesn't act on the filesystem.

---

**`"task.new": "allow"`**
This is what makes orchestration possible. `task.new` is OpenCode's mechanism for spawning a subagent to run a task. Without this permission, the orchestrator cannot delegate work.

`task.new` creates a new OpenCode "task" (a subagent invocation with tools and context). The orchestrator uses this to call:
- The Planner with a feature description
- The Implementer with a plan
- The Reviewer with implementation details

**`"task.list": "allow"`**
Lets the orchestrator see all running tasks. Useful for monitoring subagent progress and checking if the Implementer is still working.

**`"task.kill": "allow"`**
Lets the orchestrator cancel a running subagent. For example, if the Implementer has been running for too long or went off-track, the orchestrator can terminate it.

---

## Key Takeaway: Central vs. Distributed Config

OpenCode uses a **hybrid configuration approach**:
- Central config (`opencode.json`): global model, global instructions, orchestrator permissions
- Distributed config (individual agent YAML frontmatter): per-agent mode, model override, temperature, tool restrictions

This separation makes the config readable at two levels:
1. "What does this project use overall?" → read `opencode.json`
2. "What does the Planner agent do specifically?" → read `.opencode/agents/planner.md`

Compare with Copilot, which has no central config file — everything is distributed across agent files and instructions files. OpenCode's `opencode.json` acknowledges the need for a single source of truth for project-level settings.
