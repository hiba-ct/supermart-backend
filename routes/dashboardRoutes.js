
const express = require("express");

const {
  getDashboardStats,
  getDashboardAnalytics,
  getFinanceSummary,
} = require("../controllers/dashboardController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/stats", authMiddleware, getDashboardStats);
router.get("/analytics", authMiddleware, getDashboardAnalytics);
router.get("/finance", authMiddleware, getFinanceSummary);

module.exports = router;
