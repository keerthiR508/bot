const express = require('express');
const router = express.Router();
const { handleChatMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.post('/message', protect, handleChatMessage);

module.exports = router;
