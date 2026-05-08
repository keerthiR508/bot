const express = require('express');
const router = express.Router();
const { getResults, updateCutoff, getRecruiterCompanies, getResumes } = require('../controllers/recruiterController');
const { protect, recruiter } = require('../middleware/authMiddleware');

router.get('/results', protect, recruiter, getResults);
router.put('/cutoff', protect, recruiter, updateCutoff);
router.get('/companies', protect, getRecruiterCompanies);
router.get('/resumes', protect, recruiter, getResumes);

module.exports = router;
