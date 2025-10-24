// backend/controllers/orderController.js

const Order = require("../models/Order"); // Assuming you have an Order model
const Product = require("../models/Product"); // Might need this to populate product details if not already in order

// ... (your existing order controller functions, like addOrder, updateOrder, etc.)

// Get Orders for Authenticated User
exports.getUserOrders = async (req, res) => {
    try {
        // req.user.id comes from your verifyToken middleware
        const userId = req.user.id;
        console.log(`Fetching orders for user ID: ${userId}`);

        // Find orders by the user and populate product details
        // Assuming your Order model has a 'user' field referencing the User _id
        // And 'products.product' field referencing the Product _id
        const orders = await Order.find({ user: userId })
                                  .populate('products.product', 'name image price') // Populate product details (name, image, price)
                                  .sort({ createdAt: -1 }); // Show most recent orders first

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: "No orders found for this user." });
        }

        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ message: 'Server error while fetching orders.', error: error.message });
    }
};

// ... (rest of your order controller functions)