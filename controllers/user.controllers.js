const bcrypt = require('bcrypt');
const jsonWebToken = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const saltRounds = 10;

// Import user model once globally at the top
const User = require('../models/user.models'); 

// Dedicated Mail Configuration Engine
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Upgrades connection to SSL/TLS automatically
    pool: true,   // Keeps connections open so sending emails doesn't lag the server
    auth: {
        user: process.env.ADMIN_EMAIL || 'israeloye2019@gmail.com',
        // CRITICAL: This MUST be a 16-character Google App Password (e.g., "abcd efgh ijkl mnop")
        pass: process.env.ADMIN_EMAIL_PASSWORD || 'zuegcnabukvzyziz' 
    }
});

// Auto-Verify SMTP Handshake on Startup
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ CRITICAL: Mail Server configuration is broken:", error.message);
    } else {
        console.log("🚀 SUCCESS: Mail Server connected and authenticated cleanly!");
    }
});

// ==========================================
// 1. STANDARD USER WELCOME EMAIL TEMPLATE
// ==========================================
const sendUserWelcomeEmail = async (email, firstName, lastName) => {
    const mailOptions = {
        from: `"eCrown Tech" <${process.env.ADMIN_EMAIL || 'israeloye2019@gmail.com'}>`,
        to: email,
        subject: '🚀 Welcome to eCrown Tech!',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                @media screen and (max-width: 600px) { .wrapper { width: 100% !important; } }
            </style>
        </head>
        <body>
            <table width="100%" bgcolor="#f8fafc" cellspacing="0" cellpadding="0" style="padding: 40px 0;">
                <tr>
                    <td align="center">
                        <table class="wrapper" width="550" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                            <tr>
                                <td bgcolor="#0F172A" style="padding: 35px; text-align: center; border-bottom: 4px solid #F59E0B;">
                                    <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800;">eCrown <span style="color: #F59E0B;">Tech</span></h2>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 45px;">
                                    <h1 style="margin: 0 0 20px 0; color: #0F172A; font-size: 22px; font-weight: 700;">Welcome to the Crew! 🚀</h1>
                                    <p style="color: #334155; font-size: 16px; font-weight: 600;">Hi ${firstName} ${lastName},</p>
                                    <p style="color: #475569; font-size: 15px; line-height: 1.6;">Thank you for signing up for our application. We are absolutely thrilled to have you on board with eCrown Tech! Your secure profile has been successfully generated.</p>
                                    <table cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                                        <tr>
                                            <td bgcolor="#0F172A" style="border-radius: 8px;"><a href="http://localhost:5174/dashboard" target="_blank" style="display: inline-block; padding: 14px 28px; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none;">Go to Dashboard</a></td>
                                        </tr>
                                    </table>
                                    <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 25px 0;">
                                    <p style="margin: 0; color: #64748B; font-size: 13px;">Best regards,<br><strong>The eCrown Tech Team</strong></p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>`
    };

    return transporter.sendMail(mailOptions);
};

// ==========================================
// 2. EXCLUSIVE ADMIN WELCOME EMAIL TEMPLATE
// ==========================================
const sendAdminWelcomeEmail = async (email, firstName, lastName) => {
    const mailOptions = {
        from: `"eCrown Admin Network" <${process.env.ADMIN_EMAIL || 'israeloye2019@gmail.com'}>`,
        to: email,
        subject: '🛡️ eCrown Security Clearance: Admin Workspace Provisioned',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { margin: 0; padding: 0; background-color: #0c0a09; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                @media screen and (max-width: 600px) { .wrapper { width: 100% !important; } }
            </style>
        </head>
        <body>
            <table width="100%" bgcolor="#0c0a09" cellspacing="0" cellpadding="0" style="padding: 40px 0;">
                <tr>
                    <td align="center">
                        <table class="wrapper" width="550" cellspacing="0" cellpadding="0" style="background-color: #1c1917; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #2e2a24;">
                            <tr>
                                <td bgcolor="#3b0764" style="padding: 40px; text-align: center; border-bottom: 4px solid #eab308;">
                                    <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 1px;">
                                        👑 eCROWN <span style="color: #eab308;">ADMIN SYSTEM</span>
                                    </h2>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 45px;">
                                    <h1 style="margin: 0 0 20px 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
                                        Admin Console Access Initialized 🛠️
                                    </h1>
                                    <p style="margin: 0 0 16px 0; color: #e7e5e4; font-size: 16px; font-weight: 600;">
                                        Attention: Administrator ${lastName},
                                    </p>
                                    <p style="margin: 0 0 24px 0; color: #a8a29e; font-size: 15px; line-height: 1.6;">
                                        An administrative credential profile matching your name (<strong>${firstName} ${lastName}</strong>) has been elevated to management tier parameters on our cluster network. 
                                    </p>
                                    <div style="background-color: #450a0a; border-left: 4px solid #ef4444; padding: 16px; margin: 25px 0; border-radius: 6px;">
                                        <p style="margin: 0; color: #fca5a5; font-size: 13px; font-weight: 500; line-height: 1.5;">
                                            <strong>SECURITY MANDATE:</strong> This account holds core data clearance keys, payment manifest maps, and directory controls. Do not share terminal screen operations or credential keys with unauthorized nodes.
                                        </p>
                                    </div>
                                    <table cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                                        <tr>
                                            <td bgcolor="#eab308" style="border-radius: 8px; text-align: center;">
                                                <a href="https://localhost:5174/admin/dashboard" target="_blank" style="display: inline-block; padding: 14px 32px; color: #000000; font-size: 14px; font-weight: 700; text-decoration: none; letter-spacing: 0.5px;">
                                                    Launch Command Dashboard
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                    <hr style="border: none; border-top: 1px solid #2e2a24; margin: 30px 0;">
                                    <table width="100%" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td>
                                                <p style="margin: 0 0 4px 0; color: #78716c; font-size: 12px; font-style: italic;">Automated Deployment Authentication,</p>
                                                <p style="margin: 0; color: #e7e5e4; font-size: 14px; font-weight: 700;">The eCrown System Infrastructure Hub</p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>`
    };

    return transporter.sendMail(mailOptions);
};

// ==========================================
// 3. SIGN-IN NOTIFICATION EMAIL TEMPLATE
// ==========================================
const sendSigninNotificationEmail = async (email, firstName, lastName, role = 'user') => {
    const isAdmin = role.toLowerCase() === 'admin';
    const mailOptions = {
        from: `"eCrown System" <${process.env.ADMIN_EMAIL || 'israeloye2019@gmail.com'}>`,
        to: email,
        subject: isAdmin ? '🚨 Admin Signed In Successfully' : 'Successful Sign-In Notification',
        html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: ${isAdmin ? '#4A154B' : '#1f2937'};">${isAdmin ? 'Admin Sign-In Security Alert' : 'Hello ' + firstName}!</h2>
            <p>Your eCrown account profile signed in successfully.</p>
            <p><strong>Account Access:</strong> ${email}</p>
            <p><strong>System Role Assigned:</strong> ${role.toUpperCase()}</p>
            <p style="color: #ef4444; font-size: 13px; margin-top: 20px;">If this connection authorization was not executed by you, secure your credentials immediately.</p>
        </div>`
    };

    return transporter.sendMail(mailOptions);
};

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