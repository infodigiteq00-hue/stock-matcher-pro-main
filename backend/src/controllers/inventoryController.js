const { getInventorySnapshot, replaceInventorySnapshot, getCollectionItems, addCollectionItem, updateCollectionItem, deleteCollectionItem, } = require("../services/inventoryService");

const fetchInventorySnapshot = async (req, res) => 
{
  const snapshot = await getInventorySnapshot(req.inventoryUserId);
  res.json(snapshot);
};

const saveInventorySnapshot = async (req, res) => 
{
  await replaceInventorySnapshot(req.inventoryUserId, req.body);
  res.status(204).send();
};

const fetchCollectionItems = async (req, res) => 
{
  const { collection } = req.params;
  const items = await getCollectionItems(req.inventoryUserId, collection);
  res.json(items);
};

const addCollectionItemHandler = async (req, res) => 
{
  const { collection } = req.params;
  const created = await addCollectionItem(req.inventoryUserId, collection, req.body);
  res.status(201).json(created);
};

const updateCollectionItemHandler = async (req, res) => 
{
  const { collection, id } = req.params;
  const updated = await updateCollectionItem(req.inventoryUserId, collection, id, req.body);
  res.json(updated);
};

const deleteCollectionItemHandler = async (req, res) => 
{
  const { collection, id } = req.params;
  const removed = await deleteCollectionItem(req.inventoryUserId, collection, id);
  res.json(removed);
};

module.exports = { fetchInventorySnapshot, saveInventorySnapshot, fetchCollectionItems, addCollectionItemHandler, updateCollectionItemHandler, deleteCollectionItemHandler, };
