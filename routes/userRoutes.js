const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const { getCurrentUser } = require("../controllers/userController");

const router = express.Router();

// Get logged-in user
router.get("/me", authMiddleware, getCurrentUser);


router.get(
  "/admin-test",
  authMiddleware,
  allowRoles("admin"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Admin access granted",
      role: req.role
    });
  }
);
module.exports = router;

 