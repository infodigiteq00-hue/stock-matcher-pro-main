const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const DATA_DIR = process.env.INVENTORY_DATA_DIR || path.join(ROOT_DIR, "data");
const DATA_FILE_PATH = path.join(DATA_DIR, "inventory-data.json");
const ADMIN_DATA_FILE_PATH = path.join(DATA_DIR, "admin-data.json");

const STATUS_MODES = 
{
  ACTIVE: "active",
  PAUSED: "paused",
};

const createEmptyInventorySnapshot = () => (
{
  stock: [],
  leftovers: [],
  boqItems: [],
  matchResults: [],
  customShapes: [],
  stockLedger: {},
}

);

const createDefaultStore = () => (
{
  status: 
  {
    mode: STATUS_MODES.ACTIVE,
    updatedAt: new Date().toISOString(),
  },

  inventory: createEmptyInventorySnapshot(),
  inventoryByUser: {},
  users: [],

});

const createDefaultAdminStore = () => (
{
  adminCredentials: 
  {
    email: "digiteq00@gmail.com",
    password: "147852",
  },
  controls: 
  {
    allowPausedUsersAccess: false,
    userStatusOptions: ["active", "paused"],
    paymentStatusOptions: ["paid", "unpaid"],
  },
});

module.exports = { DATA_DIR, DATA_FILE_PATH, ADMIN_DATA_FILE_PATH, STATUS_MODES, createDefaultStore, createDefaultAdminStore, createEmptyInventorySnapshot,};
