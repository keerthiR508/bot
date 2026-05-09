const Result = require('../models/Result');
const User = require('../models/User');
const ResumeScore = require('../models/ResumeScore');

// @desc    Get all candidate results
// @route   GET /api/recruiter/results
// @access  Protected (Recruiter)
const getResults = async (req, res) => {
  try {
    const companyFilter = req.user.company ? { company: req.user.company.toLowerCase() } : { company: 'none' };
    const results = await Result.find(companyFilter)
      .populate('candidate', 'name email profileType')
      .sort({ createdAt: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update ATS cutoff score
// @route   PUT /api/recruiter/cutoff
// @access  Protected (Recruiter)
const updateCutoff = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.atsCutoff = req.body.cutoff;
      await user.save();
      res.json({ message: 'ATS Cutoff updated successfully', cutoff: user.atsCutoff });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get registered recruiter companies
// @route   GET /api/recruiter/companies
// @access  Protected
const getRecruiterCompanies = async (req, res) => {
  try {
    const companies = await User.distinct('company', {
      role: 'Recruiter',
      company: { $exists: true, $ne: null, $ne: '' },
    });
    const normalizedCompanies = companies
      .map((name) => String(name).trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    res.json(normalizedCompanies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all candidate resumes for recruiter company
// @route   GET /api/recruiter/resumes
// @access  Protected (Recruiter)
const getResumes = async (req, res) => {
  try {
    const company = req.user.company;
    if (!company) {
      return res.status(400).json({ message: 'Recruiter company not set' });
    }
    const resumes = await ResumeScore.find({ company: company.toLowerCase() })
      .sort({ createdAt: -1 });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getResults, updateCutoff, getRecruiterCompanies, getResumes };
