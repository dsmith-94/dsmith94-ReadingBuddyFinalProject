import path from "node:path";
import { existsSync } from "node:fs";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const staticDir = process.env["STATIC_DIR"];
if (staticDir) {
  const resolved = path.resolve(staticDir);
  if (existsSync(resolved)) {
    logger.info({ staticDir: resolved }, "Serving static frontend");
    app.use(express.static(resolved));
    app.use((req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") return next();
      if (req.path.startsWith("/api/")) return next();
      const indexFile = path.join(resolved, "index.html");
      if (existsSync(indexFile)) {
        res.sendFile(indexFile);
        return;
      }
      next();
    });
  } else {
    logger.warn({ staticDir: resolved }, "STATIC_DIR set but folder not found");
  }
}

export default app;
