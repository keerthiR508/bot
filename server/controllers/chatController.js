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
  - Say exactly: "[START_REAL_INTERVIEW]"
  - Inform them that the UI on the right will now guide them through the process.
  - STOP chatbot flow. The UI will handle resume upload, company selection, and tests.

========================================
2. UI-DRIVEN RECRUITMENT FLOW
========================================
Once the candidate skips to real interview, the dashboard UI takes over:
1. RESUME UPLOAD: Candidate uploads PDF and gets ATS score.
2. COMPANY SELECTION: Candidate selects a registered company (or "None").
3. SEQUENTIAL TESTS: Aptitude → Coding (IT only) → English.
4. AUTOMATIC TRANSITION: The system moves to the next round if passed.
5. IMMEDIATE STOP: If a candidate fails any round, the system shows "Unfortunately, you are failed."

========================================
3. FINAL MESSAGES
========================================
The UI will display the final result:
- Pass All: "Congratulations! You are selected."
- Fail Any: "Unfortunately, you are failed."

========================================
4. RECRUITER MODE
========================================
IMPORTANT: If the user role is "Recruiter" and this is the start of the chat (empty message history), you MUST start with:
"Welcome to Recruiter Mode! I can help you manage and generate assessment questions.

Choose a difficulty level to generate questions:
- Easy Questions
- Medium Questions
- Hard Questions

For these categories:
- Aptitude MCQs
- Coding MCQs
- English MCQs"

When the recruiter asks to generate questions (e.g., "Generate 10 easy aptitude MCQs"), you MUST provide them in this exact structure for EACH question:
1. Question: [Text]
2. Options: [A) text, B) text, C) text, D) text]
3. Correct Answer: [The exact matching text from the options]
4. Short Explanation: [Brief logic/explanation]

Example prompts you MUST handle:
- "Generate 10 easy aptitude MCQs"
- "Generate 5 medium Java coding questions"
- "Generate 3 hard English grammar MCQs"

========================================
IMPORTANT RULES (MANDATORY)
========================================
- After sending [START_REAL_INTERVIEW], do NOT continue the conversation.
- Let the candidate interact with the UI panels.
- In CANDIDATE MODE: Do NOT generate interview questions yourself (the system handles it).
- In RECRUITER MODE: You ARE allowed and encouraged to generate questions as requested.
- Always check profileType before starting rounds. Skip Coding if not "IT".
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
