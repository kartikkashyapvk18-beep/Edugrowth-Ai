import React, { useState, useMemo } from "react";
import { 
  Flame, Award, Trophy, Target, Zap, Clock, Sparkles, BookOpen, 
  HelpCircle, ChevronRight, CheckCircle2, TrendingUp, AlertCircle, BarChart3,
  Sliders, Compass, Eye, ShieldAlert, BadgeInfo
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Curriculum default models
const CURRICULUM_DATA = {
  JEE: {
    subjects: [
      { name: "Physics", marks: 88, max: 100, color: "#ef4444" },
      { name: "Chemistry", marks: 74, max: 100, color: "#f59e0b" },
      { name: "Mathematics", marks: 95, max: 100, color: "#3b82f6" }
    ],
    velocity: [
      { week: "Week 1", rate: 55 },
      { week: "Week 2", rate: 68 },
      { week: "Week 3", rate: 75 },
      { week: "Week 4", rate: 84 },
      { week: "Week 5", rate: 92 }
    ],
    correct: 184,
    incorrect: 40,
    streak: 9,
    doubtsSolved: 34
  },
  NEET: {
    subjects: [
      { name: "Biology", marks: 94, max: 100, color: "#10b981" },
      { name: "Chemistry", marks: 78, max: 100, color: "#f59e0b" },
      { name: "Physics", marks: 66, max: 100, color: "#ef4444" }
    ],
    velocity: [
      { week: "Week 1", rate: 60 },
      { week: "Week 2", rate: 64 },
      { week: "Week 3", rate: 78 },
      { week: "Week 4", rate: 81 },
      { week: "Week 5", rate: 89 }
    ],
    correct: 215,
    incorrect: 52,
    streak: 12,
    doubtsSolved: 48
  },
  CA: {
    subjects: [
      { name: "Accounting", marks: 89, max: 100, color: "#8b5cf6" },
      { name: "Business Laws", marks: 76, max: 100, color: "#6366f1" },
      { name: "Maths & Stats", marks: 82, max: 100, color: "#06b6d4" }
    ],
    velocity: [
      { week: "Week 1", rate: 45 },
      { week: "Week 2", rate: 58 },
      { week: "Week 3", rate: 72 },
      { week: "Week 4", rate: 79 },
      { week: "Week 5", rate: 86 }
    ],
    correct: 152,
    incorrect: 31,
    streak: 7,
    doubtsSolved: 22
  }
};

export default function MyGrowthView() {
  const [selectedStream, setSelectedStream] = useState<"JEE" | "NEET" | "CA">("JEE");
  const [dppTargetProjection, setDppTargetProjection] = useState<number>(3); // interactive projection slider

  // Extract metrics based on selected stream
  const activeData = useMemo(() => CURRICULUM_DATA[selectedStream], [selectedStream]);

  // a) Accuracy calculation
  const totalAnswers = activeData.correct + activeData.incorrect + (dppTargetProjection * 10);
  const projectedCorrect = activeData.correct + (dppTargetProjection * 9); // assume 90% correct for projection
  const currentAccuracy = Math.round((activeData.correct / (activeData.correct + activeData.incorrect)) * 100);
  const projectedAccuracy = Math.round((projectedCorrect / totalAnswers) * 100);

  const accuracyPieData = [
    { name: "Correct", value: projectedCorrect, color: "#06b6d4" }, // Cyan neon glow
    { name: "Incorrect", value: activeData.incorrect, color: "#f43f5e" } // Rose alert
  ];

  // Subject Mastery bar elements
  const barChartData = activeData.subjects;

  // Learning Velocity custom layout
  const velocityData = activeData.velocity;

  return (
    <div className="space-y-6 text-slate-100" id="my-growth-view-dashboard">
      
      {/* Dynamic Header Banner styled in premium Dark mode */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl p-5 md:p-6 border border-indigo-500/20 shadow-lg relative overflow-hidden" id="growth-header-indigo">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
        <div className="absolute -bottom-6 -left-6 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[10.5px] bg-indigo-500/20 text-indigo-300 px-3 py-1 border border-indigo-500/30 rounded-full font-extrabold uppercase tracking-wide">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Dynamic Student Progress Ledger
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Kartik Kashyap's Performance Tracker
            </h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-xl font-medium leading-relaxed">
              Track your daily learning consistency score, review master coaching tests breakdown, and boost your 2026 score targets.
            </p>
          </div>

          {/* Curriculum Switcher inside dark theme */}
          <div className="bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 shrink-0 w-full md:w-auto">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2.5 block mb-1">
              Select Curriculum Stream
            </span>
            <div className="grid grid-cols-3 gap-1">
              {(["JEE", "NEET", "CA"] as const).map((stream) => (
                <button
                  key={stream}
                  onClick={() => setSelectedStream(stream)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all text-center ${
                    selectedStream === stream 
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 border border-indigo-400/30" 
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  {stream} Class
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gamification Badges & Micro Achievements Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="streaks-and-achievements-widgets">
        
        {/* Streak Badge */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 hover:border-orange-500/40 transition-colors shadow-sm">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-orange-500/20 shrink-0 animate-pulse">
            <Flame className="w-7 h-7 text-white fill-orange-200" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-orange-400 font-extrabold uppercase tracking-wider">CHALLENGER STREAK</span>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
            </div>
            <h4 className="text-lg font-black text-white">{activeData.streak}-Day Study Streak!</h4>
            <p className="text-[11px] text-slate-400 font-semibold">Continuous DPP solutions submitted offline.</p>
          </div>
        </div>

        {/* Doubt Killer Badge */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 hover:border-cyan-500/40 transition-colors shadow-sm">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-cyan-500/20 shrink-0">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider">ELITE BADGE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            </div>
            <h4 className="text-lg font-black text-white">🏆 Doubt Killer</h4>
            <p className="text-[11px] text-slate-400 font-semibold">{activeData.doubtsSolved} major followups solved with Saarthi AI.</p>
          </div>
        </div>

        {/* Level Indicator Badge */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 hover:border-indigo-500/40 transition-colors shadow-sm">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-700 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-600/20">
            <Award className="w-7 h-7 text-yellow-300" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider">ACADEMIC LEVEL</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            </div>
            <h4 className="text-lg font-black text-white">Cohort Rank #5</h4>
            <p className="text-[11px] text-slate-400 font-semibold">Top 3% among regional batch enrollments.</p>
          </div>
        </div>

      </div>

      {/* Main 3 Visual Data Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="three-visual-indicators-dashboard">
        
        {/* Left Hand: a) Accuracy Meter (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col space-y-4" id="accuracy-meter-subview">
          <div>
            <span className="text-[9.5px] font-black text-cyan-400 uppercase tracking-widest block">Core Pillar Alpha</span>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <Target className="w-4 h-4 text-cyan-400" />
                Accuracy Meter (Sahi vs Galat)
              </h3>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-black border border-slate-700">
                Live DPP Rate
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Ratio of correct answers over total questions solved in your batch.</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center min-h-[180px] bg-slate-950/40 rounded-xl relative p-3 border border-slate-800/40">
            
            {/* Pie details wrapper */}
            <div className="w-full h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={accuracyPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {accuracyPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Absolute Centered percentage text inside donut hole */}
              <div className="absolute text-center">
                <span className="text-3xl font-black text-white block leading-none">{projectedAccuracy}%</span>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide block mt-1">Accuracy</span>
              </div>
            </div>

            {/* Custom Pie Legend layout */}
            <div className="flex items-center justify-center gap-4 text-xs mt-1 w-full font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-sm"></span>
                <span className="text-slate-300">Correct ({projectedCorrect})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm"></span>
                <span className="text-slate-300">Incorrect ({activeData.incorrect})</span>
              </div>
            </div>
          </div>

          {/* Projection interactive helper Slider */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor="projection-slider" className="text-slate-300 font-bold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Solve future DPPs (+90% Accuracy Target):
              </label>
              <strong className="text-cyan-400 font-black">+{dppTargetProjection * 10} MCQs</strong>
            </div>
            
            <input 
              id="projection-slider"
              type="range"
              min="0"
              max="10"
              value={dppTargetProjection}
              onChange={(e) => setDppTargetProjection(Number(e.target.value))}
              className="w-full bg-slate-800 accent-cyan-400 h-1 rounded-lg cursor-pointer" 
            />

            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Baseline ({currentAccuracy}%)</span>
              <span className="text-indigo-400 font-bold">Projection: {projectedAccuracy}% Accuracy</span>
            </div>
          </div>
        </div>

        {/* Right Hand: b) Subject Mastery & c) Learning Velocity Charts (7 cols) */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-6 flex flex-col" id="mastery-and-velocity-visuals">
          
          {/* b) Subject Mastery (PCM/PCB marks bar chart) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex-1" id="subject-mastery-custom">
            <div>
              <span className="text-[9.5px] font-black text-indigo-400 uppercase tracking-widest block">COACHING TESTS SUMMARY</span>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  Subject Mastery (Class Syllabus Scores)
                </h3>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-black border border-slate-700">
                  PCM Model
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Calculated score averages extracted directly from Sankalp's recent weekend mock tests.</p>
            </div>

            <div className="h-44 w-full bg-slate-950/20 p-2 rounded-xl border border-slate-805/40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px style rgb(30, 41, 59)", color: "#f8fafc", fontSize: "12px", borderRadius: "8px" }}
                  />
                  <Bar dataKey="marks" radius={[6, 6, 0, 0]} maxBarSize={36}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Micro warning indicator */}
            <div className="p-2.5 bg-yellow-950/40 border border-yellow-900/60 text-yellow-300/90 rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-yellow-400 animate-pulse" />
              <span>Study Note: Revise fundamental equations of {barChartData.find(s => s.marks < 80)?.name || "Chemistry"} to cross the 85% overall average clearance line!</span>
            </div>
          </div>

          {/* c) Learning Velocity (Neon Blue area chart) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex-1" id="learning-velocity-custom">
            <div>
              <span className="text-[9.5px] font-black text-cyan-400 uppercase tracking-widest block">VELOCITY RATE METRIC</span>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Learning Velocity Progress Index
                </h3>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-black border border-slate-700">
                  Weekly Index
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Syllabus coverage speed index computed based on DPP answers velocity rate.</p>
            </div>

            <div className="h-44 w-full bg-slate-950/20 p-2 rounded-xl border border-slate-805/40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={velocityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px style rgb(30, 41, 59)", color: "#f8fafc", fontSize: "12px", borderRadius: "8px" }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#06b6d4" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorVelocity)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
