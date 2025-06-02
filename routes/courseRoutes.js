const express = require('express');
const router = express.Router();
const Course = require('../models/Course'); // Import the Course model

// Route to get all courses
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find(); // Fetch all courses from the database
        res.status(200).json(courses);
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.status(500).json({ message: 'Server error fetching courses' });
    }
});

// Route to add a new course (for testing/admin purposes)
// In a real application, this would be protected by admin authentication
router.post('/', async (req, res) => {
    const { id, title, description, longDescription, imageUrl, category, instructor, duration, difficulty, lessons, topics } = req.body;

    // Basic validation
    if (!id || !title || !description) {
        return res.status(400).json({ message: 'Please provide ID, title, and description for the course.' });
    }

    try {
        // Check if a course with this ID already exists
        const existingCourse = await Course.findOne({ id });
        if (existingCourse) {
            return res.status(400).json({ message: 'Course with this ID already exists.' });
        }

        const newCourse = new Course({
            id,
            title,
            description,
            longDescription,
            imageUrl,
            category,
            instructor,
            duration,
            difficulty,
            lessons,
            topics
        });

        await newCourse.save();
        res.status(201).json({ message: 'Course added successfully!', course: newCourse });

    } catch (err) {
        console.error('Error adding course:', err);
        res.status(500).json({ message: 'Server error adding course' });
    }
});

// Route to get a single course by ID
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findOne({ id: req.params.id });
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.status(200).json(course);
    } catch (err) {
        console.error('Error fetching single course:', err);
        res.status(500).json({ message: 'Server error fetching course' });
    }
});

// You can add more routes here, e.g., for updating, deleting.

module.exports = router;
