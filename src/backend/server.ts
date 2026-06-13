import express from "express";
import cors from "cors";
import { apiRouter } from "./routes/api";

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api", apiRouter);

// Start the Express server
app.listen(PORT, () => {
  console.log(`🚀 Express API Server running at http://localhost:${PORT}`);
});
