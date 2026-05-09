import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ChatbotUI = ({ user, externalMessages = [], onBotInstruction }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Loading...' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Initial greeting
  useEffect(() => {
    const initChat = async () => {
      try {
        const res = await axios.post('/api/chat/message', {
          messages: [],
          userRole: user.role
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setMessages([{ role: 'assistant', content: res.data.content }]);
        checkBotInstruction(res.data.content);
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Error connecting to AI.';
        setMessages([{ role: 'assistant', content: `Error: ${errorMsg}` }]);
      }
    };
    initChat();
  }, [user]);

  // Handle external system messages (e.g., ATS score, Quiz score)
  useEffect(() => {
    if (externalMessages.length > 0) {
      const lastExternal = externalMessages[externalMessages.length - 1];
      if (lastExternal && !messages.some(m => m.id === lastExternal.id)) {
        sendMessage(lastExternal.content, true, lastExternal.id);
      }
    }
  }, [externalMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkBotInstruction = (content) => {
    if (onBotInstruction) {
      const lower = content.toLowerCase();
      if (content.includes('[APTITUDE_TEST]')) onBotInstruction('APTITUDE_TEST');
      if (content.includes('[CODING_TEST]')) onBotInstruction('CODING_TEST');
      if (content.includes('[ENGLISH_TEST]')) onBotInstruction('ENGLISH_TEST');
      if (content.includes('[PRACTICE_MODE]')) onBotInstruction('PRACTICE_INTERVIEW');
      if (content.includes('[RESUME_UPLOAD]')) onBotInstruction('RESUME_UPLOAD');
      if (content.includes('[START_REAL_INTERVIEW]')) onBotInstruction('START_REAL_INTERVIEW');
      
      const completedMatch = content.match(/\[INTERVIEW_COMPLETED:\s*(.*?)\]/);
      if (completedMatch && completedMatch[1]) {
        onBotInstruction('INTERVIEW_COMPLETED', completedMatch[1].trim());
      } else if (content.includes('[INTERVIEW_COMPLETED]')) {
        onBotInstruction('INTERVIEW_COMPLETED', 'SELECTED');
      }
      
      const companyMatch = content.match(/\[COMPANY_SELECTED:\s*(.*?)\]/);
      if (companyMatch && companyMatch[1]) {
        onBotInstruction('COMPANY_SELECTED', companyMatch[1].trim());
      }

      const cutoffMatch = content.match(/\[SET_ATS_CUTOFF:\s*(\d+)\]/);
      if (cutoffMatch && cutoffMatch[1]) {
        onBotInstruction('SET_ATS_CUTOFF', cutoffMatch[1].trim());
      }
    }
  };

  const sendMessage = async (text, isSystem = false, externalId = null) => {
    if (!text.trim()) return;

    const newMessage = { role: 'user', content: text, id: externalId || Date.now().toString() };
    const updatedMessages = [...messages, newMessage];
    
    // Only show user messages in UI if not a system injection
    if (!isSystem) {
      setMessages(updatedMessages);
      setInput('');
    }
    
    setIsLoading(true);

    try {
      const res = await axios.post('/api/chat/message', {
        messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        userRole: user.role
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      const assistantMessage = { role: 'assistant', content: res.data.content };
      
      if (isSystem || text.startsWith('[ROUND_COMPLETED]')) {
        setMessages([...messages, assistantMessage]); // don't show the injected system message
      } else {
        setMessages([...updatedMessages, assistantMessage]);
      }
      
      checkBotInstruction(assistantMessage.content);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to get response.';
      setMessages([...updatedMessages, { role: 'assistant', content: `Error: ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-indigo-600 p-4 flex items-center justify-between">
        <h3 className="text-white font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          AI Recruitment Assistant
        </h3>
        <span className="text-indigo-200 text-xs">{user.role} Mode</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-800">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-slate-700 text-slate-200 rounded-bl-none border border-slate-600'
            }`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-slate-200 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-slate-900 border-t border-slate-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl font-medium transition-all disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatbotUI;
