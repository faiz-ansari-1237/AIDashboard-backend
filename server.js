require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // NEW: Import jsonwebtoken

const User = require('./models/User');
const courseRoutes = require('./routes/courseRoutes');
const quizRoutes = require('./routes/quizRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
// NEW: Define your JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'e16a345808f416d5933e00d3ba222c5fdbc4941b0a77eca0e4d92cad2a04ba1a'; // Use a strong secret!

// =====================================================================
// Middleware
// =====================================================================

// CORS Configuration (MODIFIED: Removed trailing slash from origin)
const corsOptions = {
    origin: 'https://ailearningdashboard.netlify.app', // CORRECTED: Removed trailing slash
    credentials: true, // Crucial for sending cookies/authorization headers
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
    optionsSuccessStatus: 200 // Return 200 for preflight OPTIONS requests
};
app.use(cors(corsOptions)); // Apply CORS middleware with specific options

app.use(express.json()); // Body parser for JSON

// =====================================================================
// MongoDB Connection
// =====================================================================
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected successfully!')) // Moved log inside .then()
    .catch(err => console.error('MongoDB connection error:', err));

// =====================================================================
// JWT Authentication Middleware (NEW)
// This middleware will protect routes by verifying the JWT
// =====================================================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Check if Authorization header exists and starts with 'Bearer '
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        // If no token, access is denied (401 Unauthorized)
        return res.status(401).json({ message: 'No authentication token, authorization denied' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // If token is invalid or expired (403 Forbidden)
            return res.status(403).json({ message: 'Token is not valid' });
        }
        // If token is valid, attach user payload to the request object
        req.user = user;
        next(); // Proceed to the next middleware/route handler
    });
};

// =====================================================================
// Routes
// =====================================================================

// User Authentication Routes
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const newUser = new User({ username, password }); // In a real app, hash the password!
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!' });

    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ message: 'Server error during signup' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // In a real app, you'd compare hashed passwords: await bcrypt.compare(password, user.password)
        if (password !== user.password) {
            return res.status(400).json({ message: 'Invalid credentials' }); // Changed from 440 to 400 for standard HTTP codes
        }

        // NEW: Generate JWT upon successful login
        const payload = {
            id: user._id,
            username: user.username
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour

        res.status(200).json({
            message: 'Login successful!',
            user: {
                id: user._id,
                username: user.username
            },
            token // Send the token to the frontend
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// NEW: Add a route to verify the token and get user data (useful on refresh)
app.get('/api/auth/verify', authenticateToken, async (req, res) => {
    try {
        // If the middleware passes, req.user contains the decoded token payload
        const user = await User.findById(req.user.id).select('-password'); // Fetch user without password
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({
            message: 'Token is valid',
            user: {
                id: user._id,
                username: user.username
            }
        });
    } catch (err) {
        console.error('Verify token error:', err);
        res.status(500).json({ message: 'Server error during token verification' });
    }
});

// Apply authentication middleware to protected routes (e.g., fetching courses, quizzes)
// For now, let's protect fetching courses and quizzes to demonstrate
// You might choose to protect only certain routes or all, based on your app's needs.
app.use('/api/courses', authenticateToken, courseRoutes);
app.use('/api/quizzes', authenticateToken, quizRoutes);


// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`); // Changed log to use actual PORT
});
