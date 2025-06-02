const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Course = require('../models/Course'); // Needed to link quizzes to courses
const mongoose = require('mongoose'); // NEW: Import mongoose for ObjectId validation

// Route to get all quizzes (optional, might prefer by course)
router.get('/', async (req, res) => {
    console.log('Attempting to fetch all quizzes...'); // Log request
    try {
        // Populate the 'course' field to get course title and id
        const quizzes = await Quiz.find().populate('course', 'title id');
        console.log(`Successfully fetched ${quizzes.length} quizzes.`); // Log success
        res.status(200).json(quizzes);
    } catch (err) {
        console.error('Error fetching all quizzes:', err); // More specific error log
        res.status(500).json({ message: 'Server error fetching all quizzes' });
    }
});

// Route to get quizzes for a specific course (using course's MongoDB _id)
router.get('/course/:courseObjectId', async (req, res) => {
    const courseObjectId = req.params.courseObjectId;
    console.log(`Attempting to fetch quizzes for courseObjectId: ${courseObjectId}`); // Log incoming ID

    // NEW: Validate if the provided courseObjectId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(courseObjectId)) {
        console.error(`Invalid courseObjectId format received: ${courseObjectId}`);
        // If it's not a valid ObjectId, it cannot be a valid course._id
        return res.status(400).json({ message: 'Invalid course ID format provided.' });
    }

    try {
        // Find quizzes linked to the provided course ObjectId
        const quizzes = await Quiz.find({ course: courseObjectId });
        console.log(`Successfully fetched ${quizzes.length} quizzes for courseObjectId: ${courseObjectId}`); // Log success
        res.status(200).json(quizzes);
    } catch (err) {
        console.error('Error fetching quizzes for course:', err); // More specific error log
        res.status(500).json({ message: 'Server error fetching quizzes for course' });
    }
});

// Route to get a single quiz by its ID
router.get('/:id', async (req, res) => {
    const quizId = req.params.id;
    console.log(`Attempting to fetch single quiz with ID: ${quizId}`); // Log incoming ID

    // NEW: Validate if the provided quizId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
        console.error(`Invalid quiz ID format received: ${quizId}`);
        return res.status(400).json({ message: 'Invalid quiz ID format provided.' });
    }

    try {
        // Populate the 'course' field to get course title and id
        const quiz = await Quiz.findById(quizId).populate('course', 'title id');
        if (!quiz) {
            console.log(`Quiz with ID: ${quizId} not found.`); // Log not found
            return res.status(404).json({ message: 'Quiz not found' });
        }
        console.log(`Successfully fetched quiz with ID: ${quizId}`); // Log success
        res.status(200).json(quiz);
    } catch (err) {
        console.error('Error fetching single quiz:', err); // More specific error log
        res.status(500).json({ message: 'Server error fetching quiz' });
    }
});

// Route to create a new quiz (Admin-only in a real app)
router.post('/', async (req, res) => {
    const { title, description, courseId, questions, passPercentage } = req.body;
    console.log(`Attempting to create new quiz for courseId: ${courseId}`); // Log creation attempt

    if (!title || !courseId || !questions || questions.length === 0) {
        return res.status(400).json({ message: 'Missing required quiz fields: title, courseId, questions.' });
    }

    try {
        // Find the course by its 'id' field (assuming you use 'id' for courses like "web-dev-bootcamp")
        const course = await Course.findOne({ id: courseId });
        if (!course) {
            console.log(`Course not found with provided courseId: ${courseId}`); // Log not found
            return res.status(404).json({ message: 'Course not found with the provided courseId.' });
        }

        const newQuiz = new Quiz({
            title,
            description,
            course: course._id, // Link using MongoDB's internal _id
            questions,
            passPercentage
        });

        await newQuiz.save();

        // Also update the Course to include this new quiz's ID
        course.quizzes.push(newQuiz._id);
        await course.save();

        console.log(`Quiz created successfully with ID: ${newQuiz._id}`); // Log success
        res.status(201).json({ message: 'Quiz created successfully!', quiz: newQuiz });
    } catch (err) {
        console.error('Error creating quiz:', err); // More specific error log
        res.status(500).json({ message: 'Server error creating quiz' });
    }
});

// Route to submit a quiz and calculate score
router.post('/:id/submit', async (req, res) => {
    const quizId = req.params.id;
    const { answers } = req.body; // answers will be an array of { questionId: '...', userAnswer: '...' }
    console.log(`Attempting to submit quiz with ID: ${quizId}`); // Log submission attempt

    // NEW: Validate if the provided quizId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
        console.error(`Invalid quiz ID format received for submission: ${quizId}`);
        return res.status(400).json({ message: 'Invalid quiz ID format provided.' });
    }

    try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            console.log(`Quiz with ID: ${quizId} not found for submission.`); // Log not found
            return res.status(404).json({ message: 'Quiz not found' });
        }

        let score = 0;
        let totalQuestions = quiz.questions.length;
        let results = [];

        quiz.questions.forEach(question => {
            // Ensure question.id is used for matching answers
            const userAnswer = answers.find(a => a.questionId === question.id)?.userAnswer;
            let isCorrect = false;
            let correctAnswerText = ''; // To store the text of the correct answer for feedback

            if (question.type === 'multiple-choice' || question.type === 'true-false') {
                const correctOption = question.options.find(opt => opt.isCorrect);
                if (correctOption) {
                    correctAnswerText = correctOption.text;
                    if (userAnswer === correctOption.text) {
                        isCorrect = true;
                    }
                }
            } else if (question.type === 'short-answer') {
                // Simple case-insensitive match for short answer
                if (question.correctAnswer) {
                    correctAnswerText = question.correctAnswer;
                    if (userAnswer && userAnswer.toLowerCase() === question.correctAnswer.toLowerCase()) {
                        isCorrect = true;
                    }
                }
            }

            if (isCorrect) {
                score++;
            }
            results.push({
                questionId: question.id,
                questionText: question.questionText,
                userAnswer: userAnswer,
                correctAnswer: correctAnswerText, // Use the determined correct answer text
                isCorrect: isCorrect
            });
        });

        const percentage = (score / totalQuestions) * 100;
        const passed = percentage >= quiz.passPercentage;

        console.log(`Quiz submission for ID: ${quizId} processed. Score: ${score}/${totalQuestions}`); // Log submission result
        // In a real app, you'd save this attempt to a UserQuizAttempt model
        res.status(200).json({
            message: 'Quiz submitted successfully!',
            score: score,
            totalQuestions: totalQuestions,
            percentage: percentage,
            passed: passed,
            results: results // Detailed results for feedback
        });

    } catch (err) {
        console.error('Error submitting quiz:', err); // More specific error log
        res.status(500).json({ message: 'Server error submitting quiz' });
    }
});


module.exports = router;
