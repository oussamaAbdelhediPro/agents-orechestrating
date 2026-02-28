# Task Manager API

A TypeScript/Express REST API for managing tasks.
Source code in `src/`, tests in `tests/`, no database (in-memory Map).

## Project Structure
- `src/models/task.model.ts` — Task type and DTOs
- `src/services/task.service.ts` — Business logic, in-memory store
- `src/routes/tasks.routes.ts` — Express route handlers
- `src/app.ts` — Express app setup
- `tests/tasks.test.ts` — Integration tests

## Code Standards
- TypeScript strict mode — all types must be explicit
- Use `async/await` — no raw callbacks or `.then()` chains
- Named exports only (exception: Express `app`)
- Route handlers are thin — business logic belongs in the service layer
- RESTful status codes: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 404 Not Found

## Validation Rules for Tasks
- `title`: required, string, 1–100 characters
- `description`: optional, string, max 500 characters
- `status`: optional enum — "todo" | "in-progress" | "done"
- `:id` params must be valid UUID v4

## Testing Standards
- Jest + Supertest for integration tests
- Test file pattern: `tests/*.test.ts`
- Every endpoint needs: happy path + 404 + input validation cases
- Test descriptions: imperative mood — "returns 201 when...", "returns 400 when..."

## Build & Test Commands
- `npm run build` — compile TypeScript
- `npm test` — run all tests
- `npm run dev` — start dev server on port 3000
