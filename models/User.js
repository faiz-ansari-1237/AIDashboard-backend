const mongoose = require('mongoose');

// Define the User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true } // Reminder: NOT HASHED as per current request!
}, { timestamps: true }); // Adds createdAt and updatedAt fields automatically

// Create and export the User model
module.exports = mongoose.model('User', userSchema);
