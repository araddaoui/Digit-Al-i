import React, { useState, useEffect } from 'react';
import { BookOpen, ShieldAlert, GraduationCap, Clock } from 'lucide-react';

interface NavbarProps {
  currentMode: 'student' | 'instructor';
  setMode: (mode: 'student' | 'instructor') => void;
}

export default function Navbar({ currentMode, setMode }: NavbarProps) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-[#4d3112] text-white shadow-md border-b-4 border-[#ffc72c] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="bg-[#ffc72c] text-[#4d3112] p-2 rounded-lg font-bold flex items-center justify-center shadow-inner">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight font-sans flex items-center gap-2">
              Digit-Al-i <span className="text-xs bg-[#ffc72c] text-[#4d3112] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider font-semibold">UW TA Bot</span>
            </h1>
            <p className="text-xs text-amber-100 font-sans">
              POLS 4710 / INST 4990 &bull; The Arab Spring & Its Aftermaths
            </p>
          </div>
        </div>

        {/* Timings and Clock */}
        <div className="hidden lg:flex items-center gap-5 bg-black/20 px-4 py-1.5 rounded-lg border border-white/10 text-xs">
          <div className="flex items-center gap-1.5 text-amber-200">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{timeStr}</span>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <div>
            <span className="text-white/60">Class meets:</span>{' '}
            <span className="font-semibold text-amber-200">Mon/Wed 14:10 - 15:00 MST</span>
          </div>
        </div>

        {/* Mode Selector Toggle */}
        <div className="flex items-center gap-2">
          <div className="bg-black/30 p-1 rounded-lg flex items-center gap-1 border border-white/5">
            <button
              onClick={() => setMode('student')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                currentMode === 'student'
                  ? 'bg-[#ffc72c] text-[#4d3112] shadow'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Student View
            </button>
            <button
              onClick={() => setMode('instructor')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                currentMode === 'instructor'
                  ? 'bg-[#ffc72c] text-[#4d3112] shadow'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Instructor Portal
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
