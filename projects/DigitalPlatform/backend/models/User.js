const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, sparse: true },
    password: { type: String },
    phone: { type: String, unique: true, sparse: true },
    isTeacher: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    name: { type: String, required: true },
    avatar: { type: String, default: 'https://placehold.co/150x150/EFEFEF/AAAAAA?text=Avatar' },
    enrolledCourses: [{
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        },
        progress: { type: Number, default: 0 }
    }],
    // New field for teacher notes
    notes: { type: String }
});

module.exports = mongoose.model('User', userSchema);