const Product = require("../models/Product");
const fs = require("fs"); // Make sure fs is imported if you're deleting files

// Add Product (Admin only)
exports.addProduct = async (req, res) => {
  try {
    console.log("📦 Incoming Product Body:", req.body);
    console.log("🖼️ Incoming File:", req.file);

    const { name, price, description, category, stock, state } = req.body;

    if (!name || !price || !category || !state) {
      return res.status(400).json({ msg: "Name, price, category, and state are required." });
    }

    const image = req.file ? req.file.path.replace(/\\/g, "/") : "";

    const product = new Product({
      name,
      price: parseFloat(price),
      description,
      category,
      stock: parseInt(stock),
      state,
      image,
    });

   await product.save();
    res.status(201).json({ msg: "Product added successfully", product });
  } catch (err) {
    console.error("❌ Failed to add product:", err.message);
    res.status(500).json({ msg: "Failed to add product", error: err.message });
  }
};

// Get All or Filtered Products (Public)
exports.getFilteredProducts = async (req, res) => {
  try {
    const { state, category } = req.query;

    const filter = {};
    if (state) filter.state = state;
    if (category) filter.category = category;

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch products", error: err.message });
  }
};

// 🔍 Get Single Product by ID (Public) // <--- NEW FUNCTION ADDED HERE
// ... other controller functions
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error('Error fetching product by ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};
// ... other controller functions

// Delete Product (Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: "Product not found" });

    // Delete the image file if it exists
    if (product.image && fs.existsSync(product.image)) { // Added fs.existsSync check
        fs.unlinkSync(product.image);
    }
    await product.deleteOne(); // Use deleteOne() or findByIdAndDelete()
    res.json({ msg: "Product deleted" });
  } catch (err) {
    console.error("❌ Failed to delete product:", err.message);
    res.status(500).json({ msg: "Failed to delete product", error: err.message });
  }
};

// Update Product (Admin only)
exports.updateProduct = async (req, res) => {
  try {
    const { name, price, category, stock, description, state } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: "Product not found" });

    // If a new file is uploaded, delete the old one first
    if (req.file && product.image && fs.existsSync(product.image)) {
        fs.unlinkSync(product.image);
    }

    product.name = name || product.name;
    product.price = price ? parseFloat(price) : product.price;
    product.category = category || product.category;
    product.stock = stock ? parseInt(stock) : product.stock;
    product.description = description || product.description;
    product.state = state || product.state;

    if (req.file) product.image = req.file.path.replace(/\\/g, "/");

    await product.save();
    res.json({ msg: "Product updated", product });
  } catch (err) {
    console.error("❌ Update failed:", err.message);
    res.status(500).json({ msg: "Update failed", error: err.message });
  }
};