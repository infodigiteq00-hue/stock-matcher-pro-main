const { AppError } = require("../utils/appError");

const resolveInventoryUserContext = (req, _res, next) => {
  const userRole = String(req.headers["x-user-role"] || "").trim().toLowerCase();
  const userId = String(req.headers["x-user-id"] || "").trim();

  if (userRole !== "user") {
    next(new AppError("Only user accounts can access inventory.", 403));
    return;
  }

  if (!userId) {
    next(new AppError("Missing user id for inventory access.", 401));
    return;
  }

  req.inventoryUserId = userId;
  next();
};

module.exports = { resolveInventoryUserContext };
