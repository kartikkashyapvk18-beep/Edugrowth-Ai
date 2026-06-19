import React, { useState } from "react";
import { ClipboardCheck, Sparkles, Check, X, ArrowRight, HelpCircle, Loader2, RefreshCw, Award, BookOpen } from "lucide-react";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface DPPPracticeViewProps {
  initialTopic?: string;
  initialDifficulty?: string;
  onClearInitialState?: () => void;
}

export default function DPPPracticeView({ initialTopic, initialDifficulty, onClearInitialState }: DPPPracticeViewProps) {
  const [topic, setTopic] = useState(initialTopic || "Mechanics");
  const [difficulty, setDifficulty] = useState(initialDifficulty || "Moderate");
  const [isLoading, setIsLoading] = useState(false);
  const [quizList, setQuizList] = useState<Question[] | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
      if (initialDifficulty) {
        setDifficulty(initialDifficulty);
      }
      handleGenerate(initialTopic, initialDifficulty || difficulty);
      if (onClearInitialState) {
        onClearInitialState();
      }
    }
  }, [initialTopic, initialDifficulty]);

  const topicPresets = [
    { title: "Newtonian Mechanics", value: "Mechanics", diff: "Moderate" },
    { title: "Indian Constitution", value: "Constitution", diff: "HOTS" },
    { title: "Partnership Goodwill", value: "Partnership Accounts", diff: "Fundamental" },
    { title: "Plant Photosynthesis", value: "Cell Biology", diff: "Moderate" }
  ];

  const handleGenerate = async (customTopic = topic, customDiff = difficulty) => {
    setIsLoading(true);
    setError(null);
    setQuizList(null);
    setSelectedAnswers({});
    setShowResults(false);

    try {
      const response = await fetch("/api/ai/generate-dpp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: customTopic, difficulty: customDiff }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate DPP quiz questions");
      }

      const data = await response.json();
      if (Array.isArray(data.quiz)) {
        setQuizList(data.quiz);
      } else {
        throw new Error("Invalid response format received from quiz API");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate DPP. Please verify database/Gemini key connections.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (qId: number, option: string) => {
    if (showResults) return; // Locked when showing final grades
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: option
    }));
  };

  const calculateScore = () => {
    if (!quizList) return 0;
    let score = 0;
    quizList.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        score++;
      }
    });
    return score;
  };

  return (
    <div className="space-y-6" id="dpp-practice-container">
      
      {/* Banner Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden" id="dpp-practice-banner">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl transform translate-x-12 -translate-y-12"></div>
        
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs bg-indigo-500/30 px-3 py-1 rounded-full font-extrabold tracking-wide uppercase">
            <ClipboardCheck className="w-4 h-4 text-indigo-300" />
            2026 Competitive Exam Patterns
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">AI Daily Practice Problems (DPP)</h2>
          <p className="text-indigo-100 text-sm md:text-base leading-relaxed font-semibold">
            Evaluate your preparedness on physical, biological, tax, or legal questions. Generate instantly, test, and master with detailed step explanations.
          </p>
        </div>
      </div>

      {/* Control Board Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dpp-workspace-grid">
        
        {/* Left Side: Parameters Form */}
        <div className="lg:col-span-4 space-y-5" id="dpp-parameters-sidebar">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 border-b border-slate-150 pb-2">
              <Sparkles className="w-4.5 h-4.5 text-indigo-600 fill-indigo-100 animate-pulse" />
              Generator Workspace
            </h3>

            {/* Custom Topic Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Topic / Syllabus Category</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Mechanics, Carbon Chemistry"
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              />
            </div>

            {/* Difficulty choosing */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Difficulty Target</label>
              <div className="grid grid-cols-3 gap-2">
                {["Fundamental", "Moderate", "HOTS"].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all border text-center ${
                      difficulty === lvl 
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-none" 
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleGenerate()}
              disabled={isLoading || !topic.trim()}
              className="w-full flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-700 disabled:bg-slate-200 text-white py-3 px-4 rounded-xl font-extrabold text-sm transition-all focus:scale-98 active:scale-95 shadow-md disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Structuring DPP Sheets...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Generate New DPP Set</span>
                </>
              )}
            </button>
          </div>

          {/* Quick presets list */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Quick Topic presets</h4>
            <div className="grid grid-cols-1 gap-2">
              {topicPresets.map((preset, prIdx) => (
                <button
                  key={prIdx}
                  type="button"
                  onClick={() => {
                    setTopic(preset.title);
                    setDifficulty(preset.diff);
                    handleGenerate(preset.title, preset.diff);
                  }}
                  className="w-full text-left p-3 rounded-xl hover:bg-indigo-50/40 border border-slate-100 hover:border-indigo-150 transition-all flex justify-between items-center group"
                >
                  <div className="space-y-0.5">
                    <strong className="text-xs text-slate-700 font-bold group-hover:text-indigo-700 transition-colors block">{preset.title}</strong>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-extrabold">{preset.diff}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Active Practice Board */}
        <div className="lg:col-span-8" id="dpp-active-board">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm min-h-[420px] flex flex-col">
            
            {/* Header dashboard layout */}
            <div className="border-b border-slate-100 pb-3 mb-5 flex justify-between items-center bg-white">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                  <ClipboardCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">DPP Test Sheet Workspace</h3>
                  <p className="text-[11px] text-slate-400">Strictly 5 questions (1 fundamental, 3 moderate application, 1 HOTS)</p>
                </div>
              </div>
              
              {quizList && (
                <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full">
                  Topic: {topic}
                </span>
              )}
            </div>

            {/* Main Stage State Switcher */}
            <div className="flex-1 flex flex-col justify-center">
              {isLoading ? (
                <div className="text-center py-12 p-6 flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <ClipboardCheck className="w-5 h-5 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-700 font-extrabold uppercase tracking-widest animate-pulse">Structuring 5 High-Quality Questions...</p>
                    <p className="text-[11px] text-slate-455 max-w-xs mx-auto">Mixing levels and generating contextual step-by-step explanations matching latest exam patterns...</p>
                  </div>
                </div>
              ) : quizList ? (
                <div className="space-y-8" id="active-test-list">
                  
                  {/* Results Bento Box */}
                  {showResults && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-150 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in" id="test-results-scorecard">
                      <div className="flex items-center gap-3.5 text-center sm:text-left">
                        <span className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                          <Award className="w-8 h-8" />
                        </span>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-800">Double Checking Success!</h4>
                          <p className="text-xs text-slate-500">You scored <strong>{calculateScore()} out of 5</strong> answers correct.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-center bg-white border border-emerald-100 rounded-xl px-4 py-2">
                          <span className="text-xl font-black text-emerald-600 block">{calculateScore()}/5</span>
                          <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">Correct</span>
                        </div>
                        
                        <button
                          onClick={() => {
                            setSelectedAnswers({});
                            setShowResults(false);
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-[#b21421] text-white rounded-xl text-xs font-bold transition-all"
                        >
                          Retry Quiz
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Loop Through 5 Questions */}
                  <div className="space-y-6">
                    {quizList.map((q, idx) => {
                      const isCorrect = selectedAnswers[q.id] === q.correctAnswer;
                      const hasSelected = selectedAnswers[q.id] !== undefined;

                      return (
                        <div key={q.id || idx} className={`p-5 rounded-2xl border transition-all ${
                          showResults 
                            ? isCorrect 
                              ? "bg-emerald-50/40 border-emerald-150" 
                              : "bg-rose-50/30 border-rose-150"
                            : selectedAnswers[q.id] 
                              ? "bg-indigo-50/10 border-indigo-150" 
                              : "bg-white border-slate-150/80 hover:border-slate-300"
                        }`} id={`q-card-${q.id}`}>
                          
                          {/* Top Tag */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] bg-slate-100 text-slate-500 font-extrabold uppercase tracking-widest px-2 py-0.5 rounded">
                              Question {idx + 1} {idx === 4 ? "• HOTS (High Order)" : idx === 0 ? "• Fundamental" : "• Application"}
                            </span>

                            {showResults && (
                              <span className={`text-xs font-black flex items-center gap-1 leading-none ${
                                isCorrect ? "text-emerald-600" : "text-rose-600"
                              }`}>
                                {isCorrect ? (
                                  <>
                                    <Check className="w-4 h-4 text-emerald-600" />
                                    <span>Correct</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="w-4 h-4 text-rose-650" />
                                    <span>Incorrect</span>
                                  </>
                                )}
                              </span>
                            )}
                          </div>

                          <h4 className="text-slate-800 font-bold text-sm leading-relaxed mb-3">{q.question}</h4>

                          {/* Options grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {q.options.map((opt, oIdx) => {
                              const isSelected = selectedAnswers[q.id] === opt;
                              const isThisCorrect = q.correctAnswer === opt;

                              let btnStyle = "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700";
                              if (isSelected) {
                                btnStyle = "bg-indigo-650/15 border-indigo-600 text-indigo-900";
                              }
                              if (showResults) {
                                if (isThisCorrect) {
                                  btnStyle = "bg-emerald-100 border-emerald-500 text-emerald-900 font-semibold";
                                } else if (isSelected) {
                                  btnStyle = "bg-rose-100 border-rose-500 text-rose-900";
                                } else {
                                  btnStyle = "bg-slate-50 border-slate-100 text-slate-400 opacity-60";
                                }
                              }

                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() => handleOptionSelect(q.id, opt)}
                                  disabled={showResults}
                                  className={`p-3 text-left rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-2 ${btnStyle}`}
                                >
                                  <span className="h-5 w-5 rounded-full border border-slate-300 flex items-center justify-center font-bold text-[10px] bg-white shrink-0">
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <span className="leading-relaxed">{opt}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanatory notes block */}
                          {showResults && (
                            <div className="mt-4 bg-white border border-slate-100 p-4 rounded-xl space-y-1">
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Concept Explanation</span>
                              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{q.explanation}</p>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>

                  {/* Submission triggers */}
                  {!showResults && (
                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => setShowResults(true)}
                        disabled={Object.keys(selectedAnswers).length < quizList.length}
                        className="flex items-center gap-2 bg-indigo-650 hover:bg-[#b21421] disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm py-3 px-6 rounded-xl transition-all shadow-md active:scale-95"
                      >
                        <ClipboardCheck className="w-4.5 h-4.5" />
                        <span>Submit & View Solutions ({Object.keys(selectedAnswers).length}/{quizList.length})</span>
                      </button>
                    </div>
                  )}

                </div>
              ) : error ? (
                <div className="text-center py-12 p-6 bg-red-50/50 border border-red-100/60 rounded-xl space-y-3">
                  <p className="text-xs text-red-600 font-bold">{error}</p>
                  <p className="text-[11px] text-slate-400">Please verify your database schema and Gemini API config credentials inside the Secrets tab.</p>
                </div>
              ) : (
                <div className="text-center py-16 space-y-3">
                  <div className="mx-auto w-12 h-12 bg-slate-50 border border-slate-100 flex items-center justify-center rounded-full text-slate-400 animate-pulse">
                    <ClipboardCheck className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-slate-600 uppercase">Interactive Sheet is empty</h5>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Choose a preset scenario on the left or type your customized topic to spin up a personalized 5-question Daily Practice Problem checklist!
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
