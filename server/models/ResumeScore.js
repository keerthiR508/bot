const mongoose = require('mongoose');

const resumeScoreSchema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: String, required: true, default: 'none' },
    resumeHash: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    matchedKeywords: { type: [String], default: [] },
    missingKeywords: { type: [String], default: [] },
    keywordMatch: { type: Number, default: 0 },
    skillsMatch: { type: Number, default: 0 },
    experienceRelevance: { type: Number, default: 0 },
    candidateName: { type: String, required: true },
    candidateEmail: { type: String, required: true },
    resumeFilePath: { type: String, required: true },
    suggestions: { type: [String], default: [] },
  },
  { timestamps: true }
);

resumeScoreSchema.index({ candidate: 1, company: 1, resumeHash: 1 }, { unique: true });

module.exports = mongoose.model('ResumeScore', resumeScoreSchema);
