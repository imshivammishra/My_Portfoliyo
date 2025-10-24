    const mongoose = require('mongoose');

    const lessonSchema = new mongoose.Schema({
        title: {
            type: String,
            required: true
        },
        description: String,
        videoUrl: {
            type: String,
            required: true
        },
        // Optional: add a field to track if a lecture is completed
        isCompleted: {
            type: Boolean,
            default: false
        }
    });

    const moduleSchema = new mongoose.Schema({
        title: {
            type: String,
            required: true
        },
        lessons: [lessonSchema]
    });

    const instructorSchema = new mongoose.Schema({
        name: {
            type: String,
            required: true
        },
        bio: String,
        avatar: String
    });

    const courseSchema = new mongoose.Schema({
        title: {
            type: String,
            required: true
        },
        description: String,
        thumbnail: String,
        instructor: instructorSchema,
        modules: [moduleSchema]
    });

    const Course = mongoose.model('Course', courseSchema);

    module.exports = Course;