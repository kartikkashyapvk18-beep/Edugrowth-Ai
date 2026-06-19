import React, { useState, useRef, useEffect } from "react";
import { 
  User, 
  Settings, 
  Plus, 
  Save, 
  BookOpen, 
  MessageSquare, 
  Key, 
  ShieldCheck, 
  Loader2, 
  AlertTriangle,
  Mail,
  Smartphone,
  Award
} from "lucide-react";
import { Course, MessageTemplate } from "../types";

interface SettingsViewProps {
  courses: Course[];
  templates: MessageTemplate[];
  onRefreshCourses: () => void;
  onRefreshTemplates: () => void;
}

export default function SettingsView({ 
  courses, 
  templates, 
  onRefreshCourses, 
  onRefreshTemplates 
}: SettingsViewProps) {
  // Custom Toast Alerts
  const [settingsToast, setSettingsToast] = useState<{ message: string; type: 'success' | 'warning' | 'refusal' } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'refusal' = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setSettingsToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setSettingsToast(null);
    }, 4500);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Course form state
  const [newCourse, setNewCourse] = useState({ name: "", code: "", description: "" });
  const [isAddingCourse, setIsAddingCourse] = useState(false);

  // Template custom edit states
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Create new course stream
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.name || !newCourse.code) {
      showToast("Please fill Course name and code identifier.", "warning");
      return;
    }
    setIsAddingCourse(true);

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCourse)
      });
      if (res.ok) {
        showToast("Course Stream successfully configured!");
        onRefreshCourses();
        setNewCourse({ name: "", code: "", description: "" });
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to create Course.", "refusal");
      }
    } catch (err) {
      console.error(err);
      showToast("Network failure encountered during course configuration.", "refusal");
    } finally {
      setIsAddingCourse(false);
    }
  };

  // Trigger editing static template
  const startEditingTemplate = (tmpl: MessageTemplate) => {
    setEditingTemplateId(tmpl.id);
    setEditingText(tmpl.content);
  };

  // Save modified static templates
  const handleSaveModifiedTemplate = async (tmplId: string) => {
    setIsSavingTemplate(true);
    try {
      // In-memory update on server
      const tmpl = templates.find(t => t.id === tmplId);
      if (!tmpl) return;

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: tmpl.title,
          type: tmpl.type,
          content: editingText
        })
      });

      if (res.ok) {
        onRefreshTemplates();
        setEditingTemplateId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="settings-view-scaffold">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="settings-view-layout">
        
        {/* Left Column (Advisor Bio & AI Credentials status check) - Col-1 */}
        <div className="space-y-6 lg:col-span-1" id="advisor-bio-credentials">
          
          {/* Advisor Profile Card */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-[0_4px_12px_rgba(79,96,115,0.02)] space-y-4" id="advisor-profile-card">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-wide">Registered Advisor bio</h4>
            
            <div className="flex flex-col items-center text-center p-2">
              {/* Profile Avatar Hotlink */}
              <div className="relative">
                <img 
                  alt="Kunal Verma Profile Image" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrvWwbdj5qPcyoAy4oUhKkWTjXmDsn-8qNR60EIxdSYvagG8RAgNTnKtl-RD2UPjm7Jc5fyMKjNdkI9VVldhWO-EAqfoCd6ug9MgonULT0U0UF7Wh1pqb88Qb5KD_uKbeZuBfWLWlBfFL6JTx860DJQkByUIddpXme1_ng1oOD05KeeiDr_S84ouHXvnzUEo_Uq0aYtnoyjyZfJ6yXDMnsN8UON0t0Sc0K6e4-G0hzQCzA84wx5xaGw0osc_xzOaUky14tkWgBW-4"
                  className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 shadow-md"
                />
                <span className="absolute bottom-0 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" title="Active on duty"></span>
              </div>

              <h4 className="text-base font-extrabold text-slate-800 mt-3">Kunal Verma</h4>
              <p className="text-slate-400 text-xs font-semibold">Senior Admissions Director @ EduGrowth AI</p>

              <div className="mt-4 w-full space-y-2.5 text-xs text-slate-600 text-left border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>kunal.v@edugrowth.ai</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-slate-400" />
                  <span>+91 91111 22222</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-700">18 converted seats this month!</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Credentials diagnostics panel */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-[0_4px_12px_rgba(79,96,115,0.02)] space-y-4" id="ai-credentials-diagnostics-card">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Key className="w-4 h-4 text-indigo-500" /> AI Service Diagnostics
            </h4>

            <div className="space-y-3.5">
              <p className="text-xs text-slate-500 leading-normal">
                Personalized and template WhatsApp outbox outlines are drafted using server-side **Gemini 3.5**.
              </p>

              {/* Status Indicator */}
              <div className="p-3 bg-slate-50 border border-slate-100/50 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Model Engine:</span>
                <span className="text-[10px] font-black tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  gemini-3.5-flash
                </span>
              </div>

              <div className="p-3 bg-indigo-50/50 border border-indigo-100/30 rounded-xl space-y-1">
                <span className="text-[10px] text-indigo-700 font-extrabold tracking-wide uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Secure Environment
                </span>
                <p className="text-[11px] text-indigo-800 leading-normal">
                  Credentials are proxy-routed exclusively at port 3000. Under no scenario complies with browser exposure of keys. Configure variables inside the **Secrets UI** panel.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Editable templates list and Course registry) - Col-2 & Col-3 */}
        <div className="lg:col-span-2 space-y-6" id="settings-functional-configurations">
          
          {/* Section: Message template customized */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-[0_4px_12px_rgba(79,96,115,0.02)] space-y-4" id="whatsApp-templates-customization-section">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h4 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
                  <MessageSquare className="w-5 h-5 text-slate-400" /> WhatsApp Template Texts Customizer
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Customize default templates. Use tag variables <strong className="text-slate-600 font-bold">{"{name}"}</strong> and <strong className="text-slate-600 font-bold">{"{course}"}</strong> to parse student info.</p>
              </div>
            </div>

            <div className="space-y-4" id="template-editor-grid">
              {templates.map(tmpl => (
                <div key={tmpl.id} className="border border-slate-100 p-3.5 rounded-xl hover:bg-slate-50/30 transition-all space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-slate-800 leading-none">{tmpl.title} <span className="font-normal text-slate-400">({tmpl.type})</span></span>
                    {editingTemplateId === tmpl.id ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleSaveModifiedTemplate(tmpl.id)}
                          className="px-2.5 py-1 bg-slate-900 border text-white font-bold rounded text-[10px] active:scale-95 transition-transform"
                        >
                          {isSavingTemplate ? "Saving..." : "Save Template"}
                        </button>
                        <button
                          onClick={() => setEditingTemplateId(null)}
                          className="px-2.5 py-1 border border-slate-200 bg-white font-bold text-slate-600 rounded text-[10px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditingTemplate(tmpl)}
                        className="px-2.5 py-1 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold rounded text-[10px] active:scale-95 transition-transform"
                      >
                        Customize Base Text
                      </button>
                    )}
                  </div>

                  {editingTemplateId === tmpl.id ? (
                    <textarea
                      rows={3}
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded text-xs bg-white focus:border-slate-800 outline-none"
                    />
                  ) : (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded border border-slate-100 leading-relaxed font-medium">
                      "{tmpl.content}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section: Academic course registry */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-[0_4px_12px_rgba(79,96,115,0.02)] space-y-4" id="academic-courses-registry-section">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h4 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-5 h-5 text-slate-400" /> Target Academic Offerings Registry
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Configure available target educational courses for admissions profiling.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="course-section-main-bento">
              {/* Courses Grid view */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1" id="settings-courses-list">
                {courses.map(c => (
                  <div key={c.id} className="p-2.5 border border-slate-100 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors flex justify-between items-center">
                    <div>
                      <span className="font-extrabold text-xs text-slate-800 leading-none">{c.name}</span>
                      <span className="block text-[9px] text-slate-400 font-bold tracking-wider uppercase mt-1">CODE: {c.code}</span>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  </div>
                ))}
              </div>

              {/* Add Course Form */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4" id="settings-add-course-form">
                <form onSubmit={handleCreateCourse} className="space-y-3">
                  <h5 className="font-extrabold text-xs text-slate-700 tracking-wide uppercase">Register New Academic Line</h5>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5 tracking-wide uppercase">Course Title *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. UPSC IAS Prep"
                        value={newCourse.name}
                        onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white placeholder-slate-300 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5 tracking-wide uppercase">Identifier Code *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. UPSC_CIVIL"
                        value={newCourse.code}
                        onChange={(e) => setNewCourse({...newCourse, code: e.target.value.toUpperCase()})}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white placeholder-slate-300 font-bold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAddingCourse}
                    className="w-full py-1.5 bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                  >
                    {isAddingCourse ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Add Course Stream
                  </button>
                </form>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* ==================== SYSTEM ALERT TOASTS ==================== */}
      {settingsToast && (
        <div className="fixed top-5 right-5 z-60 animate-bounce max-w-sm bg-slate-900 border border-indigo-500/30 rounded-xl p-4 shadow-2xl flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            settingsToast.type === 'success' ? 'bg-emerald-950 text-emerald-400' :
            settingsToast.type === 'refusal' ? 'bg-rose-950 text-rose-400' :
            'bg-amber-950 text-amber-400'
          }`}>
            {settingsToast.type === 'success' ? '✓' : '⚠️'}
          </div>
          <div>
            <p className="text-xs font-black text-white uppercase tracking-wider">Settings Hub</p>
            <p className="text-xs text-slate-300 font-semibold mt-0.5 leading-relaxed">{settingsToast.message}</p>
          </div>
          <button onClick={() => setSettingsToast(null)} className="text-slate-500 hover:text-white font-bold ml-2">
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
