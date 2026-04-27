const { getStatus, setStatusMode } = require("../services/inventoryService");

const fetchStatus = async (_req, res) => 
{
  const status = await getStatus();
  res.json(status);
};

const updateStatus = async (req, res) => 
{
  const { mode } = req.body || {};
  const status = await setStatusMode(mode);
  res.json(status);
};

module.exports = { fetchStatus, updateStatus, };
