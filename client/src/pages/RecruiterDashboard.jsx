import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import ChatbotUI from '../components/ChatbotUI';

const RecruiterDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('results'); // results, questions, live
  const [results, setResults] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [externalMessages, setExternalMessages] = useState([]);

  
  // New question form state
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState('');
  const [qType, setQType] = useState('Aptitude');
  const [error, setError] = useState('');


  useEffect(() => {
    if (activeTab === 'results') fetchResults();
    if (activeTab === 'questions') fetchQuestions();
  }, [activeTab]);

  const fetchResults = async () => {
    try {
      const { data } = await axios.get('/api/recruiter/results', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setResults(data);
    } catch (err) {
      console.error(err);
    }
  };



  const fetchQuestions = async () => {
    try {
      const { data } = await axios.get('/api/questions', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setQuestions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    try {
      if (!qOptions.includes(qCorrect)) {
        setError('Correct answer must exactly match one of the options.');
        return;
      }

      await axios.post('/api/questions', {
        text: qText,
        options: qOptions,
        correctAnswer: qCorrect,
        type: qType
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setQText('');
      setQOptions(['', '', '', '']);
      setQCorrect('');
      setError('');
      fetchQuestions();
      setExternalMessages(prev => [...prev, { id: Date.now().toString(), content: '[SYSTEM INJECTION]: The recruiter just added a new question successfully. Ask them what they want to do next.' }]);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to add question');
    }
  };

  const handleDeleteQuestion = async (id) => {
    try {
      await axios.delete(`/api/questions/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...qOptions];
    newOptions[index] = value;
    setQOptions(newOptions);
  };

  const handleBotInstruction = async (instruction, data) => {
    const lower = instruction.toLowerCase();
    
    if (instruction === 'SET_ATS_CUTOFF') {
      try {
        await axios.put('/api/recruiter/cutoff', { cutoff: Number(data) }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        // Optionally update the local user state if needed, but the bot handles the confirmation message
      } catch (err) {
        console.error('Failed to update cutoff', err);
      }
      return;
    }

    if (lower.includes('manage aptitude') || lower.includes('manage coding') || lower.includes('manage english')) {
      setActiveTab('questions');
      if (lower.includes('aptitude')) setQType('Aptitude');
      if (lower.includes('coding')) setQType('Coding');
      if (lower.includes('english')) setQType('English');
    } else if (lower.includes('view candidate results')) {
      setActiveTab('results');
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-slate-900 flex">
      {/* Sidebar - AI Assistant */}
      <div className="w-1/3 bg-slate-800 border-r border-slate-700 flex flex-col p-4 shadow-xl z-10 relative">
        <div className="mb-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex flex-col items-center">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Managing Questions For</span>
          <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            {user.company || 'None'}
          </span>
        </div>
        <ChatbotUI 
          user={user} 
          externalMessages={externalMessages}
          onBotInstruction={handleBotInstruction}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto bg-slate-900">
        {/* Navigation Tabs (if manual override needed) */}
        <div className="flex gap-4 mb-8">
          <button onClick={() => setActiveTab('results')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'results' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>Results</button>
          <button onClick={() => setActiveTab('questions')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'questions' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>Questions Bank</button>
        </div>

        {activeTab === 'results' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              Candidate Results
            </h3>
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
              <table className="w-full text-left text-slate-300">
                <thead className="bg-slate-900/50 text-slate-400">
                  <tr>
                    <th className="p-4 font-medium text-xs uppercase tracking-wider">Candidate Name</th>
                    <th className="p-4 font-medium text-xs uppercase tracking-wider">Email</th>
                    <th className="p-4 font-medium text-xs uppercase tracking-wider">Profile</th>
                    <th className="p-4 font-medium text-xs uppercase tracking-wider">Round</th>
                    <th className="p-4 font-medium text-xs uppercase tracking-wider">Score</th>
                    <th className="p-4 font-medium text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {results.length === 0 ? (
                    <tr><td colSpan="6" className="p-8 text-center text-slate-500 italic">No candidate results available for your company.</td></tr>
                  ) : (
                    results.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-700/30 transition-colors group">
                        <td className="p-4 font-semibold text-white">{r.candidate?.name || 'Unknown'}</td>
                        <td className="p-4 text-slate-400">{r.candidate?.email || 'N/A'}</td>
                        <td className="p-4">
                          <span className="bg-slate-900 text-indigo-300 px-2.5 py-1 rounded-md text-[10px] font-bold border border-slate-700 uppercase">
                            {r.candidate?.profileType || 'N/A'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-white text-sm font-medium">{r.roundName}</span>
                            <span className="text-[10px] text-slate-500">Completed Round</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-white font-mono">{r.score} / {r.totalQuestions}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className={`w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              r.status === 'Pass' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {r.status === 'Pass' ? 'Selected' : 'Rejected'}
                            </span>
                            {r.reason && (
                              <span className="text-[9px] text-rose-400 font-bold uppercase tracking-tight italic">
                                {r.reason}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="xl:col-span-1">
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4">Add Question</h3>
                {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-xs border border-red-500/20">{error}</div>}
                <form onSubmit={handleCreateQuestion} className="space-y-4">
                  <div>
                    <label className="block text-slate-400 text-sm mb-1 font-medium">Question Type</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" value={qType} onChange={e => setQType(e.target.value)}>
                      <option>Aptitude</option>
                      <option>Coding</option>
                      <option>English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-1 font-medium">Question Text</label>
                    <textarea required className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[100px]" value={qText} onChange={e => setQText(e.target.value)}></textarea>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-1 font-medium">Options (4)</label>
                    <div className="space-y-2">
                      {qOptions.map((opt, i) => (
                        <input key={i} required className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder={`Option ${i+1}`} value={opt} onChange={e => updateOption(i, e.target.value)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-1 font-medium">Correct Answer <span className="text-xs text-slate-500">(Must match an option exactly)</span></label>
                    <input required className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" value={qCorrect} onChange={e => setQCorrect(e.target.value)} />
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/25 mt-2">Add Question</button>
                </form>
              </div>
            </div>
            <div className="xl:col-span-2">
              <h3 className="text-xl font-bold text-white mb-4">Question Bank</h3>
              <div className="space-y-4">
                {questions.map(q => (
                  <div key={q._id} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-md flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-indigo-500/20 text-indigo-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-500/20">{q.type}</span>
                        <p className="text-white font-medium text-lg leading-tight">{q.text}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {q.options.map((opt, idx) => (
                          <span key={idx} className={`px-3 py-1 rounded-lg text-sm border ${opt === q.correctAnswer ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteQuestion(q._id)} className="shrink-0 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-xl text-sm font-bold border border-red-500/20 transition-colors">
                      Delete
                    </button>
                  </div>
                ))}
                {questions.length === 0 && (
                  <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-2xl p-12 text-center">
                    <p className="text-slate-500 text-lg">No questions found in the bank.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default RecruiterDashboard;
