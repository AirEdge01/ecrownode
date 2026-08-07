// const express = require('express');
// const mongoose = require('mongoose');
// const dotenv = require('dotenv');
// const cors = require('cors');
// const multer = require('multer');
// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 2000;
// const MongoDB_URI = process.env.MongoDB_URI;

// const userRoutes = require('./routes/users.routes');
// const { payment } = require('./paystack');
// const { sendAdminOrderAlert } = require('./mailer');



// // ==========================================
// // 1. DATABASE SCHEMAS & MODELS
// // ==========================================

// const productSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   price: { type: Number, required: true },
//   description: { type: String },
//   category: { type: String },
//   stock: { type: Number, required: true, default: 10 },
// }, { timestamps: true });

// const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

// const orderSchema = new mongoose.Schema({
//   email: { type: String, required: true, default: "israeloye2019@gmail.com" },
//   userEmail: { type: String },
//   items: [
//     {
//       productId: { type: String, required: true },
//       name: { type: String, required: true },
//       quantity: { type: Number, required: true },
//       price: { type: Number, required: true }
//     }
//   ],
//   totalAmount: { type: Number, required: true },
//   reference: { type: String, default: null },
//   status: {
//     type: String,
//     enum: ['Pending', 'Paid', 'Failed', 'Processing', 'Shipped', 'Delivered'],
//     default: 'Pending'
//   }
// }, { timestamps: true });

// const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// // ==========================================
// // 2. MIDDLEWARE CONFIGURATION
// // ==========================================
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// app.use(cors({
//   origin: ['https://e-crown-8duf.vercel.app', 'https://localhost:5174'], // Added standard React port fallback
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//   credentials: true
// }));

// // ==========================================
// // 4. API ENDPOINTS & ROUTES
// // ==========================================

// app.get('/', (req, res) => res.send('eCrown Engine operational API system running smoothly.'));

// // Attach user authentication endpoints (Signup/Signin)
// app.use('/user', userRoutes);

// app.post('/pay', async (req, res, next) => {
//   try { await payment(req, res, next); } catch (error) { res.status(500).json({ error: error.message }); }
// });

// // Get all products
// app.get('/api/products', async (req, res) => {
//   try {
//     const products = await Product.find().sort({ createdAt: -1 });
//     return res.json({ success: true, products });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// });

// // Admin Route: Add product
// app.post('/api/admin/products', async (req, res) => {
//   try {
//     const { name, price, description, category, stock } = req.body;
//     const newProduct = new Product({ name, price: Number(price), description, category, stock: Number(stock) });
//     await newProduct.save();
//     return res.status(201).json({ success: true, message: "Product created successfully!", product: newProduct });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// });

// // Admin Route: Edit product
// app.put('/api/admin/products/:id', async (req, res) => {
//   try {
//     const { name, price, description, category, stock } = req.body;
//     const updatedProduct = await Product.findByIdAndUpdate(
//       req.params.id,
//       { name, price: Number(price), description, category, stock: Number(stock) },
//       { new: true }
//     );
//     return res.json({ success: true, message: "Product context mapping updated successfully!", product: updatedProduct });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// });

// // Customer Checkout Session Endpoint
// app.post('/api/orders', async (req, res) => {
//   try {
//     const incomingItems = req.body.items || req.body.orderItems;
//     const customerEmail = req.body.email || req.body.userEmail || "customer@example.com";
//     const totalAmount = req.body.totalAmount || req.body.totalPrice;
//     const reference = req.body.paymentReference || req.body.reference || null;

//     if (!incomingItems || !Array.isArray(incomingItems) || incomingItems.length === 0) {
//       return res.status(400).json({ message: "Validation Failed: Checkout items array cannot be empty." });
//     }

//     const formattedItems = [];

//     // Verify Stock Levels dynamically
//     for (const item of incomingItems) {
//       const targetId = item.productId || item.product || item._id;

//       let product = null;
//       if (mongoose.Types.ObjectId.isValid(targetId)) {
//         product = await Product.findById(targetId);
//       }

//       if (product) {
//         if (product.stock <= 0) {
//           return res.status(400).json({
//             success: false,
//             outOfStock: true,
//             productId: product._id,
//             message: `The item "${product.name}" is currently OUT OF STOCK!`
//           });
//         }

//         if (product.stock < item.quantity) {
//           return res.status(400).json({
//             message: `Insufficient inventory stock. Only ${product.stock} units left for "${product.name}".`
//           });
//         }

//         formattedItems.push({
//           productId: String(product._id),
//           name: product.name,
//           quantity: Number(item.quantity || item.qty || 1),
//           price: Number(product.price)
//         });
//       } else {
//         // Fallback for hardcoded mock elements
//         formattedItems.push({
//           productId: String(targetId),
//           name: item.name || 'Unknown Hardware Item',
//           quantity: Number(item.quantity || item.qty || 1),
//           price: Number(item.price || 0)
//         });
//       }
//     }

//     const newOrder = new Order({
//       email: customerEmail,
//       userEmail: customerEmail,
//       items: formattedItems,
//       totalAmount: Number(totalAmount),
//       reference: reference,
//       status: reference ? 'Paid' : 'Pending'
//     });

//     const savedOrder = await newOrder.save();

//     // Only deduct stock counts for real database items
//     for (const item of formattedItems) {
//       if (mongoose.Types.ObjectId.isValid(item.productId)) {
//         const existingProduct = await Product.findById(item.productId);
//         if (existingProduct) {
//           await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
//         }
//       }
//     }

//     // Fire Email Notification safely backgrounded
//     sendAdminOrderAlert(savedOrder).catch(err => console.error("Non-blocking background mail error:", err));

//     return res.status(201).json({
//       success: true,
//       message: "Order verified and saved successfully!",
//       order: savedOrder,
//       orderId: savedOrder._id
//     });

//   } catch (error) {
//     console.error("❌ CRITICAL ORDER HANDLER EXCEPTION:", error);
//     return res.status(500).json({ message: "Server error, could not save order.", databaseError: error.message });
//   }
// });

// // Admin Panel Order Routes
// app.get('/api/admin/orders', async (req, res) => {
//   try {
//     const orders = await Order.find().sort({ createdAt: -1 });
//     const normalizedOrders = orders.map(order => ({
//       _id: order._id,
//       userEmail: order.userEmail || order.email || "customer@example.com",
//       totalAmount: order.totalAmount,
//       reference: order.reference || "N/A",
//       status: order.status,
//       createdAt: order.createdAt
//     }));
//     return res.json({ success: true, orders: normalizedOrders });
//   } catch (error) { return res.status(500).json({ error: error.message }); }
// });

// app.put('/api/admin/orders/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;
//     const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });
//     return res.json({ success: true, order: updatedOrder });
//   } catch (error) { return res.status(500).json({ error: error.message }); }
// });

// // ==========================================
// // 5. SERVER CONNECTIVITY ENGINE
// // ==========================================
// if (!MongoDB_URI) {
//   console.error("❌ CRITICAL ERROR: process.env.MongoDB_URI is undefined! Check your .env file.");
//   process.exit(1);
// }

// mongoose.connect(MongoDB_URI)
//   .then(() => {
//     console.log("Connected to MongoDB cluster database successfully.");
//     app.listen(PORT, () => {
//       console.log(`🚀 Server active and running on port ${PORT}`);
//     });
//   })
//   .catch((err) => console.error("Mongoose Fatal Error:", err.message));



const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 2000;
const MongoDB_URI = process.env.MongoDB_URI;

const userRoutes = require('./routes/users.routes');
const { payment } = require('./paystack');

// ==========================================
// 1. NODEMAILER TRANSPORTER & EMAIL HELPERS
// ==========================================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "israeloye2019@gmail.com",
    pass: process.env.GOOGLE_APP_PASSWORD, // 16-character Google App Password
  },
});

// Helper: Send Welcome Email after Signup
const sendSignupEmail = async (userEmail, userName = "Valued Customer") => {
  const mailOptions = {
    from: '"Aare Israel" <israeloye2019@gmail.com>',
    to: userEmail,
    subject: "🚀 Welcome to eCrown Tech!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #111827;">Welcome to eCrown, ${userName}! 🎉</h2>
        <p>Thank you for creating an account with us. Your registration was successful.</p>
        <p>You can now log in, explore our product catalog, and place orders directly online.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280;">If you did not register for this account, please ignore this email.</p>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

// Helper: Send Security Notification after Sign-in / Login
const sendLoginEmail = async (userEmail, userName = "Customer") => {
  const timeStamp = new Date().toLocaleString();
  const mailOptions = {
    from: '"Aare Israel" <israeloye2019@gmail.com>',
    to: userEmail,
    subject: "🔐 Security Alert: Account Sign-in Detected",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #1f2937;">Hello ${userName},</h2>
        <p>Your eCrown account was just accessed successfully.</p>
        <ul>
          <li><strong>Email:</strong> ${userEmail}</li>
          <li><strong>Time:</strong> ${timeStamp}</li>
        </ul>
        <p>If this was you, no further action is needed.</p>
        <p style="color: #dc2626; font-weight: bold;">If you did not log in, please update your password immediately.</p>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

// Helper: Send Admin & Customer Order Alert
const sendAdminOrderAlert = async (order) => {
  const mailOptions = {
    from: '"Aare Israel" <israeloye2019@gmail.com>',
    to: `israeloye2019@gmail.com, ${order.email || order.userEmail}`,
    subject: `📦 Order Confirmation - #${order._id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #10b981;">Order Confirmed!</h2>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Total Amount:</strong> ₦${order.totalAmount}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <h3>Ordered Items:</h3>
        <ul>
          ${order.items.map(item => `<li>${item.name} x ${item.quantity} - ₦${item.price}</li>`).join('')}
        </ul>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

// Export mail helpers so external router modules can use them if needed
module.exports = { transporter, sendSignupEmail, sendLoginEmail, sendAdminOrderAlert };


// ==========================================
// 2. DATABASE SCHEMAS & MODELS
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
// 3. MIDDLEWARE CONFIGURATION
// ==========================================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors({
  origin: ['https://e-crown-8duf.vercel.app', 'http://localhost:5174', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

// ==========================================
// 4. API ENDPOINTS & ROUTES
// ==========================================

app.get('/', (req, res) => res.send('eCrown Engine operational API system running smoothly.'));

// Attach user authentication sub-routes
app.use('/user', userRoutes);

// Signup Endpoint: Dispatches Welcome Email
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    // Trigger non-blocking Welcome Email
    sendSignupEmail(email, name).catch(err => console.error("Signup email error:", err.message));

    return res.status(201).json({
      success: true,
      message: "User registered successfully! Confirmation email sent to " + email
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Login / Signin Endpoint: Dispatches Security Notification Email
app.post(['/api/login', '/api/signin'], async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    // Trigger non-blocking Security Login Email
    sendLoginEmail(email).catch(err => console.error("Login email error:", err.message));

    return res.status(200).json({
      success: true,
      message: "Login successful! Security alert sent to " + email
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

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

    // Deduct inventory counts
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

// Direct test mail endpoint
app.get('/sendmail', async (req, res) => {
  try {
    const info = await transporter.sendMail({
      from: '"Aare Israel" <israeloye2019@gmail.com>',
      to: "israeloye2019@gmail.com",
      subject: "Test Mail ✔",
      text: "Nodemailer integration working cleanly.",
      html: "<b>Nodemailer integration working cleanly.</b>",
    });

    return res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
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