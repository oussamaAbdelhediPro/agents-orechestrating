import { ValidationError, CreateTaskDto, UpdateTaskDto, TaskStatus, VALID_STATUSES } from "../models/task.model";

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_V4_REGEX.test(value);
}

export function isValidStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && (VALID_STATUSES as readonly string[]).includes(value);
}

export function validateCreateTask(body: unknown): { errors: ValidationError[]; dto: CreateTaskDto | null } {
  const errors: ValidationError[] = [];

  if (typeof body !== "object" || body === null) {
    return { errors: [{ field: "body", message: "Request body must be a JSON object" }], dto: null };
  }

  const raw = body as Record<string, unknown>;

  // title: required, string, 1–100 chars
  if (raw.title === undefined || raw.title === null) {
    errors.push({ field: "title", message: "title is required" });
  } else if (typeof raw.title !== "string") {
    errors.push({ field: "title", message: "title must be a string" });
  } else if (raw.title.trim().length === 0) {
    errors.push({ field: "title", message: "title must not be empty" });
  } else if (raw.title.length > 100) {
    errors.push({ field: "title", message: "title must be 100 characters or fewer" });
  }

  // description: optional, string, max 500 chars
  if (raw.description !== undefined && raw.description !== null) {
    if (typeof raw.description !== "string") {
      errors.push({ field: "description", message: "description must be a string" });
    } else if (raw.description.length > 500) {
      errors.push({ field: "description", message: "description must be 500 characters or fewer" });
    }
  }

  // status: optional, must be valid enum value
  if (raw.status !== undefined && raw.status !== null) {
    if (!isValidStatus(raw.status)) {
      errors.push({ field: "status", message: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    }
  }

  if (errors.length > 0) {
    return { errors, dto: null };
  }

  return {
    errors: [],
    dto: {
      title: (raw.title as string).trim(),
      description: raw.description as string | undefined,
      status: raw.status as TaskStatus | undefined,
    },
  };
}

export function validateUpdateTask(body: unknown): { errors: ValidationError[]; dto: UpdateTaskDto | null } {
  const errors: ValidationError[] = [];

  if (typeof body !== "object" || body === null) {
    return { errors: [{ field: "body", message: "Request body must be a JSON object" }], dto: null };
  }

  const raw = body as Record<string, unknown>;

  // title: optional but if present, must be valid
  if (raw.title !== undefined && raw.title !== null) {
    if (typeof raw.title !== "string") {
      errors.push({ field: "title", message: "title must be a string" });
    } else if (raw.title.trim().length === 0) {
      errors.push({ field: "title", message: "title must not be empty" });
    } else if (raw.title.length > 100) {
      errors.push({ field: "title", message: "title must be 100 characters or fewer" });
    }
  }

  // description: optional, string, max 500 chars
  if (raw.description !== undefined && raw.description !== null) {
    if (typeof raw.description !== "string") {
      errors.push({ field: "description", message: "description must be a string" });
    } else if (raw.description.length > 500) {
      errors.push({ field: "description", message: "description must be 500 characters or fewer" });
    }
  }

  // status: optional, must be valid enum value
  if (raw.status !== undefined && raw.status !== null) {
    if (!isValidStatus(raw.status)) {
      errors.push({ field: "status", message: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    }
  }

  if (errors.length > 0) {
    return { errors, dto: null };
  }

  const dto: UpdateTaskDto = {};
  if (raw.title !== undefined) dto.title = (raw.title as string).trim();
  if (raw.description !== undefined) dto.description = raw.description as string | undefined;
  if (raw.status !== undefined) dto.status = raw.status as TaskStatus;

  return { errors: [], dto };
}
