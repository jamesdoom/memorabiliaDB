// memorabilia-api/server/src/index.ts
import * as dotenv from "dotenv";
import { app } from "./app";

dotenv.config();

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
