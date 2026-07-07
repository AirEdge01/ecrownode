const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASSWORD
  }
});

const sendWelcomeEmail = async (userEmail) => {
  const mailOptions = {
    from: `"eCrown Store" <${process.env.ADMIN_EMAIL}>`,
    to: userEmail,
    subject: '🎉 Welcome to eCrown — Your Account is Ready!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 30px; color: #333; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1a1a2e;">Welcome to eCrown! 🛍️</h2>
        <p>Hi there,</p>
        <p>Your account has been created successfully. You can now browse our products, place orders, and track your deliveries.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p><strong>Account Email:</strong> ${userEmail}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p>If you did not create this account, please contact us immediately.</p>
        <p style="font-size: 12px; color: #999; margin-top: 30px;">— The eCrown Team</p>
      </div>
    `
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️ Welcome email sent to ${userEmail}`);
  } catch (err) {
    console.error('❌ Failed to send welcome email:', err.message);
  }
};

const sendSigninEmail = async (userEmail) => {
  const now = new Date().toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'full',
    timeStyle: 'short'
  });
  const mailOptions = {
    from: `"eCrown Security" <${process.env.ADMIN_EMAIL}>`,
    to: userEmail,
    subject: '🔐 New Sign-In to Your eCrown Account',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 30px; color: #333; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1a1a2e;">New Login Detected 🔐</h2>
        <p>Hi,</p>
        <p>We noticed a new sign-in to your eCrown account.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p><strong>Account:</strong> ${userEmail}</p>
        <p><strong>Time:</strong> ${now}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p>If this was you, no action is needed. If you did <strong>not</strong> sign in, please reset your password immediately.</p>
        <p style="font-size: 12px; color: #999; margin-top: 30px;">— The eCrown Security Team</p>
      </div>
    `
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️ Sign-in alert sent to ${userEmail}`);
  } catch (err) {
    console.error('❌ Failed to send sign-in alert:', err.message);
  }
};

const sendAdminOrderAlert = async (orderData) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'your-admin-email@gmail.com';
  const itemsListHTML = orderData.items.map(item =>
    `<li><strong>${item.name}</strong> (Qty: ${item.quantity}) - ₦${item.price.toLocaleString()}</li>`
  ).join('');
  const mailOptions = {
    from: `"eCrown System" <${adminEmail}>`,
    to: adminEmail,
    subject: `🚨 New Order Received! - Invoice #${orderData._id}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>New Order Notification</h2>
        <p>A client has submitted an order. Details below:</p>
        <hr/>
        <p><strong>Customer Account:</strong> ${orderData.email}</p>
        <p><strong>Total Amount:</strong> ₦${orderData.totalAmount.toLocaleString()}</p>
        <h3>Order Items:</h3>
        <ul>${itemsListHTML}</ul>
        <hr/>
        <p style="font-size: 12px; color: #777;">Update the order status in your admin panel to notify the customer.</p>
      </div>
    `
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log('✉️ Admin order alert sent successfully.');
  } catch (err) {
    console.error('❌ Admin alert email failed:', err.message);
  }
};

module.exports = { sendWelcomeEmail, sendSigninEmail, sendAdminOrderAlert };