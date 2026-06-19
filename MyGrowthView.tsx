import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Search, 
  GraduationCap, 
  Coins, 
  BookOpen, 
  Sliders, 
  UserPlus, 
  X, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Phone,
  Mail,
  ChevronDown
} from "lucide-react";
import { Student, Course } from "../types";

interface StudentsViewProps {
  students: Student[];
  courses: Course[];
  onRefreshStudents: () => void;
}

export default function StudentsView({ students, courses, onRefreshStudents }: StudentsViewProps) {
  // Local lookup triggers
  const [searchQuery, setSearchQuery] = useState("");
  
  // Custom toast notifications for system alerts
  const [studentsAlert, setStudentsAlert] = useState<{ message: string; type: 'success' | 'refusal' | 'warning' } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'success' | 'refusal' | 'warning' = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setStudentsAlert({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setStudentsAlert(null);
    }, 4500);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);
  const [courseFilter, setCourseFilter] = useState("All");
  const [feesFilter, setFeesFilter] = useState("All");

  // Modals / Edit triggering
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Edit Form state
  const [editForm, setEditForm] = useState({
    batch: "",
    feesStatus: 'Paid' as 'Paid' | 'Partial' | 'Unpaid',
    onboardingProgress: 0,
    name: "",
    email: "",
    phone: "",
    targetCourse: ""
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Add Manual Student state
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    targetCourse: "",
    batch: "Morning Fast-track Batch A",
    feesStatus: 'Paid' as 'Paid' | 'Partial' | 'Unpaid',
    onboardingProgress: 20
  });
  const [isManualAdding, setIsManualAdding] = useState(false);

  // Filtered Students list
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchSearch = 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.phone.includes(searchQuery) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCourse = courseFilter === "All" || student.targetCourse === courseFilter;
      const matchFees = feesFilter === "All" || student.feesStatus === feesFilter;

      return matchSearch && matchCourse && matchFees;
    });
  }, [students, searchQuery, courseFilter, feesFilter]);

  // Open Edit student form
  const openEditStudentSetup = (student: Student) => {
    setSelectedStudent(student);
    setEditForm({
      name: student.name,
      email: student.email,
      phone: student.phone,
      targetCourse: student.targetCourse,
      batch: student.batch,
      feesStatus: student.feesStatus,
      onboardingProgress: student.onboardingProgress
    });
    setIsEditModalOpen(true);
  };

  // Submit edits
  const handleSaveStudentEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setIsSavingEdit(true);

    try {
      const res = await fetch(`/api/students/${selectedStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        onRefreshStudents();
        setIsEditModalOpen(false);
        setSelectedStudent(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Submit manual addition
  const handleAddNewStudentManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.phone || !addForm.targetCourse) {
      showToast("Please enter Name, phone and target course.", "warning");
      return;
    }
    setIsManualAdding(true);

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm)
      });

      if (res.ok) {
        showToast("Student profile successfully registered in active cohort!");
        onRefreshStudents();
        setIsAddModalOpen(false);
        setAddForm({
          name: "",
          email: "",
          phone: "",
          targetCourse: courses[0]?.name || "CA Foundation",
          batch: "Morning Fast-track Batch A",
          feesStatus: 'Unpaid',
          onboardingProgress: 20
        });
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to enroll student. Verified details required.", "refusal");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error during manual student enrollment.", "refusal");
    } finally {
      setIsManualAdding(false);
    }
  };

  return (
    <div className="space-y-6" id="students-view-scaffold">
      {/* Search and Filters header */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-[0_4px_12px_rgba(79,96,115,0.02)]" id="students-filter-box">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Search enrolled students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50/50 focus:border-slate-800 focus:bg-white outline-none text-sm w-full transition-all"
              id="student-search-input"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2" id="students-filter-selectors">
            {/* Filter by course */}
            <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50/50 hover:bg-white transition-colors">
              <span className="text-xs font-semibold text-slate-500">Course:</span>
              <select 
                value={courseFilter} 
                onChange={(e) => setCourseFilter(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-transparent border-none outline-none cursor-pointer max-w-[130px] truncate"
                id="student-course-select"
              >
                <option value="All">All Courses</option>
                {courses.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Filter by fees status */}
            <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50/50 hover:bg-white transition-colors">
              <span className="text-xs font-semibold text-slate-500">Fees State:</span>
              <select 
                value={feesFilter} 
                onChange={(e) => setFeesFilter(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-transparent border-none outline-none cursor-pointer"
                id="student-fees-select"
              >
                <option value="All">All Fees</option>
                <option value="Paid">Paid Only</option>
                <option value="Partial">Partial Dues</option>
                <option value="Unpaid">Unpaid Only</option>
              </select>
            </div>

            {/* Manual matriculation trigger */}
            <button
              onClick={() => {
                setAddForm(p => ({ ...p, targetCourse: courses[0]?.name || "CA Foundation" }));
                setIsAddModalOpen(true);
              }}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center gap-1.5 text-xs active:scale-95 transition-all shadow-md"
              id="matriculate-student-btn"
            >
              <UserPlus className="w-4 h-4" /> Enroll Student
            </button>
          </div>

        </div>
      </div>

      {/* Grid List of students */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="students-grid-cards">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((stud) => {
            const isFullPaid = stud.feesStatus === "Paid";
            const isPartial = stud.feesStatus === "Partial";
            const isUnpaid = stud.feesStatus === "Unpaid";

            return (
              <div 
                key={stud.id}
                className="bg-white border border-slate-100 rounded-xl p-5 shadow-[0_4px_12px_rgba(79,96,115,0.02)] hover:shadow-md transition-all space-y-4"
                id={`student-profile-${stud.id}`}
              >
                {/* Header Information row */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                      {stud.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 leading-tight">{stud.name}</h4>
                      <p className="text-slate-400 text-[11px] font-medium leading-none mt-1">Enrolled {new Date(stud.enrolledAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Fees collection badge */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase ${
                    isFullPaid ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                    isPartial ? "bg-amber-50 text-amber-700 border border-amber-100" :
                    "bg-red-50 text-red-600 border border-red-100"
                  }`}>
                    {stud.feesStatus === "Paid" && "🟢 Full Paid"}
                    {stud.feesStatus === "Partial" && "🟡 Partial Dues"}
                    {stud.feesStatus === "Unpaid" && "🔴 Unverified: Unpaid"}
                  </span>
                </div>

                {/* Logistics info boxes */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Target Course</span>
                    <span className="font-bold text-slate-700 truncate">{stud.targetCourse}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Active Batch</span>
                    <span className="font-bold text-slate-700 truncate">{stud.batch || "Pending Assignment"}</span>
                  </div>
                </div>

                {/* Sub contact and mails */}
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>{stud.phone}</span>
                  <span className="truncate max-w-[150px]">{stud.email}</span>
                </div>

                {/* Onboarding progress slider */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100" id={`student-onboard-loader-${stud.id}`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500">Onboarding Process Checklist</span>
                    <span className="font-extrabold text-slate-700">{stud.onboardingProgress}%</span>
                  </div>

                  {/* Tracker loader progress track */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        stud.onboardingProgress === 100 ? "bg-emerald-500" :
                        stud.onboardingProgress > 50 ? "bg-primary" : "bg-slate-400"
                      }`}
                      style={{ width: `${stud.onboardingProgress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action trigger footer */}
                <div className="pt-2 flex justify-end gap-1.5">
                  <button 
                    onClick={() => openEditStudentSetup(stud)}
                    className="px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                    id={`student-edit-btn-${stud.id}`}
                  >
                    <Sliders className="w-3.5 h-3.5 text-slate-400" /> Manage Student File
                  </button>
                </div>

              </div>
            );
          })
        ) : (
          <div className="md:col-span-2 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No students enrolled matching search filters.</p>
            <p className="text-xs text-slate-400 mt-1">Convert warm/hot admission leads in the Leads panel to enroll them automatically.</p>
          </div>
        )}
      </div>

      {/* ================= MODAL: MANUAL ENROLLMENT DATA ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="add-student-modal-screen">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scale-in">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center">
              <h4 className="font-extrabold text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-slate-300" /> Direct Student Enrollment Matriculation
              </h4>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewStudentManual} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Student Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Priyanika Sen"
                    value={addForm.name}
                    onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">WhatsApp Contact *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. +91 99000-88000"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({...addForm, phone: e.target.value})}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Email Identifier</label>
                  <input 
                    type="email" 
                    placeholder="e.g. student@gmail.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({...addForm, email: e.target.value})}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Select Course *</label>
                  <select 
                    value={addForm.targetCourse}
                    onChange={(e) => setAddForm({...addForm, targetCourse: e.target.value})}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Assigned Batch</label>
                  <select 
                    value={addForm.batch}
                    onChange={(e) => setAddForm({...addForm, batch: e.target.value})}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50"
                  >
                    <option value="Morning Fast-track Batch A">Morning Fast-track Batch A</option>
                    <option value="Evening regular Batch C">Evening regular Batch C</option>
                    <option value="Weekend Special commerce Batch E">Weekend Special commerce Batch E</option>
                    <option value="Pending - Pending seat assignment">Pending Batch Schedule</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Fees Collection Status</label>
                  <select 
                    value={addForm.feesStatus}
                    onChange={(e) => setAddForm({...addForm, feesStatus: e.target.value as any})}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50"
                  >
                    <option value="Unpaid">🔴 Unpaid</option>
                    <option value="Partial">🟡 Partial / Installments</option>
                    <option value="Paid">🟢 Verified fully Paid</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isManualAdding}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2 shadow-md"
                >
                  {isManualAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Matriculate Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT STUDENT DOSSIER ================= */}
      {isEditModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="edit-student-modal-screen">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-scale-in">
            <div className="bg-slate-950 text-white px-5 py-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Onboarding & Payment Dossier</span>
                <h4 className="font-extrabold text-base text-white">{selectedStudent.name}</h4>
              </div>
              <button 
                onClick={() => { setIsEditModalOpen(false); setSelectedStudent(null); }}
                className="text-slate-400 hover:text-white rounded-full"
              >
                <X className="w-5 h-5 text-slate-100" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentEdits} className="p-5 space-y-4">
              
              {/* Batch Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Assigned Academic Batch</label>
                <select 
                  value={editForm.batch}
                  onChange={(e) => setEditForm({...editForm, batch: e.target.value})}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-5 focus:bg-white outline-none font-bold text-slate-700"
                  id="student-edit-batch-select"
                >
                  <option value="Morning Fast-track Batch A">Morning Fast-track Batch A (08:00 AM)</option>
                  <option value="Evening Regular Batch C">Evening Regular Batch C (04:00 PM)</option>
                  <option value="Weekend commerce Special Batch E">Weekend Special commerce Batch (09:00 AM)</option>
                  <option value="Not Assigned (Pending)">Pending Batch schedule assignment</option>
                </select>
              </div>

              {/* Fees status */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Fees Collection Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Paid', 'Partial', 'Unpaid'] as const).map(fs => (
                    <button
                      key={fs}
                      type="button"
                      onClick={() => setEditForm({...editForm, feesStatus: fs})}
                      className={`px-3 py-2 border rounded-lg text-xs font-bold transition-all ${
                        editForm.feesStatus === fs 
                          ? fs === "Paid" ? "bg-emerald-600 text-white border-emerald-600" :
                            fs === "Partial" ? "bg-amber-500 text-white border-amber-500" :
                            "bg-red-650 bg-red-600 text-white border-red-600"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {fs === "Paid" && "Paid"}
                      {fs === "Partial" && "Partial"}
                      {fs === "Unpaid" && "Unpaid"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Onboarding checklist range */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Onboarding Completion Progress</label>
                  <span className="font-black text-slate-800 text-xs">{editForm.onboardingProgress}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  value={editForm.onboardingProgress}
                  onChange={(e) => setEditForm({...editForm, onboardingProgress: parseInt(e.target.value)})}
                  className="w-full accent-slate-900 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
                  id="onboard-slider"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase pt-1">
                  <span>Registered Seat (0%)</span>
                  <span>Partially Verified</span>
                  <span>Fully Completed (100%)</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setSelectedStudent(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-lg text-xs"
                >
                  Close
                </button>
                <button 
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-md"
                  id="student-save-profile-btn"
                >
                  {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Student Dossier
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================== SYSTEM ALERT TOASTS ==================== */}
      {studentsAlert && (
        <div className="fixed top-5 right-5 z-60 animate-bounce max-w-sm bg-slate-900 border border-indigo-500/30 rounded-xl p-4 shadow-2xl flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            studentsAlert.type === 'success' ? 'bg-emerald-950 text-emerald-400' :
            studentsAlert.type === 'refusal' ? 'bg-rose-950 text-rose-400' :
            'bg-amber-950 text-amber-400'
          }`}>
            {studentsAlert.type === 'success' ? '✓' : '⚠️'}
          </div>
          <div>
            <p className="text-xs font-black text-white uppercase tracking-wider">Cohort Update</p>
            <p className="text-xs text-slate-300 font-semibold mt-0.5 leading-relaxed">{studentsAlert.message}</p>
          </div>
          <button onClick={() => setStudentsAlert(null)} className="text-slate-500 hover:text-white font-bold ml-2">
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
