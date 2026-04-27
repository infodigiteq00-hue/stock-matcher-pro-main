const { AppError } = require("../utils/appError");
const { getStore, saveStore } = require("./inventoryService");
const { getAdminStore, USER_STATUS } = require("./adminService");

const createUserId = () =>
  `USR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizeName = (value) => String(value || "").trim();

const sanitizeUser = (user) => (
{
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  createdAt: user.createdAt,
  lastLogin: user.lastLogin,
  status: user.status === "paused" ? "paused" : "active",
  paymentStatus: user.paymentStatus === "paid" ? "paid" : "unpaid",
});

const signupUser = async ({ fullName, email, password, confirmPassword }) => 
{
  const normalizedFullName = normalizeName(fullName);
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || "");
  const normalizedConfirmPassword = String(confirmPassword || "");

  if (!normalizedFullName || !normalizedEmail || !normalizedPassword || !normalizedConfirmPassword) 
  {
    throw new AppError("Full name, email, password and confirmPassword are required.", 400);
  }

  if (normalizedPassword !== normalizedConfirmPassword) 
  {
    throw new AppError("Password and confirmPassword must match.", 400);
  }

  const adminStore = await getAdminStore();
  const adminEmail = String(adminStore.adminCredentials.email || "").toLowerCase();

  if (normalizedEmail === adminEmail) 
  {
    throw new AppError("This email is reserved for admin login.", 409);
  }

  const store = await getStore();
  const users = Array.isArray(store.users) ? store.users : [];
  const existing = users.find((user) => normalizeEmail(user.email) === normalizedEmail);

  if (existing) 
  {
    throw new AppError("User already exists with this email.", 409);
  }

  const now = new Date().toISOString();
  const user = 
  {
    id: createUserId(),
    fullName: normalizedFullName,
    email: normalizedEmail,
    password: normalizedPassword,
    createdAt: now,
    lastLogin: null,
    status: "active",
    paymentStatus: "unpaid",
  };

  users.push(user);
  store.users = users;
  await saveStore(store);

  return sanitizeUser(user);
};

const loginUser = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || "");
  const adminStore = await getAdminStore();
  const adminEmail = String(adminStore.adminCredentials.email || "").toLowerCase();
  const adminPassword = String(adminStore.adminCredentials.password || "");

  if (!normalizedEmail || !normalizedPassword) {
    throw new AppError("Email and password are required.", 400);
  }

  if (
    normalizedEmail === adminEmail &&
    normalizedPassword === adminPassword
  ) {
    return {
      role: "admin",
      user: {
        id: "ADMIN-001",
        fullName: "Digiteq",
        email: adminStore.adminCredentials.email,
        createdAt: null,
        lastLogin: new Date().toISOString(),
        status: "active"
      },
    };
  }

  const store = await getStore();
  const users = Array.isArray(store.users) ? store.users : [];
  const user = users.find((entry) => normalizeEmail(entry.email) === normalizedEmail);

  if (!user || user.password !== normalizedPassword) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (user.status === USER_STATUS.PAUSED && !adminStore.controls.allowPausedUsersAccess) {
    throw new AppError("Your account is paused. Please contact admin.", 403);
  }

  user.lastLogin = new Date().toISOString();
  store.users = users;
  await saveStore(store);

  return {
    role: "user",
    user: sanitizeUser(user),
  };
};

module.exports = { signupUser, loginUser, };
