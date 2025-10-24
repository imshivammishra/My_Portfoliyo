const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const User = require("../models/User");
const { verifyToken } = require("../middleware/authMiddleware");

// =============== File Upload Setup ===============
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// =============== OTP Memory Store ===============
const otpStore = {};
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// =============== Login (Admin) ===============
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error during login" });
  }
});

// =============== Login (User - Homepage) ===============
router.post("/login-password", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({ token });
});

// =============== Send OTP for Registration ===============
router.post("/send-register-otp", async (req, res) => {
  const { name, email } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email already exists" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = otp;

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  
try {
  await transporter.sendMail({
  from: `"Wo&Men Support" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: "Your Wo&Men Registration OTP (Valid for 10 Minutes)",
  text: `
Hello ${name},

Welcome to Wo&Men — India's curated destination for modern and traditional fashion excellence.

We're excited to have you on board!

🔐 Your One-Time Password (OTP) for completing registration is:

OTP: ${otp}

🕒 Validity: 10 minutes only  
Please do not share this OTP with anyone. Wo&Men will never ask you for it via email, call, or message.

About Us:
At Wo&Men, we blend India's timeless heritage with contemporary style. Each piece is a tribute to culture, craftsmanship, and individuality.

Need help or didn’t request this OTP?
Simply ignore this message or contact our team for assistance.

Contact Us:
📧 Email: support@womenclothing.com  
🔒 Privacy Policy: https://yourdomain.com/privacy-policy  
🌐 Website: https://yourdomain.com

Thank you for trusting us.  
— Team Wo&Men
© ${new Date().getFullYear()} Wo&Men Clothing Pvt. Ltd. All Rights Reserved.
`
,
  html: `
  <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #ddd; box-shadow: 0 0 10px rgba(0,0,0,0.04);">
    <h2 style="color: #000000;">Hello ${name},</h2>
    <p style="font-size: 16px; color: #333333;">
      Welcome to <strong>Wo&Men</strong> — where India’s rich tradition meets contemporary elegance.
    </p>

    <p style="font-size: 18px; color: #000000; margin-top: 20px;">
      Your One-Time Password (OTP) is:
    </p>
    <div style="font-size: 36px; font-weight: 600; color: #222222; letter-spacing: 2px; margin: 16px 0;">
      ${otp}
    </div>

    <p style="font-size: 14px; color: #555555;">
      This OTP is <strong>valid for 10 minutes</strong> only. Please do not share it with anyone. We will never ask you to disclose it via email, SMS, or phone.
    </p>

    <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />

    <p style="font-size: 14px; color: #666;">
      <strong>About Wo&Men:</strong><br/>
      We are India’s premium fashion label blending traditional aesthetics with modern silhouettes. Every piece is thoughtfully designed to reflect heritage, identity, and style.
    </p>

    <p style="font-size: 14px; color: #666; margin-top: 24px;">
      <strong>Need Help?</strong><br/>
      📧 Email: <a href="mailto:support@womenclothing.com" style="color: #000;">support@womenclothing.com</a><br/>
      🔒 Privacy Policy: <a href="https://yourdomain.com/privacy-policy" style="color: #000;">Click here</a><br/>
      🌐 Website: <a href="https://yourdomain.com" style="color: #000;">yourdomain.com</a>
    </p>

    <p style="font-size: 12px; color: #aaa; margin-top: 40px; text-align: center;">
      © ${new Date().getFullYear()} Wo&Men Clothing Pvt. Ltd. All rights reserved.
    </p>
  </div>
`,

});

    res.json({ message: "OTP sent for registration." });
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ message: "Failed to send OTP email." });
  }
});

// =============== Register with OTP ===============
router.post("/register-otp", async (req, res) => {
  const { name, email, password, otp } = req.body;

  if (otpStore[email] !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  delete otpStore[email];

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email already registered" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword });

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

// =============== Google Login ===============
router.post("/google", async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        avatar: picture,
        password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token });
  } catch (err) {
    console.error("Google auth failed:", err);
    res.status(400).json({ message: "Google authentication failed" });
  }
});

// =============== Get Current User ===============
router.get("/me", verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// =============== Update Profile Info ===============
router.put("/update", verifyToken, async (req, res) => {
  const { name, email, password } = req.body;
  const updates = { name, email };

  if (password) {
    updates.password = await bcrypt.hash(password, 10);
  }

  try {
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile updated", user });
  } catch (err) {
    console.error("Profile update failed:", err);
    res.status(500).json({ message: "Server error during update" });
  }
});

// =============== Upload Avatar ===============
router.post("/upload-avatar", verifyToken, upload.single("avatar"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Optional: delete old local avatar if not from Google
    if (user.avatar && !user.avatar.startsWith("http")) {
      const oldPath = path.join("uploads", user.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    user.avatar = req.file.filename;
    await user.save();

    res.json({ message: "Avatar uploaded", avatar: user.avatar });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Server error during upload" });
  }
});

module.exports = router;
