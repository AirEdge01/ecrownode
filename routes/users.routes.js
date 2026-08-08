const express = require('express');
const router = express.Router();

// Import controller handlers - names MUST match user.controllers.js exports exactly
const { 
    getSignup, 
    postSignup, 
    getSigningin, 
    postSigningin 
} = require('../controllers/user.controllers');

// ==========================================
// USER AUTHENTICATION ROUTES
// ==========================================

// Signup Routes
router.get('/signup', getSignup);
router.post('/signup', postSignup);

// Signin Routes
router.get('/signin', getSigningin);
router.post('/signin', postSigningin);

// Alias Routes (allows frontend to hit /login as well as /signin)
router.get('/login', getSigningin);
router.post('/login', postSigningin);

module.exports = router;