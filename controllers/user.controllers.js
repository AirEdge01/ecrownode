const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jsonWebToken = require('jsonwebtoken');

// Model import
const User = require('../models/user.models'); 

const saltRounds = 10;

// Reusable Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || 'israeloye2019@gmail.com',
        pass: process.env.GOOGLE_APP_PASSWORD || process.env.GMAIL_PASS || 'zuegcnabukvzyziz'
    }
});

const getSignup = (req, res) => {
    res.render('signup', { title: 'Sign Up' });
};

// ==========================================
// 1. SIGNUP CONTROLLER (Sends Welcome Email)
// ==========================================
const postSignup = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(String(password), saltRounds);

        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
        });

        const savedUser = await newUser.save();

        // Dispatch Welcome Email
        const mailOptions = {
            from: '"AirEdge Mobile Bank" <israeloye2019@gmail.com>',
            to: email,
            subject: '🚀 Welcome to AirEdge Mobile BankApp!',
            html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h1 style="color: #4CAF50;">Welcome to AirEdge, ${firstName}!</h1>
                <p>Thank you for signing up for our application. We are thrilled to have you on board!</p>
                <p>If you have any questions, feel free to reply directly to this email.</p>
                <br />
                <p>Best regards,</p>
                <p><strong>The AirEdge Support Team</strong></p>
            </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.error('❌ Welcome email error:', error.message);
            else console.log('✉️ Welcome email sent:', info.response);
        });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully! Welcome email sent.',
            user: { id: savedUser._id, firstName, lastName, email }
        });

    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getSigningin = (req, res) => {
    res.render('signin', { title: 'Sign In' });
};

// ==========================================
// 2. SIGNIN CONTROLLER (Sends Security Alert Email)
// ==========================================
const postSigningin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        const match = await bcrypt.compare(String(password), user.password);
        if (!match) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        const secretKey = process.env.jsonSecretKey || 'defaultSecretKey';
        const token = jsonWebToken.sign(
            { id: user._id, email: user.email }, 
            secretKey, 
            { expiresIn: '1h' }
        );

        // Dispatch Sign-in Alert Email
        const mailOptions = {
            from: '"AirEdge Mobile Bank" <israeloye2019@gmail.com>',
            to: user.email,
            subject: '🔐 Security Alert: Account Sign-In Detected',
            html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #1f2937;">Hello ${user.firstName || 'User'},</h2>
                <p>A successful sign-in to your AirEdge account was detected.</p>
                <ul>
                    <li><strong>Account Email:</strong> ${user.email}</li>
                    <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
                </ul>
                <p>If this was you, no action is needed.</p>
                <p style="color: #dc2626; font-weight: bold;">If you did not log in, please reset your password immediately.</p>
            </div>
            `
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) console.error("❌ Sign-in alert error:", err.message);
            else console.log("✉️ Sign-in alert email sent:", info.response);
        });

        return res.status(200).json({
            success: true,
            message: 'User logged in successfully! Security alert email sent.',
            token
        });

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });  
    }
};

module.exports = { postSignup, getSignup, postSigningin, getSigningin };