import { Router, Request, Response } from "express";
import { TaskService } from "../services/task.service";
import { CreateTaskDto } from "../models/task.model";

const router = Router();
const taskService = new TaskService();

// GET /tasks — list all tasks
router.get("/", (_req: Request, res: Response) => {
  const tasks = taskService.findAll();
  res.json(tasks);
});

// GET /tasks/:id — get task by id
router.get("/:id", (req: Request, res: Response) => {
  // BUG: No UUID format validation — any string accepted
  const task = taskService.findById(req.params.id);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(task);
});

// POST /tasks — create a task
router.post("/", (req: Request, res: Response) => {
  // BUG: No input validation — missing title is not checked
  const dto: CreateTaskDto = req.body;
  const task = taskService.create(dto);
  res.status(201).json(task);
});

// DELETE /tasks/:id — delete a task
router.delete("/:id", (req: Request, res: Response) => {
  const deleted = taskService.delete(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.status(204).send();
});

// TODO: PATCH /tasks/:id — update a task (not implemented)

export { router as taskRouter };
