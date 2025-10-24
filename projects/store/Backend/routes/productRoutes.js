const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const {
  addProduct,
  getFilteredProducts,
  updateProduct,
  deleteProduct,
  getProductById // <--- ADD THIS LINE: Import getProductById
} = require("../controllers/productController");

// ➕ Add Product (Admin only)
router.post("/", verifyToken, isAdmin, upload.single("image"), addProduct);

// 🔍 Get All or Filtered Products (Public)
router.get("/", getFilteredProducts); // This handles /api/products (all) or /api/products?state=...

// 🔍 Get Single Product by ID (Public) // <--- ADD THIS NEW ROUTE
router.get("/:id", getProductById); // This handles /api/products/:id

// ✏️ Update Product (Admin only)
router.put("/:id", verifyToken, isAdmin, upload.single("image"), updateProduct);

// 🗑️ Delete Product (Admin only)
router.delete("/:id", verifyToken, isAdmin, deleteProduct);

module.exports = router;