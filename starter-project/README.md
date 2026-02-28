# Task Manager API — Workshop Starter Project

A simple REST API for managing tasks. Built with **Express** and **TypeScript**.

## Getting Started

```bash
npm install
npm run dev
```

The server starts on **http://localhost:3000**.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/tasks` | List all tasks |
| `GET` | `/tasks/:id` | Get a task by ID |
| `POST` | `/tasks` | Create a new task |
| `DELETE` | `/tasks/:id` | Delete a task |

> **Note:** A `PATCH /tasks/:id` endpoint for updating tasks is missing. This is what you'll build during the workshop!

## Data Model

```typescript
interface Task {
  id: string;           // UUID, auto-generated
  title: string;        // Required, 1–100 chars
  description?: string; // Optional, max 500 chars
  status: "todo" | "in-progress" | "done";
  createdAt: string;    // ISO 8601 date string
  updatedAt: string;    // ISO 8601 date string
}
```

## Run Tests

```bash
npm test
```

## Known Gaps (intentional — for the workshop)

- No `PATCH /tasks/:id` endpoint
- No input validation on `POST /tasks`
- No error handling for invalid UUIDs
- Test coverage is minimal
