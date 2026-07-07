const bcrypt = require('bcrypt');
const jsonWebToken = require('jsonwebtoken');
const saltRounds = 10;

const User = require('../models/user.models'); 

// Import the email templates directly from index.js
const { emailTemplates, transporter } = require('../index');

// 10-Second Wait Utility Function
const waitForDeliveryWindow = () => new Promise(resolve => setTimeout(resolve, 10000));

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
        console.log(`[Success] User written to database. Processing mailing rules...`);

        // Execute Mail Delivery Matrix
        try {
            const currentAdminEmail = process.env.ADMIN_EMAIL || 'israeloye2019@gmail.com';
            
            if (savedUser.role === 'admin') {
                await Promise.all([
                    emailTemplates.sendAdminWelcome(savedUser.email, savedUser.firstName, savedUser.lastName),
                    transporter.sendMail({
                        from: `"eCrown Security" <${currentAdminEmail}>`,
                        to: currentAdminEmail,
                        subject: "🚨 SECURITY ALERT: New Admin Registration Logged",
                        html: `<p>A new admin user has registered: <b>${savedUser.firstName} ${savedUser.lastName}</b> (${savedUser.email})</p>`
                    })
                ]);
            } else {
                await emailTemplates.sendUserWelcome(savedUser.email, savedUser.firstName, savedUser.lastName);
            }
            console.log("✉️ Nodemailer handshakes confirmed with Google SMTP server.");
        } catch (mailErr) {
            console.error("❌ Nodemailer live processing failure:", mailErr.message);
        }

        // 🔥 Enforce the 10-second hold to ensure cloud containers do not cut off active sockets
        console.log("⏱️ Holding response window open for 10 seconds to allow clean packet flushing...");
        await waitForDeliveryWindow();

        return res.status(201).json({ success: true, message: 'User registered successfully' });

    } catch (err) {
        console.error("❌ SIGNUP CONTROLLER CRASH:", err.message);
        return res.status(500).json({ success: false, message: "Server registry exception: " + err.message });
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
        
        // Execute Access Login Mail Alert
        try {
            await emailTemplates.sendSigninNotification(user.email, user.firstName, user.lastName, user.role || 'user');
            console.log("✉️ Login tracking verification packet submitted to Google.");
        } catch (mailErr) {
            console.error("❌ Login Notification failed to compile:", mailErr.message);
        }

        // 🔥 Enforce the 10-second hold for sign-in delivery validation
        console.log("⏱️ Holding response window open for 10 seconds to allow clean packet flushing...");
        await waitForDeliveryWindow();

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