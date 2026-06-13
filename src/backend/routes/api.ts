import { Router } from "express";
import { query } from "../lib/db";

export const apiRouter = Router();

apiRouter.get("/db-test", async (req, res) => {
  try {
    const result = await query("SELECT * FROM users ORDER BY id ASC");
    res.json({
      success: true,
      message: "Connected to PostgreSQL via Express!",
      users: result.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to connect to the database.",
      error: error.message || String(error),
    });
  }
});

apiRouter.get("/hello", (req, res) => {
  res.json({ message: "Hello from Express!", method: "GET" });
});

apiRouter.put("/hello", (req, res) => {
  res.json({ message: "Hello from Express!", method: "PUT" });
});

apiRouter.get("/hello/:name", (req, res) => {
  const name = req.params.name;
  res.json({ message: `Hello, ${name}!` });
});
