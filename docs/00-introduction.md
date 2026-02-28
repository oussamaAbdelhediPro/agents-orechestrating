# Deep Dive into Agent Orchestration
### Workshop Introduction — Shared Track

**Duration:** 1h30 &nbsp;|&nbsp; **Level:** Intermediate/Advanced &nbsp;|&nbsp; **Language:** English

---

## Agenda

| Time | Segment |
|------|---------|
| 0:00 – 0:15 | Theory: Agents, Orchestration & Tools |
| 0:15 – 0:30 | Phase 1 — Setup your project & instructions |
| 0:30 – 0:55 | Phase 2 — Create your specialized agents |
| 0:55 – 1:15 | Phase 3 — Build and run the orchestrator |
| 1:15 – 1:30 | Debrief, discussion & next steps |

---

## Objectives

By the end of this workshop you will be able to:

1. **Create specialized AI agents** with distinct roles, tools, and personas
2. **Orchestrate agents** using the Coordinator/Worker pattern (one agent delegating to multiple specialized subagents)
3. **Write instruction files** that guide LLM behavior per project or per file type
4. **Apply a real-world orchestration scenario**: plan → implement → review → iterate

---

## Theory (15 min)

### What is an AI Coding Agent?

An AI coding agent is an **LLM + tools + instructions + a feedback loop**.

```
  ┌──────────────────────────────────────┐
  │             AI Agent                 │
  │                                      │
  │  ┌─────────┐    ┌──────────────────┐ │
  │  │  LLM    │───▶│  Tools           │ │
  │  │ (brain) │◀───│  (read/edit/run) │ │
  │  └─────────┘    └──────────────────┘ │
  │       │                              │
  │  ┌────▼─────┐                        │
  │  │Instructions│ ← your .md files    │
  │  └──────────┘                        │
  └──────────────────────────────────────┘
```

The agent **observes** the codebase, **reasons** about what to do, **acts** via tools, then **evaluates** its own output — looping until the task is done.

---

### Agent Orchestration Patterns

#### Pattern 1 — Coordinator / Worker (what we build today)

One **coordinator agent** decomposes a task and delegates to **specialized worker agents** (subagents), each running in an **isolated context window**. Results flow back to the coordinator for synthesis.

```
  User Request
       │
       ▼
  ┌──────────────┐
  │ Orchestrator │  ← coordinator: decomposes, delegates, synthesises
  └──────┬───────┘
         │  spawns (parallel or sequential)
    ┌────┼────┐
    ▼    ▼    ▼
 Planner Impl. Reviewer  ← specialized subagents, isolated contexts
```

**Key property:** each subagent starts with a **clean context** — no conversation history is inherited. Only the final result is returned. This keeps tokens low and focus high.

#### Pattern 2 — Multi-Perspective Review

The same input is reviewed by multiple subagents simultaneously (security reviewer, performance reviewer, style reviewer), and the coordinator synthesizes all findings.

#### Pattern 3 — TDD Loop

Three sequential agents: **Red** (write a failing test), **Green** (make it pass), **Refactor** (clean up the code).

---

### Key Concepts

| Concept | Copilot term | OpenCode term |
|---------|-------------|---------------|
| Specialized agent definition | `.agent.md` file | `.md` file in `.opencode/agents/` |
| Always-on project instructions | `copilot-instructions.md` | `AGENTS.md` |
| Per-file-type instructions | `.instructions.md` | `instructions` in config |
| Reusable task templates | `.prompt.md` | custom commands (`.opencode/commands/`) |
| Subagent invocation | `agent` tool | `task` tool + `@mention` |
| Parallel subagents | Supported | Supported |

---

### Capabilities Comparison

| Feature | GitHub Copilot | OpenCode |
|---------|---------------|----------|
| Custom agents | `.agent.md` frontmatter | JSON config or `.md` files |
| Subagent orchestration | `tools: ['agent']` | task permissions + `@mention` |
| Instruction files | `.github/copilot-instructions.md` + `.instructions.md` | `AGENTS.md` + glob patterns in config |
| Model choice | Copilot-managed (GPT-4o, Claude, etc.) | Any provider — 75+ models |
| Cost | GitHub Copilot license | Free (bring-your-own API key) or Zen plan |
| Interface | VS Code extension | TUI, desktop app, VS Code SDK |
| Open source | No | Yes (MIT) |

---

## Prerequisites Checklist

Before the workshop, make sure you have the following installed and working:

- [ ] **Node.js** ≥ 20 — [nodejs.org](https://nodejs.org)
- [ ] **Git** — [git-scm.com](https://git-scm.com)
- [ ] **VS Code** (latest version) — [code.visualstudio.com](https://code.visualstudio.com)
- [ ] **GitHub Copilot** (active license) OR **OpenCode** installed — pick your track:
  - Copilot track: confirm Copilot Chat is working in VS Code (try asking a question in the chat)
  - OpenCode track: `npm i -g opencode-ai@latest` then run `opencode --version`

---

## Setup: Clone & Run the Starter Project

```bash
# Clone the workshop repository
git clone https://github.com/YOUR_ORG/workshop-agent-orchestration.git
cd workshop-agent-orchestration/starter-project

# Install dependencies
npm install

# Start the server
npm run dev
# → Task Manager API running on http://localhost:3000

# In a separate terminal — verify it works
curl http://localhost:3000/health
# → {"status":"ok","timestamp":"..."}

curl http://localhost:3000/tasks
# → [{"id":"...","title":"Design API schema",...}, ...]

# Run the tests
npm test
```

The starter project is a **Task Manager REST API** with intentional gaps:
- No `PATCH /tasks/:id` endpoint
- No input validation on `POST /tasks`
- Minimal test coverage

**Your mission:** Use an orchestrated team of AI agents to add the missing endpoint, validate inputs, and write thorough tests — all in one prompt to the orchestrator.

---

## Now pick your track

➡️ **GitHub Copilot users** → open [01-workshop-copilot.md](./01-workshop-copilot.md)

➡️ **OpenCode users** → open [02-workshop-opencode.md](./02-workshop-opencode.md)
