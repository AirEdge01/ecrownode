// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const { getSignUp, getSignIn, postSignUp, postSignIn } = require('../controllers/user.controllers');

// const router = express.Router();

// // ==========================================
// // 📦 MULTER CONFIGURATION (Safe Storage)
// // ==========================================
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'uploads/'); // Saves inside your newly created folder
//     },
//     filename: function (req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         cb(null, uniqueSuffix + path.extname(file.originalname));
//     }
// });

// const upload = multer({ storage: storage });

// // ==========================================
// // 🔐 AUTHENTICATION ROUTES
// // ==========================================
// router.get('/signup', getSignUp);
// router.post('/signup', postSignUp);
// router.get('/signin', getSignIn);
// router.post('/signin', postSignIn);

// // ==========================================
// // 🔨 FIXED ADMIN PRODUCT INGESTION ROUTE
// // ==========================================
// // CRITICAL: Path is '/admin/products' if your index.js uses app.use('/api', userRoutes)
// router.post('/admin/products', upload.single('image'), async (req, res) => {
//     try {
//         // Log to your terminal window to visually inspect incoming payloads
//         console.log("=== INCOMING DATA ===");
//         console.log("Parsed req.body text:", req.body);
//         console.log("Parsed req.file metadata:", req.file);

//         // 1. Double check if body exists
//         if (!req.body) {
//             return res.status(400).json({ success: false, message: "Form body parsing failed entirely." });
//         }

//         // 2. Safely destructure now that Multer has unpacked the multipart boundary fields
//         const { name, price, description, category, countInStock } = req.body;
        
//         if (!name) {
//             return res.status(400).json({ success: false, message: "Missing required 'name' field property." });
//         }

//         if (!req.file) {
//             return res.status(400).json({ success: false, message: 'Hardware image file binary data is missing.' });
//         }

//         // Clean file system slash directions for cross-browser web addresses
//         const imagePath = req.file.path.replace(/\\/g, '/'); 

//         // If you haven't linked your Mongoose model back yet, we return a structural success response:
//         return res.status(201).json({ 
//             success: true, 
//             message: "🎉 Success! Multer intercepted form and saved asset image.",
//             productData: {
//                 name,
//                 price: Number(price),
//                 description,
//                 category,
//                 countInStock: Number(countInStock || 10),
//                 image: imagePath
//             }
//         });

//     } catch (error) {
//         console.error("❌ Route handling runtime exception:", error);
//         return res.status(500).json({ success: false, error: error.message });
//     }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { sendWelcomeEmail, sendSigninEmail } = require('../mailer');

const userSchema = new mongoose.Schema({
  name:     { type: String, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// POST /user/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({ name: name || '', email, password: hashedPassword });
    await newUser.save();

    sendWelcomeEmail(email).catch(err =>
      console.error('Background welcome email error:', err.message)
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! A welcome email has been sent to you.',
      user: { id: newUser._id, name: newUser.name, email: newUser.email }
    });

  } catch (error) {
    console.error('❌ Signup error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during signup.', error: error.message });
  }
});

// POST /user/signin
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    sendSigninEmail(user.email).catch(err =>
      console.error('Background signin email error:', err.message)
    );

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully! A login alert has been sent to your email.',
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (error) {
    console.error('❌ Signin error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during signin.', error: error.message });
  }
});

module.exports = router;