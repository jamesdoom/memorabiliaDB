import express from "express";
import cors from "cors";
import cardsRouter from "./routes/cards";
import uploadRouter from "./routes/upload";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

app.use("/cards", cardsRouter);
app.use("/upload", uploadRouter);

app.use(errorHandler);
