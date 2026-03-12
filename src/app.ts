import express from "express";
import { taskRouter } from "./routes/tasks.routes";

const app = express();

app.use(express.json());

// Routes
app.use("/tasks", taskRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export { app };
