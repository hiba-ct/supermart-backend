const express = require("express");

const {
  getInventory,
  getLowStock,
  getOutOfStock,
  adjustStock,
  getStockHistory,
} = require("../controllers/inventoryController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get complete inventory
router.get(
  "/",
  authMiddleware,
  getInventory
);

// Get low stock products
router.get(
  "/low-stock",
  authMiddleware,
  getLowStock
);

// Get out of stock products
router.get(
  "/out-of-stock",
  authMiddleware,
  getOutOfStock
);

// Adjust stock
router.post(
  "/adjust",
  authMiddleware,
  adjustStock
);

// Get product stock history
router.get(
  "/history/:productId",
  authMiddleware,
  getStockHistory
);

module.exports = router;