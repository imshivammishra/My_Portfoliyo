require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.error("DB connection failed", err));

async function createAdmin() {
  const email = "shivammishra@gmail.com";
  const existing = await User.findOne({ email });

  if (existing) {
    console.log("Admin already exists");
    process.exit();
  }

  const hashedPassword = await bcrypt.hash("muskansingh", 10);

  const adminUser = new User({
    name: "Admin",
    email,
    password: hashedPassword,
    role: "admin",
  });

  await adminUser.save();
  console.log("✅ Admin user created");
  process.exit();
}

createAdmin();
