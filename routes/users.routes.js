const express = require('express');
const multer = require('multer');
const path = require('path');
const { getSignUp, getSignIn, postSignUp, postSignIn } = require('../controllers/user.controllers');

const router = express.Router();

// ==========================================
// 📦 MULTER CONFIGURATION (Safe Storage)
// ==========================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Saves inside your newly created folder
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// ==========================================
// 🔐 AUTHENTICATION ROUTES
// ==========================================
router.get('/signup', getSignUp);
router.post('/signup', postSignUp);
router.get('/signin', getSignIn);
router.post('/signin', postSignIn);

// ==========================================
// 🔨 FIXED ADMIN PRODUCT INGESTION ROUTE
// ==========================================
// CRITICAL: Path is '/admin/products' if your index.js uses app.use('/api', userRoutes)
router.post('/admin/products', upload.single('image'), async (req, res) => {
    try {
        // Log to your terminal window to visually inspect incoming payloads
        console.log("=== INCOMING DATA ===");
        console.log("Parsed req.body text:", req.body);
        console.log("Parsed req.file metadata:", req.file);

        // 1. Double check if body exists
        if (!req.body) {
            return res.status(400).json({ success: false, message: "Form body parsing failed entirely." });
        }

        // 2. Safely destructure now that Multer has unpacked the multipart boundary fields
        const { name, price, description, category, countInStock } = req.body;
        
        if (!name) {
            return res.status(400).json({ success: false, message: "Missing required 'name' field property." });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Hardware image file binary data is missing.' });
        }

        // Clean file system slash directions for cross-browser web addresses
        const imagePath = req.file.path.replace(/\\/g, '/'); 

        // If you haven't linked your Mongoose model back yet, we return a structural success response:
        return res.status(201).json({ 
            success: true, 
            message: "🎉 Success! Multer intercepted form and saved asset image.",
            productData: {
                name,
                price: Number(price),
                description,
                category,
                countInStock: Number(countInStock || 10),
                image: imagePath
            }
        });

    } catch (error) {
        console.error("❌ Route handling runtime exception:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;