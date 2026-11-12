const express = require('express');
const photobooths = require('../controllers/photoboothsController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

//have to be logged in for all of these
router.use(requireAuth);

// DELETE /api/photobooths/:id - Delete a strip
router.delete('/:id', photobooths.deletePhotobooth);

// POST /api/photobooths/:id/email - Email a strip to yourself
router.post('/:id/email', photobooths.emailPhotobooth);

module.exports = router;
