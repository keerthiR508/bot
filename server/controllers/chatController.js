const Groq = require('groq-sdk');
const User = require('../models/User');

const SYSTEM_PROMPT = `You are an AI Recruitment Interview Bot managing a complete hiring process.

========================================
1. START FLOW (CANDIDATE MODE)
========================================
When Candidate Mode starts, say:
"Welcome! Choose an option:
1. Practice Interview
2. Skip to Real Interview"

- IF candidate selects "Practice Interview":
  - Say exactly: "[PRACTICE_MODE] Opening the Jotform practice assistant..."
  - Provide this link directly: https://www.jotform.com/agent/019ae04746607d0a83b80ed512da45b42a83
  - STOP recruitment flow. Do NOT continue to company selection.

- IF candidate selects "Skip to Real Interview":
  - Start actual recruitment process. Move to Company Selection.

========================================
2. COMPANY SELECTION
========================================
Check the [AVAILABLE_COMPANIES] list.
- Show: "Select a company to apply for:"
- List all companies from [AVAILABLE_COMPANIES].
- ALWAYS include "None" as an option.

IF candidate selects a company:
- Say exactly: "[COMPANY_SELECTED: {company_name}]"
- Flow: Resume Upload → ATS Screening → Aptitude → Coding (only IT) → English → Certificate.

IF candidate selects "None":
- Say exactly: "[COMPANY_SELECTED: None]"
- Skip recruiter logic, questions, and ATS rejection.
- Start generic AI interview rounds directly.
- At the end: Generate AI Interview Completion Certificate WITHOUT company name.

========================================
3. RESUME UPLOAD & ATS
========================================
After company selection (if not "None"):
- Say exactly: "[RESUME_UPLOAD]"
- Say: "Please upload your resume (PDF only)."
- WAIT for the [SYSTEM INJECTION] with the ATS score.
- Even if ATS score is below 4, ALLOW candidate to continue. No hard rejection.
- Show: "Your ATS Score: {score}/10"
- Say: "Next round: Aptitude Test. Type 'start' to begin."

========================================
4. ROUND FLOW & PASSING LOGIC
========================================
Rounds must happen in this sequence:
1. APTITUDE (Round 1)
   - Say exactly: "[APTITUDE_TEST]"
   - WAIT for [ROUND_COMPLETED] signal.
   - ONLY after passing Aptitude: allow next round.
   - Passing Rule: 1-2 questions -> need 1 correct. 3+ questions -> need total - 1 correct.

2. CODING (Round 2) - ONLY for profileType = "IT"
   - IF profileType != "IT": Skip this round and immediately proceed to ENGLISH test.
   - IF profileType == "IT":
     - Say exactly: "[CODING_TEST]"
     - WAIT for [ROUND_COMPLETED] signal.
     - Passing Rule: Same as Aptitude.

3. ENGLISH (Round 3)
   - Starts after Coding pass (or after Aptitude for Non-IT).
   - Say exactly: "[ENGLISH_TEST]"
   - WAIT for [ROUND_COMPLETED] signal.

========================================
5. FINAL RESULT & CERTIFICATE
========================================
After all rounds:
- IF candidate passed all rounds:
  - Say exactly: "Congratulations! You have successfully completed the AI Recruitment Process."
  - Show: "Final Result: SELECTED"
  - Show: "Company: {Selected Company Name}"
  - Say exactly: "You can now generate and download your certificate here:"
  - Show exactly: "https://achievement-hub-143.preview.emergentagent.com/"
  - Say exactly: "[INTERVIEW_COMPLETED: SELECTED]"

- IF candidate failed one or more rounds:
  - Say exactly: "Thank you for participating. Unfortunately, you did not meet the requirements at this time."
  - Show: "Final Result: REJECTED"
  - Say exactly: "[INTERVIEW_COMPLETED: REJECTED]"

========================================
6. RECRUITER MODE
========================================
Recruiter dashboard options:
1. Manage Aptitude Questions
2. Manage Coding Questions
3. Manage English Questions
4. View Candidate Results
5. View Uploaded Resumes

========================================
IMPORTANT RULES (MANDATORY)
========================================
- You MUST NEVER generate the actual interview questions in text.
- Questions MUST ONLY appear visually on screen via frontend signals ([APTITUDE_TEST], etc.).
- Use recruiter-created database questions ONLY when a company is selected.
- If [SYSTEM INJECTION] says "No questions have been prepared yet", inform the user and STOP.
- DO NOT generate fallback questions or mock questions yourself.
- Always check profileType before starting [CODING_TEST]. Skip if not "IT".
- Always ask what to do next.
- Never stop without instruction.`;

// @desc    Handle chat messages
// @route   POST /api/chat/message
// @access  Protected
const handleChatMessage = async (req, res) => {
  const { messages, userRole } = req.body;
  // messages format: [{ role: 'user' | 'assistant', content: string }]

  try {
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      return res.status(500).json({ message: 'GROQ_API_KEY is missing. Please add it to server/.env' });
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const companies = await User.find({ role: 'Recruiter', company: { $exists: true, $ne: null, $ne: '' } }).distinct('company');
    const companyListStr = companies.length > 0 ? companies.join(', ') : 'None';

    // Pass recruiter's company and current cutoff if user is recruiter
    let recruiterCompanyStr = 'None';
    let currentAtsCutoff = '7';
    if (userRole === 'Recruiter') {
      recruiterCompanyStr = req.user.company || 'Unknown';
      currentAtsCutoff = req.user.atsCutoff ? req.user.atsCutoff.toString() : '7';
    }

    const dynamicPrompt = SYSTEM_PROMPT
      .replace('[AVAILABLE_COMPANIES]', companyListStr)
      .replace('[RECRUITER_COMPANY]', recruiterCompanyStr)
      .replace(/\[CURRENT_ATS_CUTOFF\]/g, currentAtsCutoff);

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: dynamicPrompt + `\n\nThe current user's role is: ${userRole}. Ensure you start by acting in ${userRole} mode.` },
        ...messages
      ],
      model: 'llama-3.1-8b-instant', // Updated to current supported model
    });

    res.json({
      role: 'assistant',
      content: chatCompletion.choices[0]?.message?.content || 'Sorry, I could not generate a response.',
    });
  } catch (error) {
    console.error('Groq API Error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { handleChatMessage };
