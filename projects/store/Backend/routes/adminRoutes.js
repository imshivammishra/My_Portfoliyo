const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const { getDashboard, getAnalytics } = require("../controllers/adminController");
// ✅ THIS LINE IS MISSING IN YOUR CODE — ADD IT:
const { toggleUserRole } = require("../controllers/adminController");

const { getAllUsers, deleteUser } = require("../controllers/adminController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

router.get("/dashboard", verifyToken, isAdmin, getDashboard);

module.exports = router;








router.get("/users", verifyToken, isAdmin, getAllUsers);
router.delete("/users/:id", verifyToken, isAdmin, deleteUser);
router.put("/users/:id/role", verifyToken, isAdmin, toggleUserRole);
router.get("/analytics", verifyToken, isAdmin, getAnalytics);





const {
  getOrders,
  updateOrderStatus,
  deleteOrder
} = require("../controllers/adminController");

router.get("/orders", verifyToken, isAdmin, getOrders);
router.put("/orders/:id", verifyToken, isAdmin, updateOrderStatus);
router.delete("/orders/:id", verifyToken, isAdmin, deleteOrder);
















// Fetch current admin info
router.get("/me", verifyToken, isAdmin, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ name: user.name, email: user.email });
});

// Update settings
router.put("/settings", verifyToken, isAdmin, async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ msg: "User not found" });

  user.name = name;

  if (currentPassword && newPassword) {
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ msg: "Incorrect current password" });
    user.password = await bcrypt.hash(newPassword, 10);
  }

  await user.save();
  res.json({ msg: "Settings updated" });
});

module.exports = router;










const { getAdminAlerts } = require("../controllers/adminController");
router.get("/alerts", verifyToken, isAdmin, getAdminAlerts);
