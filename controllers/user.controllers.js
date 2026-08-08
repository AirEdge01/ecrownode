const bcrypt = require('bcrypt');
const jsonWebToken = require('jsonwebtoken');
const saltRounds = 10;

const User = require('../models/user.models');
const {
    sendUserWelcomeEmail,
    sendAdminWelcomeEmail,
    sendSigninNotificationEmail
} = require('../mailer');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

// Accepts whatever field names the frontend actually sends
const extractNameParts = (body = {}) => {
    const rawFirstName = String(
        body.firstName || body.firstname || body.first_name || body.fname ||
        body.name || body.fullName || body.fullname || ''
    ).trim();
    const rawLastName = String(
        body.lastName || body.lastname || body.last_name || body.lname || body.surname || ''
    ).trim();

    if (rawFirstName && rawLastName) {
        return { firstName: rawFirstName, lastName: rawLastName };
    }

    if (rawFirstName) {
        const parts = rawFirstName.split(/\s+/);
        return {
            firstName: parts[0] || '',
            // Fallback so lastName is never empty if only a full name was sent
            lastName: parts.slice(1).join(' ') || parts[0] || ''
        };
    }

    return { firstName: '', lastName: '' };
};

const getAssignedRole = (body = {}) => {
    const role = body.role || body.userRole || body.user_role || '';
    return role && String(role).toLowerCase() === 'admin' ? 'admin' : 'user';
};

// ==========================================
// CONTROLLER ROUTE INTERFACES
// ==========================================

const getSignUp = (req, res) => {
    res.render('signUp', { title: 'Sign Up' });
};

const postSignUp = async (req, res) => {
    try {
        const { firstName, lastName } = extractNameParts(req.body);
        const email = normalizeEmail(req.body.email || req.body.userEmail || req.body.emailAddress || '');
        const password = String(req.body.password || '');

        // Validate BEFORE hitting the database, with a clear reason for each failure
        if (!firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'First name and last name are required',
                received: req.body // TEMP: helps you see exactly what the frontend sent — remove once confirmed working
            });
        }

        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const assignedRole = getAssignedRole(req.body);

        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: assignedRole
        });

        let savedUser;
        try {
            savedUser = await newUser.save();
        } catch (dbErr) {
            // Handle Mongoose validation errors and duplicate-key races explicitly
            if (dbErr.code === 11000) {
                return res.status(400).json({ success: false, message: 'Email already exists' });
            }
            if (dbErr.name === 'ValidationError') {
                const details = Object.values(dbErr.errors).map(e => e.message).join('; ');
                console.error("❌ VALIDATION ERROR:", details);
                return res.status(400).json({ success: false, message: details });
            }
            throw dbErr; // anything else falls through to the outer catch
        }

        console.log(`[Success] Account written to database with clearance: ${savedUser.role}`);

        // Email failures never block the signup response
        try {
            if (savedUser.role === 'admin') {
                await sendAdminWelcomeEmail(savedUser.email, savedUser.firstName, savedUser.lastName);
                console.log('✉️ Admin welcome email sent successfully.');
            } else {
                await sendUserWelcomeEmail(savedUser.email, savedUser.firstName, savedUser.lastName);
                console.log('✉️ Welcome email sent successfully.');
            }
        } catch (mailError) {
            console.error('❌ Welcome email failure:', mailError.message);
        }

        return res.status(201).json({ success: true, message: 'User registered successfully' });

    } catch (err) {
        console.error("❌ SIGNUP CONTROLLER CRASH:", err); // full error object, not just .message
        return res.status(500).json({
            success: false,
            message: "Server error during signup: " + err.message
        });
    }
};

const getSignIn = (req, res) => {
    res.render('signIn', { title: 'Sign In' });
};

const postSignIn = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email || req.body.userEmail || req.body.emailAddress || '');
        const password = String(req.body.password || '');

        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
        }

        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required' });
        }

        const user = await User.findOne({ email });
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

        try {
            await sendSigninNotificationEmail(user.email, user.firstName, user.lastName, user.role || 'user');
            console.log('✉️ Sign-in notification email sent successfully.');
        } catch (mailError) {
            console.error('❌ Sign-in email failure:', mailError.message);
        }

        return res.status(200).json({ success: true, message: 'User logged in successfully', token });

    } catch (err) {
        console.error('❌ LOGIN CONTROLLER CRASH:', err);
        return res.status(500).json({ success: false, message: 'Server error during login: ' + err.message });
    }
};

module.exports = {
    postSignUp,
    getSignUp,
    postSignIn,
    getSignIn
};