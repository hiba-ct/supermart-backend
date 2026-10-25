
const express = require("express");

const {
  getDailyAttendance,
  markAttendance,
} = require("../controllers/attendanceController");

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  allowRoles("admin", "manager"),
  getDailyAttendance
);

router.post(
  "/",
  authMiddleware,
  allowRoles("admin", "manager"),
  markAttendance
);

module.exports = router;
