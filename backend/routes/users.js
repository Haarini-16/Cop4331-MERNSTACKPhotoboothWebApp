const express = require('express');
const users = require('../controllers/usersController');
const photobooths = require('../controllers/photoboothsController');
const validateObjectId = require('../middleware/validateObjectId');
const { requireAuth, requireSelf } = require('../middleware/auth');

const router = express.Router();

// Runs before any route below that contains :userId
router.param('userId', validateObjectId);

// POST /api/users - Register a new user (open to everyone)
router.post('/', users.createUser);

// PUT /api/users/password - Change your own password
router.put('/password', requireAuth, users.changePassword);

// Everything below needs a logged-in user, and only their own account
// GET /api/users/:userId - Fetch one user
router.get('/:userId', requireAuth, requireSelf, users.getUser);

//strips go under the user like the cards in the tutorial
// GET  /api/users/:userId/photobooths - Get your strips
// POST /api/users/:userId/photobooths - Save a strip
router.get('/:userId/photobooths', requireAuth, requireSelf, photobooths.listPhotobooths);
router.post('/:userId/photobooths', requireAuth, requireSelf, photobooths.createPhotobooth);

module.exports = router;
