// const jwt = require('jsonwebtoken');

// const protectRoute = async (req, res, next) => {
//     try {
//         // 1. Get the token from the request header
//         const authHeader = req.headers.authorization;
        
//         // Check if the Authorization header exists and starts with 'Bearer '
//         if (!authHeader || !authHeader.startsWith('Bearer ')) {
//             return res.status(401).json({ 
//                 success: false, 
//                 message: 'Access Denied: No token provided or invalid format.' 
//             });
//         }

//         // 2. Extract the raw token string
//         const token = authHeader.split(' ')[1];

//         // 3. Verify the token using your secret key
//         const decodedPayload = jwt.verify(token, process.env.jsonSecretKey || 'default_fallback_secret_key');

//         // 4. Attach the decoded user information to the request object
//         req.user = decodedPayload;

//         // 5. Let the user pass through to the controller route!
//         next();

//     } catch (err) {
//         console.error("🛡️ Auth Middleware Blocked Request:", err.message);
//         return res.status(403).json({ 
//             success: false, 
//             message: 'Access Denied: Invalid or expired token.' 
//         });
//     }
// };

// module.exports = { protectRoute };