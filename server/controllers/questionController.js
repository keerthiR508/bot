const Question = require('../models/Question');

// @desc    Get all questions (optional filter by type)
// @route   GET /api/questions
// @access  Public / Protected
const getQuestions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type.toLowerCase();
    
    // Filter by company (always lowercase for consistency)
    if (req.query.company) {
      filter.company = req.query.company.toLowerCase();
    } else if (req.user && req.user.role === 'Recruiter') {
      filter.company = (req.user.company || 'None').toLowerCase();
    } else {
      filter.company = 'none';
    }

    // Only return questions that have a company field
    filter.company = { $exists: true, $ne: null, $eq: filter.company };

    let limit = 0;
    if (filter.type === 'aptitude') limit = 30;
    if (filter.type === 'coding' || filter.type === 'english') limit = 20;

    let query = Question.find(filter);
    if (limit > 0 && req.query.random === 'true') {
        // Simple random sampling (in production use aggregation $sample)
        query = Question.aggregate([
            { $match: filter },
            { $sample: { size: limit } }
        ]);
    }

    const questions = await query;
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new question
// @route   POST /api/questions
// @access  Protected (Recruiter)
const createQuestion = async (req, res) => {
  const { text, options, correctAnswer, type } = req.body;

  try {
    const question = new Question({
      text,
      options,
      correctAnswer,
      type: type.toLowerCase(),
      company: (req.user.company || 'None').toLowerCase(),
    });
    const createdQuestion = await question.save();
    res.status(201).json(createdQuestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a question
// @route   DELETE /api/questions/:id
// @access  Protected (Recruiter)
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (question) {
      await question.deleteOne();
      res.json({ message: 'Question removed' });
    } else {
      res.status(404).json({ message: 'Question not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getQuestions, createQuestion, deleteQuestion };
