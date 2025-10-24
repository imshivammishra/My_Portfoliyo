// backend/routes/orderRoutes.js

const express = require("express");
const router = express.Router();
const {
    // ... existing imports (e.g., addOrder, updateOrder, deleteOrder)
    getUserOrders // Import the new function
} = require("../controllers/orderController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware"); // Ensure verifyToken is imported

// ... (your existing order routes)

// Get orders for the authenticated user
router.get("/myorders", verifyToken, getUserOrders); // Protected route

// ... (rest of your order routes, e.g., POST /api/orders for placing an order)

module.exports = router;