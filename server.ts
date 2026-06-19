import express from "express";
import path from "path";
import http from "http";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Lead, Student, Course, MessageTemplate, TimelineEvent, LeadStatus } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Data Store (Initialized with visual mockup data and realistic records)
let leads: Lead[] = [
  {
    id: "lead_1",
    name: "Aryan Sharma",
    email: "aryan.s@example.com",
    phone: "+91 98765 43210",
    targetCourse: "CA Foundation",
    status: "Hot",
    notes: "Particularly interested in accounts and mercantile law modules. Requested study material on tax laws. Working professional alongside prep.",
    addedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), // 3 days ago
    lastContacted: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
    timeline: [
      {
        id: "ev_1",
        type: "created",
        title: "Lead Created",
        description: "Admissions inquiry form submitted via social media campaign.",
        timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "ev_2",
        type: "call",
        title: "Inbound Call Connected",
        description: "Discussed batch timings and fee layout. Highly interested. Set status to Hot.",
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    id: "lead_2",
    name: "Neha Kapoor",
    email: "neha.k@example.com",
    phone: "+91 87654 32109",
    targetCourse: "12th Board + CUET",
    status: "Warm",
    notes: "School-going student looking for science stream courses with CUET preparation. Parent was also on the call, looking for weekend batches.",
    addedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // added yesterday
    lastContacted: new Date(Date.now() - 18 * 3600 * 1000).toISOString(), // yesterday evening
    timeline: [
      {
        id: "ev_3",
        type: "created",
        title: "Lead Created",
        description: "Inquiry registered via website contact form.",
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    id: "lead_3",
    name: "Rahul Patel",
    email: "rahul.p@example.com",
    phone: "+91 76543 21098",
    targetCourse: "CS Executive",
    status: "Hot",
    notes: "Completed CS Executive Entrance Test (CSEET). Immediate enrollment requested for upcoming executive batch. Needs info on study material kit.",
    addedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
    lastContacted: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    timeline: [
      {
        id: "ev_4",
        type: "created",
        title: "Lead Created",
        description: "Form submitted 10 mins ago via website landing page.",
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "lead_4",
    name: "Ananya Iyer",
    email: "ananya.iyer@example.com",
    phone: "+91 99887 76655",
    targetCourse: "JEE Main + Advanced",
    status: "Cold",
    notes: "Expressed general interest in test series. Called twice, parents requested call back in July.",
    addedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    lastContacted: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    timeline: [
      {
        id: "ev_5",
        type: "created",
        title: "Lead Created",
        description: "Inquiry from Offline Seminars in Pune.",
        timestamp: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "ev_6",
        type: "call",
        title: "Call Logged: Not reachable",
        description: "Ringing but did not pick up standard follow up.",
        timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
      }
    ]
  }
];

let students: Student[] = [
  {
    id: "student_101",
    name: "Vikram Malhotra",
    email: "vikram.m@example.com",
    phone: "+91 90123 45678",
    targetCourse: "CA Foundation",
    batch: "Morning Fast-track Batch A",
    feesStatus: "Paid",
    onboardingProgress: 100,
    enrolledAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "student_102",
    name: "Sneha Reddy",
    email: "sneha.r@example.com",
    phone: "+91 81234 56789",
    targetCourse: "12th Board + CUET",
    batch: "Weekend Batch C",
    feesStatus: "Partial",
    onboardingProgress: 65,
    enrolledAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  }
];

let courses: Course[] = [
  { id: "c_1", name: "CA Foundation", code: "CA_FOUND", description: "Comprehensive coaching for the Chartered Accountancy entrance index exam." },
  { id: "c_2", name: "12th Board + CUET", code: "12_CUET", description: "Dual focus on commerce theory and Common University Entrance Test strategy." },
  { id: "c_3", name: "CS Executive", code: "CS_EXEC", description: "Advanced training modules for Company Secretary Executive stage exams." },
  { id: "c_4", name: "JEE Main + Advanced", code: "JEE", description: "Rigorous preparatory schedule targeting elite Indian engineering options." },
  { id: "c_5", name: "NEET UG", code: "NEET", description: "Medical entrance tutorial featuring expert faculty and testing metrics." }
];

let templates: MessageTemplate[] = [
  {
    id: "tmpl_1",
    title: "Syllabus Copy Outline",
    type: "Syllabus",
    content: "Hi {name}! 👋 Thank you for inquiring about the {course} program at EduGrowth AI. Here is the comprehensive, updated syllabus document you requested. Let's make your study path clear. Reach back if you'd like to schedule an online trial session!"
  },
  {
    id: "tmpl_2",
    title: "5-Year PYQs (Solved)",
    type: "PYQs",
    content: "Hello {name}, 📚 Cracking {course} requires practicing previous exam trends! Here is the download link for the last 5 years' Solved past papers: [edu.growth.ai/pyq-kit]. Our next batch starts soon. Best, EduGrowth Admissions Team."
  },
  {
    id: "tmpl_3",
    title: "Free Evaluation Mock Test",
    type: "MockTest",
    content: "Hey {name}! 🎯 Want to evaluate your stand in {course}? Take our free 45-minute diagnostics test online at [edu.growth.ai/evaluation]. Get individual progress charts instantly! Let's conquer it together."
  },
  {
    id: "tmpl_4",
    title: "Digital Admission Prospectus",
    type: "Prospectus",
    content: "Dear {name}, 🎓 Discover how we achieve our 92.4% conversion and study success! Here is the latest Admission brochure explaining our pedagogy, weekly test formats, and scholarship structure for {course}: [edu.growth.ai/brochure]. Feel free to call us back."
  }
];

// Helper: Lazily get GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // In development, let's gracefully log a warning instead of crashing, but let user know.
      console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. Please configure it in your Secrets Panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// ================= API ENDPOINTS =================

// --- Leads API ---
app.get("/api/leads", (req, res) => {
  res.json(leads);
});

app.post("/api/leads", (req, res) => {
  const { name, email, phone, targetCourse, status, notes } = req.body;
  if (!name || !phone || !targetCourse) {
    return res.status(400).json({ error: "Missing required fields: name, phone, targetCourse" });
  }

  // Sanitize phone for comparison
  const normalizedPhone = phone.replace(/[^0-9]/g, "");
  const isDuplicate = leads.some(l => {
    const lPhone = l.phone.replace(/[^0-9]/g, "");
    const emailMatch = email && l.email && l.email.toLowerCase().trim() === email.toLowerCase().trim();
    return (normalizedPhone && lPhone === normalizedPhone) || emailMatch;
  });

  if (isDuplicate) {
    return res.status(409).json({ error: "A student lead with this phone number or email is already registered in the system!" });
  }

  const randomSuffix = Math.floor(Math.random() * 10000);
  const newLead: Lead = {
    id: `lead_${Date.now()}_${randomSuffix}`,
    name,
    email: email || "",
    phone,
    targetCourse,
    status: status || "Warm",
    notes: notes || "",
    addedAt: new Date().toISOString(),
    lastContacted: new Date().toISOString(),
    timeline: [
      {
        id: `ev_${Date.now()}_${randomSuffix}`,
        type: "created",
        title: "Lead Created",
        description: "Manually created in the pipeline.",
        timestamp: new Date().toISOString()
      }
    ]
  };

  leads.unshift(newLead);
  res.status(201).json(newLead);
});

app.put("/api/leads/:id", (req, res) => {
  const { id } = req.params;
  const { name, email, phone, targetCourse, status, notes } = req.body;

  const leadIndex = leads.findIndex(l => l.id === id);
  if (leadIndex === -1) {
    return res.status(404).json({ error: "Lead not found" });
  }

  const oldStatus = leads[leadIndex].status;
  const currentLead = leads[leadIndex];

  const updatedLead: Lead = {
    ...currentLead,
    name: name !== undefined ? name : currentLead.name,
    email: email !== undefined ? email : currentLead.email,
    phone: phone !== undefined ? phone : currentLead.phone,
    targetCourse: targetCourse !== undefined ? targetCourse : currentLead.targetCourse,
    status: status !== undefined ? status : currentLead.status,
    notes: notes !== undefined ? notes : currentLead.notes,
  };

  // If status changed, add to timeline
  if (status && status !== oldStatus) {
    updatedLead.timeline.unshift({
      id: `ev_${Date.now()}`,
      type: "status_change",
      title: "Status Updated",
      description: `Lead state transitioned from '${oldStatus}' to '${status}'.`,
      timestamp: new Date().toISOString()
    });

    // Check if status is Converted. If so, automatically enroll as a student!
    if (status === "Converted") {
      const alreadyStudent = students.some(s => s.id === `student_${id}` || s.email === updatedLead.email);
      if (!alreadyStudent) {
        const newStudent: Student = {
          id: `student_${Date.now()}`,
          name: updatedLead.name,
          email: updatedLead.email,
          phone: updatedLead.phone,
          targetCourse: updatedLead.targetCourse,
          batch: "Not Assigned (Pending)",
          feesStatus: "Unpaid",
          onboardingProgress: 10,
          enrolledAt: new Date().toISOString()
        };
        students.unshift(newStudent);

        updatedLead.timeline.unshift({
          id: `ev_${Date.now()}_con`,
          type: "converted",
          title: "Enrolled as Student 🎉",
          description: `Successfully converted to a permanent student with onboarding initial progress.`,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  leads[leadIndex] = updatedLead;
  res.json(updatedLead);
});

app.delete("/api/leads/:id", (req, res) => {
  const { id } = req.params;
  const initialLen = leads.length;
  leads = leads.filter(l => l.id !== id);
  if (leads.length === initialLen) {
    return res.status(404).json({ error: "Lead not found" });
  }
  res.json({ success: true, message: "Lead removed" });
});

// Logs a phone call interaction
app.post("/api/leads/:id/call", (req, res) => {
  const { id } = req.params;
  const { outcome, duration, notes, nextStatus } = req.body;

  const leadIndex = leads.findIndex(l => l.id === id);
  if (leadIndex === -1) {
    return res.status(404).json({ error: "Lead not found" });
  }

  const lead = leads[leadIndex];
  const oldStatus = lead.status;
  const timestamp = new Date().toISOString();

  // Create call event
  const callEvent: TimelineEvent = {
    id: `ev_call_${Date.now()}`,
    type: "call",
    title: `Call Logged: ${outcome}`,
    description: `Duration: ${duration}s. Notes: ${notes || "No call notes recorded."}`,
    timestamp
  };

  lead.timeline.unshift(callEvent);
  lead.lastContacted = timestamp;

  if (nextStatus && nextStatus !== oldStatus) {
    lead.status = nextStatus;
    lead.timeline.unshift({
      id: `ev_stat_${Date.now()}`,
      type: "status_change",
      title: "Status Promotion via Call",
      description: `Transitioned state from '${oldStatus}' to '${nextStatus}'.`,
      timestamp
    });

    if (nextStatus === "Converted") {
      const alreadyStudent = students.some(s => s.email === lead.email);
      if (!alreadyStudent) {
        students.unshift({
          id: `student_${Date.now()}`,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          targetCourse: lead.targetCourse,
          batch: "Not Assigned (Pending)",
          feesStatus: "Unpaid",
          onboardingProgress: 10,
          enrolledAt: timestamp
        });
        lead.timeline.unshift({
          id: `ev_${Date.now()}_con`,
          type: "converted",
          title: "Enrolled as Student 🎉",
          description: `Successfully converted to a permanent student with onboarding initial progress.`,
          timestamp
        });
      }
    }
  }

  leads[leadIndex] = lead;
  res.json({ success: true, lead });
});

// Logs a WhatsApp interaction
app.post("/api/leads/:id/whatsapp", (req, res) => {
  const { id } = req.params;
  const { templateTitle, customText } = req.body;

  const leadIndex = leads.findIndex(l => l.id === id);
  if (leadIndex === -1) {
    return res.status(404).json({ error: "Lead not found" });
  }

  const lead = leads[leadIndex];
  const timestamp = new Date().toISOString();

  // Create whatsapp event
  const whatsappEvent: TimelineEvent = {
    id: `ev_wa_${Date.now()}`,
    type: "whatsapp",
    title: `WhatsApp Sent: ${templateTitle || "Study Resource"}`,
    description: customText ? `Content: "${customText}"` : "Sent automated messaging study materials.",
    timestamp
  };

  lead.timeline.unshift(whatsappEvent);
  lead.lastContacted = timestamp;

  leads[leadIndex] = lead;
  res.json({ success: true, lead });
});


// --- Students API ---
app.get("/api/students", (req, res) => {
  res.json(students);
});

app.post("/api/students", (req, res) => {
  const { name, email, phone, targetCourse, batch, feesStatus, onboardingProgress } = req.body;
  if (!name || !phone || !targetCourse) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Sanitize phone for duplicate check
  const normalizedPhone = phone.replace(/[^0-9]/g, "");
  const isDuplicate = students.some(s => {
    const sPhone = s.phone.replace(/[^0-9]/g, "");
    const emailMatch = email && s.email && s.email.toLowerCase().trim() === email.toLowerCase().trim();
    return (normalizedPhone && sPhone === normalizedPhone) || emailMatch;
  });

  if (isDuplicate) {
    return res.status(409).json({ error: "An enrolled student with this phone number or email already exists!" });
  }

  const randomSuffix = Math.floor(Math.random() * 10000);
  const newStudent: Student = {
    id: `student_${Date.now()}_${randomSuffix}`,
    name,
    email: email || "",
    phone,
    targetCourse,
    batch: batch || "Not Assigned",
    feesStatus: feesStatus || "Unpaid",
    onboardingProgress: onboardingProgress !== undefined ? onboardingProgress : 0,
    enrolledAt: new Date().toISOString()
  };

  students.unshift(newStudent);
  res.status(201).json(newStudent);
});

app.put("/api/students/:id", (req, res) => {
  const { id } = req.params;
  const { batch, feesStatus, onboardingProgress, name, email, phone } = req.body;

  const stIndex = students.findIndex(s => s.id === id);
  if (stIndex === -1) {
    return res.status(404).json({ error: "Student not found" });
  }

  const currentStudent = students[stIndex];
  students[stIndex] = {
    ...currentStudent,
    name: name !== undefined ? name : currentStudent.name,
    email: email !== undefined ? email : currentStudent.email,
    phone: phone !== undefined ? phone : currentStudent.phone,
    batch: batch !== undefined ? batch : currentStudent.batch,
    feesStatus: feesStatus !== undefined ? feesStatus : currentStudent.feesStatus,
    onboardingProgress: onboardingProgress !== undefined ? onboardingProgress : currentStudent.onboardingProgress
  };

  res.json(students[stIndex]);
});


// --- Courses API ---
app.get("/api/courses", (req, res) => {
  res.json(courses);
});

app.post("/api/courses", (req, res) => {
  const { name, code, description } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: "Missing name or code" });
  }
  const newCourse: Course = {
    id: `c_${Date.now()}`,
    name,
    code,
    description
  };
  courses.push(newCourse);
  res.status(201).json(newCourse);
});


// --- Templates API ---
app.get("/api/templates", (req, res) => {
  res.json(templates);
});

app.post("/api/templates", (req, res) => {
  const { title, type, content } = req.body;
  if (!title || !type || !content) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const newTmpl: MessageTemplate = {
    id: `tmpl_${Date.now()}`,
    title,
    type,
    content
  };
  templates.push(newTmpl);
  res.status(201).json(newTmpl);
});


// --- AI Generation API (Gemini Integration) ---

// 1. WhatsApp Draft Counselor Assistant (Hinglish, < 120 words, Lead AI Admissions Strategist)
app.post("/api/ai/draft-whatsapp", async (req, res) => {
  const { leadId, promptNotes, tone, templateType } = req.body;

  const lead = leads.find(l => l.id === leadId);
  if (!lead) {
    return res.status(404).json({ error: "Selected Lead not found" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    // Elegant fallback adhering strictly to requested guidelines
    const simulatedDraft = `Hi *${lead.name}*! Kunal Verma here, Senior Admissions Director @ EduGrowth AI. 😊 

I saw you are targeting *${lead.targetCourse}*. Last year, *92.4%* of our students cracked it using our tailored DPPs & weekly mentorship! 🚀

${lead.notes ? `Mujhe yaad hai, aapne bataya tha: "${lead.notes}".` : "Syllabus pattern easily crack karne ke liye humne exclusive planning banayi hai."}

Aapke level ko analyze karne ke liye I want to offer a *Free Solved 5-Year PYQ Kit* or an exclusive premium online trial class tomorrow. Hum connect karein? Chalo let me know! 👍`;
    
    return res.json({ draft: simulatedDraft, keyConfigured: false });
  }

  try {
    const api = getGeminiClient();
    const resolvedTone = tone || "encouraging";
    
    const systemPrompt = `You are "Lead AI Admissions Strategist" for EduGrowth AI, working closely with Senior Counselor Kunal Verma. Your job is to draft a hyper-personalized, high-converting WhatsApp message for a prospective student.
- Language: Natural Hinglish (the way young Indian students and parents actually text - e.g., using English letters to write casual Hindi words: 'Aapki preparation', 'Humare pass' etc.). Do NOT use robotic or pure formal English.
- Structure:
  1. Greeting from Kunal Verma (mentioning designation: Senior Admissions Director).
  2. Direct reference to their target course and a specific value hook (e.g., "I saw you are targetting JEE Main. Last year 92.4% of our students cracked it using our tailored DPPs...").
  3. A clear call-to-action (CTA) inviting them to an exclusive online trial session or offering a free Solved 5-Year PYQ Kit.
- Formatting: Use bold markers (*text*) for key focus words and strategically place emojis to make the message visually scannable on a smartphone screen.
- Constraints: Keep it under 120 words. Absolutely no corporate jargon. No XML/JSON, output purely the raw message. Use actual student name "${lead.name}" directly.`;

    const prompt = `Draft follow-up WhatsApp outreach message for student:
- Name: "${lead.name}"
- Course Target: "${lead.targetCourse}"
- Interaction Notes: "${lead.notes || "Showed passion for visual question shortcuts."}"
- Template Type: "${templateType || "PYQs and Study Guidelines"}"
- Additional requested context: "${promptNotes || "None."}"
- Tone constraint: "${resolvedTone}"`;

    const response = await api.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.75,
      }
    });

    const draftText = response.text || "";
    res.json({ draft: draftText.trim(), keyConfigured: true });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Failed to connect to Gemini API", details: error.message });
  }
});

// 2. EduGrowth Saarthi (PW-Style Academic Doubt Solver)
app.post("/api/ai/solve-doubt", async (req, res) => {
  const { doubt, course, history } = req.body;
  if (!doubt) {
    return res.status(400).json({ error: "Doubt question is required" });
  }

  const selectedCourse = course || "JEE";
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    // Beautiful default fallback depending on exam subject and conversational state
    let content = "";
    const isFollowUp = history && Array.isArray(history) && history.length > 1;

    if (isFollowUp) {
      const queryLower = doubt.toLowerCase();
      if (queryLower.includes("trick") || queryLower.includes("shortcut") || queryLower.includes("short") || queryLower.includes("jugaad")) {
        content = `🔥 **Encouraging Opener**: Haha, shortcut trick / jugaad chahiye? Absolutely! Saarthi is here to save your time. Let's look at the killer concept hack!

🎯 **The Core Concept**: Competitive exams me time bachane ke liye standard ratio patterns or symmetry results ko direct apply karna chahiye. Skip long integration/derivation routes!

🔢 **Step-by-Step Breakdown**:
- **Step 1**: Target standard proportionality: $T^2 \\propto R^3$, hence $T_{new} / T_{old} = (R_{new} / R_{old})^{1.5}$.
- **Step 2**: Apply fast cube/square operations. If $R$ reduces to $1/4$th, compute $(1/4)^{1.5} = (1/2)^3 = 1/8$.
- **Step 3**: Direct multiplier within 2 seconds! Multiplying old duration with $1/8$.
- **Step 4**: Same trick works for Partnership sacrifice: If no new sacrifice ratio is specified, the old sharing ratio (e.g. 3:2) behaves natively as sacrifice ratio!

⚠️ **Common Trap (Mistake Alert)**: Silly mistake tab hoti hai jab aap shortcut key direct equations pe apply karte ho bina check kiye ki standard assumptions (like constant gravity or uniform sharing) satisfy ho rahe hain ya nahi.

💪 **Closing Motivation**: Work hard but study SMART! Aisi special tricks copy me highlight karke rakho aur revision me master karo. You will crack it! Let's go!`;
      } else if (queryLower.includes("explain") || queryLower.includes("why") || queryLower.includes("how") || queryLower.includes("kyun") || queryLower.includes("kyu")) {
        content = `🔥 **Encouraging Opener**: Bilkul deep me samjhte hain! "Why" ya "Kyun" puchna is a sign of a true future ranker. Let's clear the root mechanism!

🎯 **The Core Concept**: Pure memorization is temporary, but understanding first principles makes concepts permanent in your subconscious mind!

🔢 **Step-by-Step Breakdown**:
- **Step 1**: Gravity and Orbital velocity derive directly from balancing centripetal pull: $G M m / R^2 = m v^2 / R$.
- **Step 2**: Since linear velocity $v = 2\\pi R / T$, substituting it gives: $G M / R = 4\\pi^2 R^2 / T^2$.
- **Step 3**: Re-arrange carefully to separate variables: $T^2 = (4\\pi^2 / G M) \\cdot R^3$. 
- **Step 4**: The fraction $(4\\pi^2 / G M)$ is purely a constant. That is why Kepler's Third law holds!

⚠️ **Common Trap (Mistake Alert)**: Formula direct memorize karne me student constants ko bhul jaate hain. Physics me unit dimensions matching should always guide your checks!

💪 **Closing Motivation**: Concepts clean honge toh paper me confidence level alag hi asmaan par hoga! Practice everyday, I am always here to guide you. You are unstoppable!`;
      } else if (queryLower.includes("mistake") || queryLower.includes("error") || queryLower.includes("galti")) {
        content = `🔥 **Encouraging Opener**: Sabse common mistakes review karna is the secret of 100 percentlers! Let's pinpoint where students compromise points.

🎯 **The Core Concept**: Under high peer exam pressure, candidates make silly calculation errors or interpret questions incorrectly. Identifying pitfalls eliminates negative markings.

🔢 **Step-by-Step Breakdown**:
- **Step 1**: Non-Uniform assumptions: Assuming acceleration due to gravity is uniform at cosmic distances.
- **Step 2**: Misreading Goodwill allocation rules: Multiplying standard incoming premium directly in the old profit sharing instead of calculated Sacrificing partner ratios.
- **Step 3**: Dimensional flaws: Mismatching standard SI values (using hours instead of absolute seconds or kg instead of standard grams).
- **Step 4**: Overconfidence trap: Choosing Option A in a hurry, which is usually the common trap answer! Always analyze all four choices.

⚠️ **Common Trap (Mistake Alert)**: Always circle keywords like "NOT", "INCORRECT", "STATIONARY" in the question paper and re-verify before finalizing answers.

💪 **Closing Motivation**: Galtiyon se hi seekh kar topper bante hain! Har galti ko ek learning opportunities ki tarah dekhein. Cheer up, you have got this!`;
      } else {
        content = `🔥 **Encouraging Opener**: Bahut hi solid follow up question pucha aapne! Chalo is concept context ko completely details me build up karte hain.

🎯 **The Core Concept**: Dynamic doubt solving helps bridge minor conceptual gaps instantly. Let's relate this straight to our core study stream guidelines!

🔢 **Step-by-Step Breakdown**:
- **Step 1**: Analyze request context against current exam syllabi.
- **Step 2**: Differentiate primary and secondary variables to formulate equations.
- **Step 3**: Execute computations step-by-step or compile theoretical markers.
- **Step 4**: Arrive at final logical deduction for your exact query: "${doubt}".

⚠️ **Common Trap (Mistake Alert)**: Avoid shifting topics frequently. Master one sub-concept completely before introducing multiple complex branches!

💪 **Closing Motivation**: Your continuous query flow shows incredible dedication. Keep asking, keep shining! Saarthi and EduGrowth are super proud of you. Let's study!`;
      }
    } else {
      if (selectedCourse === "JEE" || selectedCourse.toLowerCase().includes("math") || selectedCourse.toLowerCase().includes("physics")) {
        content = `🔥 **Encouraging Opener**: Hello Future IITian! Bilkul darna nahi hai, let's crush this Kepler's Mechanics/Physics doubt together with full power!

🎯 **The Core Concept**: Time period squared ($T^2$) is directly proportional to semi-major axis cubed ($R^3$). Kepler's third law kehte hai isse! Orbital motion increases as radius shrinks to conserve total angular momentum.

🔢 **Step-by-Step Breakdown**:
- **Step 1**: Law state kijiye: $T^2 \\propto R^3$. 
- **Step 2**: Create ratio equation for orbital time period comparisons: $(T_1/T_2)^2 = (R_1/R_2)^3$.
- **Step 3**: Let's substitute $R_2 = 1/4 R_1$ (since earth's orbital radius is reduced to 1/4th of current). Then: 
  $(T_2/T_1)^2 = (R_2 / R_1)^3 = (1/4)^3 = 1/64$.
- **Step 4**: Take the square root on both sides to find relation: 
  $T_2/T_1 = \\sqrt{1/64} = 1/8$
- **Step 5**: Therefore, new orbital year time $T_2 = 1/8 \\times T_1$. Orbital year is reduced to 1/8th of its original duration (approx 45.6 days)!

⚠️ **Common Trap (Mistake Alert)**: Students usually write $T \\propto R$, making a silly mistake like writing $T_2 = 1/4 T_1$. Ya fir cube karke square root lene me galti kar dete hain! Equation ko hamesha dhyan se solve karein.

💪 **Closing Motivation**: Momentum bilkul break nahi hona chahiye! Din raat mehnat karo, success tumhara wait kar rahi hai. Padhte raho! You will crack JEE!`;
      } else if (selectedCourse === "CA Foundation") {
        content = `🔥 **Encouraging Opener**: Hello Future Chartered Accountant! Let's clear this Partnership Goodwill journal adjustment entry doubt beautifully!

🎯 **The Core Concept**: Goodwill brought in cash by a new partner is distributed ONLY among sacrificed partner files in their *Sacrifice Ratio* ($Old Ratio - New Ratio$), not the old ratio!

🔢 **Step-by-Step Breakdown**:
- **Step 1**: Calculate the Sacrifice Ratio. Let old share be 3:2 (A and B) and new candidate incoming fraction be 1/5.
- **Step 2**: Calculate Partner A's sacrifice = $3/5 - New Share$. If no new ratio is given, the old ratio 3:2 itself is the Sacrifice Ratio.
- **Step 3**: Record Journal Entry 1 (Capital and Goodwill brought in):
  \`Debit: Bank A/c\`
  \`Credit: New Partner's Capital A/c\`
  \`Credit: Premium for Goodwill A/c\`
- **Step 4**: Record Entry 2 (Premium distribution):
  \`Debit: Premium for Goodwill A/c\`
  \`Credit: Sacrificing Partners' Capital A/c\` (In 3:2 sacrificing ratio)

⚠️ **Common Trap (Mistake Alert)**: Sabse badi aur common mistake hai premium for goodwill ko directly traditional capital profit-sharing ratio (3:2) me allocate kar dena bina check kiye ki standard Sacrifice ratio badla toh nahi! Hamesha state ratio carefully verify kijiye first!

💪 **Closing Motivation**: Concept is King! Ek ek transaction ko logic se samjho toh ledger apne aap match hoga. Keep shining! You will be a brilliant CA!`;
      } else if (selectedCourse === "NEET") {
        content = `🔥 **Encouraging Opener**: Hello Future Doctor! Let's master the Calvin Cycle biochemistry equations! Biosynthesis is highly testable in NEET. Let's make it clear.
        
🎯 **The Core Concept**: For the manufacture of one single direct molecule of Glucose ($C_6H_{12}O_6$), the cycle must turn exactly 6 times. Each turn requires specific ATP and NADPH fractions.

🔢 **Step-by-Step Breakdown**:
- **Step 1**: In 1 single turn of the Calvin cycle (dark reaction), 3 ATP and 2 NADPH are consumed during fixation, reduction, and regeneration.
- **Step 2**: To fix 6 molecules of Carbon Dioxide ($CO_2$) to create 1 Glucose molecule, we need 6 full turns of the pathway.
- **Step 3**: Calculate total ATP = $6 \\text{ turns} \\times 3 \\text{ ATP/turn} = 18 \\text{ ATP}$.
- **Step 4**: Calculate total NADPH = $6 \\text{ turns} \\times 2 \\text{ NADPH/turn} = 12 \\text{ NADPH}$.
- **Step 5**: Net requirement: 18 ATP and 12 NADPH.

⚠️ **Common Trap (Mistake Alert)**: NEET candidates often confuse the ratio or invert standard values, stating 12 ATP and 18 NADPH. Remember, ATP requirement is always higher because of the regeneration step of Ribulose-1,5-bisphosphate (RuBP)!

💪 **Closing Motivation**: Master every pathway like an open map! Your stethoscope is calling. Believe in your potential and study hard, NEET selection is near!`;
      } else {
        content = `🔥 **Encouraging Opener**: Hello Future Ranker! Let's conquer this important competitive exam concept together with full high energy!

🎯 **The Core Concept**: Koi bhi bada topic crack karne ke liye, core definition aur first principles ko clear rakhna zaroori hai. Chalo conceptual base clear karte hain.

🔢 **Step-by-Step Breakdown**:
- **Step 1**: Sabse pehle identify karein framework, historical context ya underlying equation.
- **Step 2**: Step-by-Step core components ko differentiate karein.
- **Step 3**: Logical linkage ya mathematical reduction formula apply kijiye.
- **Step 4**: Direct application problem models compare karke evaluate kijiye: "${doubt}".

⚠️ **Common Trap (Mistake Alert)**: Jaldbazi me formula galat coordinate check karna ya absolute negative marks silly mistake se avoid kijiye! Double check boundaries before selecting final options.

💪 **Closing Motivation**: Akele nahi ho aap is journey me, EduGrowth Saarthi is always behind you. Pura dhyan lagayi rakhein, success is yours! Let's crack this!`;
      }
    }

    return res.json({ solution: content, keyConfigured: false });
  }

  try {
    const api = getGeminiClient();
    const systemPrompt = `You are "EduGrowth Saarthi," an elite, empathetic, and brilliant academic mentor inspired by the teaching style of Physics Wallah. Your goal is to solve student doubts for competitive exams (JEE, NEET, CA Foundation, UPSC) with absolute clarity, extreme passion, and high energy. You are handling a conversational, multi-turn chat experience (like ChatGPT). Maintain standard context and reference previous points in the thread if relevant.

Strictly adhere to the following response structure:
1. 🔥 **Encouraging Opener**: Start with a high-energy, motivational phrase in natural Hinglish/English connected to their question or state.
2. 🎯 **The Core Concept**: Explain the underlying formula, law, or core concept in 2 simple lines using plain Hinglish.
3. 🔢 **Step-by-Step Breakdown**: Provide a bulleted, highly detailed, step-by-step mathematical, accounting, or logical solution. Use standard formatting for equations.
4. ⚠️ **Common Trap (Mistake Alert)**: Explicitly mention where students usually make a silly mistake in this type of question.
5. 💪 **Closing Motivation**: End with a powerful encouraging sign-off.

Tone: Friendly, passionate, deeply supportive, and authoritative. Teach the "why", never just the raw answer.`;

    // Map history to standard Gemini SDK contents structure
    let promptContents: any[] = [];
    if (history && Array.isArray(history) && history.length > 0) {
      promptContents = history.map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }]
      }));
      // Double check if the last item is the current doubt. If not, append it.
      const lastMsg = history[history.length - 1];
      if (lastMsg.content !== doubt) {
        promptContents.push({ role: "user", parts: [{ text: doubt }] });
      }
    } else {
      promptContents = [{ role: "user", parts: [{ text: doubt }] }];
    }

    const response = await api.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptContents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.72,
      }
    });

    res.json({ solution: response.text || "", keyConfigured: true });

  } catch (error: any) {
    console.error("Doubt Solver API Error:", error);
    res.status(500).json({ error: "Failed to connect to Doubt Solver API", details: error.message });
  }
});

// 3. DPP Quiz Generator (5 Questions JSON format)
app.post("/api/ai/generate-dpp", async (req, res) => {
  const { topic, difficulty } = req.body;
  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }

  const diffLevel = difficulty || "Moderate";
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    // Return custom mock quizzes based on topic key
    const mockQuizzes: Record<string, any[]> = {
      "mechanics": [
        {
          id: 1,
          question: "A rocket of mass 1000 kg is launched vertically. If its fuel burns at 10 kg/s ejecting gases at 2000 m/s relative to rocket, find the initial acceleration? (g = 10 m/s²)",
          options: ["10 m/s²", "20 m/s²", "15 m/s²", "5 m/s²"],
          correctAnswer: "10 m/s²",
          explanation: "Thrust force F = v * (dm/dt) = 2000 m/s * 10 kg/s = 20,000 N. Net Force = Thrust - mg = 20,000 - 10,000 = 10,000 N. Acceleration = Net Force / Mass = 10,000 / 1000 = 10 m/s²."
        },
        {
          id: 2,
          question: "A block of mass m is placed on a smooth wedge of angle θ. What horizontal acceleration must be given to the wedge so the block remains stationary relative to wedge?",
          options: ["g sin θ", "g cos θ", "g tan θ", "g cot θ"],
          correctAnswer: "g tan θ",
          explanation: "For block to be stationary, pseudo force must balance components. Resolving forces shows ma cos θ = mg sin θ => a = g tan θ."
        },
        {
          id: 3,
          question: "A 5kg block is pulled on a rough horizontal surface (μk = 0.2) by a constant force of 20N. What is the friction force acting on it?",
          options: ["10 N", "9.8 N", "20 N", "4 N"],
          correctAnswer: "9.8 N",
          explanation: "Frictional force f_k = μk * Normal force = μk * m * g = 0.2 * 5 * 9.8 = 9.8 N."
        },
        {
          id: 4,
          question: "What is the work done by static friction on a block sliding down an inclined plane?",
          options: ["Zero", "Positive", "Negative", "Depends on speed"],
          correctAnswer: "Zero",
          explanation: "For sliding blocks, there is no relative displacement at contact points for static friction (it is actually kinetic friction). Hence static friction work done is zero."
        },
        {
          id: 5,
          question: "HOTS (High Order thinking): A bead of mass m can slide along a smooth circular wire of radius R in a vertical plane. The wire rotates with angular velocity ω. What is the stable equilibrium angle θ?",
          options: ["cos θ = g/(R ω²)", "sin θ = g/(R ω²)", "cos θ = R ω²/g", "Zero"],
          correctAnswer: "cos θ = g/(R ω²)",
          explanation: "Taking balance of centrifugal and gravity: m R ω² sin θ cos θ = mg sin θ which reduces to cos θ = g/(R ω²). Valid for ω > √(g/R)."
        }
      ],
      "constitution": [
        {
          id: 1,
          question: "Which of the following Articles deals with the Right to Constitutional Remedies in the Indian Constitution?",
          options: ["Article 21", "Article 32", "Article 14", "Article 19"],
          correctAnswer: "Article 32",
          explanation: "Article 32 gives citizens the right to move the Supreme Court for enforcement of Fundamental Rights, called the 'Heart and Soul' of the Constitution by Dr. Ambedkar."
        },
        {
          id: 2,
          question: "Under the Indian Constitution, the Directive Principles of State Policy are borrowed from which country?",
          options: ["USA", "Ireland", "USSR", "Australia"],
          correctAnswer: "Ireland",
          explanation: "The Directive Principles of State Policy (Part IV) were borrowed from the Irish Constitution."
        },
        {
          id: 3,
          question: "Which Constitutional Amendment is famously known as the 'Mini-Constitution' of India?",
          options: ["44th Amendment", "42nd Amendment", "24th Amendment", "73rd Amendment"],
          correctAnswer: "42nd Amendment",
          explanation: "The 42nd Amendment Act (1976) introduced comprehensive changes, including words Socialist, Secular, Integrity to the Preamble."
        },
        {
          id: 4,
          question: "The power of judicial review in the Indian Constitution is base on:",
          options: ["Due process of law", "Procedure established by law", "Rule of law", "Precedents and conventions"],
          correctAnswer: "Procedure established by law",
          explanation: "Indian Constitution relies on 'Procedure Established by Law' under Article 21, although judiciary often interprets it closer to 'Due Process'."
        },
        {
          id: 5,
          question: "HOTS: Consider the Federal Balance in India. Which Union Territory has representation in the Council of States (Rajya Sabha)?",
          options: ["Delhi, Puducherry, Jammu & Kashmir", "Delhi & Puducherry only", "Chandigarh & Puducherry", "All Union Territories"],
          correctAnswer: "Delhi, Puducherry, Jammu & Kashmir",
          explanation: "Only Delhi, Puducherry, and Jammu & Kashmir have legislative assemblies, therefore they are representable in Rajya Sabha."
        }
      ]
    };

    // Generic Fallback Matcher
    const genericKey = mockQuizzes[topic.toLowerCase()] ? topic.toLowerCase() : "mechanics";
    const selectedQuiz = mockQuizzes[genericKey] || mockQuizzes["mechanics"];
    return res.json({ quiz: selectedQuiz, keyConfigured: false });
  }

  try {
    const api = getGeminiClient();
    const systemPrompt = `You are an expert curriculum developer for competitive examinations (JEE, NEET, CA Foundation, UPSC). Your task is to generate a highly key-aligned and accurate 5-question Daily Practice Problem (DPP) quiz in perfect JSON.
Output strictly in JSON format with the following array schema so the React UI can parse it natively:
[
  {
    "id": 1,
    "question": "Clear question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B",
    "explanation": "Detailed step-by-step explanation of why this option is correct."
  }
]

Ensure that:
- Exactly 1 question is fundamental, 3 are moderate application-based, and 1 is a high-order thinking skill (HOTS) question matching the recent exam trends of 2026.
- The correctAnswer MUST exactly match one of the items inside the "options" array.
- There are no trailing commas, no extra markdown wrapper code outside the raw valid JSON list. Output ONLY the JSON array starting with [ and ending with ].`;

    const prompt = `Generate a 5-question DPP quiz on:
Topic: "${topic}"
Difficulty Level: "${diffLevel}"`;

    const response = await api.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.72,
        responseMimeType: "application/json",
      }
    });

    const bodyText = response.text || "";
    // Parse to verify it is valid JSON
    const parsed = JSON.parse(bodyText.trim());
    res.json({ quiz: parsed, keyConfigured: true });

  } catch (error: any) {
    console.error("DPP Generator API Error:", error);
    // Graceful fallback to valid JSON on parsing error or API error
    const basicRescue = [
      {
        id: 1,
        question: `Sample Fundamental question on ${topic}`,
        options: ["Correct Option", "Wrong option 1", "Wrong option 2", "Wrong option 3"],
        correctAnswer: "Correct Option",
        explanation: `This is a fundamental application question on ${topic} matching the difficulty level requested.`
      }
    ];
    res.json({ quiz: basicRescue, keyConfigured: false, errorEncountered: error.message });
  }
});


// ================= DEVELOPMENT VS PRODUCTION =================

const httpServer = http.createServer(app);

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          server: httpServer,
        }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`EduGrowth AI Express Server initialized and routing live on http://localhost:${PORT}`);
  });
}

startServer();
