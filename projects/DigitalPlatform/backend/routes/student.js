const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Note: For this example, we'll use an in-memory map to store OTPs.
// In a production environment, you should add 'otp' and 'otpExpiration' fields to your User model.
const otpStore = new Map();

// @route   POST /api/student/send-otp
// @desc    Send OTP to a student's email
// @access  Private
router.post('/send-otp', auth, async (req, res) => {
    try {
        const { email } = req.body;
        let user = await User.findById(req.user.id);

        if (!user || user.isTeacher) {
            return res.status(404).json({ msg: 'Student not found' });
        }

        // You would typically use a service like Nodemailer to send an email here.
        // For now, we'll just generate the OTP and store it.
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiration = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes

        otpStore.set(user.id, { otp, otpExpiration, email });

        console.log(`OTP for ${email}: ${otp}`); // Log OTP to the console for testing
        res.json({ msg: 'OTP sent successfully. Check console for OTP.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/student/verify-otp
// @desc    Verify OTP
// @access  Private
router.post('/verify-otp', auth, async (req, res) => {
    try {
        const { otp } = req.body;
        let user = await User.findById(req.user.id);

        if (!user || user.isTeacher) {
            return res.status(404).json({ msg: 'Student not found' });
        }

        const storedOtp = otpStore.get(user.id);

        if (!storedOtp || storedOtp.otp !== otp || Date.now() > storedOtp.otpExpiration) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        // OTP is valid, proceed with verification
        otpStore.delete(user.id); // Remove OTP after successful verification
        res.json({ msg: 'OTP verified successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/student/profile
// @desc    Get student profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
    try {
        // Here's the fix: use .populate('enrolledCourses.course') to get full course details
        const user = await User.findById(req.user.id).select('-password').populate('enrolledCourses.course');
        if (!user || user.isTeacher) {
            return res.status(404).json({ msg: 'Student not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/student/profile
// @desc    Update student profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
    const { name, email, phone, avatar } = req.body;
    try {
        let user = await User.findById(req.user.id);
        if (!user || user.isTeacher) {
            return res.status(404).json({ msg: 'Student not found' });
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.avatar = avatar || user.avatar;

        await user.save();
        res.json({ msg: 'Profile updated successfully', user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Student enrolls in a course
router.post('/enroll-course', auth, async (req, res) => {
    const { courseId } = req.body;
    try {
        let user = await User.findById(req.user.id);
        if (!user || user.isTeacher) {
            return res.status(404).json({ msg: 'Student not found' });
        }

        if (user.enrolledCourses.some(c => c.course.toString() === courseId)) {
            return res.status(400).json({ msg: 'Already enrolled in this course' });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ msg: 'Course not found' });
        }

        user.enrolledCourses.push({ course: courseId });
        await user.save();

        res.json({ msg: 'Course enrolled successfully', enrolledCourses: user.enrolledCourses });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Mark a lecture as complete
router.post('/complete-lecture', auth, async (req, res) => {
    const { courseId, lectureId } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'Student not found' });
        }

        const enrolledCourse = user.enrolledCourses.find(c => c.course.toString() === courseId);
        if (!enrolledCourse) {
            return res.status(400).json({ msg: 'Not enrolled in this course' });
        }

        if (enrolledCourse.completedLectures.includes(lectureId)) {
            return res.status(400).json({ msg: 'Lecture already marked as complete' });
        }

        enrolledCourse.completedLectures.push(lectureId);
        await user.save();

        res.json({ msg: 'Lecture marked as complete successfully', completedLectures: enrolledCourse.completedLectures });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
