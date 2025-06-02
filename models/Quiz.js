const mongoose = require('mongoose');

// Schema for individual options within a multiple-choice question
const optionSchema = new mongoose.Schema({
    _id: false, // Don't create a default _id for sub-documents
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true }
});

// Schema for individual questions within a quiz
const questionSchema = new mongoose.Schema({
    _id: false, // Don't create a default _id for sub-documents
    id: { type: String, required: true }, // Unique ID for the question
    questionText: { type: String, required: true },
    type: { type: String, enum: ['multiple-choice', 'true-false', 'short-answer'], default: 'multiple-choice' },
    options: [optionSchema], // Only for multiple-choice/true-false
    correctAnswer: { type: String } // For short-answer questions, or if you prefer string for MCQs
});

// Main Quiz Schema
const quizSchema = new mongoose.Schema({ // Corrected: removed 'new' before mongoose.Schema
    title: { type: String, required: true },
    description: String,
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }, // Link to a Course
    questions: [questionSchema],
    passPercentage: { type: Number, default: 70 }, // Minimum percentage to pass
    // You can add more fields like: totalAttempts, averageScore, etc.
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
