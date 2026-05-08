const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadResume, submitAnswers } = require('../controllers/candidateController');
const { protect } = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
      return;
    }
    cb(new Error('Only PDF files are allowed'));
  },
});

router.post('/resume-upload', protect, upload.single('resume'), uploadResume);
// router.get('/resume-status', protect, getResumeStatus);
router.post('/submit-answers', protect, submitAnswers);

module.exports = router;
