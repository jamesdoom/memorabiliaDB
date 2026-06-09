// memorabilia-api/server/src/index.ts
import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import cardsRouter from "./routes/cards";
import uploadRouter from "./routes/upload";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = 5000;

// CORS FIRST
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

// Body parser
app.use(express.json());

// Routes
app.use("/cards", cardsRouter);
app.use("/upload", uploadRouter);

// Global error handler (LAST)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
