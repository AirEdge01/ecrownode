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

// Email Template A: Admin Order System Alert
const sendAdminOrderAlert = async (orderData) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'israeloye2019@gmail.com';
  
  const itemsListHTML = orderData.items.map(item => 
    `<li><strong>${item.name}</strong> (Qty: ${item.quantity}) - ₦${item.price.toLocaleString()}</li>`
  ).join('');

  const mailOptions = {
    from: `"eCrown Operations" <${adminEmail}>`,
    to: adminEmail,
    subject: `🚨 New Order Received! - Invoice #${orderData._id}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #eab308; padding-bottom: 10px;">New Order System Manifest</h2>
        <p>An order profile transaction payload has passed network authorization verification:</p>
        <hr style="border:0; border-top: 1px solid #f1f5f9;"/>
        <p><strong>Customer Target Account:</strong> ${orderData.email}</p>
        <p><strong>Transaction Ref Key:</strong> ${orderData.reference || 'N/A'}</p>
        <p><strong>Total Funds Captured:</strong> ₦${orderData.totalAmount.toLocaleString()}</p>
        <h3 style="color: #0f172a; margin-top: 20px;">Ordered Items Manifest:</h3>
        <ul style="background-color: #f8fafc; padding: 15px; border-radius: 6px; list-style-type: none;">${itemsListHTML}</ul>
        <hr style="border:0; border-top: 1px solid #f1f5f9;"/>
        <p style="font-size: 12px; color: #64748b;">Process updates inside your admin cluster network directory to refresh client console interfaces.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

// Email Template B: Client Facing Invoice Document Update
const sendCustomerOrderInvoice = async (orderData) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'israeloye2019@gmail.com';
  
  const itemsListHTML = orderData.items.map(item => 
    `<tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 10px 0; color: #334155;">${item.name}</td>
      <td style="padding: 10px 0; text-align: center; color: #64748b;">${item.quantity}</td>
      <td style="padding: 10px 0; text-align: right; color: #334155;">₦${item.price.toLocaleString()}</td>
    </tr>`
  ).join('');

  const mailOptions = {
    from: `"eCrown Tech Support" <${adminEmail}>`,
    to: orderData.email,
    subject: `🛍️ Order Confirmed! - Invoice #${orderData._id}`,
    html: `
      <div style="font-family: sans-serif; padding: 25px; color: #334155; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0f172a; margin-top:0;">Thank You for Your Purchase! 🎉</h2>
        <p>Hi there, your order has been securely registered and processed by our system parameters.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Invoice Reference ID:</strong> #${orderData._id}</p>
          <p style="margin: 4px 0;"><strong>Payment Status Parameter:</strong> <span style="color: green; font-weight: bold;">${orderData.status}</span></p>
        </div>
        <table width="100%" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
          <thead>
            <tr style="border-bottom: 2px solid #cbd5e1; text-align: left; font-size: 14px; color: #0f172a;">
              <th style="padding-bottom: 8px;">Item Description</th>
              <th style="padding-bottom: 8px; text-align: center;">Qty</th>
              <th style="padding-bottom: 8px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsListHTML}
          </tbody>
        </table>
        <div style="text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; color: #0f172a;">
          Total Charged: ₦${orderData.totalAmount.toLocaleString()}
        </div>
        <hr style="border:0; border-top: 1px solid #e2e8f0; margin: 25px 0;"/>
        <p style="font-size: 13px; color: #64748b; text-align: center; margin: 0;">If you have any installation questions, reach out to terminal routing units at any time.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
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

    // 🔥 THE FIX: Fully awaiting dual notifications so they compile cleanly before returning a response
    try {
      await Promise.all([
        sendAdminOrderAlert(savedOrder),
        sendCustomerOrderInvoice(savedOrder)
      ]);
      console.log("✉️ Dual Transaction Manifest Mailings completely finalized across targets.");
    } catch (mailError) {
      // Caught inside isolation so mailing structural problems won't break client screen processing
      console.error("❌ Checkout Mail System Failure Execution Exception:", mailError.message);
    }

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