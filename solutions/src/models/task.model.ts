export type TaskStatus = "todo" | "in-progress" | "done";

export const VALID_STATUSES: readonly TaskStatus[] = ["todo", "in-progress", "done"];

export interface Task {
  readonly id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  readonly createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

export interface ValidationError {
  field: string;
  message: string;
}
