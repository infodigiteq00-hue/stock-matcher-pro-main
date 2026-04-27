const express = require("express");
const { fetchInventorySnapshot, saveInventorySnapshot, fetchCollectionItems, addCollectionItemHandler, updateCollectionItemHandler, deleteCollectionItemHandler, } = require("../controllers/inventoryController");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", asyncHandler(fetchInventorySnapshot));
router.post("/", asyncHandler(saveInventorySnapshot));

router.get("/:collection", asyncHandler(fetchCollectionItems));
router.post("/:collection", asyncHandler(addCollectionItemHandler));
router.put("/:collection/:id", asyncHandler(updateCollectionItemHandler));
router.delete("/:collection/:id", asyncHandler(deleteCollectionItemHandler));

module.exports = router;
