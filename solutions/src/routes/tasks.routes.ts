import { Router, Request, Response } from "express";
import { TaskService } from "../services/task.service";
import { validateCreateTask, validateUpdateTask, isValidUuid } from "../utils/validation";

const router = Router();
const taskService = new TaskService();

// GET /tasks — list all tasks
router.get("/", (_req: Request, res: Response): void => {
  const tasks = taskService.findAll();
  res.json(tasks);
});

// GET /tasks/:id — get task by id
router.get("/:id", (req: Request, res: Response): void => {
  if (!isValidUuid(req.params.id)) {
    res.status(400).json({ error: "Invalid task ID format" });
    return;
  }
  const task = taskService.findById(req.params.id);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(task);
});

// POST /tasks — create a task
router.post("/", (req: Request, res: Response): void => {
  const { errors, dto } = validateCreateTask(req.body);
  if (errors.length > 0) {
    res.status(400).json({ errors });
    return;
  }
  const task = taskService.create(dto!);
  res.status(201).json(task);
});

// PATCH /tasks/:id — partially update a task
router.patch("/:id", (req: Request, res: Response): void => {
  if (!isValidUuid(req.params.id)) {
    res.status(400).json({ error: "Invalid task ID format" });
    return;
  }
  const { errors, dto } = validateUpdateTask(req.body);
  if (errors.length > 0) {
    res.status(400).json({ errors });
    return;
  }
  const task = taskService.update(req.params.id, dto!);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(task);
});

// DELETE /tasks/:id — delete a task
router.delete("/:id", (req: Request, res: Response): void => {
  if (!isValidUuid(req.params.id)) {
    res.status(400).json({ error: "Invalid task ID format" });
    return;
  }
  const deleted = taskService.delete(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.status(204).send();
});

export { router as taskRouter };
