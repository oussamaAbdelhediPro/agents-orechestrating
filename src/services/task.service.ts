import { v4 as uuidv4 } from "uuid";
import { Task, CreateTaskDto } from "../models/task.model";

// In-memory store — no database needed for the workshop
const tasks: Map<string, Task> = new Map();

// Seed some initial data
const seedData: Omit<Task, "id" | "createdAt" | "updatedAt">[] = [
  { title: "Design API schema", description: "Draft the OpenAPI specification", status: "done" },
  { title: "Implement GET endpoints", description: "List and get-by-id endpoints", status: "done" },
  { title: "Implement POST endpoint", description: "Create new tasks", status: "in-progress" },
  { title: "Add input validation", description: "Validate all request bodies", status: "todo" },
  { title: "Write unit tests", description: "Cover all service methods", status: "todo" },
];

seedData.forEach((data) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  tasks.set(id, { ...data, id, createdAt: now, updatedAt: now });
});

export class TaskService {
  findAll(): Task[] {
    return Array.from(tasks.values());
  }

  findById(id: string): Task | undefined {
    return tasks.get(id);
  }

  // BUG: No validation — accepts any input including empty title
  create(dto: CreateTaskDto): Task {
    const id = uuidv4();
    const now = new Date().toISOString();
    const task: Task = {
      id,
      title: dto.title,
      description: dto.description,
      status: dto.status ?? "todo",
      createdAt: now,
      updatedAt: now,
    };
    tasks.set(id, task);
    return task;
  }

  delete(id: string): boolean {
    return tasks.delete(id);
  }

  // TODO: implement update(id, dto) for PATCH support
}
