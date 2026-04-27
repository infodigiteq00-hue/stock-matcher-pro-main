const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const apiRoutes = require("./routes");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");

const app = express();

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
