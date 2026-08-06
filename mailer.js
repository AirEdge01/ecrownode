const nodemailer = require('nodemailer');
require('dotenv').config();

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT || 587);
// secure is TRUE only for port 465, FALSE for 587 (which uses STARTTLS)
const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : smtpPort === 465;
const smtpUser = process.env.ADMIN_EMAIL;
const smtpPass = process.env.ADMIN_EMAIL_PASSWORD;

// Create Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: smtpHost.includes('gmail') ? 'gmail' : undefined,
    host: !smtpHost.includes('gmail') ? smtpHost : undefined,
    port: smtpPort,
    secure: smtpSecure,
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000,
    tls: {
        rejectUnauthorized: false
    }
});

// Verify connection configuration
const verifyTransport = async () => {
    if (!smtpUser || !smtpPass) {
        console.warn('⚠️ Mail not configured: ADMIN_EMAIL and ADMIN_EMAIL_PASSWORD environment variables are missing.');
        return false;
    }

    try {
        await transporter.verify();
        console.log('🚀 Mail transporter verified and ready to send emails.');
        return true;
    } catch (error) {
        console.error('❌ Mail transporter verification failed:', error.message);
        return false;
    }
};

// Generic mail sender helper
const sendMail = async (mailOptions) => {
    if (!smtpUser || !smtpPass) {
        console.warn('⚠️ Attempted to send email without valid credentials configured.');
        return null;
    }

    return transporter.sendMail(mailOptions);
};

// ==========================================
// EMAIL TEMPLATES & DISPATCHERS
// ==========================================

// 1. User Welcome Email (handles single name string OR firstName + lastName)
const sendUserWelcomeEmail = async (email, firstName = '', lastName = '') => {
    const displayName = typeof firstName === 'string' && !lastName 
        ? firstName 
        : `${firstName} ${lastName}`.trim() || 'Valued Customer';

    const mailOptions = {
        from: `"eCrown Tech" <${smtpUser}>`,
        to: email,
        subject: '🚀 Welcome to eCrown Tech!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 10px; color: #333;">
                <h2 style="color: #111827;">Welcome to eCrown Tech, ${displayName}! 👋</h2>
                <p>Thank you for signing up. Your account is ready and you can now sign in to explore our store and place orders.</p>
                <p>If you did not create this account, please contact our support team immediately.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #6b7280;">This is an automated operational email from eCrown Store.</p>
            </div>
        `
    };

    return sendMail(mailOptions);
};

// 2. Admin Account Welcome Email
const sendAdminWelcomeEmail = async (email, firstName = '', lastName = '') => {
    const displayName = `${firstName} ${lastName}`.trim() || 'Admin';

    const mailOptions = {
        from: `"eCrown Security" <${smtpUser}>`,
        to: email,
        subject: '🛡️ Admin Account Created',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 10px; color: #333;">
                <h2 style="color: #7c2d12;">Admin Access Granted</h2>
                <p>Hello ${displayName},</p>
                <p>Your administrative account has been created successfully. You now have permission to manage catalog items and view customer orders.</p>
            </div>
        `
    };

    return sendMail(mailOptions);
};

// 3. User Sign-in / Login Security Notification Email
const sendSigninNotificationEmail = async (email, firstName = '', lastName = '', role = 'user') => {
    const displayName = typeof firstName === 'string' && !lastName 
        ? firstName 
        : `${firstName} ${lastName}`.trim() || 'Customer';

    const timeStamp = new Date().toLocaleString();

    const mailOptions = {
        from: `"eCrown Security" <${smtpUser}>`,
        to: email,
        subject: '🔐 Security Alert: New sign-in detected',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 10px; color: #333;">
                <h2 style="color: #1f2937;">Hello ${displayName},</h2>
                <p>We recorded a successful sign-in to your eCrown account.</p>
                <ul style="line-height: 1.8;">
                    <li><strong>Account Email:</strong> ${email}</li>
                    <li><strong>Account Role:</strong> ${role}</li>
                    <li><strong>Time:</strong> ${timeStamp}</li>
                </ul>
                <p style="color: #4b5563;">If this was you, no action is required.</p>
                <p style="color: #dc2626; font-weight: bold;">If you did not authorize this login, please reset your password immediately.</p>
            </div>
        `
    };

    return sendMail(mailOptions);
};

// 4. Admin Order Alert Notification Email
const sendAdminOrderAlert = async (orderData) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;

    const itemsListHTML = (orderData.items || []).map(item =>
        `<li><strong>${item.name}</strong> (Qty: ${item.quantity}) - ₦${Number(item.price || 0).toLocaleString()}</li>`
    ).join('');

    const mailOptions = {
        from: `"eCrown System" <${adminEmail}>`,
        to: adminEmail,
        subject: `🚨 New Order Received! - Invoice #${orderData._id}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2>New Order Notification</h2>
                <p>A customer placed a new order package.</p>
                <p><strong>Customer:</strong> ${orderData.email || orderData.userEmail}</p>
                <p><strong>Total Amount:</strong> ₦${Number(orderData.totalAmount || 0).toLocaleString()}</p>
                <h3>Ordered Items:</h3>
                <ul>${itemsListHTML}</ul>
            </div>
        `
    };

    return sendMail(mailOptions);
};

// Verify transporter on server startup
verifyTransport();

module.exports = {
    sendUserWelcomeEmail,
    sendAdminWelcomeEmail,
    sendSigninNotificationEmail,
    sendAdminOrderAlert,
    verifyTransport,
    
    // Aliases to ensure backward compatibility with other route naming conventions
    sendWelcomeEmail: sendUserWelcomeEmail,
    sendLoginAlertEmail: sendSigninNotificationEmail
};