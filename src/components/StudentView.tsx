import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  HelpCircle, 
  PhoneCall, 
  Calendar, 
  BookOpen, 
  AlertTriangle,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  UserCheck,
  MousePointerClick,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Message } from '../types';

interface StudentViewProps {
  onAddLogMessage?: (query: string, reply: string, category: string, flagged: boolean) => void;
}

export default function StudentView({ onAddLogMessage }: StudentViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Howdy! I am Digit-Al-i, your teaching assistant for POLS 4710 / INST 4990. I'm here to help you navigate course readings, understand Gerd Nonneman's multi-level framework, explore case studies (Tunisia, Egypt, Syria, Yemen), and master course logistics.\n\nI won't write your essays or feedback for you, but I will help you develop your own analytical arguments! What can we learn together today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<number>(1);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Speech and Voice Integration states
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const currentUtteranceRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, showHistory]);

  // Setup speech recognition
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      setRecognitionSupported(true);
      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript}` : transcript;
          });
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    // Stop speaking if active
    if (isSpeaking) {
      stopSpeaking();
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Stop existing playback
    stopSpeaking();

    // Clean text: strip markdown characters, emojis, and bracketed technical details for cleaner speech output
    const cleanText = text
      .replace(/[*#_~`\-+]/g, '') // remove markdown characters
      .replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '') // remove emojis
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    currentUtteranceRef.current = utterance;

    // Try finding an English voice (preferably a natural or premium one)
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('David') || v.name.includes('Zira')));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    }
  };

  const socraticStarters = [
    {
      title: "Framework Q",
      text: "I don't understand Gerd Nonneman's multi-level analysis. Can you explain it?",
      icon: <Sparkles className="h-4 w-4 text-amber-600" />
    },
    {
      title: "Logistics Q",
      text: "When is the peer feedback due for the presentation and what is the word count?",
      icon: <Calendar className="h-4 w-4 text-amber-600" />
    },
    {
      title: "Case Comparison",
      text: "Why did the popular mobilization lead to such different outcomes in Tunisia vs Syria?",
      icon: <BookOpen className="h-4 w-4 text-amber-600" />
    },
    {
      title: "Write My Feedback",
      text: "Can you write my 200-word peer feedback response for the Tunisia group presentation?",
      icon: <AlertTriangle className="h-4 w-4 text-amber-600" />
    },
    {
      title: "Stress / Overwhelm",
      text: "I have 3 assignments due and I feel like falling apart. I don't know what to do.",
      icon: <PhoneCall className="h-4 w-4 text-amber-600" />
    },
    {
      title: "Ottoman Empire (Out-of-Scope)",
      text: "Can you help me write my history paper on the rise of the Ottoman Empire?",
      icon: <HelpCircle className="h-4 w-4 text-amber-600" />
    }
  ];

  const courseBlocks = [
    {
      num: 1,
      title: "Theoretical Framework",
      dates: "Aug 24 - Sep 16",
      readings: "Nonneman (2005); Hinnebusch & Ehteshami (2005)",
      presentation: "Session 7 (Wed, Sep 16)",
      details: "Introduces Gerd Nonneman's multi-level, multi-causal framework analyzing MENA foreign policy, looking at domestic, regional, and global dynamics."
    },
    {
      num: 2,
      title: "The Tunisian Case",
      dates: "Sep 21 - Oct 12",
      readings: "Schraeder & Redissi (2011); Stepan (2012); Koehler (2023)",
      presentation: "Session 14 (Mon, Oct 12)",
      details: "Explores Tunisia's path from revolution to democratic transition (elite compromises/twin tolerations) and its eventual democratic erosion under Kais Saied."
    },
    {
      num: 3,
      title: "Egypt & Syria",
      dates: "Oct 14 - Nov 4",
      readings: "Brown (2013); Salib (2017); Gause (2011); Roberts (2016); Singh (2022)",
      presentation: "Session 21 (Wed, Nov 4)",
      details: "Compares Egypt's brief Islamist government and military return with Syria's descent into a regionalized proxy civil war."
    },
    {
      num: 4,
      title: "Yemen & Synthesis",
      dates: "Nov 9 - Dec 2",
      readings: "Hokayem & Roberts (2016); Kendall (2017); Ardemagni (2017)",
      presentation: "Session 27 (Mon, Nov 30)",
      details: "Analyzes Yemen's proxy civil war, state fragmentation, and non-state actors, concluding with comparative models explaining divergent outcomes."
    }
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const studentMessage: Message = {
      id: 'student-' + Date.now(),
      sender: 'student',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, studentMessage]);
    setInput('');
    setLoading(true);

    try {
      // Build brief history context from state
      const historyContext = messages.slice(-6).map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          history: historyContext
        })
      });

      const data = await response.json();
      
      const botMessage: Message = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: data.category,
        flagged: data.flagged,
        unresolved: data.unresolved
      };

      setMessages(prev => [...prev, botMessage]);

      if (autoSpeak) {
        speakText(data.reply);
      }

      if (onAddLogMessage) {
        onAddLogMessage(textToSend, data.reply, data.category, data.flagged);
      }
    } catch (err) {
      console.error('Error communicating with backend:', err);
      // Fallback
      setMessages(prev => [...prev, {
        id: 'error-' + Date.now(),
        sender: 'bot',
        text: "My apologies! I had a momentary connection slip. If this persists, please review the syllabus or email Dr. Ali H. Raddaoui directly at araddaou@uwyo.edu.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'Logistics',
        flagged: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: "Chat reset! Let's start fresh. How can I help you learn or study course topics today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  const studentMessages = messages.filter(m => m.sender === 'student');
  const lastStudentMessage = studentMessages.length > 0 ? studentMessages[studentMessages.length - 1] : null;

  const botMessages = messages.filter(m => m.sender === 'bot' && m.id !== 'welcome');
  const lastBotMessage = botMessages.length > 0 ? botMessages[botMessages.length - 1] : null;

  const welcomeMessage = messages.find(m => m.id === 'welcome') || {
    id: 'welcome',
    sender: 'bot' as const,
    text: "Howdy! I am Digit-Al-i, your teaching assistant for POLS 4710 / INST 4990. I'm here to help you navigate course readings, understand Gerd Nonneman's multi-level framework, explore case studies (Tunisia, Egypt, Syria, Yemen), and master course logistics.\n\nI won't write your essays or feedback for you, but I will help you develop your own analytical arguments! What can we learn together today?",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Core Socratic Chat Interface (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden h-[calc(100vh-180px)] min-h-[550px]">
          
          {/* Chat Header */}
          <div className="bg-[#4d3112]/5 px-4 py-3 border-b border-gray-200 flex justify-between items-center shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-[#4d3112] font-sans">Active Session: Digit-Al-i TA Bot</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Auto Speak Toggle */}
              <button
                type="button"
                onClick={() => {
                  const newState = !autoSpeak;
                  setAutoSpeak(newState);
                  if (!newState) {
                    stopSpeaking();
                  }
                }}
                className={`px-3 py-1 rounded-full text-xs font-extrabold border transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  autoSpeak
                    ? 'bg-amber-100 text-[#4d3112] border-amber-300 shadow-sm'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
                title="Toggle automatically reading response aloud when it arrives"
              >
                {autoSpeak ? <Volume2 className="h-3.5 w-3.5 animate-pulse" /> : <VolumeX className="h-3.5 w-3.5 text-gray-400" />}
                {autoSpeak ? "Auto-Speak: ON" : "Auto-Speak: OFF"}
              </button>

              <button 
                onClick={handleResetChat}
                className="text-xs text-amber-950 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded font-medium flex items-center gap-1 transition cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                Reset Conversation
              </button>
            </div>
          </div>

          {/* Ask Input Area - Redesigned at the TOP for maximum visibility & zero scrolling friction */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 shrink-0 relative">
            {/* Highly Visible Animated Pointer for First Access / Empty Input */}
            {!input.trim() && (
              <div className="absolute top-16 left-6 bg-[#ffc72c] text-[#4d3112] text-xs font-extrabold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 animate-bounce z-10 border border-[#4d3112]/20">
                <span>👇</span>
                <span>Type here & click <strong className="underline font-extrabold">Ask Digit-Al-i</strong> to start!</span>
                <span className="absolute bottom-[-5px] left-8 w-2.5 h-2.5 bg-[#ffc72c] transform rotate-45 border-r border-b border-[#4d3112]/20"></span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!input.trim()) {
                  inputRef.current?.focus();
                  return;
                }
                handleSend(input);
              }}
              className="flex items-center gap-3"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "🎙️ Listening to your voice... Speak clearly now! Click mic to stop." : "Ask about Nonneman's framework, case study readings, or syllabus grades..."}
                disabled={loading}
                className={`flex-1 px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4d3112] focus:border-transparent bg-white disabled:bg-gray-100 shadow-xs transition-colors duration-200 ${
                  isListening ? 'border-red-400 bg-red-50/20' : 'border-gray-300'
                }`}
              />
              {recognitionSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2.5 rounded-lg border transition-all duration-200 flex items-center justify-center cursor-pointer ${
                    isListening 
                      ? 'bg-red-500 text-white border-red-600 animate-pulse ring-2 ring-red-300' 
                      : 'bg-[#4d3112]/10 hover:bg-[#4d3112]/20 text-[#4d3112] border-gray-300'
                  }`}
                  title={isListening ? 'Stop Listening' : 'Dictate with your Microphone'}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="bg-[#4d3112] hover:bg-amber-950 text-[#ffc72c] font-extrabold px-5 py-2.5 rounded-lg transition-all transform hover:scale-[1.02] active:scale-97 shadow-md flex items-center gap-1.5 text-sm shrink-0 border border-[#ffc72c]/40 cursor-pointer"
              >
                <MousePointerClick className="h-4 w-4 text-[#ffc72c]" />
                Ask Digit-Al-i
              </button>
            </form>
          </div>

          {/* Core Spotlight: Active Q&A Block - Zero scrolling to find the answer! */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
            
            {/* Active Question Box (Only show if a student question was asked) */}
            {lastStudentMessage ? (
              <div className="border-l-4 border-[#ffc72c] bg-[#4d3112]/5 p-4 rounded-r-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#4d3112] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#ffc72c] animate-pulse" />
                    Your Question
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">{lastStudentMessage.timestamp}</span>
                </div>
                <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                  {lastStudentMessage.text}
                </p>
              </div>
            ) : null}

            {/* Active Response Box (Directly and clearly below the question) */}
            <div className="border border-gray-200 rounded-xl p-5 shadow-xs bg-gray-50/30">
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#ffc72c]" />
                  Digit-Al-i's Response
                </span>
                <div className="flex items-center gap-3">
                  {lastBotMessage && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isSpeaking) {
                          stopSpeaking();
                        } else {
                          speakText(lastBotMessage.text);
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold transition-all duration-200 border cursor-pointer ${
                        isSpeaking
                          ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 animate-pulse'
                          : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      }`}
                      title={isSpeaking ? "Mute the current spoken response" : "Read this response out loud"}
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="h-3.5 w-3.5 animate-bounce" />
                          Stop Voice
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5" />
                          Speak Answer
                        </>
                      )}
                    </button>
                  )}
                  {lastBotMessage && (
                    <span className="text-[10px] text-gray-400 font-mono">{lastBotMessage.timestamp}</span>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-start py-4">
                  <span className="text-xs font-semibold text-[#4d3112] font-sans mb-3">Digit-Al-i is drafting your answer...</span>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#4d3112] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-[#4d3112] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-[#4d3112] rounded-full animate-bounce"></div>
                  </div>
                </div>
              ) : lastBotMessage ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-800 whitespace-pre-line leading-relaxed font-sans">
                    {lastBotMessage.text}
                  </div>

                  {lastBotMessage.category && (
                    <div className="pt-3 border-t border-gray-200/60 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-semibold bg-amber-100 text-[#4d3112] px-2 py-0.5 rounded">
                        Classifier: {lastBotMessage.category}
                      </span>
                      {lastBotMessage.flagged && (
                        <span className="text-[10px] font-mono font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                          ⚠️ Logged / Escalated
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Initial Welcome Message Display */
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-dashed border-gray-200/60 pb-1.5 mb-1">
                    <span className="text-xs font-extrabold text-[#4d3112] uppercase tracking-wide">Welcome Greeting</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (isSpeaking) {
                          stopSpeaking();
                        } else {
                          speakText(welcomeMessage.text);
                        }
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold transition-all border cursor-pointer ${
                        isSpeaking
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-[#4d3112]/10 text-[#4d3112] border-amber-200 hover:bg-[#4d3112]/20'
                      }`}
                      title="Speak greeting text"
                    >
                      {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                      {isSpeaking ? "Stop Voice" : "Hear Greeting"}
                    </button>
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-line leading-relaxed font-sans">
                    {welcomeMessage.text}
                  </div>
                  <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-100 text-xs text-amber-900 font-sans">
                    <p className="font-bold mb-1">📢 UW Syllabus Disclaimer:</p>
                    All responses from Digit-Al-i are AI-generated and can sometimes contain errors. Please cross-reference with syllabus text and course documents.
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Socratic Starters (Quick Actions) */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 shrink-0">
            <p className="text-[11px] font-semibold text-[#4d3112] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-sans">
              <Sparkles className="h-3 w-3 text-amber-600" />
              Socratic Study Starters (Click to Test Prompts):
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {socraticStarters.map((starter, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(starter.text)}
                  disabled={loading}
                  className="p-2 text-left bg-white hover:bg-amber-50 border border-gray-200 hover:border-amber-300 rounded text-xs font-medium text-gray-700 hover:text-[#4d3112] transition shadow-xs line-clamp-2 cursor-pointer"
                >
                  <span className="font-semibold block text-[10px] text-amber-800 uppercase tracking-wide flex items-center gap-1 mb-0.5">
                    {starter.icon}
                    {starter.title}
                  </span>
                  {starter.text}
                </button>
              ))}
            </div>
          </div>

          {/* Collapsible Session History Panel */}
          {studentMessages.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50/50 shrink-0">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="w-full px-4 py-2.5 flex justify-between items-center text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100/50 transition font-sans cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-[#4d3112]" />
                  Full Conversation Logs ({messages.length} messages)
                </span>
                <span className="text-[#4d3112] underline decoration-dotted font-bold hover:text-amber-950">
                  {showHistory ? "Hide Previous Exchanges" : "Show Previous Exchanges"}
                </span>
              </button>

              {showHistory && (
                <div className="max-h-48 overflow-y-auto p-4 border-t border-gray-200 bg-white space-y-3.5">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.sender === 'student' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold text-gray-400 font-sans">
                          {m.sender === 'student' ? 'Student' : 'Digit-Al-i (TA)'}
                        </span>
                        <span className="text-[9px] text-gray-400 font-mono">{m.timestamp}</span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-lg px-3.5 py-2 text-xs leading-relaxed ${
                          m.sender === 'student'
                            ? 'bg-[#4d3112]/90 text-white rounded-tr-none'
                            : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200/50'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column: Interactive Course Roadmap & Hotline Panel (4 Cols) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col h-[calc(100vh-180px)] overflow-y-auto">
          
          {/* Section 1: Interactive Block Timeline Tracker */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <h2 className="text-base font-bold text-[#4d3112] mb-3 flex items-center gap-2 font-sans border-b pb-2">
              <Calendar className="h-5 w-5 text-[#ffc72c]" />
              Interactive Syllabus Roadmap
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Explore presentation schedules, required articles, and timeline milestones of Fall 2026.
            </p>

            {/* Block list selector */}
            <div className="flex gap-1.5 mb-4 bg-gray-100 p-1 rounded-lg">
              {courseBlocks.map((b) => (
                <button
                  key={b.num}
                  onClick={() => setSelectedBlock(b.num)}
                  className={`flex-1 py-1 text-center text-xs font-semibold rounded transition ${
                    selectedBlock === b.num
                      ? 'bg-[#4d3112] text-white shadow'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Block {b.num}
                </button>
              ))}
            </div>

            {/* Block details view */}
            {courseBlocks.map((b) => b.num === selectedBlock && (
              <div key={b.num} className="bg-amber-50/45 p-3.5 rounded-lg border border-amber-100 space-y-3.5">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-bold text-[#4d3112]">{b.title}</h3>
                  <span className="text-[10px] bg-amber-200 text-[#4d3112] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {b.dates}
                  </span>
                </div>
                
                <p className="text-xs text-gray-700 leading-relaxed font-sans">
                  {b.details}
                </p>

                <div className="space-y-2 pt-2 border-t border-amber-200/40 text-xs">
                  <div>
                    <span className="font-semibold text-gray-700 block mb-0.5 font-sans">Assigned Readings:</span>
                    <span className="text-gray-600 italic font-sans">{b.readings}</span>
                  </div>
                  <div className="pt-1.5">
                    <span className="font-semibold text-[#4d3112] block mb-0.5 font-sans">Presentation Day:</span>
                    <span className="text-gray-700 font-bold flex items-center gap-1 font-sans">
                      <Clock className="h-3 w-3 text-amber-800" />
                      {b.presentation}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Section 2: Student Well-Being Support Hotline (Verbatim mandate) */}
          <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 p-4">
            <h2 className="text-base font-bold text-amber-950 mb-2 flex items-center gap-2 font-sans">
              <PhoneCall className="h-5 w-5 text-red-600" />
              UW Student Well-Being
            </h2>
            <p className="text-xs text-amber-900 leading-relaxed mb-4">
              Academics can be stressful. Confused, tired, or feeling overwhelmed? Know that your mental and emotional well-being is our highest priority.
            </p>

            <div className="bg-white rounded-lg border border-amber-200 p-3 space-y-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="bg-red-50 p-2 rounded text-red-600">
                  <PhoneCall className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800 font-sans">UW Counseling Center</h4>
                  <p className="text-[11px] text-gray-600 mb-1">Located at 341 Knight Hall</p>
                  <a href="tel:3077662187" className="text-xs font-mono font-bold text-red-600 hover:underline block">
                    307-766-2187
                  </a>
                  <p className="text-[10px] text-gray-400 font-sans italic mt-0.5">After hours: 307-766-8989</p>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <div className="flex items-start gap-3">
                <div className="bg-amber-50 p-2 rounded text-amber-800">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800 font-sans">Disability Support Services</h4>
                  <p className="text-[11px] text-gray-600 mb-1">DSS: 109 Knight Hall</p>
                  <span className="text-xs font-semibold text-[#4d3112] font-mono">
                    udss@uwyo.edu &bull; 307-766-3073
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Academic Honesty Quick Check (Regulation 2-114) */}
          <div className="bg-red-50 rounded-xl shadow-sm border border-red-100 p-4">
            <h2 className="text-sm font-bold text-red-950 mb-1.5 flex items-center gap-1.5 font-sans">
              <AlertTriangle className="h-4 w-4 text-red-700 animate-pulse" />
              UW Regulation 2-114
            </h2>
            <p className="text-xs text-red-800 leading-relaxed font-sans">
              Submitting AI-generated text as your own original coursework constitutes academic dishonesty. Digit-Al-i is programmed to aid your critical reading and outline formulations, but will never write assignments on your behalf.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
