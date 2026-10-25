
const express = require("express");
const router = express.Router();

const {
  createSalesReturn,
  getSalesReturns,

  getSalesReturnById,
  getSaleForReturn,
} = require("../controllers/salesReturnController");

// Use the same authentication middleware as your existing sales routes.
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createSalesReturn);
router.get(
  "/invoice/:invoiceNumber",
  authMiddleware,
  getSaleForReturn
);
router.get("/", authMiddleware, getSalesReturns);
router.get("/:id", authMiddleware, getSalesReturnById);

module.exports = router;
