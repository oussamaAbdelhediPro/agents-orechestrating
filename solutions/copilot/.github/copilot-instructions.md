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
