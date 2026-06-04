import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "node:path";

import { getUploadsDirectory } from "./middleware/upload.middleware.js";
import { apiHitLogger } from "./middleware/api-hit-logger.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { notFoundHandler } from "./middleware/not-found.middleware.js";
import routes from "./routes/index.js";

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(cors());
app.use(express.json());
app.use(apiHitLogger);
app.use("/uploads", express.static(path.join(getUploadsDirectory())));

app.use("/", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
