const Product = require("../models/Product");
const User = require("../models/User");

exports.getDashboard = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalOrders = 0; // Placeholder for now

    const salesData = {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      values: [400, 800, 600, 700, 900, 1100],
    };

    res.json({ totalProducts, totalUsers, totalOrders, salesData });
  } catch (err) {
    res.status(500).json({ msg: "Dashboard error", error: err.message });
  }
};
















exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch users" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: "User deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Delete error" });
  }
};












exports.getAnalytics = async (req, res) => {
  const sales = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    values: [12000, 15000, 14000, 20000, 22000, 25000],
  };

  const uploads = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    values: [4, 6, 9, 5, 8, 10],
  };

  const categoriesAgg = await Product.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  const categories = {
    labels: categoriesAgg.map((c) => c._id),
    values: categoriesAgg.map((c) => c.count),
  };

  res.json({ sales, uploads, categories });
};












const Order = require("../models/Order");

exports.getOrders = async (req, res) => {
  const orders = await Order.find().populate("user").sort({ createdAt: -1 });
  res.json(orders);
};

exports.updateOrderStatus = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ msg: "Order not found" });

  order.status = req.body.status;
  await order.save();
  res.json({ msg: "Status updated" });
};

exports.deleteOrder = async (req, res) => {
  await Order.findByIdAndDelete(req.params.id);
  res.json({ msg: "Order deleted" });
};














exports.getAdminAlerts = async (req, res) => {
  try {
    const lowStockProducts = await Product.find({ stock: { $lt: 5 } }).limit(5);
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate("user");

    res.json({
      lowStock: lowStockProducts,
      recentOrders,
    });
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch alerts", error: err.message });
  }
};






// DELETE a user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ message: "No user ID" });

    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// TOGGLE user role (admin <-> user)
exports.toggleUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.role = user.role === "admin" ? "user" : "admin";
    await user.save();

    res.json({ msg: `User role updated to ${user.role}`, user });
  } catch (error) {
    console.error("Error in toggleUserRole:", error);
    res.status(500).json({ msg: "Server error" });
  }
};



