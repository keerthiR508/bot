const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
  type: { type: String, enum: ['aptitude', 'coding', 'english'], required: true },
  company: { type: String, required: true },
}, { timestamps: true });

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;
