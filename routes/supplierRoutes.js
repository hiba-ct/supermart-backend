const express = require("express");

const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/supplierController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get all suppliers
router.get(
  "/",
  authMiddleware,
  getSuppliers
);

// Get single supplier
router.get(
  "/:id",
  authMiddleware,
  getSupplierById
);

// Create supplier
router.post(
  "/",
  authMiddleware,
  createSupplier
);

// Update supplier
router.put(
  "/:id",
  authMiddleware,
  updateSupplier
);

// Delete supplier
router.delete(
  "/:id",
  authMiddleware,
  deleteSupplier
);

module.exports = router;