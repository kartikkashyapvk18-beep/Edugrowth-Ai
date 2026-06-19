import React, { useState, useRef, useEffect } from "react";
import { 
  HelpCircle, Sparkles, MessageSquare, Flame, CheckCircle, ArrowRight, 
  BookOpen, AlertTriangle, Send, Trash2, User, RefreshCw, Lightbulb, Zap
} from "lucide-react";

interface ChatMessage {
  role: "user" | "model";
  content: string;
  timestamp: string;
}

interface DoubtSolverViewProps {
  initialDoubt?: string;
  initialCourse?: string;
  onClearInitialState?: () => void;
  onActivityPerformed?: () => void;
}

export default function DoubtSolverView({ initialDoubt, initialCourse, onClearInitialState, onActivityPerformed }: DoubtSolverViewProps) {
  const [courseStream, setCourseStream] = useState(initialCourse || "JEE");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Focus and auto-scroll target
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle incoming props (deep linking to doubt solver)
  useEffect(() => {
    if (initialDoubt) {
      const selectedStream = initialCourse || courseStream;
      setCourseStream(selectedStream);
      
      const userMessage: ChatMessage = {
        role: "user",
        content: initialDoubt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages([userMessage]);
      triggerSolveConversation(initialDoubt, selectedStream, [userMessage]);
      
      if (onActivityPerformed) {
        onActivityPerformed();
      }

      if (onClearInitialState) {
        onClearInitialState();
      }
    }
  }, [initialDoubt, initialCourse]);

  const presets = [
    { 
      title: "Kepler's Orbit Calculation", 
      course: "JEE", 
      text: "If earth's orbital radius is reduced to 1/4th of current, what will be the duration of earth's orbital year?" 
    },
    { 
      title: "Goodwill Journal Entry", 
      course: "CA Foundation", 
      text: "A and B are partners with profit-sharing 3:2. Incoming partner C brings Rs 50,000 as goodwill premium in cash for 1/5th share. How is premium allocated?" 
    },
    { 
      title: "Photosynthesis ATP yield", 
      course: "NEET", 
      text: "How many molecules of ATP and NADPH are required to manufacture one molecule of Glucose in the Calvin Cycle?" 
    },
    { 
      title: "Preamble Amendments", 
      course: "UPSC", 
      text: "Analyze the significance of the 42nd Amendment of the Indian Preamble. Which words were added?" 
    }
  ];

  // Primary API Caller
  const triggerSolveConversation = async (queryText: string, activeStream = courseStream, currentHistory = messages) => {
    setIsLoading(true);
    setError(null);

    try {
      // Map history structure to what the server expects
      const payloadHistory = currentHistory.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch("/api/ai/solve-doubt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          doubt: queryText, 
          course: activeStream,
          history: payloadHistory
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to formulate solution from Saarthi AI. Please check server.");
      }

      const data = await response.json();
      
      const aiResponse: ChatMessage = {
        role: "model",
        content: data.solution,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please verify connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit standard chat message
  const handleSendMessage = (textToSend = inputMessage) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputMessage("");
    triggerSolveConversation(trimmed, courseStream, nextMessages);

    if (onActivityPerformed) {
      onActivityPerformed();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInputMessage("");
    setError(null);
  };

  // Quick Action pill dispatchers
  const handleQuickAction = (actionType: "trick" | "mistake" | "explain") => {
    if (messages.length === 0) return;
    
    let promptText = "";
    if (actionType === "trick") {
      promptText = "Can you show me a quick shortcut trick or formula hack for this concept?";
    } else if (actionType === "mistake") {
      promptText = "What are the common traps or silly errors students usually make in this precise area?";
    } else if (actionType === "explain") {
      promptText = "Please explain the fundamental 'why' and core theory behind this step in more detail.";
    }

    handleSendMessage(promptText);
  };

  // Render individual structural block response (Inspired by PW style formatting)
  const formatText = (rawText: string) => {
    if (!rawText) return null;
    
    const blocks = rawText.split(/\n\n+/);
    return blocks.map((block, idx) => {
      // 1. Encouraging Opener Card
      if (block.startsWith("🔥 **Encouraging Opener**") || block.includes("Encouraging Opener")) {
        const clean = block.replace(/🔥\s*\*\*Encouraging Opener\*\*:\s*/i, "");
        return (
          <div key={idx} className="bg-gradient-to-r from-amber-50 to-orange-50/70 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs space-y-1 my-2" id={`opener-${idx}`}>
            <span className="text-[10px] font-extrabold text-amber-700 tracking-wider uppercase flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
              HEYE ENERGY START
            </span>
            <p className="text-slate-800 font-bold text-sm leading-relaxed whitespace-pre-wrap">{clean}</p>
          </div>
        );
      }

      // 2. Core Concept Card
      if (block.startsWith("🎯 **The Core Concept**") || block.includes("The Core Concept")) {
        const clean = block.replace(/🎯\s*\*\*The Core Concept\*\*:\s*/i, "");
        return (
          <div key={idx} className="bg-blue-50/80 border-l-4 border-blue-500 p-4 rounded-r-xl shadow-xs space-y-1 my-2" id={`concept-${idx}`}>
            <span className="text-[10px] font-extrabold text-blue-700 tracking-wider uppercase flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              CORE PEDAGOGY PRINCIPLE
            </span>
            <p className="text-slate-800 font-semibold text-sm leading-relaxed whitespace-pre-wrap">{clean}</p>
          </div>
        );
      }

      // 3. Step-by-Step Box
      if (block.startsWith("🔢 **Step-by-Step Breakdown**") || block.includes("Step-by-Step Breakdown")) {
        const clean = block.replace(/🔢\s*\*\*Step-by-Step Breakdown\*\*:\s*/i, "");
        return (
          <div key={idx} className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl shadow-xs space-y-2 my-2" id={`steps-${idx}`}>
            <span className="text-[10px] font-extrabold text-slate-500 tracking-wider uppercase flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              STEP-BY-STEP DETAILED CALCULATION
            </span>
            <div className="text-slate-800 text-sm whitespace-pre-wrap leading-relaxed space-y-1 font-mono bg-white p-3 rounded-lg border border-slate-100 shadow-3xs">
              {clean}
            </div>
          </div>
        );
      }

      // 4. Common Trap Card
      if (block.startsWith("⚠️ **Common Trap**") || block.includes("Common Trap") || block.includes("Mistake Alert")) {
        const clean = block.replace(/⚠️\s*\*\*Common Trap \(Mistake Alert\)\*\*:\s*/i, "")
                           .replace(/⚠️\s*\*\*Common Trap\*\*:\s*/i, "")
                           .replace(/Mistake Alert:\s*/i, "");
        return (
          <div key={idx} className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl shadow-xs space-y-1 my-2" id={`trap-${idx}`}>
            <span className="text-[10px] font-extrabold text-rose-700 tracking-wider uppercase flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              SILLY MISTAKE ALERT (SABSE BADI GHALTI!)
            </span>
            <p className="text-slate-800 font-medium text-sm leading-relaxed whitespace-pre-wrap">{clean}</p>
          </div>
        );
      }

      // 5. Closing Motivation Card
      if (block.startsWith("💪 **Closing Motivation**") || block.includes("Closing Motivation")) {
        const clean = block.replace(/💪\s*\*\*Closing Motivation\*\*:\s*/i, "");
        return (
          <div key={idx} className="bg-emerald-50/80 border-l-4 border-emerald-500 p-4 rounded-r-xl shadow-xs space-y-1 my-2" id={`motivation-${idx}`}>
            <span className="text-[10px] font-extrabold text-emerald-700 tracking-wider uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              JOSH BOOSTER SIGN OFF
            </span>
            <p className="text-slate-800 font-bold italic text-sm leading-relaxed whitespace-pre-wrap">{clean}</p>
          </div>
        );
      }

      // Plain Text Fallback
      return (
        <div key={idx} className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap py-1">
          {block}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6" id="doubt-solver-conversation-root">
      
      {/* Dynamic Header Banner */}
      <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl p-5 md:p-6 text-white shadow-sm relative overflow-hidden" id="saarthi-banner">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl transform translate-x-12 -translate-y-12"></div>
        <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-black/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs bg-white/20 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full font-extrabold tracking-wide uppercase">
            <Flame className="w-3.5 h-3.5 text-orange-300 fill-orange-300" />
            Empathetic Conversational Mode Active
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">EduGrowth Saarthi - AI Doubt Solver</h2>
          <p className="text-red-50 text-xs md:text-sm leading-relaxed font-semibold">
            Solve, follow-up, and clear all academic blockages. Type follow-up questions just like ChatGPT to refine your learning!
          </p>
        </div>
      </div>

      {/* Grid Layout splits into Course Setup & Live Interactive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="saarthi-main-layout">
        
        {/* Left Side: Session Controls & Setup Panel */}
        <div className="lg:col-span-4 space-y-4" id="controls-panel">
          
          {/* Stream Selector Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Target Stream</span>
              <span className="text-[10px] bg-slate-100 text-[#d11a2a] px-2 py-0.5 rounded-full font-bold">
                {courseStream} Mode
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {["JEE", "NEET", "CA Foundation", "UPSC"].map((str) => (
                <button
                  key={str}
                  type="button"
                  onClick={() => setCourseStream(str)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border text-center ${
                    courseStream === str 
                      ? "bg-[#d11a2a]/10 border-[#d11a2a] text-[#d11a2a] shadow-2xs font-extrabold" 
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  {str}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Demo Presets Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Witness Concepts (Presets)</h4>
            <div className="space-y-2">
              {presets.map((preset, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => {
                    setCourseStream(preset.course);
                    const userMsg: ChatMessage = {
                      role: "user",
                      content: preset.text,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                    const nextMsgs = [userMsg];
                    setMessages(nextMsgs);
                    triggerSolveConversation(preset.text, preset.course, nextMsgs);
                  }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-[#f6faff] border border-slate-100 hover:border-[#d3e4fb] transition-all group flex items-start gap-2 text-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#d11a2a] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div className="truncate flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-semibold">{preset.course}</span>
                      <strong className="text-slate-700 font-bold group-hover:text-[#d11a2a] transition-colors truncate block max-w-[120px]">
                        {preset.title}
                      </strong>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{preset.text}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Thread Action controls */}
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:border-red-100 bg-white hover:bg-rose-50 text-slate-600 hover:text-red-600 py-3 rounded-lg text-xs font-black transition-all hover:shadow-2xs active:scale-98"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Current Chat Thread</span>
            </button>
          )}

        </div>

        {/* Right Side: ChatGPT-like Conversation Room */}
        <div className="lg:col-span-8 flex flex-col h-[520px] bg-white rounded-xl border border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden" id="saarthi-chat-room">
          
          {/* Chat Workspace Header */}
          <div className="bg-slate-50/80 border-b border-slate-100 px-4 py-3.5 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#d11a2a]/10 border border-[#d11a2a]/20 flex items-center justify-center text-[#d11a2a]">
                <Sparkles className="w-4 h-4 fill-[#d11a2a]/20" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">Saarthi Live Concept Coach</h3>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active ChatGPT-Style Session
                </div>
              </div>
            </div>
            
            <div className="text-[10px] bg-slate-100 border border-slate-200/50 text-slate-500 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {courseStream} stream
            </div>
          </div>

          {/* Messages scrollable viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20" id="chat-messages-container">
            {messages.length === 0 ? (
              // Empty State greeting card
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4" id="empty-workspace">
                <div className="w-16 h-16 bg-[#d11a2a]/5 border border-[#d11a2a]/10 rounded-2xl flex items-center justify-center text-[#d11a2a] animate-bounce">
                  <Sparkles className="w-8 h-8" />
                </div>
                
                <div className="space-y-1.5 max-w-sm">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Solve doubts step-by-step</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Select a core preset question on the left or type your custom CA, JEE, NEET, or UPSC doubt directly in the chat input below!
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> Multi-turn follow ups supported
                </div>
              </div>
            ) : (
              // Conversational Thread list
              <div className="flex flex-col space-y-4" id="active-chat-thread">
                {messages.map((msg, index) => (
                  <div 
                    key={index}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} space-y-1`}
                  >
                    {/* Role Header */}
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest px-1 flex items-center gap-1">
                      {msg.role === "user" ? (
                        <>
                          <User className="w-3 h-3 text-slate-400" />
                          <span>Student</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-[#d11a2a]" />
                          <span className="text-[#d11a2a]">AI Saarthi Mentor</span>
                        </>
                      )}
                    </span>

                    {/* Chat bubble body container */}
                    <div 
                      className={`p-3 md:p-4 rounded-2xl max-w-[85%] shadow-2xs border ${
                        msg.role === "user" 
                          ? "bg-slate-850 border-slate-800 text-white rounded-tr-none px-4" 
                          : "bg-white border-slate-250/70 text-slate-850 rounded-tl-none space-y-3"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                      ) : (
                        <div className="space-y-4">
                          {formatText(msg.content)}
                        </div>
                      )}

                      {/* Bubble timestamp */}
                      <div className={`text-[9px] mt-1.5 font-bold ${msg.role === "user" ? "text-slate-400 text-right" : "text-slate-400"}`}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading State turn bubble */}
                {isLoading && (
                  <div className="flex flex-col items-start space-y-1 animate-pulse">
                    <span className="text-[10px] text-[#d11a2a] font-extrabold uppercase tracking-widest px-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#d11a2a]" />
                      <span>Saarthi is Thinking...</span>
                    </span>
                    
                    <div className="bg-white border border-slate-200/80 p-5 rounded-2xl rounded-tl-none max-w-[80%] flex items-center gap-3">
                      <div className="flex space-x-1">
                        <span className="w-2.5 h-2.5 bg-[#d11a2a] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2.5 h-2.5 bg-[#d11a2a] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2.5 h-2.5 bg-[#d11a2a] rounded-full animate-bounce"></span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">Educator Kunal is writing detailed step-by-step logic...</span>
                    </div>
                  </div>
                )}

                {/* Error Banner inside thread */}
                {error && (
                  <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg text-rose-700 text-xs text-center font-semibold">
                    {error}. Please try again.
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* ChatGPT Interactive suggestions pills (only visible when there are active chats in thread) */}
          {messages.length > 0 && !isLoading && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto select-none shrink-0" id="quick-chat-followups">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                <Lightbulb className="w-3 h-3 text-amber-500" />
                Quick Actions:
              </span>
              
              <button 
                onClick={() => handleQuickAction("trick")}
                className="text-[10.5px] bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-200 text-slate-600 hover:text-amber-800 px-2.5 py-1 rounded-full font-bold transition-all shrink-0 flex items-center gap-1 shadow-3xs"
              >
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                Formula shortcut trick?
              </button>

              <button 
                onClick={() => handleQuickAction("mistake")}
                className="text-[10.5px] bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-800 px-2.5 py-1 rounded-full font-bold transition-all shrink-0 flex items-center gap-1 shadow-3xs"
              >
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                Silly mistake alert?
              </button>

              <button 
                onClick={() => handleQuickAction("explain")}
                className="text-[10.5px] bg-white hover:bg-[#ebf4ff] border border-slate-200 hover:border-blue-200 text-slate-600 hover:text-blue-800 px-2.5 py-1 rounded-full font-bold transition-all shrink-0 flex items-center gap-1 shadow-3xs"
              >
                <BookOpen className="w-3 h-3 text-blue-500" />
                Explain "why" steps?
              </button>
            </div>
          )}

          {/* Custom chat message input bar */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 shrink-0">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input 
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={isLoading ? "Please wait while Saarthi writes..." : "Ask follow-up query or paste details here..."}
                disabled={isLoading}
                className="flex-1 bg-white border border-slate-220 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#d11a2a]/20 focus:border-[#d11a2a] transition-all text-slate-800 font-semibold placeholder-slate-400 shadow-3xs disabled:opacity-75"
              />
              
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="bg-[#d11a2a] hover:bg-[#b21421] disabled:bg-slate-200 text-white p-3 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center shrink-0 shadow-sm disabled:shadow-none"
              >
                <Send className="w-4 h-4 fill-white" />
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
