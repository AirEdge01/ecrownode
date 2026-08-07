const nodemailer = require('nodemailer');
require('dotenv').config();

const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
const smtpUser = String(process.env.SMTP_USER || process.env.ADMIN_EMAIL || '').trim();
const smtpPass = String(process.env.SMTP_PASS || process.env.ADMIN_EMAIL_PASSWORD || '').trim().replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    requireTLS: true,
    pool: true,
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    tls: {
        rejectUnauthorized: false
    }
});

const verifyTransport = async () => {
    if (!smtpUser || !smtpPass) {
        console.warn('⚠️ Mail not configured: ADMIN_EMAIL and ADMIN_EMAIL_PASSWORD are required.');
        return false;
    }

    try {
        await transporter.verify();
        console.log('🚀 Mail transporter verified successfully.');
        return true;
    } catch (error) {
        console.error('❌ Mail transporter verification failed:', error.message);
        return false;
    }
};

const sendMail = async (mailOptions) => {
    if (!smtpUser || !smtpPass) {
        throw new Error('Mail credentials are not configured.');
    }

    const normalizedMailOptions = {
        ...mailOptions,
        from: mailOptions.from || `"eCrown Tech" <${smtpUser}>`,
        replyTo: mailOptions.replyTo || smtpUser,
        headers: {
            ...(mailOptions.headers || {}),
            'X-Priority': '3',
            'X-MSMail-Priority': 'Normal'
        }
    };

    try {
        return await transporter.sendMail(normalizedMailOptions);
    } catch (error) {
        console.error('❌ Mail send failed:', error.message);
        throw error;
    }
};

const sendUserWelcomeEmail = async (email, firstName, lastName) => {
    const recipient = String(email || '').trim();
    if (!recipient) {
        throw new Error('Recipient email is required.');
    }

    const mailOptions = {
        from: `"eCrown Tech" <${smtpUser || 'no-reply@example.com'}>`,
        to: recipient,
        subject: '🚀 Welcome to eCrown Tech!',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 10px;">
        <h2 style="color: #111827;">Welcome to eCrown Tech!</h2>
        <p>Hi ${firstName || ''} ${lastName || ''},</p>
        <p>Thank you for signing up. Your account is ready and you can now sign in to access your dashboard.</p>
        <p>If you did not create this account, please contact support immediately.</p>
      </div>
    `
    };

    return sendMail(mailOptions);
};

const sendAdminWelcomeEmail = async (email, firstName, lastName) => {
    const recipient = String(email || '').trim();
    if (!recipient) {
        throw new Error('Recipient email is required.');
    }

    const mailOptions = {
        from: `"eCrown Admin" <${smtpUser || 'no-reply@example.com'}>`,
        to: recipient,
        subject: '🛡️ Admin account created',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 10px;">
        <h2 style="color: #7c2d12;">Admin account created</h2>
        <p>Hello ${firstName || ''} ${lastName || ''},</p>
        <p>Your admin account has been created successfully. Please use your credentials to sign in.</p>
      </div>
    `
    };

    return sendMail(mailOptions);
};

const sendSigninNotificationEmail = async (email, firstName, lastName, role = 'user') => {
    const recipient = String(email || '').trim();
    if (!recipient) {
        throw new Error('Recipient email is required.');
    }

    const mailOptions = {
        from: `"eCrown System" <${smtpUser || 'no-reply@example.com'}>`,
        to: recipient,
        subject: '🔐 New sign-in detected',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 10px;">
        <h2 style="color: #1f2937;">Hello ${firstName || ''} ${lastName || ''}</h2>
        <p>Your eCrown account was signed in successfully.</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Role:</strong> ${role}</p>
        <p>If this was not you, change your password immediately.</p>
      </div>
    `
    };

    return sendMail(mailOptions);
};

const sendAdminOrderAlert = async (orderData) => {
    const adminEmail = String(process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'your-admin-email@gmail.com').trim();
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
        <p>A customer placed a new order.</p>
        <p><strong>Customer:</strong> ${orderData.email}</p>
        <p><strong>Total Amount:</strong> ₦${Number(orderData.totalAmount || 0).toLocaleString()}</p>
        <ul>${itemsListHTML}</ul>
      </div>
    `
    };

    return sendMail(mailOptions);
};

verifyTransport();

module.exports = {
    sendUserWelcomeEmail,
    sendAdminWelcomeEmail,
    sendSigninNotificationEmail,
    sendAdminOrderAlert,
    verifyTransport
};