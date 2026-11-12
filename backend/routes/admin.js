const express = require('express');
const admin = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

//only admins can use these
router.use(requireAuth, requireAdmin);

// GET  /api/admin/users - Get all users
// POST /api/admin/users - Create a new admin
router.get('/users', admin.listUsers);
router.post('/users', admin.createAdmin);

// PUT /api/admin/users/:userId/status   - Enable or disable an account
// PUT /api/admin/users/:userId/password - Change someone's password
router.put('/users/:userId/status', admin.setStatus);
router.put('/users/:userId/password', admin.setPassword);

module.exports = router;
