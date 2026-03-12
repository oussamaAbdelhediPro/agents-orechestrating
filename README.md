# Deep Dive into Agent Orchestration — Workshop

**Duration:** 1h30 &nbsp;|&nbsp; **Level:** Intermediate/Advanced &nbsp;|&nbsp; **Language:** English

---

## Structure

```
workshop/
├── docs/
│   ├── 00-introduction.md       ← Start here! Theory + shared setup (15 min)
│   ├── 01-workshop-copilot.md   ← Copilot track (1h15 hands-on)
│   └── 02-workshop-opencode.md  ← OpenCode track (1h15 hands-on)
│

├── src/
│   ├── models/task.model.ts
│   ├── services/task.service.ts
│   ├── routes/tasks.routes.ts
│   ├── app.ts
│   └── index.ts
├── tests/tasks.test.ts
├── package.json
├── tsconfig.json
└── README.md
│
└── solutions/                   ← Reference solution — don't peek until you're done!
    ├── copilot/                 ← Completed Copilot agent files
    │   └── .github/
    │       ├── copilot-instructions.md
    │       ├── instructions/typescript.instructions.md
    │       ├── agents/          ← planner, implementer, reviewer, orchestrator
    │       └── prompts/feature.prompt.md
    │
    ├── opencode/                ← Completed OpenCode config files
    │   ├── AGENTS.md
    │   ├── opencode.json
    │   └── .opencode/
    │       ├── agents/          ← planner, implementer, reviewer, orchestrator
    │       └── commands/feature.md
    │
    └── src/                     ← Completed source code with PATCH endpoint
        ├── models/task.model.ts
        ├── utils/validation.ts
        ├── services/task.service.ts
        ├── routes/tasks.routes.ts
        └── tests/tasks.test.ts
```

---

## Quick Start

```bash
cd starter-project
npm install
npm run dev
# → http://localhost:3000
```

Then open [docs/00-introduction.md](docs/00-introduction.md) to begin.

---

## Choose Your Track

| I have... | Track |
|-----------|-------|
| A GitHub Copilot license + VS Code | [docs/01-workshop-copilot.md](docs/01-workshop-copilot.md) |
| No Copilot / prefer open-source | [docs/02-workshop-opencode.md](docs/02-workshop-opencode.md) |
