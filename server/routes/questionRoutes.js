const express = require('express');
const router = express.Router();
const { getQuestions, createQuestion, deleteQuestion } = require('../controllers/questionController');
const { protect, recruiter } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getQuestions)
  .post(protect, recruiter, createQuestion);

router.route('/:id')
  .delete(protect, recruiter, deleteQuestion);

module.exports = router;
