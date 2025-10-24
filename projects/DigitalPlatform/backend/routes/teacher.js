const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const teacherAuth = require('../middleware/teacherauth'); // Import the new middleware
const bcrypt = require('bcryptjs');

// Get teacher profile
router.get('/profile', teacherAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user || !user.isTeacher) {
            return res.status(404).json({ msg: 'Teacher not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update teacher profile
router.put('/profile', teacherAuth, async (req, res) => {
    const { name, email, phone, avatar, password } = req.body;
    try {
        let user = await User.findById(req.user.id);
        if (!user || !user.isTeacher) {
            return res.status(404).json({ msg: 'Teacher not found' });
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.avatar = avatar || user.avatar;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();
        res.json({ msg: 'Profile updated successfully', user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// New Routes for Student Management

// @route   POST /api/teacher/students
// @desc    Register a new student account
// @access  Private (Teacher Only)
router.post('/students', teacherAuth, async (req, res) => {
    const { name, email, phone, avatar } = req.body;
    try {
        if (!name || (!email && !phone)) {
            return res.status(400).json({ msg: 'Name and at least one of email or phone are required.' });
        }

        let student = await User.findOne({ $or: [{ email }, { phone }] });
        if (student) {
            return res.status(409).json({ msg: 'A user with this email or phone already exists.' });
        }

        student = new User({ name, email, phone, avatar, isTeacher: false });
        await student.save();

        res.status(201).json({ msg: 'Student account created successfully', student });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/teacher/students
// @desc    Get all students
// @access  Private (Teacher Only)
router.get('/students', teacherAuth, async (req, res) => {
    try {
        const students = await User.find({ isTeacher: false }).select('-password');
        res.json(students);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/teacher/students/:id
// @desc    Get a single student's details
// @access  Private (Teacher Only)
router.get('/students/:id', teacherAuth, async (req, res) => {
    try {
        const student = await User.findById(req.params.id).select('-password');
        if (!student || student.isTeacher) {
            return res.status(404).json({ msg: 'Student not found.' });
        }
        res.json(student);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/teacher/students/:id
// @desc    Update student details
// @access  Private (Teacher Only)
router.put('/students/:id', teacherAuth, async (req, res) => {
    const { name, email, phone, notes, avatar } = req.body;
    try {
        let student = await User.findById(req.params.id);

        if (!student || student.isTeacher) {
            return res.status(404).json({ msg: 'Student not found.' });
        }

        if (name) student.name = name;
        if (email) student.email = email;
        if (phone) student.phone = phone;
        if (notes) student.notes = notes;
        if (avatar) student.avatar = avatar;

        await student.save();

        res.json({ msg: 'Student details updated successfully', student });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/teacher/students/:id
// @desc    Remove a student account
// @access  Private (Teacher Only)
router.delete('/students/:id', teacherAuth, async (req, res) => {
    try {
        const student = await User.findOneAndDelete({ _id: req.params.id, isTeacher: false });

        if (!student) {
            return res.status(404).json({ msg: 'Student not found.' });
        }

        res.json({ msg: 'Student account removed successfully.' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Invalid student ID.' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;