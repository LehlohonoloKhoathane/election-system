// Import required libraries
const axios = require('axios');
const firebase = require('firebase/app');
require('firebase/auth');
const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase (ensure this is in your firebase.js config)
admin.initializeApp({
  credential: admin.credential.cert(require('../config/firebase-key.json')),
});

// Function to verify if the email is valid (using external API)
async function verifyEmail(email) {
    const apiKey = 'YOUR_MAILCHECK_API_KEY';
    const response = await axios.get(`https://api.mailcheck.ai/email/${email}?key=${apiKey}`);
    return response.data.valid;
}

// Controller to register a new voter
async function registerVoter(req, res) {
    const { id, email } = req.body;

    // Step 1: Check if the email is valid
    const isValid = await verifyEmail(email);
    if (!isValid) {
        return res.status(400).send("Invalid email");
    }

    // Step 2: Create new voter instance and save
    const Voter = require('../models/Voter');
    const voter = new Voter(id, email);
    await voter.save();

    // Step 3: Send success response
    res.status(201).send("Voter registered successfully");
}

module.exports = { registerVoter };

// Controller to register a new user (Firebase Authentication)
exports.signup = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userRecord = await getAuth().createUser({ email, password });
        res.status(201).json({ message: 'User registered successfully', userId: userRecord.uid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Controller to log in a user (Firebase Authentication)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Use Firebase Auth client SDK for sign-in
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        res.status(200).json({ message: 'User logged in successfully', userId: userCredential.user.uid });
    } catch (error) {
        res.status(401).json({ error: 'Invalid credentials' });
    }
};
