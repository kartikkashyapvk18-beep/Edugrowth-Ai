import { useMemo } from "react";
import { 
  Users, 
  Flame, 
  GraduationCap, 
  TrendingUp, 
  DollarSign, 
  MessageSquare, 
  PhoneCall, 
  Clock, 
  ChevronRight 
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from "recharts";
import { Lead, Student, Course } from "../types";

interface DashboardViewProps {
  leads: Lead[];
  students: Student[];
  courses: Course[];
  setActiveTab: (tab: 'dashboard' | 'leads' | 'students' | 'settings') => void;
}

export default function DashboardView({ leads, students, courses, setActiveTab }: DashboardViewProps) {
  // Compute High-Level Metrics
  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const hotLeads = leads.filter(l => l.status === "Hot").length;
    const enrolledStudents = students.length;
    
    // Real-time conversion rate: Enrolled Students / Total Leads
    const conversionRate = totalLeads > 0 
      ? Math.round((enrolledStudents / totalLeads) * 100) 
      : 50;

    // Expected Revenue (assume avg fee 25,000 INR per student)
    const totalRevenue = students.filter(s => s.feesStatus === "Paid").length * 25000 + 
                           students.filter(s => s.feesStatus === "Partial").length * 12500;

    return {
      totalLeads,
      hotLeads,
      enrolledStudents,
      conversionRate,
      totalRevenue
    };
  }, [leads, students]);

  // Chart 1: Course Breakdown
  const courseChartData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    leads.forEach(l => {
      counts[l.targetCourse] = (counts[l.targetCourse] || 0) + 1;
    });
    students.forEach(s => {
      counts[s.targetCourse] = (counts[s.targetCourse] || 0) + 1;
    });

    return Object.keys(counts).map(course => ({
      name: course,
      value: counts[course]
    }));
  }, [leads, students]);

  // Chart 2: Leads Pipeline Funnel
  const funnelChartData = useMemo(() => {
    const total = leads.length;
    const contacted = leads.filter(l => l.timeline.some(ev => ev.type === "call" || ev.type === "whatsapp")).length;
    const hot = leads.filter(l => l.status === "Hot").length;
    const converted = leads.filter(l => l.status === "Converted").length;

    return [
      { stage: "Total Leads", count: total, fill: "#4f6073" },
      { stage: "Contacted", count: contacted, fill: "#8fa3b7" },
      { stage: "Hot Leads", count: hot, fill: "#f14c5c" },
      { stage: "Converted", count: converted, fill: "#d11a2a" }
    ];
  }, [leads]);

  // Chart 3: Pipeline Health Status Breakdown (Donut Chart)
  const statusChartData = useMemo(() => {
    const counts = { Hot: 0, Warm: 0, Cold: 0, Converted: 0 };
    leads.forEach(l => {
      if (l.status === "Hot") counts.Hot++;
      else if (l.status === "Warm") counts.Warm++;
      else if (l.status === "Cold") counts.Cold++;
      else if (l.status === "Converted") counts.Converted++;
    });

    return [
      { name: "Hot", value: counts.Hot, fill: "#f43f5e" },
      { name: "Warm", value: counts.Warm, fill: "#cb5a07" },
      { name: "Cold", value: counts.Cold, fill: "#3b82f6" },
      { name: "Converted", value: counts.Converted, fill: "#10b981" }
    ];
  }, [leads]);

  // Pipeline Health Rating Assessment
  const pipelineHealthRating = useMemo(() => {
    if (leads.length === 0) {
      return { label: "Pending", color: "text-slate-400" };
    }
    const hotAndConverted = leads.filter(l => l.status === "Hot" || l.status === "Converted").length;
    const ratio = hotAndConverted / leads.length;
    if (ratio >= 0.5) {
      return { label: "Excellent", color: "text-emerald-600" };
    } else if (ratio >= 0.25) {
      return { label: "Healthy", color: "text-indigo-600" };
    } else {
      return { label: "Needs Nudge", color: "text-amber-600" };
    }
  }, [leads]);

  // Activity feed: Collect last 5 timeline events from all leads
  const recentActivities = useMemo(() => {
    const events: { 
      leadName: string; 
      leadId: string;
      id: string;
      type: string;
      title: string;
      description: string;
      timestamp: string;
    }[] = [];

    leads.forEach(lead => {
      lead.timeline.forEach(ev => {
        events.push({
          leadName: lead.name,
          leadId: lead.id,
          id: ev.id,
          type: ev.type,
          title: ev.title,
          description: ev.description,
          timestamp: ev.timestamp
        });
      });
    });

    // Sort by timestamp descending
    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [leads]);

  // PIE CHART COLORS
  const COLORS = ["#d11a2a", "#4f6073", "#ecf5fe", "#e0e9f2", "#696b6c", "#141d23"];

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-view-panel">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-metrics-grid">
        {/* Metric 1 */}
        <div className="glass-card neon-glow-blue rounded-xl p-5 hover:scale-102 transition-all flex items-center gap-4 border border-blue-500/20" id="metric-card-total-leads">
          <div className="p-3 bg-blue-950/80 text-blue-400 rounded-lg border border-blue-800/40">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Leads</p>
            <h3 className="text-2xl font-black text-slate-100">{metrics.totalLeads}</h3>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-card neon-glow-red rounded-xl p-5 hover:scale-102 transition-all flex items-center gap-4 border border-red-500/20" id="metric-card-hot-leads">
          <div className="p-3 bg-red-950/80 text-red-400 rounded-lg border border-red-900/40">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hot Leads</p>
            <h3 className="text-2xl font-black text-red-400">{metrics.hotLeads}</h3>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-card neon-glow-emerald rounded-xl p-5 hover:scale-102 transition-all flex items-center gap-4 border border-emerald-500/20" id="metric-card-enrolled">
          <div className="p-3 bg-emerald-905/80 text-emerald-400 rounded-lg border border-emerald-900/40">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Students Enrolled</p>
            <h3 className="text-2xl font-black text-emerald-400">{metrics.enrolledStudents}</h3>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-card neon-glow-amber rounded-xl p-5 hover:scale-102 transition-all flex items-center gap-4 border border-amber-500/20" id="metric-card-conv-rate">
          <div className="p-3 bg-amber-950/80 text-amber-400 rounded-lg border border-amber-900/40">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conversion Rate</p>
            <h3 className="text-2xl font-black text-amber-400">{metrics.conversionRate}%</h3>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-layout">
        {/* Chart 1: Funnel Analysis */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-[0_4px_12px_rgba(79,96,115,0.02)] flex flex-col" id="chart-card-funnel">
          <div className="mb-4">
            <h4 className="text-lg font-bold text-slate-800">Conversion Funnel</h4>
            <p className="text-xs text-slate-400">Stages in converting inquiries to finalized paid admissions.</p>
          </div>
          <div className="h-60 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={funnelChartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="stage" type="category" stroke="#94a3b8" width={80} style={{ fontSize: "11px" }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: "8px" }} 
                  itemStyle={{ color: "#f8fafc" }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {funnelChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Pipeline Health Status Breakdown (Donut Chart) */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-[0_4px_12px_rgba(79,96,115,0.02)] flex flex-col" id="chart-card-pipeline-health">
          <div className="mb-4">
            <h4 className="text-lg font-bold text-slate-800">Pipeline Health Check</h4>
            <p className="text-xs text-slate-400">Status distribution of current admissions leads.</p>
          </div>
          
          <div className="h-60 flex-1 relative flex items-center justify-center">
            {leads.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: "8px" }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400 text-center">No interactive pipeline health records active.</p>
            )}
            
            <div className="absolute text-center bg-transparent">
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Health Rating</span>
              <span className={`text-sm font-extrabold ${pipelineHealthRating.color} block leading-tight mt-0.5`}>
                {pipelineHealthRating.label}
              </span>
            </div>
          </div>

          {/* Symmetrical Legend */}
          <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-500 overflow-hidden text-ellipsis">
            {statusChartData.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between gap-1.5 truncate">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.fill }}></span>
                  <span className="truncate">{entry.name}</span>
                </div>
                <span className="font-bold text-slate-700">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Course Enrolled Allocation */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-[0_4px_12px_rgba(79,96,115,0.02)] flex flex-col" id="chart-card-courses">
          <div className="mb-4">
            <h4 className="text-lg font-bold text-slate-800">Course Distribution</h4>
            <p className="text-xs text-slate-400">Share of student targets active in pipeline.</p>
          </div>
          <div className="h-60 flex-1 relative flex items-center justify-center">
            {courseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={courseChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {courseChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: "8px" }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400 text-center">No interactive course representation active.</p>
            )}
            <div className="absolute text-center bg-transparent">
              <span className="text-xs text-slate-400 font-medium block font-semibold">Admissions</span>
              <span className="text-2xl font-extrabold text-slate-800 block">
                {metrics.totalLeads + metrics.enrolledStudents}
              </span>
            </div>
          </div>
          {/* Legend customized */}
          <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-500 overflow-hidden text-ellipsis">
            {courseChartData.slice(0, 4).map((entry, idx) => (
              <div key={idx} className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Core Segment: Recent Actions and Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-lower-bento">
        {/* Activity Feed */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-[0_4px_12px_rgba(79,96,115,0.02)] lg:col-span-2" id="timeline-actions-card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-lg font-bold text-slate-800">Recent Engagement Timeline</h4>
              <p className="text-xs text-slate-400">Live feed of calls logged, WhatsApp messages, and conversions.</p>
            </div>
            <button 
              onClick={() => setActiveTab('leads')}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5 active:scale-95 transition-transform"
            >
              Verify Leads <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4" id="recent-activities-container">
            {recentActivities.length > 0 ? (
              recentActivities.map((ev, index) => {
                const isCall = ev.type === "call";
                const isWa = ev.type === "whatsapp";
                const isConv = ev.type === "converted" || ev.type === "status_change";

                return (
                  <div key={ev.id || index} className="flex gap-4 items-start relative group" id={`activity-line-${index}`}>
                    {/* Visual Connector Line */}
                    {index !== recentActivities.length - 1 && (
                      <span className="absolute left-5 top-8 bottom-0 w-0.5 bg-slate-100 group-hover:bg-slate-200 transition-colors"></span>
                    )}

                    {/* Icon Bubble */}
                    <div className={`p-2.5 rounded-full shrink-0 z-10 ${
                      isCall ? "bg-blue-50 text-blue-600" :
                      isWa ? "bg-emerald-50 text-emerald-600" :
                      isConv ? "bg-red-50 text-primary" : "bg-slate-50 text-slate-600"
                    }`}>
                      {isCall && <PhoneCall className="w-4 h-4" />}
                      {isWa && <MessageSquare className="w-4 h-4" />}
                      {isConv && <GraduationCap className="w-4 h-4" />}
                      {!isCall && !isWa && !isConv && <Clock className="w-4 h-4" />}
                    </div>

                    {/* Content Detail */}
                    <div className="flex-1 min-w-0 bg-slate-50/50 p-3 rounded-lg border border-slate-100/50 group-hover:bg-slate-50 transition-all">
                      <div className="flex justify-between items-start gap-2">
                        <h5 className="font-bold text-sm text-slate-800 truncate">
                          {ev.title} <span className="font-normal text-slate-400">for</span> {ev.leadName}
                        </h5>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap font-medium">
                          {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {ev.description}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-400 py-6 text-center">No recruitment engagement events recorded yet.</p>
            )}
          </div>
        </div>

        {/* Dynamic AI Insights Pane */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white border border-indigo-950 rounded-xl p-5 shadow-lg flex flex-col justify-between" id="ai-insight-panel-card">
          <div>
            <div className="flex items-center gap-2 mb-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest">EduGrowth Auto-Pilot</p>
            </div>
            <h4 className="text-lg font-extrabold text-white">Daily Admission Insights</h4>
            <p className="text-xs text-slate-400 mt-1">AI-suggested tasks to maximize student enrollment conversion rate.</p>

            <div className="mt-5 space-y-3">
              <div className="bg-white/5 border border-white/10 p-3 rounded-lg hover:bg-white/10 transition-colors">
                <span className="text-[10px] text-indigo-300 font-bold block mb-0.5">HIGH PRIORITY OUTBREAK</span>
                <p className="text-xs text-slate-200 leading-normal">
                  Follow up with <strong className="text-white hover:underline cursor-pointer" onClick={() => setActiveTab('leads')}>Aryan Sharma</strong>. He was contacted 2 hours ago. His target is <strong className="text-white">CA Foundation</strong> and he is a hot lead!
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 p-3 rounded-lg hover:bg-white/10 transition-colors">
                <span className="text-[10px] text-indigo-300 font-bold block mb-0.5">TEMPLATE STRATEGY</span>
                <p className="text-xs text-slate-200 leading-normal">
                  Draft an AI syllabus outline WhatsApp broadcast for <strong className="text-white">Neha Kapoor</strong> to transition her from Warm to Hot Lead.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Powered by Gemini 3.5</span>
            <button 
              onClick={() => setActiveTab('leads')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all text-[11px]"
            >
              Draft WhatsApp Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
