const express = require("express");
const { fetchStatus, updateStatus } = require("../controllers/statusController");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", asyncHandler(fetchStatus));
router.patch("/", asyncHandler(updateStatus));

module.exports = router;
