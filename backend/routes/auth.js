const express = require('express');
const auth = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/login - Verify credentials
// Logging in is an action rather than a resource, so this is the one
// deliberate, conventional exception to noun-only REST URLs.
router.post('/login', auth.login);
router.get('/verify', auth.verify);
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);
module.exports = router;
