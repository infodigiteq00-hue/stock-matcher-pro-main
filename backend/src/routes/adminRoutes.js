const express = require("express");
const { fetchUsersAdminView, updateUserStatus, updateUserPaymentStatus, } = require("../controllers/adminController");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.get("/users", asyncHandler(fetchUsersAdminView));
router.patch("/users/:id/status", asyncHandler(updateUserStatus));
router.patch("/users/:id/payment-status", asyncHandler(updateUserPaymentStatus));

module.exports = router;
