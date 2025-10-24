// backend/models/Order.js (Example structure)

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to your User model
        required: true,
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product', // Reference to your Product model
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                default: 1,
            },
            // You might also store price at the time of order for historical accuracy
            priceAtOrder: {
                type: Number,
                required: true,
            }
        }
    ],
    totalAmount: {
        type: Number,
        required: true,
    },
    shippingAddress: {
        // ... details like street, city, state, postalCode, country
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending',
    },
    // You might also add payment details, etc.
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Order', orderSchema);