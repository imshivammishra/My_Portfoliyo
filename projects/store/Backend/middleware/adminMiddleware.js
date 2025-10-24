// This middleware checks if the logged-in user is an admin
module.exports = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Admin access required" });
  }
  next(); // If admin, continue to next middleware/controller
};
