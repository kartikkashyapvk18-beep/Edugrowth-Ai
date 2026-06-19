import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Plus, 
  X, 
  Sparkles, 
  PhoneCall, 
  MessageSquare, 
  Loader2, 
  Calendar, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  History, 
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { Lead, Course, MessageTemplate, LeadStatus, TimelineEvent } from "../types";

interface LeadsViewProps {
  leads: Lead[];
  courses: Course[];
  templates: MessageTemplate[];
  onRefreshLeads: () => void;
  onRefreshStudents: () => void;
}

export default function LeadsView({ 
  leads, 
  courses, 
  templates, 
  onRefreshLeads, 
  onRefreshStudents 
}: LeadsViewProps) {
  // Local state for searching & filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [courseFilter, setCourseFilter] = useState<string>("All");
  const [selectedLeadForTimeline, setSelectedLeadForTimeline] = useState<string | null>(null);

  // Modals status
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);

  // Selected lead for actions
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  // Ref-based Timers for Call Simulator to guarantee absolute memory cleanups
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Unmount tracker useEffect for call timers
  useEffect(() => {
    return () => {
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
      if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    };
  }, []);

  // System custom non-blocking notification alerts (replaces iframe window.alert blocks)
  const [systemAlert, setSystemAlert] = useState<{ message: string; type: "success" | "refusal" | "warning" } | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: "success" | "refusal" | "warning" = "success") => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    setSystemAlert({ message, type });
    alertTimeoutRef.current = setTimeout(() => {
      setSystemAlert(null);
    }, 4500);
  };

  // Safe cleaner for alert timeout on unmount
  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, []);

  // Soft modal state for delete confirmations (replaces iframe window.confirm blocks)
  const [pendingDeleteLead, setPendingDeleteLead] = useState<{ id: string; name: string } | null>(null);

  // Add Lead Form State
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    targetCourse: "",
    status: "Warm" as LeadStatus,
    notes: ""
  });
  const [isAddingLead, setIsAddingLead] = useState(false);

  // Call Logging State
  const [callTimer, setCallTimer] = useState(0);
  const [isCallingActive, setIsCallingActive] = useState(false); // Calling animation active
  const [isCallConnected, setIsCallConnected] = useState(false); // Call answered
  const [callOutcome, setCallOutcome] = useState("Connected - Highly Interested");
  const [callNotes, setCallNotes] = useState("");
  const [nextLeadStatus, setNextLeadStatus] = useState<LeadStatus>("Hot");
  const [isSavingCall, setIsSavingCall] = useState(false);

  // WhatsApp Drafting State
  const [selectedTmplId, setSelectedTmplId] = useState<string>(templates[0]?.id || "");
  const [waTone, setWaTone] = useState<'professional' | 'encouraging' | 'urgent'>("professional");
  const [waAiPrompt, setWaAiPrompt] = useState("");
  const [waCustomText, setWaCustomText] = useState("");
  const [isDraftingAi, setIsDraftingAi] = useState(false);
  const [isLoggingWa, setIsLoggingWa] = useState(false);
  const [aiCustomNotice, setAiCustomNotice] = useState<string | null>(null);

  // Filtered Leads list
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchSearch = 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === "All" || lead.status === statusFilter;
      const matchCourse = courseFilter === "All" || lead.targetCourse === courseFilter;

      return matchSearch && matchStatus && matchCourse;
    });
  }, [leads, searchQuery, statusFilter, courseFilter]);

  // Handle Add Lead Submission
  const handleAddNewLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.phone || !addForm.targetCourse) {
      showToast("Name, phone and target course are required.", "warning");
      return;
    }
    setIsAddingLead(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm)
      });
      if (res.ok) {
        showToast("New student lead successfully registered in the pipeline!", "success");
        onRefreshLeads();
        setIsAddLeadModalOpen(false);
        setAddForm({
          name: "",
          email: "",
          phone: "",
          targetCourse: courses[0]?.name || "CA Foundation",
          status: "Warm",
          notes: ""
        });
      } else {
        const errorData = await res.json();
        showToast(errorData.error || "Failed to create lead", "refusal");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error occurred during registration.", "refusal");
    } finally {
      setIsAddingLead(false);
    }
  };

  // Open Add Lead Setup
  const openAddLead = () => {
    setAddForm(prev => ({
      ...prev,
      targetCourse: courses[0]?.name || "CA Foundation"
    }));
    setIsAddLeadModalOpen(true);
  };

  // Delete Lead Actions
  const executeDeleteLead = async (id: string) => {
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Lead profile has been permanently deleted.", "success");
        onRefreshLeads();
        if (selectedLeadForTimeline === id) setSelectedLeadForTimeline(null);
      } else {
        showToast("An error occurred while deleting lead profile.", "refusal");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error occurred during deletion.", "refusal");
    }
  };

  // ================= CALL SIMULATION ENGINE =================
  const startCallSim = (lead: Lead) => {
    setActiveLead(lead);
    setCallTimer(0);
    setIsCallingActive(true);
    setIsCallConnected(false);
    setCallNotes("");
    setNextLeadStatus(lead.status === "Converted" ? "Converted" : "Hot");
    setCallOutcome("Connected - Interested and requested resources");
    setIsCallModalOpen(true);

    // Clear any existing timers first to prevent multiple timer overlaps
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    if (callIntervalRef.current) clearInterval(callIntervalRef.current);

    // After 2.8s simulate pick-up
    callTimeoutRef.current = setTimeout(() => {
      setIsCallConnected(true);
      // Start real-time digital stopwatch timer
      callIntervalRef.current = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    }, 2800);
  };

  const stopCallSimTimer = () => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    if (callIntervalRef.current) {
      clearInterval(callIntervalRef.current);
      callIntervalRef.current = null;
    }
  };

  const handleSaveCallLogs = async () => {
    if (!activeLead) return;
    stopCallSimTimer();
    setIsSavingCall(true);

    try {
      const res = await fetch(`/api/leads/${activeLead.id}/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcome: callOutcome,
          duration: callTimer,
          notes: callNotes,
          nextStatus: nextLeadStatus
        })
      });

      if (res.ok) {
        showToast("Call log details successfully synchronized with profile timeline!", "success");
        onRefreshLeads();
        onRefreshStudents();
        setIsCallModalOpen(false);
        setIsCallingActive(false);
        setIsCallConnected(false);
      } else {
        showToast("Failed to save call logs.", "refusal");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error saving call log.", "refusal");
    } finally {
      setIsSavingCall(false);
    }
  };

  const handleCloseCallModal = () => {
    stopCallSimTimer();
    setIsCallModalOpen(false);
    setIsCallingActive(false);
    setIsCallConnected(false);
  };

  // Format Timer duration
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  // ================= WHATSAPP DRAFTING & AI ENGINE =================
  const initiateWhatsAppDrafter = (lead: Lead) => {
    setActiveLead(lead);
    setSelectedTmplId(templates[0]?.id || "");
    setWaTone("professional");
    setWaAiPrompt("");
    setAiCustomNotice(null);
    
    // Set initial text template
    if (templates[0]) {
      const initialContent = templates[0].content
        .replace("{name}", lead.name)
        .replace("{course}", lead.targetCourse);
      setWaCustomText(initialContent);
    } else {
      setWaCustomText("");
    }
    
    setIsWaModalOpen(true);
  };

  // Handle Template change selection
  const handleTemplateSelection = (tmplId: string) => {
    setSelectedTmplId(tmplId);
    const tmpl = templates.find(t => t.id === tmplId);
    if (tmpl && activeLead) {
      const parsedText = tmpl.content
        .replace("{name}", activeLead.name)
        .replace("{course}", activeLead.targetCourse);
      setWaCustomText(parsedText);
    }
  };

  // Call Server-Side Gemini API to generate dynamic message
  const handleGenerateAiDraftMessage = async () => {
    if (!activeLead) return;
    setIsDraftingAi(true);
    setAiCustomNotice(null);

    const tmpl = templates.find(t => t.id === selectedTmplId);

    try {
      const res = await fetch("/api/ai/draft-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: activeLead.id,
          promptNotes: waAiPrompt,
          tone: waTone,
          templateType: tmpl?.title || "Custom Outlines"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setWaCustomText(data.draft);
        if (data.keyConfigured === false) {
          setAiCustomNotice("Using offline semantic preview. Configure Gemini API secrets for fully contextual drafts!");
          showToast("A draft has been generated offline.", "warning");
        } else {
          setAiCustomNotice("Custom draft crafted by Gemini!");
          showToast("Gemini draft successfully composed!", "success");
        }
      } else {
        showToast("Server failed to contact Gemini API. Please check your credentials.", "refusal");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDraftingAi(false);
    }
  };

  // Log Whatsapp Event inside internal timeline
  const handleLogWhatsAppSent = async () => {
    if (!activeLead) return;
    setIsLoggingWa(true);

    const tmpl = templates.find(t => t.id === selectedTmplId);

    try {
      const res = await fetch(`/api/leads/${activeLead.id}/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateTitle: tmpl ? tmpl.title : "Custom AI Message",
          customText: waCustomText
        })
      });

      if (res.ok) {
        onRefreshLeads();
        setIsWaModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingWa(false);
    }
  };

  // Generate External Real WhatsApp Trigger Link
  const openRealWhatsAppExternal = () => {
    if (!activeLead) return;
    // Clean phone number from leading characters
    const cleanPhone = activeLead.phone.replace(/[^0-9]/g, "");
    const encodedText = encodeURIComponent(waCustomText);
    // WhatsApp direct link schema
    const link = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    window.open(link, "_blank");

    // Also log event locally since it was sent
    handleLogWhatsAppSent();
  };

  return (
    <div className="space-y-6 flex flex-col min-h-[500px]" id="leads-screen-root">
      {/* Search and Filters Strip */}
      <div className="bg-[#0b101d]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.4)]" id="leads-filter-strip">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4.5 h-4.5" />
            <input 
              type="text"
              placeholder="Search by name, phone or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-slate-800 rounded-xl bg-[#070b13]/80 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-550 focus:bg-slate-950 outline-none text-xs w-full transition-all font-semibold"
              id="lead-search-input"
            />
          </div>

          {/* Right dropdowns */}
          <div className="flex flex-wrap items-center gap-2" id="leads-filter-dropdowns">
            {/* Status Selector */}
            <div className="flex items-center gap-1.5 border border-slate-800 rounded-xl px-3 py-2 bg-slate-950/60 hover:bg-slate-900 transition-colors text-slate-300">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status:</span>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-bold text-[#818cf8] bg-transparent border-none outline-none cursor-pointer focus:ring-0 [&>option]:bg-slate-950 [&>option]:text-white"
                id="filter-status-select"
              >
                <option value="All">All Leads</option>
                <option value="Hot">🔥 Hot Leads</option>
                <option value="Warm">⚡ Warm Leads</option>
                <option value="Cold">❄️ Cold Leads</option>
                <option value="Converted">✅ Converted</option>
              </select>
            </div>

            {/* Course Selector */}
            <div className="flex items-center gap-1.5 border border-slate-800 rounded-xl px-3 py-2 bg-slate-950/60 hover:bg-slate-900 transition-colors text-slate-300">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Target:</span>
              <select 
                value={courseFilter} 
                onChange={(e) => setCourseFilter(e.target.value)}
                className="text-xs font-bold text-pink-400 bg-transparent border-none outline-none cursor-pointer max-w-[150px] truncate focus:ring-0 [&>option]:bg-slate-950 [&>option]:text-white"
                id="filter-course-select"
              >
                <option value="All">All Courses</option>
                {courses.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Manual Add Lead button */}
            <button 
              onClick={openAddLead}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl flex items-center gap-1.5 text-xs active:scale-95 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] cursor-pointer"
              id="add-lead-btn"
            >
              <Plus className="w-3.5 h-3.5" /> Add Lead
            </button>
          </div>

        </div>
      </div>

      {/* Main Container - Grid or split details pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="leads-grid-manager">
        {/* Leads Cards Feed (Lefty side) */}
        <div className="lg:col-span-2 space-y-4" id="leads-list-cards">
          {filteredLeads.length > 0 ? (
            filteredLeads.map((lead) => {
              const leadInitials = lead.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
              const isHot = lead.status === "Hot";
              const isWarm = lead.status === "Warm";
              const isCold = lead.status === "Cold";
              const isConverted = lead.status === "Converted";

              let targetEmoji = "📚";
              if (lead.targetCourse.includes("CA")) targetEmoji = "📈";
              else if (lead.targetCourse.includes("12th")) targetEmoji = "🧾";
              else if (lead.targetCourse.includes("CS")) targetEmoji = "⚖️";
              else if (lead.targetCourse.includes("JEE")) targetEmoji = "⚙️";
              else if (lead.targetCourse.includes("NEET")) targetEmoji = "🩺";

              const isSelected = selectedLeadForTimeline === lead.id;

              return (
                <div 
                  key={lead.id} 
                  className={`bg-[#0c1221]/50 backdrop-blur-md rounded-2xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.25)] border hover:shadow-indigo-500/10 transition-all flex flex-col md:flex-row gap-4 items-start ${
                    isSelected ? "border-indigo-500 ring-1 ring-indigo-500/20 bg-[#121c33]/55" : "border-slate-800/80"
                  }`}
                  id={`lead-card-${lead.id}`}
                >
                  {/* Lead Round Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-tr from-slate-900 to-indigo-950 rounded-full flex items-center justify-center font-black text-indigo-300 shrink-0 border border-indigo-500/30 shadow-md">
                    {leadInitials}
                  </div>

                  {/* Content space */}
                  <div className="flex-1 space-y-2 w-full">
                    {/* Header line */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-base text-white tracking-tight leading-tight">{lead.name}</h3>
                        <span className="bg-indigo-950/50 border border-indigo-900/60 text-indigo-300 px-2.5 py-0.5 rounded-full font-black text-[10px] inline-flex items-center gap-1 shadow-xs">
                          {targetEmoji} TARGET: {lead.targetCourse}
                        </span>
                      </div>

                      {/* Small Quick Trash edit buttons */}
                      <div className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedLeadForTimeline(isSelected ? null : lead.id)}
                          className={`p-1.5 rounded-lg border transition-all ${isSelected ? 'bg-indigo-650/20 text-indigo-300 border-indigo-500/30' : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'}`}
                          title="Show Pipeline Log History"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setPendingDeleteLead({ id: lead.id, name: lead.name })}
                          className="p-1.5 bg-slate-900 hover:bg-rose-950 hover:text-rose-400 rounded-lg border border-slate-800 hover:border-rose-900/45 text-slate-400 transition-all"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Sub contact line */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-bold">
                        <Phone className="w-3.5 h-3.5 text-indigo-400" /> {lead.phone}
                      </span>
                      {lead.email && (
                        <span className="flex items-center gap-1 font-medium">
                          <Mail className="w-3.5 h-3.5 text-slate-500" /> {lead.email}
                        </span>
                      )}
                    </div>

                    {/* Status badge & notes hint */}
                    <div className="pt-1 select-none flex flex-wrap items-center justify-between gap-2">
                      {/* Status Tag */}
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          isHot ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" : 
                          isWarm ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" : 
                          isCold ? "bg-cyan-400" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                        }`}></span>
                        <span>
                          {isHot && "Hot Prospect"}
                          {isWarm && "Warm Lead"}
                          {isCold && "Cold Lead"}
                          {isConverted && "Enrolled Student"}
                          {" • Contacted "}{new Date(lead.lastContacted).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "N/A"}
                        </span>
                      </div>

                      {/* Notes Summary popup link */}
                      {lead.notes && (
                        <p className="text-[11px] px-2.5 py-1 max-w-[250px] truncate text-slate-300 bg-slate-950/70 border border-slate-900 rounded-lg italic">
                          "{lead.notes}"
                        </p>
                      )}
                    </div>

                    {/* Bottom Action buttons with Primary Blue Glow on Contact */}
                    <div className="pt-3 border-t border-slate-850 flex items-center justify-end gap-2 shrink-0">
                      <button 
                        onClick={() => startCallSim(lead)}
                        disabled={isConverted}
                        className={`px-4 py-2 text-xs font-black rounded-lg flex items-center gap-1.5 active:scale-95 transition-all text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 cursor-pointer ${
                          isConverted ? "opacity-45 cursor-not-allowed" : "shadow-[0_0_15px_rgba(79,70,229,0.6)] hover:shadow-[0_0_22px_rgba(79,70,229,0.85)]"
                        }`}
                        id={`call-lead-btn-${lead.id}`}
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-slate-200 animate-pulse" /> Call Lead
                      </button>
                      <button 
                        onClick={() => initiateWhatsAppDrafter(lead)}
                        className="px-4 py-2 text-xs font-black rounded-lg flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-emerald-950/20 border border-emerald-500/20 cursor-pointer"
                        id={`whatsapp-lead-btn-${lead.id}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-white/90" /> Send WhatsApp Study Material
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-[#0b101d]/60 rounded-2xl border border-dashed border-slate-800 p-12 text-center">
              <Search className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-black uppercase text-slate-400">No matching leads</p>
              <button 
                onClick={() => { setSearchQuery(""); setStatusFilter("All"); setCourseFilter("All"); }}
                className="mt-3 text-xs bg-indigo-950 text-indigo-300 border border-indigo-900/60 font-black px-3 py-1.5 rounded-lg hover:bg-indigo-900 transition-all cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Detail Timeline Sidebar (Righty side) */}
        <div className="lg:col-span-1" id="leads-sidebar-timeline">
          {selectedLeadForTimeline ? (
            (() => {
              const lead = leads.find(l => l.id === selectedLeadForTimeline);
              if (!lead) return null;
              return (
                <div className="bg-[#0c1221]/90 backdrop-blur-lg border border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] sticky top-20 animate-slide-left">
                  <div className="flex justify-between items-start pb-4 border-b border-slate-850">
                    <div>
                      <span className="text-[9px] text-[#818cf8] uppercase font-black tracking-widest block">INTERACTION SYSTEM LOGS</span>
                      <h4 className="text-sm font-extrabold text-white mt-0.5">{lead.name}</h4>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5 tracking-wider">🎯 {lead.targetCourse}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedLeadForTimeline(null)}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* History feed list */}
                  <div className="mt-5 space-y-4 max-h-[380px] overflow-y-auto pr-1" id="sidebar-timeline-logs">
                    {lead.timeline?.map((ev, index) => {
                      const isCreated = ev.type === "created";
                      const isCall = ev.type === "call";
                      const isWa = ev.type === "whatsapp";
                      const isConv = ev.type === "converted";

                      return (
                        <div key={ev.id || index} className="flex gap-3 relative pb-2 group">
                          {index !== lead.timeline.length - 1 && (
                            <span className="absolute left-3 top-6 bottom-0 w-0.5 bg-slate-800"></span>
                          )}

                          {/* Icon marker */}
                          <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center shrink-0 z-10 text-[10px] ${
                            isCreated ? "bg-slate-950 text-slate-400 border border-slate-800" :
                            isCall ? "bg-indigo-950/70 text-indigo-400 border border-indigo-900/60" :
                            isWa ? "bg-emerald-950/70 text-emerald-400 border border-emerald-900/60" :
                            isConv ? "bg-pink-950/70 text-pink-400 border border-pink-900/60" : "bg-slate-900 text-slate-400"
                          }`}>
                            {isCall && "📲"}
                            {isWa && "💬"}
                            {isCreated && "👶"}
                            {isConv && "🎉"}
                            {!isCall && !isWa && !isCreated && !isConv && "⏳"}
                          </div>

                          {/* Details content */}
                          <div className="flex-1 bg-slate-950/60 p-3 rounded-xl border border-slate-900">
                            <div className="flex justify-between items-center flex-wrap gap-1">
                              <span className="font-black text-xs text-slate-100">{ev.title}</span>
                              <span className="text-[9px] text-slate-500 font-extrabold uppercase">
                                {new Date(ev.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 leading-normal whitespace-pre-wrap font-semibold">
                              {ev.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="bg-[#0b101d]/50 rounded-2xl border border-dashed border-slate-800 p-6 text-center text-slate-500 sticky top-20">
              <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h5 className="font-extrabold text-slate-300 text-xs uppercase tracking-wider">Interaction History Tracker</h5>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] mx-auto font-bold leading-relaxed">
                Click the history clockwise log icon on any Lead file card to view active interactive timelines.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL: ADD STUDENT LEAD ================= */}
      {isAddLeadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="add-lead-modal-screen">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scale-in">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center">
              <h4 className="font-extrabold text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-slate-300" /> Create Admission Lead Profile
              </h4>
              <button 
                onClick={() => setIsAddLeadModalOpen(false)}
                className="text-slate-400 hover:text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewLead} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full name */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase mb-1">Full Student Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Priyanika Sen"
                    value={addForm.name}
                    onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:border-slate-800 focus:bg-white outline-none"
                  />
                </div>

                {/* Telephone */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase mb-1">WhatsApp Mobile *</label>
                  <input 
                    type="phone" 
                    required
                    placeholder="e.g. +91 99000 88000"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({...addForm, phone: e.target.value})}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:border-slate-800 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase mb-1">Email ID</label>
                  <input 
                    type="email" 
                    placeholder="e.g. student@gmail.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({...addForm, email: e.target.value})}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:border-slate-800 focus:bg-white outline-none"
                  />
                </div>

                {/* Target Course selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase mb-1">Academic Target Course *</label>
                  <select 
                    value={addForm.targetCourse}
                    onChange={(e) => setAddForm({...addForm, targetCourse: e.target.value})}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:border-slate-800 focus:bg-white outline-none"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Initial Lead Rating */}
              <div>
                <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase mb-1">Encounter Level Rating</label>
                <div className="flex gap-4">
                  {(['Hot', 'Warm', 'Cold'] as LeadStatus[]).map((st) => (
                    <label key={st} className="flex items-center gap-1.5 text-xs text-slate-600 font-bold cursor-pointer">
                      <input 
                        type="radio" 
                        name="add-status"
                        checked={addForm.status === st}
                        onChange={() => setAddForm({...addForm, status: st})}
                        className="text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                      {st === "Hot" && "🔥 Hot"}
                      {st === "Warm" && "⚡ Warm"}
                      {st === "Cold" && "❄️ Cold"}
                    </label>
                  ))}
                </div>
              </div>

              {/* Initial counseling notes */}
              <div>
                <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase mb-1">Counselling Conversation Notes</label>
                <textarea 
                  placeholder="Record what parameters they asked about (batch flexibility, mock test modules etc.)..."
                  rows={3}
                  value={addForm.notes}
                  onChange={(e) => setAddForm({...addForm, notes: e.target.value})}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:border-slate-800 focus:bg-white outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setIsAddLeadModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isAddingLead}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-slate-900 border border-transparent hover:bg-slate-800 text-white flex items-center gap-2 shadow-md"
                >
                  {isAddingLead ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: LOG ACTIVE COUNSELING CALL ================= */}
      {isCallModalOpen && activeLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="call-sim-modal-screen">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-scale-in">
            
            {/* Simulation Header */}
            <div className="bg-slate-950 text-white p-5 flex flex-col items-center justify-center relative">
              <button 
                onClick={handleCloseCallModal}
                className="absolute right-4 top-4 p-1 hover:bg-white/10 rounded-full text-slate-400"
              >
                <X className="w-5 h-5 text-slate-100" />
              </button>

              {/* Glowing Phone Icon Container */}
              <div className={`p-5 rounded-full ${
                isCallConnected ? "bg-emerald-600/20 text-emerald-300 animate-pulse" : "bg-blue-600/20 text-blue-300 animate-bounce"
              }`}>
                <PhoneCall className="w-10 h-10" />
              </div>

              <h4 className="text-xl font-extrabold mt-3">{activeLead.name}</h4>
              <p className="text-sm font-medium text-slate-300">{activeLead.phone}</p>
              
              {/* Timing or Ringing display */}
              <div className="mt-3 px-4 py-1.5 rounded-full text-xs font-extrabold tracking-widest uppercase bg-white/10 text-white shadow-sm flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isCallConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-ping"}`}></span>
                {isCallConnected ? `CONNECTED • ${formatTimer(callTimer)}` : "RINGING SIMULATION..."}
              </div>
            </div>

            {/* Simulated Call Log Capture Form */}
            <div className="p-5 space-y-4">
              <h5 className="font-bold text-sm text-slate-500 tracking-wider uppercase">Active In-Call Counseling Notes</h5>

              {/* Call outcome */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Call Discussion Outcome</label>
                <select 
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50"
                  id="call-outcome-select"
                >
                  <option value="Connected - Highly Interested">Connected • Highly Interested & Requested Syllabus</option>
                  <option value="Connected - Parent requested weekend batch option">Connected • Parent interested in Weekend Batches</option>
                  <option value="Busy - Asked to callback in evening">Busy • Asked to recall later this evening</option>
                  <option value="No Answer - Left standard FollowUp voicemail">No Answer • Left follow up message</option>
                  <option value="Not Interested - Looking for other streams">Not Interested • Reject (Change target stream)</option>
                  <option value="Admissions Converted - Enrolling Immediately">Converted • Immediate Admitted enrollment!</option>
                </select>
              </div>

              {/* Next Lead rating */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Pipeline Next Status Rating</label>
                <select 
                  value={nextLeadStatus}
                  onChange={(e) => setNextLeadStatus(e.target.value as LeadStatus)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50"
                  id="call-next-status-select"
                >
                  <option value="Hot">🔥 Transition status to: Hot Lead</option>
                  <option value="Warm">⚡ Transition status to: Warm Lead</option>
                  <option value="Cold">❄️ Transition status to: Cold Lead</option>
                  <option value="Converted">🎉 Transition status to: Converted (Final Student Enrollment)</option>
                </select>
              </div>

              {/* In-call logs notes */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Discussion Details Log</label>
                <textarea 
                  rows={3}
                  placeholder="Insert custom details discussed, batch choice preferences, scholarship requests etc..."
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:border-slate-800 outline-none"
                  id="call-notes-textarea"
                />
              </div>

              {/* Save Dialog */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Time tracker: {formatTimer(callTimer)}</span>
                <button 
                  onClick={handleSaveCallLogs}
                  disabled={isSavingCall}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-slate-900 border border-transparent hover:bg-slate-800 text-white flex items-center gap-2 shadow-lg"
                  id="save-call-record-btn"
                >
                  {isSavingCall ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : "Save Call Record"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL: SEND WHATSAPP & AI OUTREACH MESSAGE ================= */}
      {isWaModalOpen && activeLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="whatsapp-drafter-modal-screen">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 grid grid-cols-1 lg:grid-cols-12 animate-scale-in">
            
            {/* LEFT INPUT SECTION - Drafting & AI (Col-7) */}
            <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] text-red-600 font-extrabold tracking-widest uppercase block mb-0.5">Custom Outreaches</span>
                    <h4 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                      WhatsApp Broadcaster • <span className="text-secondary font-medium">{activeLead.name}</span>
                    </h4>
                  </div>
                  <button 
                    onClick={() => setIsWaModalOpen(false)}
                    className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Template Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase mb-1">Select Message Template Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {templates.map(tmpl => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleTemplateSelection(tmpl.id)}
                        className={`px-3 py-2 border rounded-lg text-left text-xs font-bold transition-all truncate pb-1.5 ${
                          selectedTmplId === tmpl.id 
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {tmpl.title}
                        <span className="block font-normal text-[10px] opacity-70 truncate mt-0.5">{tmpl.type} brochure</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sparkle Gemini AI drafting assistant */}
                <div className="bg-gradient-to-br from-indigo-50 border border-indigo-100 p-4 rounded-xl space-y-3" id="ai-customizer-box">
                  <div className="flex items-center gap-2 text-indigo-800">
                    <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse shrink-0" />
                    <h5 className="font-extrabold text-sm">Gemini AI Personalized Message Drafter</h5>
                  </div>
                  
                  <p className="text-xs text-indigo-800 leading-normal">
                    Let Gemini write a highly specialized, context-aware WhatsApp outreach. It automatically matches target course <strong className="text-indigo-900 bg-indigo-100/50 px-1 py-0.5 rounded">{activeLead.targetCourse}</strong> and the student's background profile.
                  </p>

                  <div className="grid grid-cols-2 gap-2" id="ai-configuration-substrip">
                    {/* Tone configuration */}
                    <div>
                      <label className="block text-[10px] font-bold text-indigo-600 mb-1 uppercase tracking-wide">Outreach Tone</label>
                      <select 
                        value={waTone} 
                        onChange={(e) => setWaTone(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 border border-indigo-200 rounded-lg text-xs bg-white text-indigo-800 focus:border-indigo-500 outline-none font-semibold"
                        id="ai-tone-select"
                      >
                        <option value="professional">🎓 Professional & Credible</option>
                        <option value="encouraging">🌸 Friendly & Nurturing</option>
                        <option value="urgent">⚡ Action Prompting / Urgent</option>
                      </select>
                    </div>

                    {/* Quick guidelines */}
                    <div>
                      <label className="block text-[10px] font-bold text-indigo-600 mb-1 uppercase tracking-wide">Custom focus notes</label>
                      <input 
                        type="text"
                        placeholder="e.g. highlight weekend trials"
                        value={waAiPrompt}
                        onChange={(e) => setWaAiPrompt(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-indigo-200 rounded-lg text-xs bg-white text-indigo-800 placeholder-indigo-300 focus:border-indigo-500 outline-none"
                        id="ai-custom-focus-input"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAiDraftMessage}
                    disabled={isDraftingAi}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-extrabold text-xs py-2 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all"
                    id="ai-draft-trigger-button"
                  >
                    {isDraftingAi ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Generating beautiful draft...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white" />
                        Craft Custom AI Outreach with Gemini 3.5
                      </>
                    )}
                  </button>
                </div>

                {/* Final custom text */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase mb-1">Outbound SMS/WhatsApp text (Editable)</label>
                  <textarea 
                    value={waCustomText}
                    onChange={(e) => setWaCustomText(e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-slate-50 focus:bg-white focus:border-slate-800 outline-none"
                    placeholder="Enter custom messaging content..."
                    id="whatsapp-text-editor"
                  />
                  {aiCustomNotice && (
                    <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 mt-1">
                      ℹ️ {aiCustomNotice}
                    </span>
                  )}
                </div>

              </div>

              {/* Footer controllers */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsWaModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-lg text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleLogWhatsAppSent}
                  disabled={isLoggingWa}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all"
                  id="log-whatsapp-interaction-btn"
                >
                  {isLoggingWa ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />}
                  Log Message Sent Offline
                </button>
                <button
                  type="button"
                  onClick={openRealWhatsAppExternal}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center gap-1.5 shadow-md shadow-emerald-500/10 transition-all cursor-pointer"
                  id="open-whatsapp-client-btn"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-white" />
                  Launch real WhatsApp & Send!
                </button>
              </div>

            </div>

            {/* RIGHT CONTEXT PREVIEW - Mobile Interface Mockup (Col-5) */}
            <div className="lg:col-span-5 p-6 bg-slate-50 flex items-center justify-center min-h-[400px]">
              {/* Smartphone layout wrapper */}
              <div className="w-[280px] h-[520px] rounded-[32px] bg-slate-950 border-[6px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                
                {/* Smartphone Notch Camera */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full z-20 flex justify-center items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700"></span>
                </div>

                {/* WhatsApp Chat view Header */}
                <div className="bg-emerald-800 text-white pt-7 pb-2 px-3 flex items-center justify-between shadow-md shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6.5 h-6.5 rounded-full bg-emerald-100 flex items-center justify-center font-black text-[10px] text-emerald-800">
                      {activeLead.name.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <h6 className="font-extrabold text-[11px] truncate w-[130px] leading-tight">{activeLead.name}</h6>
                      <span className="font-normal text-[8px] opacity-80 block leading-tight">online</span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-85 text-[10px]">
                    <span>📞</span>
                    <span>🎥</span>
                    <span>⋮</span>
                  </div>
                </div>

                {/* WhatsApp Chat Message Screen Body */}
                <div className="flex-1 p-3 overflow-y-auto space-y-4 bg-[#ece5dd] bg-[radial-gradient(#dfdcd6_1px,transparent_1px)] [background-size:16px_16px] flex flex-col justify-end">
                  
                  {/* Automatic informational stamp */}
                  <div className="bg-[#e1f3fc] text-slate-600 rounded px-2.5 py-1 max-w-[190px] text-[8px] text-center mx-auto shadow-xs font-semibold leading-relaxed uppercase tracking-wider">
                    🔒 Messages are secure and logged internally
                  </div>

                  {/* Dynamic Outbound Chat Bubble */}
                  <div className="bg-[#d9fdd3] text-slate-800 p-2.5 rounded-xl text-[10.5px] font-medium max-w-[210px] ml-auto shadow-[0_1px_1px_rgba(0,0,0,0.12)] border-l-[3px] border-emerald-500 leading-relaxed whitespace-pre-wrap flex flex-col justify-between">
                    <div>
                      {waCustomText || "Draft text to preview in real-time..."}
                    </div>
                    <span className="text-[7.5px] text-slate-400 font-bold ml-auto mt-1 block">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                    </span>
                  </div>

                </div>

                {/* Mock input strip underneath */}
                <div className="bg-[#f0f2f5] p-2 flex items-center gap-1.5 shrink-0 border-t border-slate-200">
                  <div className="flex-1 bg-white rounded-full px-2.5 py-1 text-[9.5px] text-slate-400 flex items-center justify-between border border-slate-100 shadow-sm font-medium">
                    <span>Message</span>
                    <span>📎</span>
                  </div>
                  <div className="w-6.5 h-6.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center text-[10px] shadow active:scale-90 select-none">
                    🛩️
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================== SYSTEM ALERT TOASTS ==================== */}
      {systemAlert && (
        <div className="fixed top-5 right-5 z-60 animate-bounce max-w-sm bg-slate-900 border border-indigo-500/30 rounded-xl p-4 shadow-2xl flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            systemAlert.type === 'success' ? 'bg-emerald-950 text-emerald-400' :
            systemAlert.type === 'refusal' ? 'bg-rose-950 text-rose-400' :
            'bg-amber-950 text-amber-400'
          }`}>
            {systemAlert.type === 'success' ? '✓' : '⚠️'}
          </div>
          <div>
            <p className="text-xs font-black text-white uppercase tracking-wider">System Notification</p>
            <p className="text-xs text-slate-300 font-semibold mt-0.5 leading-relaxed">{systemAlert.message}</p>
          </div>
          <button onClick={() => setSystemAlert(null)} className="text-slate-500 hover:text-white font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* ==================== DELETE DEFERRAL/CONFIRM MODAL ==================== */}
      {pendingDeleteLead && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-slate-800/80 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-900 flex items-center justify-center mx-auto text-rose-400 text-lg">
              🗑️
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Delete Student Prospect Profile?</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Are you sure you want to permanently delete **{pendingDeleteLead.name}**? This action cannot be undone, and all CRM historical logs and Whatsapp timelines will be permanently purged.
              </p>
            </div>
            <div className="flex items-center gap-3.5 pt-2">
              <button 
                onClick={() => setPendingDeleteLead(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-850 text-slate-400 hover:text-white bg-transparent hover:bg-slate-900 transition-all text-xs font-bold font-sans uppercase"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  const targetId = pendingDeleteLead.id;
                  setPendingDeleteLead(null);
                  await executeDeleteLead(targetId);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all text-xs font-extrabold shadow-[0_0_15px_rgba(244,63,94,0.3)] font-sans uppercase"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
