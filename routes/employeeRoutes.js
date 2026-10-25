
const express = require("express");

const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
} = require("../controllers/employeeController");

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");


const router = express.Router();

// Admin and manager can view employees
router.get(
  "/",
  authMiddleware,
  allowRoles("admin", "manager"),
  getEmployees
);

router.get(
  "/:id",
  authMiddleware,
  allowRoles("admin", "manager"),
  getEmployeeById
);

// Only admin can create or update employees
router.post(
  "/",
  authMiddleware,
  allowRoles("admin"),
  createEmployee
);

router.put(
  "/:id",
  authMiddleware,
  allowRoles("admin"),
  updateEmployee
);

module.exports = router;
