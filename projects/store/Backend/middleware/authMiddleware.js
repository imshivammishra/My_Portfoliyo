const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token is not valid" });
  }
};

exports.isAdmin = (req, res, next) => {
  console.log("🧠 isAdmin middleware - User role:", req.user?.role);
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    console.log("🚫 Not admin, access denied");
    return res.status(403).json({ msg: "Unauthorized" });
  }
};






