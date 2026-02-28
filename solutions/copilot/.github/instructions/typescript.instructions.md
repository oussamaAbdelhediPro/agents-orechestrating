---
applyTo: "**/*.ts"
---
# TypeScript Conventions

- Always annotate function return types explicitly
- Use `interface` for object shapes, `type` for unions and aliases
- Prefer `readonly` for properties that should not be mutated
- Use `unknown` instead of `any` — narrow types with type guards
- Validate external input before casting to domain types
