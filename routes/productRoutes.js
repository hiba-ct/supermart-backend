const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

// Get all products
router.get(
  "/",
  authMiddleware,
  getProducts
);

// Get one product
router.get(
  "/:id",
  authMiddleware,
  getProductById
);

// Create product - Admin and Manager
router.post(
  "/",
  authMiddleware,
  allowRoles("admin", "manager"),
  createProduct
);

// Update product - Admin and Manager
router.put(
  "/:id",
  authMiddleware,
  allowRoles("admin", "manager"),
  updateProduct
);

// Delete product - Admin only
router.delete(
  "/:id",
  authMiddleware,
  allowRoles("admin"),
  deleteProduct
);

module.exports = router;