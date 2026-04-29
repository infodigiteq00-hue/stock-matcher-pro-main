const { DATA_FILE_PATH, STATUS_MODES, createDefaultStore, createEmptyInventorySnapshot, } = require("../config/constants");
const { AppError } = require("../utils/appError");
const { readJsonFile, writeJsonFile } = require("../utils/fileStore");

const ID_BASED_COLLECTIONS = new Set(["stock", "leftovers"]);
const INDEX_BASED_COLLECTIONS = new Set(["boqItems", "matchResults", "customShapes"]);
const ALLOWED_COLLECTIONS = new Set([...ID_BASED_COLLECTIONS,...INDEX_BASED_COLLECTIONS,]);

const normalizeSnapshot = (input) => ({
  stock: Array.isArray(input?.stock) ? input.stock : [],
  leftovers: Array.isArray(input?.leftovers) ? input.leftovers : [],
  boqItems: Array.isArray(input?.boqItems) ? input.boqItems : [],
  matchResults: Array.isArray(input?.matchResults) ? input.matchResults : [],
  customShapes: Array.isArray(input?.customShapes) ? input.customShapes : [],
  stockLedger:
    typeof input?.stockLedger === "object" && input?.stockLedger !== null
      ? input.stockLedger
      : {},
});

const normalizeUsers = (input) => 
{
  if (!Array.isArray(input)) 
  {
    return [];
  }

  return input.filter((user) => typeof user === "object" && user !== null);
};

const normalizeInventoryByUser = (input) => {
  if (!input || typeof input !== "object") {
    return {};
  }

  return Object.entries(input).reduce((accumulator, [userId, snapshot]) => {
    if (typeof userId === "string" && userId.trim()) {
      accumulator[userId] = normalizeSnapshot(snapshot);
    }
    return accumulator;
  }, {});
};

const hasSnapshotData = (snapshot) =>
  Array.isArray(snapshot?.stock) && snapshot.stock.length > 0 ||
  Array.isArray(snapshot?.leftovers) && snapshot.leftovers.length > 0 ||
  Array.isArray(snapshot?.boqItems) && snapshot.boqItems.length > 0 ||
  Array.isArray(snapshot?.matchResults) && snapshot.matchResults.length > 0 ||
  Array.isArray(snapshot?.customShapes) && snapshot.customShapes.length > 0 ||
  typeof snapshot?.stockLedger === "object" && snapshot.stockLedger !== null && Object.keys(snapshot.stockLedger).length > 0;

const normalizeStore = (input) => 
{
  const defaultStore = createDefaultStore();

  if (input && input.inventory) 
  {
    return {
      status: 
      {
        mode:
          input.status?.mode === STATUS_MODES.PAUSED
            ? STATUS_MODES.PAUSED
            : STATUS_MODES.ACTIVE,
        updatedAt:
          typeof input.status?.updatedAt === "string"
            ? input.status.updatedAt
            : defaultStore.status.updatedAt,
      },
      inventory: normalizeSnapshot(input.inventory),
      inventoryByUser: normalizeInventoryByUser(input.inventoryByUser),
      users: normalizeUsers(input.users),
    };
  }

  // Backward compatibility with old shape where snapshot was root object.
  return {
    status: defaultStore.status,
    inventory: normalizeSnapshot(input || createEmptyInventorySnapshot()),
    inventoryByUser: normalizeInventoryByUser(input?.inventoryByUser),
    users: normalizeUsers(input?.users),
  };
};

const getStore = async () => 
{
  const raw = await readJsonFile(DATA_FILE_PATH, createDefaultStore);
  const normalized = normalizeStore(raw);
  return normalized;
};

const saveStore = async (store) => 
{
  const normalized = normalizeStore(store);
  await writeJsonFile(DATA_FILE_PATH, normalized);
  return normalized;
};

const ensureUserInventorySnapshot = (store, userId) => {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) {
    throw new AppError("User id is required for inventory operations.", 400);
  }

  if (!store.inventoryByUser || typeof store.inventoryByUser !== "object") {
    store.inventoryByUser = {};
  }

  if (!store.inventoryByUser[normalizedUserId]) {
    const userList = Array.isArray(store.users) ? store.users : [];
    const firstCreatedUserId = typeof userList[0]?.id === "string" ? userList[0].id : "";
    const shouldMigrateLegacyData =
      Object.keys(store.inventoryByUser).length === 0 &&
      firstCreatedUserId === normalizedUserId &&
      hasSnapshotData(store.inventory);

    // Migrate old shared inventory only once to the oldest user account.
    store.inventoryByUser[normalizedUserId] = shouldMigrateLegacyData
      ? normalizeSnapshot(store.inventory)
      : createEmptyInventorySnapshot();
    return { snapshot: store.inventoryByUser[normalizedUserId], changed: true };
  }

  return { snapshot: store.inventoryByUser[normalizedUserId], changed: false };
};

const getInventorySnapshot = async (userId) => 
{
  const store = await getStore();
  const { snapshot, changed } = ensureUserInventorySnapshot(store, userId);
  if (changed) {
    await saveStore(store);
  }
  return snapshot;
};

const replaceInventorySnapshot = async (userId, snapshot) => 
{
  const store = await getStore();
  const normalizedUserId = String(userId || "").trim();
  ensureUserInventorySnapshot(store, normalizedUserId);
  store.inventoryByUser[normalizedUserId] = normalizeSnapshot(snapshot);
  await saveStore(store);
};

const validateCollection = (collection) => 
{
  if (!ALLOWED_COLLECTIONS.has(collection)) 
  {
    throw new AppError(`Unsupported collection: ${collection}`, 400);
  }
};

const getCollectionItems = async (userId, collection) => 
{
  validateCollection(collection);
  const snapshot = await getInventorySnapshot(userId);
  return snapshot[collection];
};

const addCollectionItem = async (userId, collection, payload) => 
{
  validateCollection(collection);
  const store = await getStore();
  const { snapshot } = ensureUserInventorySnapshot(store, userId);
  const current = snapshot[collection];

  if (!Array.isArray(current)) 
  {
    throw new AppError(`Collection ${collection} is not list-based.`, 400);
  }

  if (ID_BASED_COLLECTIONS.has(collection)) 
  {
    if (!payload || typeof payload !== "object") 
    {
      throw new AppError("Payload must be an object.", 400);
    }

    if (typeof payload.id !== "string" || !payload.id.trim()) 
    {
      throw new AppError("Payload must include a valid id.", 400);
    }

    const existing = current.some((item) => item.id === payload.id);
    if (existing) 
    {
      throw new AppError(`Item with id ${payload.id} already exists.`, 409);
    }
  }

  current.push(payload);
  await saveStore(store);
  return payload;
};

const updateCollectionItem = async (userId, collection, id, updates) => 
{
  validateCollection(collection);
  const store = await getStore();
  const { snapshot } = ensureUserInventorySnapshot(store, userId);
  const current = snapshot[collection];

  if (!Array.isArray(current)) 
  {
    throw new AppError(`Collection ${collection} is not list-based.`, 400);
  }

  if (ID_BASED_COLLECTIONS.has(collection)) 
  {
    const index = current.findIndex((item) => item.id === id);
    if (index === -1) 
    {
      throw new AppError(`Item with id ${id} not found.`, 404);
    }

    current[index] = { ...current[index], ...updates, id: current[index].id };
    await saveStore(store);
    return current[index];
  }

  const numericIndex = Number(id);
  if (!Number.isInteger(numericIndex) || numericIndex < 0 || numericIndex >= current.length) 
  {
    throw new AppError(`Item index ${id} not found.`, 404);
  }

  const currentValue = current[numericIndex];
  current[numericIndex] = currentValue && typeof currentValue === "object" && updates && typeof updates === "object" ? { ...currentValue, ...updates } : updates;

  await saveStore(store);
  return current[numericIndex];
};

const deleteCollectionItem = async (userId, collection, id) => 
{
  validateCollection(collection);
  const store = await getStore();
  const { snapshot } = ensureUserInventorySnapshot(store, userId);
  const current = snapshot[collection];

  if (!Array.isArray(current)) 
  {
    throw new AppError(`Collection ${collection} is not list-based.`, 400);
  }

  if (ID_BASED_COLLECTIONS.has(collection))
  {
    const index = current.findIndex((item) => item.id === id);
    if (index === -1) 
    {
      throw new AppError(`Item with id ${id} not found.`, 404);
    }
    const [removed] = current.splice(index, 1);
    await saveStore(store);
    return removed;
  }

  const numericIndex = Number(id);
  if (!Number.isInteger(numericIndex) || numericIndex < 0 || numericIndex >= current.length) 
  {
    throw new AppError(`Item index ${id} not found.`, 404);
  }

  const [removed] = current.splice(numericIndex, 1);
  await saveStore(store);
  return removed;
};

const getStatus = async () => 
{
  const store = await getStore();
  return store.status;
};

const setStatusMode = async (mode) => 
{
  if (mode !== STATUS_MODES.ACTIVE && mode !== STATUS_MODES.PAUSED) 
  {
    throw new AppError('Status mode must be "active" or "paused".', 400);
  }

  const store = await getStore();
  store.status = 
  {
    mode,
    updatedAt: new Date().toISOString(),
  };

  await saveStore(store);
  return store.status;
};

module.exports = { getStore, saveStore, getInventorySnapshot, replaceInventorySnapshot, getCollectionItems, addCollectionItem, updateCollectionItem, deleteCollectionItem, getStatus, setStatusMode, };
