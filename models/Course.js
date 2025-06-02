const mongoose = require('mongoose');

// Schema for individual lessons within a course
const lessonSchema = new mongoose.Schema({
    id: { type: String, required: true }, // Unique ID for the lesson
    title: { type: String, required: true },
    duration: { type: String, default: '10 min' }, // e.g., "10 min", "1 hour"
    description: String,
    content: String, // Detailed HTML content for the lesson
    completed: { type: Boolean, default: false } // For user progress tracking later
}, { _id: false }); // Do not create a default _id for sub-documents

// Schema for main topics/modules within a course
const topicSchema = new mongoose.Schema({
    id: { type: String, required: true }, // Unique ID for the topic
    title: { type: String, required: true },
    description: String,
}, { _id: false }); // Do not create a default _id for sub-documents


// Main Course Schema
const courseSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Unique identifier for the course
    title: { type: String, required: true },
    description: { type: String, required: true },
    longDescription: { type: String, default: '' }, // A more detailed description for the course detail page
    imageUrl: { type: String, default: 'https://placehold.co/150x100/CCCCCC/FFFFFF?text=Course' },
    category: { type: String, default: 'General' }, // e.g., 'Web Dev', 'AI/ML', 'Data Science'
    instructor: { type: String, default: 'Various Instructors' },
    duration: { type: String, default: 'Self-Paced' }, // e.g., "10 hours", "4 weeks"
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    lessons: [lessonSchema], // Array of sub-documents for lessons
    topics: [topicSchema],   // Array of sub-documents for main topics/modules
    quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }] // NEW: Array of Quiz IDs
}, { timestamps: true }); // Adds createdAt and updatedAt fields automatically

module.exports = mongoose.model('Course', courseSchema);
