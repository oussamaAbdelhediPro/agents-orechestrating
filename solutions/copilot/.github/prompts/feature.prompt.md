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
