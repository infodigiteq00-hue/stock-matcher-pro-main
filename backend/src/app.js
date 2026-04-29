const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const apiRoutes = require("./routes");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");

const app = express();

const LOCALHOST_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const PRESET_ALLOWED_ORIGINS = new Set([
  "https://stock-matcher-pro-main.onrender.com",
]);

const getAllowedOrigins = () => {
  const rawOrigins = process.env.CORS_ORIGINS || "";
  const envOrigins = rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set([...PRESET_ALLOWED_ORIGINS, ...envOrigins]);
};

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();
  const isAllowedOrigin =
    !origin ||
    LOCALHOST_ORIGIN_PATTERN.test(origin) ||
    allowedOrigins.has(origin) ||
    origin.endsWith(".vercel.app");

  if (isAllowedOrigin && origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-user-role,x-user-id");

  if (req.method === "OPTIONS") {
    res.status(isAllowedOrigin ? 204 : 403).end();
    return;
  }

  if (!isAllowedOrigin) {
    res.status(403).json({ message: "CORS blocked for this origin." });
    return;
  }

  next();
});

app.use(express.json({ limit: "20mb" }));
app.use("/api", apiRoutes);

const rendererDistPath = process.env.ELECTRON_RENDERER_DIST;
if (rendererDistPath && fs.existsSync(rendererDistPath)) {
  app.use(express.static(rendererDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }

    res.sendFile(path.join(rendererDistPath, "index.html"));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
