const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');

// 🔥 FIX 1: Run configuration BEFORE reading process.env values
dotenv.config();

const app = express();
const PORT = process.env.PORT || 2000; 
const MongoDB_URI = process.env.MongoDB_URI; 

const userRoutes = require('./routes/users.routes');
const { payment } = require('./paystack');

// ==========================================
// 1. DATABASE SCHEMAS & MODELS
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
// 2. NODEMAILER EMAIL CONFIGURATION
// ==========================================
// 🔥 FIX 2: Upgraded with strict SSL/TLS parameters and connection pooling
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
    console.error("❌ index.js Mail Configuration Error:", error.message);
  } else {
    console.log("🚀 index.js Order Mail System authenticated cleanly.");
  }
});

const sendAdminOrderAlert = async (orderData) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'israeloye2019@gmail.com';
  
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
        <p>A client has submitted an order manifest package details:</p>
        <hr/>
        <p><strong>Customer Account:</strong> ${orderData.email}</p>
        <p><strong>Total Cash Flow Captured:</strong> ₦${orderData.totalAmount.toLocaleString()}</p>
        <h3>Ordered Items Manifest:</h3>
        <ul>${itemsListHTML}</ul>
        <hr/>
        <p style="font-size: 12px; color: #777;">Process updates inside your admin panel matrix to notify client node screens.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✉️ Dispatch Alert Email cleanly sent to Admin terminal successfully.");
  } catch (err) {
    console.error("❌ Email System Failure Exception Engine Hook:", err.message);
  }
};

// ==========================================
// 3. MIDDLEWARE CONFIGURATION
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
// 4. API ENDPOINTS & ROUTES
// ==========================================

app.get('/', (req, res) => res.send('eCrown Engine operational API system running smoothly.'));

// Attach user authentication endpoints (Signup/Signin)
app.use('/user', userRoutes);

app.post('/pay', async (req, res, next) => {
    try { await payment(req, res, next); } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.json({ success: true, products });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Admin Route: Add product
app.post('/api/admin/products', async (req, res) => {
  try {
    const { name, price, description, category, stock } = req.body;
    const newProduct = new Product({ name, price: Number(price), description, category, stock: Number(stock) });
    await newProduct.save();
    return res.status(201).json({ success: true, message: "Product created successfully!", product: newProduct });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Admin Route: Edit product
app.put('/api/admin/products/:id', async (req, res) => {
  try {
    const { name, price, description, category, stock } = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price: Number(price), description, category, stock: Number(stock) },
      { new: true }
    );
    return res.json({ success: true, message: "Product context mapping updated successfully!", product: updatedProduct });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Customer Checkout Session Endpoint
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

    // Verify Stock Levels dynamically
    for (const item of incomingItems) {
      const targetId = item.productId || item.product || item._id;
      
      let product = null;
      if (mongoose.Types.ObjectId.isValid(targetId)) {
        product = await Product.findById(targetId);
      }
      
      if (product) {
        if (product.stock <= 0) {
          return res.status(400).json({ 
            success: false,
            outOfStock: true,
            productId: product._id,
            message: `The item "${product.name}" is currently OUT OF STOCK!` 
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient inventory stock. Only ${product.stock} units left for "${product.name}".`
          });
        }

        formattedItems.push({
          productId: String(product._id),
          name: product.name,
          quantity: Number(item.quantity || item.qty || 1),
          price: Number(product.price) 
        });
      } else {
        formattedItems.push({
          productId: String(targetId),
          name: item.name || 'Unknown Hardware Item',
          quantity: Number(item.quantity || item.qty || 1),
          price: Number(item.price || 0)
        });
      }
    }

    const newOrder = new Order({
      email: customerEmail,
      userEmail: customerEmail,
      items: formattedItems,
      totalAmount: Number(totalAmount),
      reference: reference,
      status: reference ? 'Paid' : 'Pending'
    });

    const savedOrder = await newOrder.save();

    for (const item of formattedItems) {
      if (mongoose.Types.ObjectId.isValid(item.productId)) {
        const existingProduct = await Product.findById(item.productId);
        if (existingProduct) {
          await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
        }
      }
    }

    // Fire Email Notification safely backgrounded
    sendAdminOrderAlert(savedOrder).catch(err => console.error("Non-blocking background mail error:", err));

    return res.status(201).json({
      success: true,
      message: "Order verified and saved successfully!",
      order: savedOrder,
      orderId: savedOrder._id
    });

  } catch (error) {
    console.error("❌ CRITICAL ORDER HANDLER EXCEPTION:", error);
    return res.status(500).json({ message: "Server error, could not save order.", databaseError: error.message });
  }
});

// Admin Panel Order Routes
app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        const normalizedOrders = orders.map(order => ({
            _id: order._id,
            userEmail: order.userEmail || order.email || "customer@example.com",
            totalAmount: order.totalAmount,
            reference: order.reference || "N/A",
            status: order.status,
            createdAt: order.createdAt
        }));
        return res.json({ success: true, orders: normalizedOrders });
    } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.put('/api/admin/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });
        return res.json({ success: true, order: updatedOrder });
    } catch (error) { return res.status(500).json({ error: error.message }); }
});

// ==========================================
// 5. SERVER CONNECTIVITY ENGINE
// ==========================================
if (!MongoDB_URI) {
  console.error("❌ CRITICAL ERROR: process.env.MongoDB_URI is undefined! Check your .env file.");
  process.exit(1);
}

mongoose.connect(MongoDB_URI)
  .then(() => {
    console.log("Connected to MongoDB cluster database successfully.");
    app.listen(PORT, () => {
      console.log(`🚀 Server active and running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("Mongoose Fatal Error:", err.message));