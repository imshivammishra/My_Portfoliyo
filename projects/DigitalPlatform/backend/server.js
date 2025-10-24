const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const Course = require('./models/Course');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected');
    seedCourses();
}).catch(err => console.log(err));

// Seed some initial course data with modules and lessons
async function seedCourses() {
    try {
        const count = await Course.countDocuments();
        if (count === 0) {
            const courses = [
                {
                    title: 'Introduction to Web Development',
                    description: 'Learn the basics of HTML, CSS, and JavaScript.',
                    thumbnail: 'https://placehold.co/300x200/4F46E5/FFFFFF?text=Web+Dev',
                    instructor: {
                        name: 'Jane Doe',
                        bio: 'Senior Software Engineer specializing in front-end development.',
                        avatar: 'https://placehold.co/150x150/d1d5db/4b5563?text=JD'
                    },
                    modules: [
                        {
                            title: 'Module 1: HTML & CSS Basics',
                            lessons: [
                                {
                                    title: 'Lecture 1: The Building Blocks',
                                    description: 'An introduction to HTML and CSS.',
                                    videoUrl: 'https://www.youtube.com/embed/pkn2Fp5c7vI?si=Wp35D_g2Pz1q1j6P'
                                },
                                {
                                    title: 'Lecture 2: CSS Layouts',
                                    description: 'Learn about modern CSS layout techniques like Flexbox and Grid.',
                                    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?si=R9J-6qVfT_yRjVbM'
                                }
                            ]
                        }
                    ]
                },
                {
                    title: 'Data Science Fundamentals',
                    description: 'Explore data analysis, machine learning, and Python.',
                    thumbnail: 'https://placehold.co/300x200/10B981/FFFFFF?text=Data+Science',
                    instructor: {
                        name: 'Dr. Alan Turing',
                        bio: 'Leading researcher in AI and data analytics.',
                        avatar: 'https://placehold.co/150x150/94a3b8/e2e8f0?text=AT'
                    },
                    modules: [
                        {
                            title: 'Module 1: Python for Data Science',
                            lessons: [
                                {
                                    title: 'Lecture 1: Introduction to NumPy',
                                    description: 'Learn how to use NumPy for efficient numerical operations.',
                                    videoUrl: 'https://www.youtube.com/embed/GB9-hNn5rK8'
                                }
                            ]
                        }
                    ]
                }
            ];
            await Course.insertMany(courses);
            console.log('Courses seeded successfully.');
        }
    } catch (err) {
        console.error('Error seeding courses:', err);
    }
}

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Define API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/student', require('./routes/student'));
app.use('/api/teacher', require('./routes/teacher'));

// New Route for fetching a single course by ID
app.get('/api/courses/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ msg: 'Course not found' });
        }
        res.json(course);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Existing route for fetching all courses
app.get('/api/courses', async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));