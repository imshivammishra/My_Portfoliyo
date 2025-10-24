// auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth');

// Helper function for sending messages
function sendResponse(res, statusCode, message, data = {}) {
    res.status(statusCode).json({ msg: message, ...data });
}

// Nodemailer transporter setup (make sure your .env has correct credentials)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Admin-only route to register a new teacher (for admin panel)
router.post('/teacher/register', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        let teacher = await User.findOne({ email });
        if (teacher) {
            return sendResponse(res, 400, 'Teacher with this email already exists');
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        teacher = new User({ email, password: hashedPassword, name, isTeacher: true });
        await teacher.save();
        sendResponse(res, 201, 'Teacher account created successfully');
    } catch (err) {
        console.error(err.message);
        sendResponse(res, 500, 'Server Error');
    }
});

// Teacher Login
router.post('/teacher/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const teacher = await User.findOne({ email, isTeacher: true });
        if (!teacher) {
            return sendResponse(res, 400, 'Invalid Credentials');
        }
        const isMatch = await bcrypt.compare(password, teacher.password);
        if (!isMatch) {
            return sendResponse(res, 400, 'Invalid Credentials');
        }
        const payload = {
            user: {
                id: teacher.id,
                isTeacher: teacher.isTeacher
            }
        };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        sendResponse(res, 500, 'Server Error');
    }
});

// Student Login - Step 1: Request OTP (unified for email or phone)
router.post('/student/request-otp', async (req, res) => {
    const { loginId } = req.body;
    const cleanLoginId = loginId.trim(); // Trim whitespace
    const isEmail = cleanLoginId.includes('@');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    try {
        let user;
        if (isEmail) {
            // Check for a user with the provided email
            user = await User.findOne({ email: cleanLoginId });
        } else {
            // Check for a user with the provided phone number
            user = await User.findOne({ phone: cleanLoginId });
        }

        if (!user) {
            // Create a new user, setting only the relevant field and using 'undefined' for the other
            const newUserFields = {
                name: 'New Student',
                otp: otp,
                otpExpires: otpExpires,
                isTeacher: false,
                email: isEmail ? cleanLoginId : undefined,
                phone: !isEmail ? cleanLoginId : undefined
            };
            user = new User(newUserFields);
        } else {
            // If a user exists, update their OTP and expiration time
            user.otp = otp;
            user.otpExpires = otpExpires;
        }

        await user.save();

        // Handle sending OTP based on login type
        if (isEmail && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: cleanLoginId,
                subject: 'Your OTP for "we will learn"',
                text: `Your One-Time Password (OTP) is: ${otp}. It is valid for 10 minutes.`
            };
            await transporter.sendMail(mailOptions);
            sendResponse(res, 200, 'OTP sent to your email.');

        } else if (!isEmail) {
            console.log(`[PHONE OTP] for ${cleanLoginId}: ${otp}`);
            sendResponse(res, 200, `OTP sent. Please use this OTP to login: ${otp}`);
        } else {
            // This case handles when an email is used but email credentials are not set up
            sendResponse(res, 500, 'Server Error: Email service is not configured.');
        }

    } catch (err) {
        console.error('Error in student/request-otp:', err.message);
        // This is the duplicate key error (code 11000) that prevents a user from being created
        // if the email or phone number is already in the database.
        if (err.name === 'ValidationError') {
            sendResponse(res, 400, `Validation Error: ${err.message}`);
        } else if (err.code === 11000) {
            sendResponse(res, 409, 'A user with this phone number or email already exists.');
        } else {
            sendResponse(res, 500, 'Server Error');
        }
    }
});

// Student Login - Step 2: Verify OTP
router.post('/student/verify-otp', async (req, res) => {
    const { loginId, otp } = req.body;
    const cleanLoginId = loginId.trim(); // Trim whitespace
    const isEmail = cleanLoginId.includes('@');

    try {
        let user;
        if (isEmail) {
            user = await User.findOne({ email: cleanLoginId });
        } else {
            user = await User.findOne({ phone: cleanLoginId });
        }

        if (!user) return sendResponse(res, 400, 'User not found.');
        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return sendResponse(res, 400, 'Invalid or expired OTP.');
        }

        user.otp = null;
        user.otpExpires = null;
        await user.save();

        const payload = { user: { id: user.id, isTeacher: user.isTeacher } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, isTeacher: user.isTeacher });
    } catch (err) {
        console.error(err.message);
        sendResponse(res, 500, 'Server Error');
    }
});

// New route to get all students (teacher-only)
router.get('/students', auth, async (req, res) => {
    try {
        // Ensure the authenticated user is a teacher
        if (!req.user.isTeacher) {
            return sendResponse(res, 403, 'Access denied. Only teachers can view this.');
        }
        
        // Find all users that are not teachers
        const students = await User.find({ isTeacher: false }).select('-password -otp -otpExpires');
        res.json(students);
    } catch (err) {
        console.error(err.message);
        sendResponse(res, 500, 'Server Error');
    }
});

// New route to add a student (teacher-only)
router.post('/students', auth, async (req, res) => {
    const { name, email, phone } = req.body;
    try {
        if (!req.user.isTeacher) {
            return res.status(403).json({ msg: 'Access denied. You are not a teacher.' });
        }
        
        const existingStudent = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingStudent) {
            return res.status(400).json({ msg: 'Student with this email or phone already exists.' });
        }

        const newStudent = new User({
            name,
            email,
            phone,
            isTeacher: false
        });

        await newStudent.save();
        res.status(201).json({ msg: 'Student added successfully.', student: newStudent });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});


// New route to delete a student (teacher-only)
router.delete('/students/:id', auth, async (req, res) => {
    try {
        // Ensure the authenticated user is a teacher
        if (!req.user.isTeacher) {
            return sendResponse(res, 403, 'Access denied. You are not a teacher.');
        }

        // Find the student by ID and delete them using the correct method
        const student = await User.findOneAndDelete({ _id: req.params.id, isTeacher: false });

        if (!student) {
            return sendResponse(res, 404, 'Student not found.');
        }

        sendResponse(res, 200, 'Student record deleted successfully.');
        
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return sendResponse(res, 404, 'Invalid student ID.');
        }
        sendResponse(res, 500, 'Server Error');
    }
});

module.exports = router;