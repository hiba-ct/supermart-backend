const express = require("express");

const {
  createSale,
  getSales,
  getSaleById,
  deleteSale,
} = require("../controllers/salesController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create sale
router.post(
  "/",
  authMiddleware,
  createSale
);

// Get all sales
router.get(
  "/",
  authMiddleware,
  getSales
);

// Get single sale
router.get(
  "/:id",
  authMiddleware,
  getSaleById
);

// Delete sale
router.delete(
  "/:id",
  authMiddleware,
  deleteSale
);

module.exports = router;