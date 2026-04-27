const { ADMIN_DATA_FILE_PATH, createDefaultAdminStore } = require("../config/constants");
const { AppError } = require("../utils/appError");
const { readJsonFile, writeJsonFile } = require("../utils/fileStore");
const { getStore, saveStore } = require("./inventoryService");

const USER_STATUS = 
{
  ACTIVE: "active",
  PAUSED: "paused",
};

const PAYMENT_STATUS = 
{
  PAID: "paid",
  UNPAID: "unpaid",
};

const sanitizeUser = (user) => (
{
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  createdAt: user.createdAt,
  lastLogin: user.lastLogin,
  status: user.status,
  paymentStatus: user.paymentStatus,
}
);

const normalizeAdminStore = (input) => 
{
  const defaults = createDefaultAdminStore();
  return {
    adminCredentials: 
    {
      email:
        typeof input?.adminCredentials?.email === "string"
          ? input.adminCredentials.email
          : defaults.adminCredentials.email,
      password:
        typeof input?.adminCredentials?.password === "string"
          ? input.adminCredentials.password
          : defaults.adminCredentials.password,
    },
    controls: 
    {
      allowPausedUsersAccess:
        typeof input?.controls?.allowPausedUsersAccess === "boolean"
          ? input.controls.allowPausedUsersAccess
          : defaults.controls.allowPausedUsersAccess,
      userStatusOptions: defaults.controls.userStatusOptions,
      paymentStatusOptions: defaults.controls.paymentStatusOptions,
    },
  };
};

const getAdminStore = async () => 
{
  const raw = await readJsonFile(ADMIN_DATA_FILE_PATH, createDefaultAdminStore);
  return normalizeAdminStore(raw);
};

const saveAdminStore = async (adminStore) => 
{
  const normalized = normalizeAdminStore(adminStore);
  await writeJsonFile(ADMIN_DATA_FILE_PATH, normalized);
  return normalized;
};

const listUsersForAdmin = async () => 
{
  const store = await getStore();
  const users = Array.isArray(store.users) ? store.users : [];
  const adminStore = await getAdminStore();

  const normalizedUsers = users.map((user) => (
  {
    ...user,
    status: user.status === USER_STATUS.PAUSED ? USER_STATUS.PAUSED : USER_STATUS.ACTIVE,
    paymentStatus: user.paymentStatus === PAYMENT_STATUS.PAID ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.UNPAID,
  }));

  const summary = normalizedUsers.reduce(
    (acc, user) => 
    {
      acc.totalUsers += 1;
      if (user.status === USER_STATUS.ACTIVE) 
      {
        acc.activeUsers += 1;
      }
      if (user.status === USER_STATUS.PAUSED) 
      {
        acc.pausedUsers += 1;
      }
      if (user.paymentStatus === PAYMENT_STATUS.PAID) 
      {
        acc.paidUsers += 1;
      }
      return acc;
    },
    {
      totalUsers: 0,
      activeUsers: 0,
      pausedUsers: 0,
      paidUsers: 0,
    },
  );

  return {
    summary,
    users: normalizedUsers.map(sanitizeUser),
    controls: adminStore.controls,
  };
};

const getUserIndex = (users, userId) => users.findIndex((user) => user.id === userId);

const updateUserStatusByAdmin = async (userId, status) => 
{
  if (status !== USER_STATUS.ACTIVE && status !== USER_STATUS.PAUSED) 
  {
    throw new AppError('Status must be "active" or "paused".', 400);
  }

  const store = await getStore();
  const users = Array.isArray(store.users) ? store.users : [];
  const index = getUserIndex(users, userId);

  if (index === -1) 
  {
    throw new AppError(`User with id ${userId} not found.`, 404);
  }

  users[index] = 
  {
    ...users[index],
    status,
  };

  store.users = users;
  await saveStore(store);

  return sanitizeUser(users[index]);
};

const updateUserPaymentStatusByAdmin = async (userId, paymentStatus) => 
{
  if (paymentStatus !== PAYMENT_STATUS.PAID && paymentStatus !== PAYMENT_STATUS.UNPAID) 
  {
    throw new AppError('Payment status must be "paid" or "unpaid".', 400);
  }

  const store = await getStore();
  const users = Array.isArray(store.users) ? store.users : [];
  const index = getUserIndex(users, userId);

  if (index === -1) 
  {
    throw new AppError(`User with id ${userId} not found.`, 404);
  }

  users[index] = 
  {
    ...users[index],
    paymentStatus,
  };

  store.users = users;
  await saveStore(store);

  return sanitizeUser(users[index]);
};

module.exports = { USER_STATUS, PAYMENT_STATUS, getAdminStore, saveAdminStore, listUsersForAdmin, updateUserStatusByAdmin, updateUserPaymentStatusByAdmin, };
