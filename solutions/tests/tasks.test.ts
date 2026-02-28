import request from "supertest";
import { app } from "../src/app";

// Helper to create a task and return its ID
async function createTask(title = "Test Task", status = "todo") {
  const res = await request(app).post("/tasks").send({ title, status });
  return res.body as { id: string };
}

// ──────────────────────────────────────────────
// GET /tasks
// ──────────────────────────────────────────────
describe("GET /tasks", () => {
  it("returns 200 and an array", async () => {
    const res = await request(app).get("/tasks");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ──────────────────────────────────────────────
// GET /tasks/:id
// ──────────────────────────────────────────────
describe("GET /tasks/:id", () => {
  it("returns 200 and the task when it exists", async () => {
    const { id } = await createTask("Get by ID task");
    const res = await request(app).get(`/tasks/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
    expect(res.body.title).toBe("Get by ID task");
  });

  it("returns 404 when the task does not exist", async () => {
    const res = await request(app).get("/tasks/00000000-0000-4000-8000-000000000000");
    expect(res.status).toBe(404);
  });

  it("returns 400 when the id is not a valid UUID", async () => {
    const res = await request(app).get("/tasks/not-a-uuid");
    expect(res.status).toBe(400);
  });
});

// ──────────────────────────────────────────────
// POST /tasks
// ──────────────────────────────────────────────
describe("POST /tasks", () => {
  it("returns 201 and creates a task with defaults when only title is provided", async () => {
    const res = await request(app).post("/tasks").send({ title: "New task" });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe("New task");
    expect(res.body.status).toBe("todo");
    expect(res.body.createdAt).toBeDefined();
    expect(res.body.updatedAt).toBeDefined();
  });

  it("returns 201 and creates a task with all fields provided", async () => {
    const res = await request(app).post("/tasks").send({
      title: "Full task",
      description: "A description",
      status: "in-progress",
    });
    expect(res.status).toBe(201);
    expect(res.body.description).toBe("A description");
    expect(res.body.status).toBe("in-progress");
  });

  it("returns 400 when title is missing", async () => {
    const res = await request(app).post("/tasks").send({ status: "todo" });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "title" }),
    ]));
  });

  it("returns 400 when title is an empty string", async () => {
    const res = await request(app).post("/tasks").send({ title: "" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when title exceeds 100 characters", async () => {
    const res = await request(app).post("/tasks").send({ title: "a".repeat(101) });
    expect(res.status).toBe(400);
  });

  it("returns 400 when status is an invalid value", async () => {
    const res = await request(app).post("/tasks").send({ title: "Task", status: "invalid" });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "status" }),
    ]));
  });
});

// ──────────────────────────────────────────────
// PATCH /tasks/:id
// ──────────────────────────────────────────────
describe("PATCH /tasks/:id", () => {
  it("returns 200 and updates the status when only status is provided", async () => {
    const { id } = await createTask("Patch status");
    const res = await request(app).patch(`/tasks/${id}`).send({ status: "done" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("done");
    expect(res.body.title).toBe("Patch status");
  });

  it("returns 200 and updates the title when only title is provided", async () => {
    const { id } = await createTask("Old title");
    const res = await request(app).patch(`/tasks/${id}`).send({ title: "New title" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("New title");
  });

  it("returns 200 and updates updatedAt on successful patch", async () => {
    const { id } = await createTask("Timestamp test");
    const before = await request(app).get(`/tasks/${id}`);
    await new Promise((r) => setTimeout(r, 10)); // ensure timestamp differs
    const res = await request(app).patch(`/tasks/${id}`).send({ status: "done" });
    expect(res.status).toBe(200);
    expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThan(
      new Date(before.body.updatedAt).getTime()
    );
  });

  it("returns 200 and does not mutate createdAt", async () => {
    const { id } = await createTask("CreatedAt immutable");
    const before = await request(app).get(`/tasks/${id}`);
    const res = await request(app).patch(`/tasks/${id}`).send({ status: "done" });
    expect(res.body.createdAt).toBe(before.body.createdAt);
  });

  it("returns 404 when the task does not exist", async () => {
    const res = await request(app)
      .patch("/tasks/00000000-0000-4000-8000-000000000000")
      .send({ status: "done" });
    expect(res.status).toBe(404);
  });

  it("returns 400 when the id is not a valid UUID", async () => {
    const res = await request(app).patch("/tasks/not-a-uuid").send({ status: "done" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when title is an empty string", async () => {
    const { id } = await createTask("Title empty test");
    const res = await request(app).patch(`/tasks/${id}`).send({ title: "" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when title exceeds 100 characters", async () => {
    const { id } = await createTask("Title too long");
    const res = await request(app).patch(`/tasks/${id}`).send({ title: "a".repeat(101) });
    expect(res.status).toBe(400);
  });

  it("returns 400 when status is an invalid value", async () => {
    const { id } = await createTask("Bad status test");
    const res = await request(app).patch(`/tasks/${id}`).send({ status: "invalid" });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "status" }),
    ]));
  });
});

// ──────────────────────────────────────────────
// DELETE /tasks/:id
// ──────────────────────────────────────────────
describe("DELETE /tasks/:id", () => {
  it("returns 204 on successful delete", async () => {
    const { id } = await createTask("Delete me");
    const res = await request(app).delete(`/tasks/${id}`);
    expect(res.status).toBe(204);
  });

  it("returns 404 for non-existent task", async () => {
    const res = await request(app).delete("/tasks/00000000-0000-4000-8000-000000000000");
    expect(res.status).toBe(404);
  });

  it("returns 400 when the id is not a valid UUID", async () => {
    const res = await request(app).delete("/tasks/not-a-uuid");
    expect(res.status).toBe(400);
  });
});
