const bcrypt = require('bcrypt');
const jsonWebToken = require('jsonwebtoken');
const saltRounds = 10;

// Import user model once globally at the top
const User = require('../models/user.models');
const {
    sendUserWelcomeEmail,
    sendAdminWelcomeEmail,
    sendSigninNotificationEmail
} = require('../mailer');

// ==========================================
// CONTROLLER ROUTE INTERFACES
// ==========================================

const getSignUp = (req, res) => {
    res.render('signup', { title: 'Sign Up' });
};

const postSignUp = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;
        const normalizedEmail = String(email).toLowerCase();

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(String(password), saltRounds);
        const assignedRole = (role && role.toLowerCase() === 'admin') ? 'admin' : 'user';

        const newUser = new User({
            firstName,
            lastName,
            email: normalizedEmail,
            password: hashedPassword,
            role: assignedRole
        });

        const savedUser = await newUser.save();
        console.log(`[Success] Account written to database with clearance: ${savedUser.role}`);

        // Fast Async background transmission process
        if (savedUser.role === 'admin') {
            sendAdminWelcomeEmail(savedUser.email, savedUser.firstName, savedUser.lastName)
                .then(info => console.log("✉️ Background Admin Email Sent:", info.response))
                .catch(err => console.error("❌ Background Admin Email Failure Trace:", err.message));
        } else {
            sendUserWelcomeEmail(savedUser.email, savedUser.firstName, savedUser.lastName)
                .then(info => console.log("✉️ Background User Email Sent:", info.response))
                .catch(err => console.error("❌ Background User Email Failure Trace:", err.message));
        }

        // Returns status 201 immediately so loading speeds remain fast
        return res.status(201).json({ success: true, message: 'User registered successfully' });

    } catch (err) {
        console.error("❌ SIGNUP CONTROLLER CRASH:", err.message);
        return res.status(500).json({ success: false, message: "Database tracking failure: " + err.message });
    }
};

const getSignIn = (req, res) => {
    res.render('signin', { title: 'Sign In' });
};

const postSignIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = String(email).toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        const token = jsonWebToken.sign(
            { id: user._id, email: user.email, role: user.role || 'user' },
            process.env.jsonSecretKey || 'default_fallback_secret_key',
            { expiresIn: '1h' }
        );

        // Fast Async background sign-in notification process
        sendSigninNotificationEmail(user.email, user.firstName, user.lastName, user.role || 'user')
            .then(info => console.log("✉️ Background Sign-In Alert Sent:", info.response))
            .catch(err => console.error("❌ Background Sign-In Email Failure Trace:", err.message));

        return res.status(200).json({ success: true, message: 'User logged in successfully', token });

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    postSignUp,
    getSignUp,
    postSignIn,
    getSignIn
};

