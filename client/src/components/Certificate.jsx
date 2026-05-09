import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Certificate = ({ candidateName, companyName, date }) => {
  const certificateRef = useRef();

  const displayCompany = !companyName || companyName === 'None' ? 'AI Recruitment Assistant' : companyName;

  return (
    <div className="flex flex-col items-center bg-slate-900/50 p-10 rounded-3xl border border-slate-700/50 shadow-2xl backdrop-blur-sm animate-in zoom-in duration-700">
      <div 
        ref={certificateRef}
        className="w-[900px] h-[630px] bg-white text-slate-900 p-2 relative overflow-hidden shadow-2xl"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        {/* Main Elegant Border */}
        <div className="absolute inset-4 border-[12px] border-double border-[#1e3a8a] flex flex-col items-center justify-between p-10">
          
          {/* Gold Corner Accents */}
          <div className="absolute top-0 left-0 w-24 h-24 border-t-8 border-l-8 border-[#d4af37]"></div>
          <div className="absolute top-0 right-0 w-24 h-24 border-t-8 border-r-8 border-[#d4af37]"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 border-b-8 border-l-8 border-[#d4af37]"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 border-b-8 border-r-8 border-[#d4af37]"></div>

          {/* Header Section */}
          <div className="text-center w-full mt-4">
            <div className="flex items-center justify-center gap-4 mb-4">
               <div className="h-[2px] w-16 bg-[#d4af37]"></div>
               <span className="text-[#1e3a8a] font-bold tracking-[0.3em] uppercase text-sm">Professional Achievement</span>
               <div className="h-[2px] w-16 bg-[#d4af37]"></div>
            </div>
            <h1 className="text-5xl font-serif font-black text-[#1e3a8a] uppercase tracking-wider mb-2" style={{ letterSpacing: '0.1em' }}>
              Certificate of Completion
            </h1>
          </div>

          {/* Recipient Section */}
          <div className="text-center w-full">
            <p className="text-slate-500 font-serif italic text-xl mb-4">This is to proudly certify that</p>
            <h2 className="text-6xl font-serif font-bold text-[#1e3a8a] mb-6 drop-shadow-sm capitalize">
              {candidateName}
            </h2>
            <div className="w-1/2 h-[1px] bg-slate-300 mx-auto mb-6"></div>
          </div>

          {/* Achievement Details */}
          <div className="text-center w-full max-w-2xl px-4">
            <p className="text-slate-700 text-lg leading-relaxed">
              has successfully completed the comprehensive <span className="font-bold text-[#1e3a8a]">AI-Driven Recruitment Process</span> including Aptitude, Coding, and English assessments at
            </p>
            <p className="text-2xl font-bold text-[#b4941f] mt-4 uppercase tracking-wide">
              {displayCompany}
            </p>
            <p className="mt-6 text-slate-500 text-sm italic">
              Demonstrating exceptional proficiency, technical skills, and professional competence.
            </p>
          </div>

          {/* Footer Section: Date, Seal, and Signature */}
          <div className="w-full flex justify-between items-end px-10 mt-4 mb-4">
            <div className="text-center">
              <p className="text-slate-800 font-bold border-b-2 border-slate-200 pb-2 mb-2 w-40">{date}</p>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Completion Date</p>
            </div>

            {/* Official Seal */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-[#d4af37] bg-[#fdfaf0] flex items-center justify-center relative overflow-hidden shadow-md">
                <div className="text-[#d4af37] font-black text-[10px] text-center uppercase leading-none">
                  OFFICIAL<br/>SEAL OF<br/>SUCCESS
                </div>
                {/* Ribbon tails */}
                <div className="absolute -bottom-4 left-4 w-6 h-12 bg-[#d4af37] rotate-12 -z-10 shadow-sm"></div>
                <div className="absolute -bottom-4 right-4 w-6 h-12 bg-[#d4af37] -rotate-12 -z-10 shadow-sm"></div>
              </div>
            </div>

            <div className="text-center">
              <div className="font-serif italic text-2xl text-[#1e3a8a] mb-0 pb-0 tracking-tighter">Recruitment Team</div>
              <p className="text-slate-800 font-bold border-t-2 border-slate-200 pt-2 w-40">Authorized Signature</p>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mt-2">Verification Office</p>
            </div>
          </div>

        </div>
      </div>
      
      <div className="flex gap-4 mt-10">
        <button 
          onClick={() => window.print()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-3 scale-105"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2z" /></svg>
          Print Certificate
        </button>
      </div>
    </div>
  );
};

export default Certificate;
