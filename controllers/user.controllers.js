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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const extractNameParts = (body = {}) => {
    const rawFirstName = String(body.firstName || body.firstname || body.first_name || body.fname || body.name || body.fullName || body.fullname || '').trim();
    const rawLastName = String(body.lastName || body.lastname || body.last_name || body.lname || body.surname || '').trim();

    if (rawFirstName && rawLastName) {
        return { firstName: rawFirstName, lastName: rawLastName };
    }

    if (rawFirstName) {
        const parts = rawFirstName.split(/\s+/);
        return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' };
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
        const normalizedEmail = email.toLowerCase();

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const assignedRole = getAssignedRole(req.body);

        const newUser = new User({
            firstName,
            lastName,
            email: normalizedEmail,
            password: hashedPassword,
            role: assignedRole
        });

        const savedUser = await newUser.save();
        console.log(`[Success] Account written to database with clearance: ${savedUser.role}`);

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
        console.error("❌ SIGNUP CONTROLLER CRASH:", err.message);
        return res.status(500).json({ success: false, message: "Database tracking failure: " + err.message });
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

