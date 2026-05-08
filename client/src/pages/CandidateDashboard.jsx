import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import ChatbotUI from '../components/ChatbotUI';

const DEFAULT_QUESTIONS = {
  Aptitude: [
    { _id: 'def_apt_1', text: '5 + 7 = ?', options: ['10', '12', '13', '15'], correctAnswer: '12', type: 'aptitude' },
    { _id: 'def_apt_2', text: 'What comes next: 2, 4, 6, 8?', options: ['9', '10', '12', '14'], correctAnswer: '10', type: 'aptitude' },
    { _id: 'def_apt_3', text: 'Which is the largest?', options: ['25', '15', '30', '20'], correctAnswer: '30', type: 'aptitude' },
    { _id: 'def_apt_4', text: 'If 1 dozen = ?', options: ['10', '12', '14', '16'], correctAnswer: '12', type: 'aptitude' },
    { _id: 'def_apt_5', text: '9 × 3 = ?', options: ['27', '18', '21', '24'], correctAnswer: '27', type: 'aptitude' }
  ],
  Coding: [
    { _id: 'def_cod_1', text: 'HTML stands for?', options: ['HyperText Markup Language', 'HighText Machine Language', 'HyperTool Multi Language', 'None'], correctAnswer: 'HyperText Markup Language', type: 'coding' },
    { _id: 'def_cod_2', text: 'CSS full form?', options: ['Cascading Style Sheets', 'Computer Style Syntax', 'Color Sheet Structure', 'Control Style System'], correctAnswer: 'Cascading Style Sheets', type: 'coding' },
    { _id: 'def_cod_3', text: 'Which language runs in browser?', options: ['Java', 'C++', 'JavaScript', 'Python'], correctAnswer: 'JavaScript', type: 'coding' },
    { _id: 'def_cod_4', text: 'Which symbol is used for comments in JavaScript?', options: ['#', '//', '/*', '<!--'], correctAnswer: '//', type: 'coding' },
    { _id: 'def_cod_5', text: 'What is React?', options: ['A backend framework', 'A database', 'A JavaScript library for UIs', 'An OS'], correctAnswer: 'A JavaScript library for UIs', type: 'coding' }
  ],
  English: [
    { _id: 'def_eng_1', text: 'Choose correct spelling:', options: ['Recieve', 'Receive', 'Receeve', 'Receve'], correctAnswer: 'Receive', type: 'english' },
    { _id: 'def_eng_2', text: 'Opposite of "Happy"?', options: ['Sad', 'Angry', 'Excited', 'Bored'], correctAnswer: 'Sad', type: 'english' },
    { _id: 'def_eng_3', text: 'Synonym of "Quick"?', options: ['Slow', 'Fast', 'Lazy', 'Heavy'], correctAnswer: 'Fast', type: 'english' },
    { _id: 'def_eng_4', text: 'Choose the correct sentence:', options: ['He go to school', 'He going to school', 'He goes to school', 'He gone to school'], correctAnswer: 'He goes to school', type: 'english' },
    { _id: 'def_eng_5', text: 'Fill in the blank: She ____ a book yesterday.', options: ['read', 'reads', 'reading', 'has read'], correctAnswer: 'read', type: 'english' }
  ]
};

const CandidateDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeAction, setActiveAction] = useState(null); // 'RESUME_UPLOAD', 'APTITUDE_TEST', 'CODING_TEST', 'ENGLISH_TEST', 'PRACTICE_INTERVIEW'
  const [selectedCompany, setSelectedCompany] = useState('None');
  const [companies, setCompanies] = useState([]);
  const [externalMessages, setExternalMessages] = useState([]);
  const [error, setError] = useState('');
  const [selectedResumeFile, setSelectedResumeFile] = useState(null);

  // Quiz state
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false);
  const [isProcessingResume, setIsProcessingResume] = useState(false);
  const [atsResult, setAtsResult] = useState(null);
  const [finalStatus, setFinalStatus] = useState('SELECTED'); // 'SELECTED' or 'REJECTED'

  useEffect(() => {
    const loadRecruiterCompanies = async () => {
      try {
        const { data } = await axios.get('/api/recruiter/companies', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setCompanies(data || []);
        if (data && data.length > 0) {
          setSelectedCompany(data[0]);
        } else {
          setSelectedCompany('None');
        }
      } catch (err) {
        setCompanies([]);
        setSelectedCompany('None');
      }
    };

    if (user?.token) {
      loadRecruiterCompanies();
    }
  }, [user?.token]);

  const handleBotInstruction = (instruction, data = null) => {
    if (instruction === 'COMPANY_SELECTED') {
      setSelectedCompany(data);
      console.log("Selected Company:", data);
      setActiveAction('RESUME_UPLOAD');
      return;
    }

    if (instruction === 'PRACTICE_MODE') {
      setActiveAction('PRACTICE_INTERVIEW');
      return;
    }

    if (instruction === 'INTERVIEW_COMPLETED') {
      const status = data || 'SELECTED';
      setFinalStatus(status);
      console.log("Interview completed. Status:", status);
      setActiveAction('INTERVIEW_COMPLETED');
      return;
    }

    if (instruction.includes('TEST')) {
      if (!selectedCompany) {
        setError('Please select a registered company first.');
        return;
      }
      if (instruction === 'CODING_TEST' && user?.profileType !== 'IT') {
        console.log("Skipping Coding Round: Candidate is Non-IT");
        pushExternalMessage("[SYSTEM INJECTION]: Candidate profile is Non-IT. Skip Coding Round and move directly to English Test.");
        setActiveAction(null);
        return;
      }
      setActiveAction(instruction);
      const type = instruction.split('_')[0];
      let queryType = 'Aptitude';
      if (type === 'CODING') queryType = 'Coding';
      if (type === 'ENGLISH') queryType = 'English';
      fetchQuestions(queryType);
      return;
    }
    setActiveAction(instruction);
  };

  const pushExternalMessage = (content) => {
    setExternalMessages(prev => [...prev, { id: Date.now().toString(), content }]);
  };

  const fetchQuestions = async (type) => {
    setIsFetchingQuestions(true);
    setQuestions([]);
    setCurrentQIndex(0);
    setAnswers([]);
    setError('');

    // REQUIRED LOG: Selected company
    console.log("Selected company:", selectedCompany);
    
    // IF candidate selects "None": use built-in default questions (Practice Mode)
    if (selectedCompany === 'None' || !selectedCompany) {
      const q = DEFAULT_QUESTIONS[type] || [];
      
      // REQUIRED LOGS: Fetched questions per round
      if (type === 'Aptitude') console.log("Fetched aptitude questions:", q);
      if (type === 'Coding') console.log("Fetched coding questions:", q);
      if (type === 'English') console.log("Fetched english questions:", q);
      
      setQuestions(q);
      setIsFetchingQuestions(false);
      return;
    }

    try {
      // IF candidate selects a registered company: fetch recruiter questions ONLY from MongoDB
      const { data } = await axios.get(`/api/questions?type=${type}&company=${selectedCompany}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      // REQUIRED LOGS: Fetched questions per round
      if (type === 'Aptitude') console.log("Fetched aptitude questions:", data);
      if (type === 'Coding') console.log("Fetched coding questions:", data);
      if (type === 'English') console.log("Fetched english questions:", data);

      if (!data || data.length === 0) {
        const errorMsg = "No questions have been prepared yet for this company.";
        setError(errorMsg);
        pushExternalMessage(`[SYSTEM INJECTION]: ${errorMsg}`);
        return;
      }

      setQuestions(data);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError('Failed to fetch questions from database.');
    } finally {
      setIsFetchingQuestions(false);
    }
  };

  const handleResumeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedResumeFile) {
      setError('Please select a resume file first.');
      return;
    }

    try {
      setIsProcessingResume(true);
      setAtsResult(null);
      setError('');
      
      const formData = new FormData();
      formData.append('resume', selectedResumeFile);
      formData.append('company', selectedCompany);

      const { data } = await axios.post('/api/candidate/resume-upload', formData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      const score = data.score ?? 5;
      setAtsResult({ score });
      
      // Show score for 3 seconds then continue to Aptitude
      setTimeout(() => {
        setAtsResult(null);
        handleBotInstruction('APTITUDE_TEST');
      }, 3000);

    } catch (err) {
      console.error("Resume Error:", err);
      const msg = err.response?.data?.message || 'Failed to process resume';
      setError(msg);
    } finally {
      setIsProcessingResume(false);
    }
  };

  const handleOptionSelect = (qId, option, roundName) => {
    const newAnswers = answers.filter(a => a.questionId !== qId);
    newAnswers.push({ questionId: qId, selectedOption: option });
    setAnswers(newAnswers);

    const isLast = currentQIndex === questions.length - 1;
    if (isLast) {
      submitRound(roundName, newAnswers);
      return;
    }
    setCurrentQIndex(prev => prev + 1);
  };

  const submitRound = async (roundName, submittedAnswers = answers) => {
    if (!questions.length) {
      setError('No questions available for this round.');
      return;
    }
    if (submittedAnswers.length < questions.length) {
      setError('Please answer all questions before submitting.');
      return;
    }

    try {
      // IF Practice Mode (None): Calculate score locally to avoid backend MongoDB lookup errors
      if (selectedCompany === 'None') {
        let score = 0;
        submittedAnswers.forEach(ans => {
          const q = questions.find(question => question._id === ans.questionId);
          if (q && q.correctAnswer === ans.selectedOption) {
            score += 1;
          }
        });

        const total = questions.length;
        // Simple pass logic for practice: >= 50%
        const status = score >= Math.ceil(total / 2) ? 'Pass' : 'Fail';
        
        pushExternalMessage(`[ROUND_COMPLETED]: ${roundName}, Score: ${score}, Total: ${total}, Result: ${status.toUpperCase()}`);
        setActiveAction(null);
        return;
      }

      // Normal Recruiter Mode: Submit to backend
      const { data } = await axios.post('/api/candidate/submit-answers', {
        roundName,
        answers: submittedAnswers,
        company: selectedCompany
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      pushExternalMessage(`[ROUND_COMPLETED]: ${roundName}, Score: ${data.score}, Total: ${data.totalQuestions}, Result: ${data.status.toUpperCase()}`);
      setActiveAction(null);
    } catch (err) {
      console.error("Submit Error:", err);
      setError('Failed to submit answers');
    }
  };

  const renderQuiz = (roundName) => {
    if (isFetchingQuestions) return (
      <div className="text-white p-12 text-center flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-lg font-medium">Fetching questions from MongoDB...</p>
      </div>
    );
    
    if (questions.length === 0) return (
      <div className="text-white p-12 text-center bg-slate-800/50 rounded-2xl border border-slate-700">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold mb-2">No questions available</h3>
        <p className="text-slate-400">Please contact the recruiter or select a different company.</p>
      </div>
    );

    const q = questions[currentQIndex];
    if (!q) return null;

    const isLast = currentQIndex === questions.length - 1;
    const currentAnswer = answers.find(a => a.questionId === q._id)?.selectedOption;

    return (
      <div className="bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-700 w-full h-full flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-xl font-bold text-white">{roundName} Test</h3>
          <span className="bg-indigo-500/20 text-indigo-300 px-4 py-1 rounded-full text-sm font-bold">
            {currentQIndex + 1} / {questions.length}
          </span>
        </div>
        
        <div className="p-8 flex-1 overflow-y-auto">
          <div className="mb-10">
            <h4 className="text-indigo-400 font-bold mb-3 text-lg">Question {currentQIndex + 1}:</h4>
            <p className="text-2xl text-white font-semibold leading-relaxed">{q.text}</p>
          </div>
          
          <div className="space-y-4">
            {(q.options || []).map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionSelect(q._id, opt, roundName)}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-center gap-5 group ${currentAnswer === opt
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-700/30 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                  }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg transition-colors ${currentAnswer === opt ? 'bg-indigo-500 text-white' : 'bg-slate-600 text-slate-400 group-hover:bg-slate-500 group-hover:text-slate-200'}`}>
                  {String.fromCharCode(65 + idx)}.
                </div>
                <span className="text-lg font-medium">{opt}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-700 flex justify-between bg-slate-900/50">
          <button
            disabled={currentQIndex === 0}
            onClick={() => setCurrentQIndex(prev => prev - 1)}
            className="px-8 py-3 rounded-xl font-bold text-slate-400 hover:text-white disabled:opacity-30 transition-all flex items-center gap-2"
          >
            ← Previous
          </button>
          <button
            onClick={() => {
              if (isLast) {
                submitRound(roundName);
              } else {
                setCurrentQIndex(prev => prev + 1);
              }
            }}
            disabled={!currentAnswer}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:grayscale"
          >
            {isLast ? 'Submit Final Answers' : 'Next Question →'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-slate-900 flex p-6 gap-6">
      <div className={`transition-all duration-500 ease-in-out ${activeAction ? 'w-1/2' : 'w-full max-w-4xl mx-auto'}`}>
        <ChatbotUI
          user={user}
          externalMessages={externalMessages}
          onBotInstruction={handleBotInstruction}
        />
      </div>

      {activeAction && (
        <div className="w-1/2 flex flex-col h-full animate-in slide-in-from-right duration-500">
          <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 flex-1 overflow-hidden flex items-center justify-center p-6">
            {activeAction === 'RESUME_UPLOAD' && (
              <div className="w-full max-w-md">
                {atsResult ? (
                  <div className="text-center animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-500">
                      <span className="text-3xl font-bold text-emerald-400">{atsResult.score}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Resume Uploaded Successfully</h3>
                    <p className="text-emerald-400 text-lg font-bold mb-4">ATS Score: {atsResult.score}/10</p>
                    <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden mb-4">
                      <div className="h-full bg-indigo-500 animate-progress"></div>
                    </div>
                    <p className="text-slate-400 animate-pulse">Continuing to Aptitude Round...</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-white mb-2 text-center">Upload Resume</h3>
                    <p className="text-indigo-400 mb-2 text-center text-sm font-medium">Target Company: {selectedCompany || 'None'}</p>
                    <p className="text-slate-400 mb-8 text-center text-xs italic">Please upload your resume to proceed with the recruitment process.</p>
                    
                    {error && <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm text-center border border-red-500/30">{error}</div>}
                    
                    <div className="mb-6">
                      <label className="block text-slate-400 text-xs uppercase font-bold tracking-widest mb-3">1. Select Company</label>
                      <select
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
                        disabled={isProcessingResume}
                      >
                        <option value="None">None (Practice Mode)</option>
                        {companies.map((company) => (
                          <option key={company} value={company}>
                            {company}
                          </option>
                        ))}
                      </select>
                    </div>

                    <form onSubmit={handleResumeSubmit} className="space-y-6">
                      <div className="mb-2">
                        <label className="block text-slate-400 text-xs uppercase font-bold tracking-widest mb-3">2. Choose Resume (PDF Only)</label>
                        <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-indigo-500 hover:bg-slate-700/50 transition-all cursor-pointer relative">
                          <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept=".pdf"
                            required
                            disabled={isProcessingResume}
                            onChange={(event) => {
                              setSelectedResumeFile(event.target.files?.[0] || null);
                              setError('');
                            }}
                          />
                          <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="mt-4 text-sm text-slate-400">
                            <span className="font-medium text-indigo-400">Click to upload</span> or drag and drop
                          </div>
                          {selectedResumeFile && (
                            <p className="text-sm text-emerald-400 mt-2 font-bold">Selected: {selectedResumeFile.name}</p>
                          )}
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={isProcessingResume || !selectedResumeFile}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        {isProcessingResume ? (
                          <>
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                            Processing Resume...
                          </>
                        ) : (
                          'Process Resume'
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}
            {activeAction === 'APTITUDE_TEST' && renderQuiz('Aptitude')}
            {activeAction === 'CODING_TEST' && renderQuiz('Coding')}
            {activeAction === 'ENGLISH_TEST' && renderQuiz('English')}
            {activeAction === 'PRACTICE_INTERVIEW' && (
              <div className="w-full h-full flex flex-col">
                <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
                    Jotform Practice Assistant
                  </h3>
                </div>
                <iframe
                  src="https://www.jotform.com/agent/019ae04746607d0a83b80ed512da45b42a83"
                  className="w-full flex-1 border-0 rounded-b-2xl"
                  title="Practice Agent"
                  allow="microphone"
                />
              </div>
            )}
            {activeAction === 'INTERVIEW_COMPLETED' && (
              <div className="w-full max-w-lg bg-slate-800 p-10 rounded-3xl border border-slate-700 shadow-2xl text-center animate-in zoom-in duration-500">
                {finalStatus === 'SELECTED' ? (
                  <>
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500">
                      <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-4">Congratulations!</h2>
                    <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                      You have successfully completed the AI Recruitment Process.
                    </p>
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700 mb-8">
                      <p className="text-emerald-400 font-black text-xl mb-1 uppercase tracking-widest">Final Result: SELECTED</p>
                      <p className="text-slate-400 text-sm">Company: <span className="text-white font-bold">{selectedCompany === 'None' ? 'AI Recruitment Assistant' : selectedCompany}</span></p>
                    </div>
                    <p className="text-slate-300 mb-4 font-medium">You can now generate and download your certificate here:</p>
                    <a 
                      href="https://achievement-hub-143.preview.emergentagent.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all transform hover:scale-105 text-lg"
                    >
                      Download Certificate
                    </a>
                    <div className="mt-8 pt-6 border-t border-slate-700">
                      <p className="text-xs text-slate-500 font-mono break-all">https://achievement-hub-143.preview.emergentagent.com/</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-500">
                      <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-4">Interview Process Completed</h2>
                    <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                      Thank you for your time and effort during the recruitment process.
                    </p>
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700 mb-8">
                      <p className="text-red-400 font-black text-xl mb-1 uppercase tracking-widest">Final Result: NOT SELECTED</p>
                      <p className="text-slate-400 text-sm italic mt-2">Better luck next time!</p>
                    </div>
                    <p className="text-slate-400 text-sm px-4">
                      We appreciate your interest in <span className="text-white font-bold">{selectedCompany === 'None' ? 'AI Recruitment' : selectedCompany}</span>. Your results have been recorded.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDashboard;
