import React, { useState, useEffect } from 'react';
import { 
  BarChart as ReChartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { 
  ShieldAlert, 
  Lock, 
  CheckCircle, 
  Trash2, 
  PlusCircle, 
  FileText, 
  TrendingUp, 
  ListFilter,
  RefreshCw,
  Search,
  BookOpen,
  Users,
  Award,
  Activity,
  Sparkles,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Play,
  CheckSquare,
  FileCheck,
  ArrowRight,
  Bot
} from 'lucide-react';
import { QueryLog, SupplementalMaterial } from '../types';

export default function InstructorView() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [logs, setLogs] = useState<QueryLog[]>([]);
  const [supplemental, setSupplemental] = useState<SupplementalMaterial[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalQueries: 0,
    flaggedCount: 0,
    unresolvedCount: 0,
    categories: {}
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [updating, setUpdating] = useState(false);

  // Navigation tab for Instructor Dashboard
  const [activeTab, setActiveTab] = useState<'analytics' | 'sandbox'>('analytics');

  // AI Classroom Agent Simulator states
  const [simTopic, setSimTopic] = useState("Comparing Tunisia's Labor Union (UGTT) role with Egypt's lack of independent civil society in the 2011 transitions");
  const [simRubric, setSimRubric] = useState("Apply Nonneman's multi-level framework (domestic vs. regional/global factors) (40%), cite evidence from readings (e.g., Bellin, Hinnebusch) (30%), evaluate structure vs. agency (30%)");
  const [simArticleText, setSimArticleText] = useState("Bellin (2012) on the robustness of authoritarianism, Hinnebusch (2006) on the international politics of the Middle East, and course notes on Tunisia (UGTT institutional strength) vs. Egypt (military business interests/Supreme Council of the Armed Forces).");

  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState('');
  const [simActiveSection, setSimActiveSection] = useState<'lesson' | 'socratic' | 'breakout' | 'grading'>('lesson');

  const [simLessonPlan, setSimLessonPlan] = useState('');
  const [simSocraticQuestion, setSimSocraticQuestion] = useState('');
  const [simStudentResponses, setSimStudentResponses] = useState('');
  const [simTeamWork, setSimTeamWork] = useState('');
  const [customStudentInput, setCustomStudentInput] = useState('');
  const [simEvaluation, setSimEvaluation] = useState('');

  // Audio state for Sandbox
  const [isSimSpeaking, setIsSimSpeaking] = useState(false);
  const [isSimListening, setIsSimListening] = useState(false);
  const [simRecognitionSupported, setSimRecognitionSupported] = useState(false);

  const simRecognitionRef = React.useRef<any>(null);
  const simUtteranceRef = React.useRef<any>(null);

  const presets = [
    {
      name: "Tunisia vs. Egypt Civil Society",
      topic: "Comparing Tunisia's Labor Union (UGTT) role with Egypt's lack of independent civil society in the 2011 transitions",
      rubric: "Apply Nonneman's multi-level framework (domestic vs. regional/global factors) (40%), cite evidence from readings (e.g., Bellin, Hinnebusch) (30%), evaluate structure vs. agency (30%)",
      article: "Bellin (2012) 'Reconsidering the Robustness of Authoritarianism in the Middle East' and Eva Bellin's analysis of the coercive apparatus."
    },
    {
      name: "Syria Civil War Structure vs Agency",
      topic: "Why did Syria slide into military conflict while Tunisia did not? Structure vs. Agency",
      rubric: "Critical analysis of structural militarization factors (40%), comparative reasoning (30%), integration of Hinnebusch's state-society framework (30%)",
      article: "Hinnebusch (2011) 'The Arab Uprisings and the International Relations of the Middle East' and comparative notes on state security fragmentation."
    },
    {
      name: "Yemen Transition Breakdown",
      topic: "The collapse of Yemen's National Dialogue Conference and foreign mediation under GCC framework",
      rubric: "Socio-political tribal division analysis (45%), regional proxy conflict influences (35%), clarity of analytical writing (20%)",
      article: "Syllabus readings on Yemen's elite divisions, regional actors (Saudi/Iran proxy war), and the GCC transition deal."
    }
  ];

  const applyPreset = (idx: number) => {
    const p = presets[idx];
    setSimTopic(p.topic);
    setSimRubric(p.rubric);
    setSimArticleText(p.article);
    setSimLessonPlan('');
    setSimSocraticQuestion('');
    setSimStudentResponses('');
    setSimTeamWork('');
    setCustomStudentInput('');
    setSimEvaluation('');
    setSimActiveSection('lesson');
  };

  // Speech recognition and Speech synthesis triggers
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      setSimRecognitionSupported(true);
      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsSimListening(true);
      };

      rec.onend = () => {
        setIsSimListening(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setCustomStudentInput(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed}\n\nStudent Voice: ${transcript}` : `Student Voice: ${transcript}`;
          });
        }
      };

      rec.onerror = (event: any) => {
        console.error('Sim speech recognition error:', event.error);
        setIsSimListening(false);
      };

      simRecognitionRef.current = rec;
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleSimListening = () => {
    if (!simRecognitionRef.current) return;
    
    if (isSimSpeaking) {
      stopSimSpeaking();
    }

    if (isSimListening) {
      simRecognitionRef.current.stop();
    } else {
      try {
        simRecognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const speakSimText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    stopSimSpeaking();

    // strip Markdown syntax and emojis for clean speech audio
    const cleanText = text
      .replace(/[*#_~`\-+]/g, '')
      .replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    simUtteranceRef.current = utterance;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('David')));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSimSpeaking(true);
    };

    utterance.onend = () => {
      setIsSimSpeaking(false);
      simUtteranceRef.current = null;
    };

    utterance.onerror = () => {
      setIsSimSpeaking(false);
      simUtteranceRef.current = null;
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSimSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSimSpeaking(false);
      simUtteranceRef.current = null;
    }
  };

  const handleRunSimAction = async (action: 'generate_lesson' | 'ask_socratic' | 'simulate_students' | 'evaluate_responses' | 'initiate_team') => {
    try {
      setSimLoading(true);
      setSimError('');

      const bodyParams: any = {
        action,
        topic: simTopic,
        rubric: simRubric,
        articleText: simArticleText,
        lessonPlan: simLessonPlan,
        socraticQuestion: simSocraticQuestion,
        studentResponses: action === 'evaluate_responses' && customStudentInput.trim() ? customStudentInput : simStudentResponses,
        transcript: simLessonPlan ? `Lesson plan generated. Question active: ${simSocraticQuestion}` : ''
      };

      const res = await fetch('/api/instructor/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyParams)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server error running simulation action.');
      }

      if (action === 'generate_lesson') {
        setSimLessonPlan(data.result);
        setSimActiveSection('lesson');
      } else if (action === 'ask_socratic') {
        setSimSocraticQuestion(data.result);
        setSimActiveSection('socratic');
      } else if (action === 'simulate_students') {
        setSimStudentResponses(data.result);
        setCustomStudentInput(data.result); // preload into custom box
        setSimActiveSection('socratic');
      } else if (action === 'initiate_team') {
        setSimTeamWork(data.result);
        setSimActiveSection('breakout');
      } else if (action === 'evaluate_responses') {
        setSimEvaluation(data.result);
        setSimActiveSection('grading');
      }
    } catch (err: any) {
      console.error('Error in simulation action:', err);
      setSimError(err.message || 'An error occurred during simulation.');
    } finally {
      setSimLoading(false);
    }
  };

  // Fetch metrics, logs, and knowledge base
  const fetchData = async () => {
    try {
      setUpdating(true);
      // Logs & Metrics
      const logsRes = await fetch('/api/instructor/logs');
      const logsData = await logsRes.json();
      setLogs(logsData.logs);
      setMetrics(logsData.metrics);

      // Supplemental Knowledge Base
      const kbRes = await fetch('/api/syllabus');
      const kbData = await kbRes.json();
      setSupplemental(kbData.supplemental);
    } catch (err) {
      console.error('Error fetching instructor data:', err);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'UW2026') {
      setIsAuthenticated(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Incorrect passcode. Please try again.');
    }
  };

  const handleAutoFill = () => {
    setPassword('UW2026');
  };

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch('/api/instructor/logs/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Error resolving log item:', err);
    }
  };

  const handleAddSupplemental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      const res = await fetch('/api/instructor/supplemental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, content: newContent })
      });
      const data = await res.json();
      if (data.success) {
        setNewTitle('');
        setNewContent('');
        fetchData();
      }
    } catch (err) {
      console.error('Error adding supplemental material:', err);
    }
  };

  const handleDeleteSupplemental = async (id: string) => {
    try {
      const res = await fetch(`/api/instructor/supplemental/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting supplemental material:', err);
    }
  };

  // Format category data for charts
  const categoryChartData = Object.keys(metrics.categories).map(catName => ({
    name: catName.replace('Content - ', ''),
    count: metrics.categories[catName]
  }));

  // Render mock volume data over the week
  const volumeChartData = [
    { day: 'Mon', count: Math.max(2, metrics.totalQueries - 5) },
    { day: 'Tue', count: Math.max(3, metrics.totalQueries - 4) },
    { day: 'Wed', count: Math.max(1, metrics.totalQueries - 3) },
    { day: 'Thu', count: Math.max(4, metrics.totalQueries - 1) },
    { day: 'Today', count: metrics.totalQueries }
  ];

  const filteredLogs = logs.filter(l => 
    l.query.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-[#4d3112] text-[#ffc72c] p-6 text-center border-b-4 border-[#ffc72c]">
          <ShieldAlert className="h-12 w-12 mx-auto mb-2" />
          <h2 className="text-xl font-bold font-sans">Instructor Secure Gateway</h2>
          <p className="text-xs text-amber-100 font-sans mt-1">
            Access restricted to Dr. Ali H. Raddaoui & authorized staff
          </p>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1 font-sans">
              Enter Portal Passcode
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4d3112] text-sm font-sans"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-600 font-sans font-semibold bg-red-50 p-2.5 rounded border border-red-100">
              {errorMsg}
            </p>
          )}

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={handleAutoFill}
              className="flex-1 text-center text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 py-2.5 rounded-lg transition"
            >
              Demo Auto-Fill
            </button>
            <button
              type="submit"
              className="flex-1 text-center text-xs font-semibold text-[#4d3112] bg-[#ffc72c] hover:bg-amber-400 py-2.5 rounded-lg transition shadow-xs"
            >
              Unlock Dashboard
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-xs border border-gray-200">
        <div>
          <h2 className="text-lg font-bold text-[#4d3112] font-sans flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            Instructor Control Panel
          </h2>
          <p className="text-xs text-gray-500 font-sans mt-0.5">
            Monitor student query analytics, flag academic integrity violations, and upload supplemental syllabus notes.
          </p>
        </div>
        {activeTab === 'analytics' && (
          <button
            onClick={fetchData}
            disabled={updating}
            className="text-xs font-semibold bg-[#4d3112] hover:bg-amber-950 text-[#ffc72c] px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${updating ? 'animate-spin' : ''}`} />
            Refresh Live Metrics
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex border border-gray-200 bg-white p-1.5 rounded-xl shadow-inner gap-2">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-[#4d3112] text-[#ffc72c] shadow'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Activity className="h-4 w-4" />
          Dashboard Analytics & RAG Notes
        </button>
        <button
          onClick={() => setActiveTab('sandbox')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer relative ${
            activeTab === 'sandbox'
              ? 'bg-[#4d3112] text-[#ffc72c] shadow'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Bot className="h-4 w-4" />
          AI Classroom Teaching Sandbox
          <span className="text-[9px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full font-mono font-extrabold animate-pulse ml-1">
            OPTION B
          </span>
        </button>
      </div>

      {activeTab === 'analytics' ? (
        <>
          {/* KPI Cards Bento Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1 */}
            <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-sans">Total Queries</span>
              <div className="flex justify-between items-end mt-2">
                <span className="text-3xl font-extrabold text-[#4d3112] font-sans">{metrics.totalQueries}</span>
                <span className="text-[10px] bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded">Active</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-sans">Flagged Queries</span>
              <div className="flex justify-between items-end mt-2">
                <span className={`text-3xl font-extrabold font-sans ${metrics.flaggedCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {metrics.flaggedCount}
                </span>
                <span className="text-[10px] bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded">Urgent</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-sans">Unresolved Tickets</span>
              <div className="flex justify-between items-end mt-2">
                <span className={`text-3xl font-extrabold font-sans ${metrics.unresolvedCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {metrics.unresolvedCount}
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">Action Required</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-sans">Syllabus Supplemental</span>
              <div className="flex justify-between items-end mt-2">
                <span className="text-3xl font-extrabold text-[#4d3112] font-sans">{supplemental.length}</span>
                <span className="text-[10px] bg-[#ffc72c]/20 text-[#4d3112] font-semibold px-2 py-0.5 rounded">RAG Indexed</span>
              </div>
            </div>

          </div>

          {/* Analytical Visualizations (Charts) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Category Breakdown */}
            <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200">
              <h3 className="text-sm font-bold text-[#4d3112] font-sans mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                Student Question Category Breakdown
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ReChartsBarChart data={categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f9fafb' }} />
                    <Bar dataKey="count" fill="#4d3112" radius={[4, 4, 0, 0]} />
                  </ReChartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Query Volume Trends */}
            <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200">
              <h3 className="text-sm font-bold text-[#4d3112] font-sans mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                Query Volume Over Time
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={volumeChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="day" stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#ffc72c" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Flagged and Unresolved Feed */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
            <h3 className="text-sm font-bold text-red-950 font-sans mb-3 border-b pb-2 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              Escalated Tickets & Academic Misconduct Flagged Messages ({metrics.unresolvedCount})
            </h3>
            {logs.filter(l => l.unresolved).length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4 text-center font-sans">
                No active student alerts or unresolved questions. Everything is running smoothly!
              </p>
            ) : (
              <div className="space-y-3">
                {logs.filter(l => l.unresolved).map(log => (
                  <div key={log.id} className="p-3.5 bg-red-50/45 rounded-lg border border-red-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded">
                          {log.category}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-800 font-sans font-semibold">
                        Student Query: "{log.query}"
                      </p>
                      <p className="text-xs text-gray-600 font-sans italic bg-white p-2.5 rounded border border-gray-100 mt-1">
                        Digit-Al-i Response: "{log.answer}"
                      </p>
                    </div>
                    <button
                      onClick={() => handleResolve(log.id)}
                      className="bg-[#4d3112] hover:bg-amber-950 text-[#ffc72c] font-bold text-xs px-3 py-1.5 rounded transition flex items-center gap-1 shrink-0 shadow-xs"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Mark Resolved
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RAG Supplemental Materials Editor */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Editor Form (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-xl shadow-xs border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-[#4d3112] font-sans border-b pb-2 mb-3 flex items-center gap-1.5">
                <PlusCircle className="h-4.5 w-4.5 text-[#ffc72c]" />
                Upload Supplemental Notes
              </h3>
              <p className="text-xs text-gray-500 font-sans mb-4">
                Upload extra articles, grading rubric corrections, or presentation guidelines. The Digit-Al-i bot will immediately index this in its RAG search database.
              </p>

              <form onSubmit={handleAddSupplemental} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase font-sans mb-1">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Supplementary Notes on Egypt's transition"
                    className="px-3 py-2 w-full border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#4d3112] font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase font-sans mb-1">
                    Content Body
                  </label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={5}
                    placeholder="Type here the specific readings, guidelines, or timelines..."
                    className="px-3 py-2 w-full border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#4d3112] font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newTitle.trim() || !newContent.trim()}
                  className="w-full bg-[#4d3112] hover:bg-amber-950 text-[#ffc72c] font-bold text-xs py-2.5 rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-45"
                >
                  <PlusCircle className="h-4 w-4" />
                  Index into Bot Database
                </button>
              </form>
            </div>

            {/* Existing Supplemental list (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-xl shadow-xs border border-gray-200 p-4 flex flex-col h-[390px]">
              <h3 className="text-sm font-bold text-[#4d3112] font-sans border-b pb-2 mb-3">
                Active Supplemental Documents ({supplemental.length})
              </h3>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {supplemental.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-8 font-sans">
                    No supplemental notes currently indexed.
                  </p>
                ) : (
                  supplemental.map(item => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-150 flex justify-between items-start gap-3">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1 font-sans">
                          <BookOpen className="h-3.5 w-3.5 text-amber-700" />
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-600 font-sans line-clamp-3 leading-relaxed">
                          {item.content}
                        </p>
                        <p className="text-[9px] text-gray-400 font-mono">
                          Added: {new Date(item.dateAdded).toLocaleString()} &bull; By {item.addedBy}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteSupplemental(item.id)}
                        className="text-gray-400 hover:text-red-600 transition p-1 rounded"
                        title="Delete and de-index"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Comprehensive Audit Logs Table */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3 mb-4">
              <h3 className="text-sm font-bold text-[#4d3112] font-sans">
                Comprehensive Student Inquiry Logs ({filteredLogs.length})
              </h3>
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search queries or responses..."
                  className="pl-9 pr-4 py-1.5 w-full border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#4d3112]"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[350px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Student Query</th>
                    <th className="py-2.5 px-3">Bot Response</th>
                    <th className="py-2.5 px-3">Alerts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400 italic font-sans">
                        No matching search logs found.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50/50">
                        <td className="py-2 px-3 text-[10px] font-mono text-gray-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">
                            {log.category.replace('Content - ', '')}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-semibold text-gray-800 max-w-[200px] truncate" title={log.query}>
                          {log.query}
                        </td>
                        <td className="py-2 px-3 text-gray-600 max-w-[250px] truncate" title={log.answer}>
                          {log.answer}
                        </td>
                        <td className="py-2 px-3">
                          {log.flagged ? (
                            <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded animate-pulse">
                              FLAGGED
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium text-gray-400">Normal</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* ==================== AI CLASSROOM TEACHING SANDBOX VIEW ==================== */
        <div className="space-y-6">
          
          {/* Quick Config Presets banner */}
          <div className="bg-[#4d3112]/5 border border-amber-200 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#ffc72c]" />
              <span className="text-xs font-extrabold text-[#4d3112] uppercase tracking-wider">
                Select Course Topic Preset (Instant Simulation Configuration)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(idx)}
                  className="bg-white border border-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-lg hover:border-[#4d3112] hover:bg-[#4d3112]/5 transition font-semibold shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <BookOpen className="h-3 w-3 text-amber-700" />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: SETUP & TEACHING STEPS PANEL (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Co-Teacher Settings Card */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-sans border-b pb-2 flex items-center gap-1.5">
                  <Bot className="h-4 w-4 text-[#4d3112]" />
                  1. Simulation Context Config
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1 font-sans">
                      Active Lecture Topic
                    </label>
                    <textarea
                      value={simTopic}
                      onChange={(e) => setSimTopic(e.target.value)}
                      rows={2}
                      className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#4d3112]"
                      placeholder="e.g. Demilitarization challenges..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1 font-sans">
                      Target Course Rubric Criteria
                    </label>
                    <textarea
                      value={simRubric}
                      onChange={(e) => setSimRubric(e.target.value)}
                      rows={2}
                      className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#4d3112]"
                      placeholder="e.g. Evidence from syllabus, critical logic..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1 font-sans">
                      Syllabus Article References
                    </label>
                    <textarea
                      value={simArticleText}
                      onChange={(e) => setSimArticleText(e.target.value)}
                      rows={2}
                      className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#4d3112]"
                      placeholder="e.g. Bellin (2012), Hinnebusch (2006)..."
                    />
                  </div>
                </div>
              </div>

              {/* Teaching Process Action Center */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-sans border-b pb-2">
                  2. Co-Teacher Action Center
                </h3>
                <p className="text-[11px] text-gray-500 font-sans leading-relaxed">
                  Trigger sequential teacher functions to simulate how the AI agent operates and manages the classroom.
                </p>

                <div className="space-y-2">
                  
                  {/* Step A */}
                  <button
                    onClick={() => handleRunSimAction('generate_lesson')}
                    disabled={simLoading}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      simLessonPlan
                        ? 'border-[#ffc72c] bg-amber-50/30 hover:bg-amber-50/50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="bg-[#4d3112] text-[#ffc72c] p-1.5 rounded text-xs font-extrabold font-mono w-6 h-6 flex items-center justify-center">
                        A
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">Draft Rubric Lesson Plan</p>
                        <p className="text-[10px] text-gray-400">Maps objectives and timeline</p>
                      </div>
                    </div>
                    {simLessonPlan ? (
                      <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">Generated</span>
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                    )}
                  </button>

                  {/* Step B */}
                  <button
                    onClick={() => handleRunSimAction('ask_socratic')}
                    disabled={simLoading || !simLessonPlan}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      !simLessonPlan ? 'opacity-40 cursor-not-allowed' : ''
                    } ${
                      simSocraticQuestion
                        ? 'border-[#ffc72c] bg-amber-50/30 hover:bg-amber-50/50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="bg-[#4d3112] text-[#ffc72c] p-1.5 rounded text-xs font-extrabold font-mono w-6 h-6 flex items-center justify-center">
                        B
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">Formulate Socratic Prompt</p>
                        <p className="text-[10px] text-gray-400">Generates deep classroom query</p>
                      </div>
                    </div>
                    {simSocraticQuestion ? (
                      <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">Active</span>
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                    )}
                  </button>

                  {/* Step C */}
                  <button
                    onClick={() => handleRunSimAction('simulate_students')}
                    disabled={simLoading || !simSocraticQuestion}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      !simSocraticQuestion ? 'opacity-40 cursor-not-allowed' : ''
                    } ${
                      simStudentResponses
                        ? 'border-[#ffc72c] bg-amber-50/30 hover:bg-amber-50/50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="bg-[#4d3112] text-[#ffc72c] p-1.5 rounded text-xs font-extrabold font-mono w-6 h-6 flex items-center justify-center">
                        C
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">Poll Simulated Students</p>
                        <p className="text-[10px] text-gray-400">Gets high, average, low responses</p>
                      </div>
                    </div>
                    {simStudentResponses ? (
                      <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">Simulated</span>
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                    )}
                  </button>

                  {/* Step D */}
                  <button
                    onClick={() => handleRunSimAction('initiate_team')}
                    disabled={simLoading || !simLessonPlan}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      !simLessonPlan ? 'opacity-40 cursor-not-allowed' : ''
                    } ${
                      simTeamWork
                        ? 'border-[#ffc72c] bg-amber-50/30 hover:bg-amber-50/50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="bg-[#4d3112] text-[#ffc72c] p-1.5 rounded text-xs font-extrabold font-mono w-6 h-6 flex items-center justify-center">
                        D
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">Launch Breakout Teams</p>
                        <p className="text-[10px] text-gray-400">Assigns collaborative exercises</p>
                      </div>
                    </div>
                    {simTeamWork ? (
                      <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">Launched</span>
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                    )}
                  </button>

                  {/* Step E */}
                  <button
                    onClick={() => handleRunSimAction('evaluate_responses')}
                    disabled={simLoading || (!simStudentResponses && !customStudentInput.trim())}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      (!simStudentResponses && !customStudentInput.trim()) ? 'opacity-40 cursor-not-allowed' : ''
                    } ${
                      simEvaluation
                        ? 'border-[#ffc72c] bg-amber-50/30 hover:bg-amber-50/50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="bg-[#4d3112] text-[#ffc72c] p-1.5 rounded text-xs font-extrabold font-mono w-6 h-6 flex items-center justify-center">
                        E
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">Assess & Grade Submissions</p>
                        <p className="text-[10px] text-gray-400">Verbatim rubric critique</p>
                      </div>
                    </div>
                    {simEvaluation ? (
                      <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">Graded</span>
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                    )}
                  </button>

                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: INTERACTIVE CLASSROOM SIMULATOR CONSOLE (7 cols) */}
            <div className="lg:col-span-7 flex flex-col min-h-[500px]">
              
              {/* Virtual Classroom Workspace header */}
              <div className="bg-gray-900 text-gray-100 rounded-t-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="bg-[#ffc72c] text-[#4d3112] p-1 rounded font-bold text-[10px] uppercase font-mono tracking-wider">
                    Console
                  </div>
                  <h3 className="text-xs font-bold font-mono text-amber-200">
                    AI TEACHER SIMULATOR TERMINAL
                  </h3>
                </div>
                {simLoading && (
                  <div className="flex items-center gap-2 text-xs text-amber-300 font-mono">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    AI Agent thinking...
                  </div>
                )}
              </div>

              {/* Simulator Tab Pills inside Terminal */}
              <div className="bg-gray-950 p-2 border-b border-gray-800 flex gap-1 overflow-x-auto">
                <button
                  onClick={() => setSimActiveSection('lesson')}
                  className={`px-3 py-1.5 rounded text-[11px] font-mono transition-all cursor-pointer shrink-0 ${
                    simActiveSection === 'lesson'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold'
                      : 'text-gray-400 hover:text-white border border-transparent'
                  }`}
                >
                  📖 Lesson Plan
                </button>
                <button
                  onClick={() => setSimActiveSection('socratic')}
                  className={`px-3 py-1.5 rounded text-[11px] font-mono transition-all cursor-pointer shrink-0 ${
                    simActiveSection === 'socratic'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold'
                      : 'text-gray-400 hover:text-white border border-transparent'
                  }`}
                >
                  🎙️ Active Debate Q&A
                </button>
                <button
                  onClick={() => setSimActiveSection('breakout')}
                  className={`px-3 py-1.5 rounded text-[11px] font-mono transition-all cursor-pointer shrink-0 ${
                    simActiveSection === 'breakout'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold'
                      : 'text-gray-400 hover:text-white border border-transparent'
                  }`}
                >
                  👥 GroupBreakouts
                </button>
                <button
                  onClick={() => setSimActiveSection('grading')}
                  className={`px-3 py-1.5 rounded text-[11px] font-mono transition-all cursor-pointer shrink-0 ${
                    simActiveSection === 'grading'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold'
                      : 'text-gray-400 hover:text-white border border-transparent'
                  }`}
                >
                  📝 Grades & Feedback
                </button>
              </div>

              {/* Main Terminal Screen */}
              <div className="bg-gray-50 flex-1 rounded-b-xl border border-gray-200 border-t-0 p-5 overflow-y-auto space-y-4 max-h-[550px]">
                
                {simError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 font-sans">
                    <strong>Error occurred:</strong> {simError}
                  </div>
                )}

                {/* LESSON PLAN VIEW */}
                {simActiveSection === 'lesson' && (
                  <div className="space-y-4">
                    {simLessonPlan ? (
                      <div className="bg-white p-5 rounded-xl border border-gray-200/85 shadow-xs space-y-4 relative">
                        <div className="flex items-center justify-between border-b pb-2">
                          <span className="text-xs font-extrabold text-[#4d3112] uppercase tracking-wide">
                            Active Lesson Plan
                          </span>
                          <button
                            onClick={() => speakSimText(simLessonPlan)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition ${
                              isSimSpeaking
                                ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            {isSimSpeaking ? (
                              <>
                                <VolumeX className="h-3 w-3" />
                                Stop Voice
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-3 w-3" />
                                Listen Plan
                              </>
                            )}
                          </button>
                        </div>
                        <SimpleMarkdown text={simLessonPlan} />
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-3">
                        <BookOpen className="h-10 w-10 text-gray-300 mx-auto" />
                        <p className="text-xs text-gray-400 italic">No Lesson Plan drafted yet.</p>
                        <button
                          onClick={() => handleRunSimAction('generate_lesson')}
                          disabled={simLoading}
                          className="text-xs bg-[#4d3112] text-[#ffc72c] font-bold px-4 py-2 rounded-lg hover:bg-amber-950 transition cursor-pointer"
                        >
                          Draft Lesson Plan Aligned to Rubric
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ACTIVE DEBATE Q&A VIEW */}
                {simActiveSection === 'socratic' && (
                  <div className="space-y-5">
                    
                    {/* Socratic Question block */}
                    {simSocraticQuestion ? (
                      <div className="bg-[#4d3112]/5 p-4 rounded-xl border border-amber-200 space-y-3">
                        <div className="flex justify-between items-center border-b border-amber-100 pb-1.5">
                          <span className="text-[10px] font-extrabold text-[#4d3112] uppercase tracking-wider">
                            AI Co-Teacher's Socratic Question
                          </span>
                          <button
                            onClick={() => speakSimText(simSocraticQuestion)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                              isSimSpeaking
                                ? 'bg-red-50 text-red-600 border-red-200'
                                : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-50'
                            }`}
                          >
                            {isSimSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                            {isSimSpeaking ? "Mute" : "Read Voice"}
                          </button>
                        </div>
                        <p className="text-xs font-semibold text-gray-800 leading-relaxed italic">
                          "{simSocraticQuestion}"
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed rounded-xl bg-white space-y-2">
                        <p className="text-xs text-gray-400 italic">No Socratic question has been asked yet.</p>
                        <button
                          disabled={!simLessonPlan || simLoading}
                          onClick={() => handleRunSimAction('ask_socratic')}
                          className="text-xs bg-amber-500 hover:bg-amber-600 text-black font-bold px-3 py-1.5 rounded-lg disabled:opacity-40 transition cursor-pointer"
                        >
                          Trigger Socratic Question
                        </button>
                      </div>
                    )}

                    {/* Simulated Student Responses */}
                    {simStudentResponses && (
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Simulated Student Comments
                        </span>
                        
                        <div className="space-y-3">
                          {simStudentResponses.split(/(?=Student Name:)/i).map((studentBlock, sIdx) => {
                            if (!studentBlock.trim()) return null;
                            const isExcellent = studentBlock.toLowerCase().includes('laila');
                            const isAverage = studentBlock.toLowerCase().includes('mateo');
                            const isStruggling = studentBlock.toLowerCase().includes('sarah');

                            let cardColor = 'bg-white border-gray-200';
                            let tag = 'SIMULATED';
                            let tagColor = 'bg-gray-100 text-gray-700';

                            if (isExcellent) {
                              cardColor = 'bg-emerald-50/20 border-emerald-100';
                              tag = 'Tier A (Laila - Sophisticated)';
                              tagColor = 'bg-emerald-100 text-emerald-800';
                            } else if (isAverage) {
                              cardColor = 'bg-blue-50/20 border-blue-100';
                              tag = 'Tier B (Mateo - Well Meaning)';
                              tagColor = 'bg-blue-100 text-blue-800';
                            } else if (isStruggling) {
                              cardColor = 'bg-red-50/20 border-red-100';
                              tag = 'Tier C (Sarah - Misconception)';
                              tagColor = 'bg-red-100 text-red-800';
                            }

                            return (
                              <div key={sIdx} className={`p-3 rounded-lg border ${cardColor} space-y-2 shadow-xs`}>
                                <div className="flex items-center justify-between">
                                  <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded ${tagColor}`}>
                                    {tag}
                                  </span>
                                  <button
                                    onClick={() => speakSimText(studentBlock)}
                                    className="text-gray-400 hover:text-amber-700 transition"
                                    title="Speak response"
                                  >
                                    <Volume2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <div className="text-xs text-gray-700 leading-relaxed font-sans whitespace-pre-line">
                                  {studentBlock}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Submit custom student answer block */}
                    {simSocraticQuestion && (
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="text-[10px] font-extrabold text-[#4d3112] uppercase tracking-wide">
                            Co-Teacher Grading Sandbox Queue
                          </span>
                          <span className="text-[9px] bg-[#ffc72c]/30 text-[#4d3112] font-semibold px-2 py-0.5 rounded-full font-mono">
                            Verbatim Rubric Evaluator
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          Edit the simulated student responses above, or write/speak your own custom student submission below to test the grading agent.
                        </p>

                        <div className="space-y-2">
                          <div className="relative">
                            <textarea
                              value={customStudentInput}
                              onChange={(e) => setCustomStudentInput(e.target.value)}
                              rows={5}
                              className="w-full text-xs border border-gray-300 rounded-lg p-3 pr-10 focus:outline-none focus:ring-1 focus:ring-[#4d3112]"
                              placeholder="Type or record custom student answers to evaluate against syllabus rubric..."
                            />
                            
                            <button
                              type="button"
                              onClick={toggleSimListening}
                              className={`absolute bottom-3 right-3 p-2 rounded-full transition cursor-pointer ${
                                isSimListening
                                  ? 'bg-red-500 text-white animate-pulse'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                              }`}
                              title={simRecognitionSupported ? "Dictate response" : "Microphone not supported"}
                              disabled={!simRecognitionSupported}
                            >
                              {isSimListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                            </button>
                          </div>

                          <div className="flex gap-2 justify-end">
                            {simStudentResponses && (
                              <button
                                onClick={() => setCustomStudentInput(simStudentResponses)}
                                className="text-[10px] font-bold text-gray-600 bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200 transition cursor-pointer"
                              >
                                Reset to Simulated Comments
                              </button>
                            )}
                            <button
                              onClick={() => handleRunSimAction('evaluate_responses')}
                              disabled={simLoading || !customStudentInput.trim()}
                              className="text-xs font-bold bg-[#4d3112] hover:bg-amber-950 text-[#ffc72c] px-4 py-2 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1"
                            >
                              <FileCheck className="h-3.5 w-3.5" />
                              Grade This Queue
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* GROUP BREAKOUT VIEW */}
                {simActiveSection === 'breakout' && (
                  <div className="space-y-4">
                    {simTeamWork ? (
                      <div className="space-y-4">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-xs font-extrabold text-[#4d3112] uppercase tracking-wide flex items-center gap-1.5">
                              <Users className="h-4 w-4 text-amber-700" />
                              Breakout Classroom Activity
                            </span>
                            <button
                              onClick={() => speakSimText(simTeamWork)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                                isSimSpeaking
                                  ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                              }`}
                            >
                              {isSimSpeaking ? "Stop Voice" : "Listen Breakout"}
                            </button>
                          </div>
                          <SimpleMarkdown text={simTeamWork} />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-3">
                        <Users className="h-10 w-10 text-gray-300 mx-auto" />
                        <p className="text-xs text-gray-400 italic">No collaborative breakout launched yet.</p>
                        <button
                          disabled={!simLessonPlan || simLoading}
                          onClick={() => handleRunSimAction('initiate_team')}
                          className="text-xs bg-[#4d3112] text-[#ffc72c] font-bold px-4 py-2 rounded-lg hover:bg-amber-950 disabled:opacity-40 transition cursor-pointer"
                        >
                          Trigger TeamBreakout Challenge
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* GRADES & FEEDBACK VIEW */}
                {simActiveSection === 'grading' && (
                  <div className="space-y-4">
                    {simEvaluation ? (
                      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                            <Award className="h-4 w-4 text-amber-600" />
                            Rubric Evaluation Report
                          </span>
                          <button
                            onClick={() => speakSimText(simEvaluation)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition ${
                              isSimSpeaking
                                ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            {isSimSpeaking ? "Stop Voice" : "Hear Feedback"}
                          </button>
                        </div>
                        <SimpleMarkdown text={simEvaluation} />
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-3">
                        <Award className="h-10 w-10 text-gray-300 mx-auto" />
                        <p className="text-xs text-gray-400 italic">No student submissions have been evaluated yet.</p>
                        <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                          To generate grades, go to the <strong>Debate Q&A</strong> tab, formulate a question, simulate/input a response, and click <strong>Grade This Queue</strong>.
                        </p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}


/* ==================== HELPER COMPONENTS FOR RICH MARKDOWN STYLING ==================== */

function SimpleMarkdown({ text }: { text: string }) {
  if (!text) return null;

  // Split by double newline to get distinct blocks
  const blocks = text.split(/\n\s*\n/);

  return (
    <div className="space-y-4 text-xs leading-relaxed text-gray-800 font-sans">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Header Levels Check
        if (trimmed.startsWith('### ')) {
          return (
            <h5 key={idx} className="text-xs font-extrabold text-[#4d3112] uppercase tracking-wider mt-4 mb-2">
              {trimmed.replace('### ', '')}
            </h5>
          );
        }
        if (trimmed.startsWith('## ') || trimmed.startsWith('##')) {
          return (
            <h4 key={idx} className="text-sm font-extrabold text-[#4d3112] border-b pb-1.5 mt-5 mb-2.5 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#ffc72c] shrink-0" />
              {trimmed.replace(/^##\s*/, '')}
            </h4>
          );
        }
        if (trimmed.startsWith('# ') || trimmed.startsWith('#')) {
          return (
            <h3 key={idx} className="text-base font-extrabold text-[#4d3112] border-b-2 border-[#ffc72c] pb-2 mt-6 mb-3">
              {trimmed.replace(/^#\s*/, '')}
            </h3>
          );
        }

        // List Check (Bullet points)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.includes('\n- ') || trimmed.includes('\n* ')) {
          const lines = trimmed.split('\n').filter(l => l.trim().length > 0);
          return (
            <ul key={idx} className="list-disc pl-5 space-y-2 mt-2">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^[\s*\-+]\s*/, '');
                return (
                  <li key={lIdx} className="text-xs text-gray-700 leading-relaxed">
                    <BoldFormatter text={cleanLine} />
                  </li>
                );
              })}
            </ul>
          );
        }

        // List Check (Numbered points)
        if (/^\d+\.\s/.test(trimmed) || trimmed.includes('\n1. ')) {
          const lines = trimmed.split('\n').filter(l => l.trim().length > 0);
          return (
            <ol key={idx} className="list-decimal pl-5 space-y-2 mt-2">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^\d+\.\s*/, '');
                return (
                  <li key={lIdx} className="text-xs text-gray-700 leading-relaxed">
                    <BoldFormatter text={cleanLine} />
                  </li>
                );
              })}
            </ol>
          );
        }

        // Regular paragraph with bold support
        return (
          <p key={idx} className="whitespace-pre-line text-xs text-gray-700 leading-relaxed">
            <BoldFormatter text={trimmed} />
          </p>
        );
      })}
    </div>
  );
}

function BoldFormatter({ text }: { text: string }) {
  if (!text.includes('**')) {
    return <>{text}</>;
  }

  const parts = text.split('**');
  return (
    <>
      {parts.map((part, i) => {
        // odd indices represent bold text
        if (i % 2 === 1) {
          return <strong key={i} className="font-extrabold text-gray-900">{part}</strong>;
        }
        return part;
      })}
    </>
  );
}

