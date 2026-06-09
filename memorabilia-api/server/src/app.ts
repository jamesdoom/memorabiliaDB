import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import cardsRouter from "./routes/cards";
import uploadRouter from "./routes/upload";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

export const app = express();

const allowedOrigins = (
  process.env.CLIENT_ORIGIN ?? "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
  }),
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "memorabilia-api",
  });
});

app.use("/cards", cardsRouter);
app.use("/upload", uploadRouter);

app.use(errorHandler);
