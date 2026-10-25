const express = require("express");

const {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  receivePurchase,
  cancelPurchase,
  deletePurchase,
} = require("../controllers/purchaseController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// GET ALL PURCHASES
// GET /api/purchases
// ======================================================

router.get(
  "/",
  authMiddleware,
  getPurchases
);

// ======================================================
// GET SINGLE PURCHASE
// GET /api/purchases/:id
// ======================================================

router.get(
  "/:id",
  authMiddleware,
  getPurchaseById
);

// ======================================================
// CREATE PURCHASE
// POST /api/purchases
// ======================================================

router.post(
  "/",
  authMiddleware,
  createPurchase
);

// ======================================================
// UPDATE PURCHASE
// PUT /api/purchases/:id
// ======================================================

router.put(
  "/:id",
  authMiddleware,
  updatePurchase
);

// ======================================================
// RECEIVE PURCHASE
// POST /api/purchases/:id/receive
// ======================================================

router.post(
  "/:id/receive",
  authMiddleware,
  receivePurchase
);

// ======================================================
// CANCEL PURCHASE
// POST /api/purchases/:id/cancel
// ======================================================

router.post(
  "/:id/cancel",
  authMiddleware,
  cancelPurchase
);

// ======================================================
// DELETE PURCHASE
// DELETE /api/purchases/:id
// ======================================================

router.delete(
  "/:id",
  authMiddleware,
  deletePurchase
);

module.exports = router;