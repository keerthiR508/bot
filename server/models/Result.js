const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String, required: true, default: 'None' },
  roundName: { type: String, required: true }, // 'Aptitude', 'Coding', 'English'
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  status: { type: String, enum: ['Pass', 'Fail'], required: true },
  reason: { type: String }, // e.g., 'Cheating / Tab Switching Detected'
}, { timestamps: true });

const Result = mongoose.model('Result', resultSchema);
module.exports = Result;
