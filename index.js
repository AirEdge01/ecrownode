const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');

// Run configuration BEFORE reading process.env values
dotenv.config();

const app = express();
const PORT = process.env.PORT || 2000; 
const MongoDB_URI = process.env.MongoDB_URI; 

const { payment } = require('./paystack');

// ==========================================
// NODEMAILER CORE CONFIGURATION ENGINE
// ==========================================
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  pool: true,
  auth: {
    user: process.env.ADMIN_EMAIL || 'israeloye2019@gmail.com',
    pass: process.env.ADMIN_EMAIL_PASSWORD || 'zuegcnabukvzyziz' 
  }
});

// Auto-Verify Connection Handling Engine on Bootstrap
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Global Mail System Error:", error.message);
  } else {
    console.log("🚀 Global Mail System authenticated cleanly via index.js");
  }
});

// Mail Utilities & Templates for Users/Admins
const emailTemplates = {
  sendUserWelcome: async (email, firstName, lastName) => {
    return transporter.sendMail({
      from: `"eCrown Tech" <${process.env.ADMIN_EMAIL || 'israeloye2019@gmail.com'}>`,
      to: email,
      subject: '🚀 Welcome to eCrown Tech!',
      html: `<h3>Welcome ${firstName} ${lastName}!</h3><p>Thank you for signing up for our application.</p>`
    });
  },
  sendAdminWelcome: async (email, firstName, lastName) => {
    return transporter.sendMail({
      from: `"eCrown Admin Network" <${process.env.ADMIN_EMAIL || 'israeloye2019@gmail.com'}>`,
      to: email,
      subject: '🛡️ eCrown Security Clearance: Admin Workspace Provisioned',
      html: `<h3>Admin Console Access Initialized</h3><p>Attention Administrator ${lastName}, your credentials have been elevated.</p>`
    });
  },
  sendSigninNotification: async (email, firstName, lastName, role = 'user') => {
    const isAdmin = role.toLowerCase() === 'admin';
    return transporter.sendMail({
      from: `"eCrown System" <${process.env.ADMIN_EMAIL || 'israeloye2019@gmail.com'}>`,
      to: email,
      subject: isAdmin ? '🚨 Admin Signed In Successfully' : 'Successful Sign-In Notification',
      html: `<div><h2>Hello ${firstName}!</h2><p>Your account profile signed in successfully.</p></div>`
    });
  },
  sendAdminOrderAlert: async (orderData) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'israeloye2019@gmail.com';
    const itemsListHTML = orderData.items.map(item => 
      `<li><strong>${item.name}</strong> (Qty: ${item.quantity}) - ₦${item.price.toLocaleString()}</li>`
    ).join('');
    return transporter.sendMail({
      from: `"eCrown System" <${adminEmail}>`,
      to: adminEmail,
      subject: `🚨 New Order Received! - Invoice #${orderData._id}`,
      html: `<h2>New Order Notification</h2><ul>${itemsListHTML}</ul>`
    });
  }
};

// Share transporter and email templates across controllers
module.exports = { transporter, emailTemplates };

// Import user routes AFTER exporting the modules to avoid circular dependencies
const userRoutes = require('./routes/users.routes');

// ==========================================
// MIDDLEWARE CONFIGURATION
// ==========================================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors({
    origin: [
      'https://e-crown-8duf.vercel.app',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// ==========================================
// MONGODB SCHEMAS & MODELS
// ==========================================
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  category: { type: String },
  stock: { type: Number, required: true, default: 10 }, 
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const orderSchema = new mongoose.Schema({
  email: { type: String, required: true, default: "israeloye2019@gmail.com" },
  userEmail: { type: String }, 
  items: [
    {
      productId: { type: String, required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }
    }
  ],
  totalAmount: { type: Number, required: true },
  reference: { type: String, default: null }, 
  status: { 
    type: String, 
    enum: ['Pending', 'Paid', 'Failed', 'Processing', 'Shipped', 'Delivered'], 
    default: 'Pending' 
  }
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// ==========================================
// API ENDPOINTS & ROUTES
// ==========================================
app.get('/', (req, res) => res.send('eCrown Engine operational API system running smoothly.'));
app.use('/user', userRoutes);

app.post('/pay', async (req, res, next) => {
    try { await payment(req, res, next); } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.json({ success: true, products });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.post('/api/orders', async (req, res) => {
  try {
    const incomingItems = req.body.items || req.body.orderItems;
    const customerEmail = req.body.email || req.body.userEmail || "customer@example.com";
    const totalAmount = req.body.totalAmount || req.body.totalPrice;
    const reference = req.body.paymentReference || req.body.reference || null;

    if (!incomingItems || !Array.isArray(incomingItems) || incomingItems.length === 0) {
      return res.status(400).json({ message: "Validation Failed: Checkout items array cannot be empty." });
    }

    const formattedItems = [];
    for (const item of incomingItems) {
      const targetId = item.productId || item.product || item._id;
      let product = mongoose.Types.ObjectId.isValid(targetId) ? await Product.findById(targetId) : null;
      
      if (product) {
        formattedItems.push({ productId: String(product._id), name: product.name, quantity: Number(item.quantity || 1), price: Number(product.price) });
      } else {
        formattedItems.push({ productId: String(targetId), name: item.name || 'Item', quantity: Number(item.quantity || 1), price: Number(item.price || 0) });
      }
    }

    const newOrder = new Order({ email: customerEmail, userEmail: customerEmail, items: formattedItems, totalAmount: Number(totalAmount), reference, status: reference ? 'Paid' : 'Pending' });
    const savedOrder = await newOrder.save();

    // Trigger Order Alert from the global templates
    emailTemplates.sendAdminOrderAlert(savedOrder).catch(err => console.error("Order Mail Error:", err.message));

    return res.status(201).json({ success: true, order: savedOrder });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

if (!MongoDB_URI) {
  console.error("❌ CRITICAL ERROR: process.env.MongoDB_URI is undefined!");
  process.exit(1);
}

mongoose.connect(MongoDB_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server active and running on port ${PORT}`));
  })
  .catch((err) => console.error("Mongoose Fatal Error:", err.message));