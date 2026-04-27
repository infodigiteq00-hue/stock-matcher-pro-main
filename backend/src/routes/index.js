const express = require("express");
const inventoryRoutes = require("./inventoryRoutes");
const statusRoutes = require("./statusRoutes");
const authRoutes = require("./authRoutes");
const adminRoutes = require("./adminRoutes");

const router = express.Router();

router.get("/health", (_req, res) => 
{
  res.json({ ok: true });
});

router.use("/inventory", inventoryRoutes);
router.use("/status", statusRoutes);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
