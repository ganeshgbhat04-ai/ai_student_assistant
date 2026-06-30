import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { getPdfs, generateQuiz, getPdfQuizzes } from "../services/chatService";
import confetti from "canvas-confetti";
import {
  HelpCircle,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Award,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  FileText,
} from "lucide-react";

function Quiz() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // States
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  
  // Quiz taking states
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Loading/UI states
  const [loadingPdfs, setLoadingPdfs] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Get auto-selected PDF from route state
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoadingPdfs(true);
      const res = await getPdfs();
      setPdfs(res.data);
      
      const routeStatePdfId = location.state?.selectedPdfId;
      if (routeStatePdfId) {
        setSelectedPdf(routeStatePdfId);
        fetchPdfQuizzes(routeStatePdfId);
      } else if (res.data.length > 0) {
        setSelectedPdf(res.data[0]._id);
        fetchPdfQuizzes(res.data[0]._id);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load PDF library");
    } finally {
      setLoadingPdfs(false);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const fetchPdfQuizzes = async (pdfId) => {
    try {
      const res = await getPdfQuizzes(pdfId);
      setQuizzes(res.data);
      if (res.data.length > 0) {
        setActiveQuiz(res.data[0]); // Load the most recent quiz
      } else {
        setActiveQuiz(null);
      }
      resetQuizState();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePdfChange = (pdfId) => {
    setSelectedPdf(pdfId);
    if (pdfId) {
      fetchPdfQuizzes(pdfId);
    } else {
      setQuizzes([]);
      setActiveQuiz(null);
      resetQuizState();
    }
  };

  const resetQuizState = () => {
    setCurrentQuestionIdx(0);
    setSelectedOptionIdx(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
  };

  const handleGenerate = async () => {
    if (!selectedPdf) return;

    try {
      setGenerating(true);
      const res = await generateQuiz(selectedPdf);
      setActiveQuiz(res.data);
      fetchPdfQuizzes(selectedPdf);
      showToast("Quiz generated successfully!");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to generate quiz");
    } finally {
      setGenerating(false);
    }
  };

  const handleOptionClick = (optionIdx) => {
    if (isAnswered) return;
    setSelectedOptionIdx(optionIdx);
  };

  const handleConfirmAnswer = () => {
    if (selectedOptionIdx === null || isAnswered) return;

    const currentQuestion = activeQuiz.questions[currentQuestionIdx];
    const isCorrect = selectedOptionIdx === currentQuestion.correctAnswer;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setIsAnswered(true);
  };

  const handleNext = () => {
    const nextIdx = currentQuestionIdx + 1;
    if (nextIdx < activeQuiz.questions.length) {
      setCurrentQuestionIdx(nextIdx);
      setSelectedOptionIdx(null);
      setIsAnswered(false);
    } else {
      setQuizFinished(true);
      // Trigger confetti celebration on high score!
      const finalScore = score + (selectedOptionIdx === activeQuiz.questions[currentQuestionIdx].correctAnswer ? 1 : 0);
      if (finalScore >= activeQuiz.questions.length * 0.6) {
        triggerConfetti();
      }
    }
  };

  const triggerConfetti = () => {
    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // since particles fall down, animate a bit higher than random
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
  };

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />

        {toastMsg && (
          <div className="fixed top-6 right-6 z-50 animate-slide-in">
            <div className="bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-2xl shadow-xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-semibold">{toastMsg}</span>
            </div>
          </div>
        )}

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-4xl mx-auto w-full space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-2xl">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Generate Quiz</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                Generate and take MCQ quizzes based on PDF content.
              </p>
            </div>
          </div>

          {/* PDF Selector bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Select PDF Notes
              </label>
              {loadingPdfs ? (
                <div className="text-sm text-slate-400">Loading library...</div>
              ) : pdfs.length === 0 ? (
                <div className="text-xs text-slate-400">
                  No PDFs uploaded.{" "}
                  <Link to="/upload" className="text-blue-500 font-bold hover:underline">
                    Upload notes
                  </Link>
                </div>
              ) : (
                <select
                  value={selectedPdf}
                  onChange={(e) => handlePdfChange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  {pdfs.map((pdf) => (
                    <option key={pdf._id} value={pdf._id}>
                      {pdf.fileName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedPdf && !activeQuiz && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow hover:shadow-lg disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2 self-end sm:self-center"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating Quiz...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generate Quiz
                  </>
                )}
              </button>
            )}
          </div>

          {/* Active Quiz Area */}
          {activeQuiz && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-sm p-6 md:p-8 min-h-96 flex flex-col">
              
              {!quizFinished ? (
                /* QUIZ TAKING PROCESS */
                <div className="flex-grow flex flex-col justify-between">
                  {/* Header Progress */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-3">
                      <span>QUESTION {currentQuestionIdx + 1} OF {activeQuiz.questions.length}</span>
                      <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full">
                        Score: {score}
                      </span>
                    </div>
                    {/* Question text */}
                    <h3 className="text-lg md:text-xl font-extrabold text-slate-850 dark:text-slate-100 leading-snug">
                      {activeQuiz.questions[currentQuestionIdx].question}
                    </h3>
                  </div>

                  {/* MCQ Options list */}
                  <div className="space-y-3.5 my-6">
                    {activeQuiz.questions[currentQuestionIdx].options.map((option, idx) => {
                      const currentQuestion = activeQuiz.questions[currentQuestionIdx];
                      
                      let optionStyle = "border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850/50";
                      let indicatorColor = "bg-slate-100 dark:bg-slate-800 text-slate-500";

                      if (selectedOptionIdx === idx) {
                        optionStyle = "border-blue-500 bg-blue-50/20 dark:bg-blue-900/10";
                        indicatorColor = "bg-blue-600 text-white shadow";
                      }

                      if (isAnswered) {
                        // Highlight correct/incorrect answers after confirming
                        if (idx === currentQuestion.correctAnswer) {
                          optionStyle = "border-green-500 bg-green-50/20 dark:bg-green-950/25";
                          indicatorColor = "bg-green-600 text-white shadow";
                        } else if (selectedOptionIdx === idx) {
                          optionStyle = "border-red-500 bg-red-50/20 dark:bg-red-950/25";
                          indicatorColor = "bg-red-600 text-white shadow";
                        } else {
                          optionStyle = "border-slate-150 dark:border-slate-850 opacity-60";
                        }
                      }

                      return (
                        <div
                          key={idx}
                          onClick={() => handleOptionClick(idx)}
                          className={`border rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-all duration-200 ${optionStyle}`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${indicatorColor}`}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className="text-sm font-semibold text-slate-750 dark:text-slate-200">
                            {option}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation card after answered */}
                  {isAnswered && (
                    <div className="mb-6 p-5 bg-blue-50 dark:bg-blue-900/10 border border-blue-150 dark:border-blue-800 rounded-2xl text-xs leading-relaxed animate-fade-in">
                      <h5 className="font-extrabold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1.5">
                        {selectedOptionIdx === activeQuiz.questions[currentQuestionIdx].correctAnswer ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500" /> Correct explanation
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" /> Incorrect. Explanation:
                          </>
                        )}
                      </h5>
                      <p className="text-slate-650 dark:text-slate-350 font-medium">
                        {activeQuiz.questions[currentQuestionIdx].explanation}
                      </p>
                    </div>
                  )}

                  {/* Confirmation/Next Step Buttons */}
                  <div className="flex items-center justify-end">
                    {!isAnswered ? (
                      <button
                        onClick={handleConfirmAnswer}
                        disabled={selectedOptionIdx === null}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow disabled:opacity-50 transition cursor-pointer"
                      >
                        Confirm Answer
                      </button>
                    ) : (
                      <button
                        onClick={handleNext}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow transition flex items-center gap-1 cursor-pointer"
                      >
                        {currentQuestionIdx + 1 === activeQuiz.questions.length ? "Finish Quiz" : "Next Question"} <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* QUIZ COMPLETED FINISHED SCOREBOARD */
                <div className="flex-grow flex flex-col items-center justify-center text-center py-10 space-y-6 animate-fade-in">
                  <div className="p-5 bg-gradient-to-tr from-amber-400 to-orange-500 text-white rounded-3xl shadow-lg shadow-orange-500/20 pulse-ring-active">
                    <Award className="h-12 w-12" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl md:text-3xl font-extrabold">Quiz Completed!</h3>
                    <p className="text-slate-550 dark:text-slate-400 text-sm">
                      {activeQuiz.title}
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-900 inline-block min-w-48 shadow-inner">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Your Score</span>
                    <span className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">
                      {score} / {activeQuiz.questions.length}
                    </span>
                    <span className="text-xs text-slate-500 block mt-2 font-semibold">
                      {score === activeQuiz.questions.length
                        ? "Perfect Score! 🏆"
                        : score >= activeQuiz.questions.length * 0.8
                        ? "Excellent work! 🌟"
                        : score >= activeQuiz.questions.length * 0.6
                        ? "Good job! 👍"
                        : "Keep studying! 📚"}
                    </span>
                  </div>

                  <div className="flex gap-4 pt-4 print:hidden">
                    <button
                      onClick={resetQuizState}
                      className="px-5 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-2xl text-sm font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="h-4 w-4" /> Retake Quiz
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow transition cursor-pointer flex items-center gap-1.5"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" /> Generate New Quiz
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Placeholder if PDF is selected but no quiz exists */}
          {selectedPdf && !activeQuiz && !generating && (
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl shadow-sm p-16 text-center">
              <FileText className="mx-auto h-16 w-16 text-slate-350 dark:text-slate-750 mb-4" />
              <h3 className="text-xl font-bold tracking-tight">No quiz generated for this PDF</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto mt-2 mb-6 leading-relaxed">
                Unlock active testing! Click the button below to have Gemini read your document and generate 5 conceptual multiple-choice questions.
              </p>
              <button
                onClick={handleGenerate}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow hover:shadow-lg transition cursor-pointer inline-flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" /> Generate MCQ Quiz
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default Quiz;
