import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import { apiErrorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";

dotenv.config();

const app = express();

// { origin: process.env.CORS_ORIGIN ?? "*" }
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", environment: process.env.NODE_ENV ?? "development" });
});

app.use("/api", routes);
app.use(notFoundHandler);
app.use(apiErrorHandler);

export default app;