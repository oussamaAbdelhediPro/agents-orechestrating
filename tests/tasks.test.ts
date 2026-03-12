import request from "supertest";
import { app } from "../src/app";

describe("GET /tasks", () => {
  it("returns 200 and an array", async () => {
    const res = await request(app).get("/tasks");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("POST /tasks", () => {
  it("creates a task and returns 201", async () => {
    const res = await request(app)
      .post("/tasks")
      .send({ title: "New task" });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe("New task");
    expect(res.body.status).toBe("todo");
  });

  // TODO: test that missing title returns 400
  // TODO: test that title > 100 chars returns 400
});

describe("DELETE /tasks/:id", () => {
  it("returns 404 for non-existent task", async () => {
    const res = await request(app).delete("/tasks/nonexistent");
    expect(res.status).toBe(404);
  });
});

// TODO: tests for GET /tasks/:id
// TODO: tests for PATCH /tasks/:id (not yet implemented)
