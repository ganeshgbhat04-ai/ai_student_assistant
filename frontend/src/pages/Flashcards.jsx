import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { getPdfs, generateFlashcards, getPdfFlashcards } from "../services/chatService";
import {
  FolderHeart,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Download,
  AlertCircle,
  FileText,
} from "lucide-react";

function Flashcards() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // States
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState("");
  const [flashcardSet, setFlashcardSet] = useState(null);
  
  // Card index navigation
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Loading/UI states
  const [loadingPdfs, setLoadingPdfs] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

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
        fetchPdfFlashcards(routeStatePdfId);
      } else if (res.data.length > 0) {
        setSelectedPdf(res.data[0]._id);
        fetchPdfFlashcards(res.data[0]._id);
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

  const fetchPdfFlashcards = async (pdfId) => {
    try {
      const res = await getPdfFlashcards(pdfId);
      if (res.data.length > 0) {
        setFlashcardSet(res.data[0]); // Load the most recent set
      } else {
        setFlashcardSet(null);
      }
      setCurrentCardIdx(0);
      setIsFlipped(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePdfChange = (pdfId) => {
    setSelectedPdf(pdfId);
    if (pdfId) {
      fetchPdfFlashcards(pdfId);
    } else {
      setFlashcardSet(null);
      setCurrentCardIdx(0);
      setIsFlipped(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedPdf) return;

    try {
      setGenerating(true);
      const res = await generateFlashcards(selectedPdf);
      setFlashcardSet(res.data);
      showToast("Flashcards generated successfully!");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to generate flashcards");
    } finally {
      setGenerating(false);
    }
  };

  const handleNext = () => {
    if (!flashcardSet) return;
    setIsFlipped(false);
    // Delay index change slightly to allow flip reset animation
    setTimeout(() => {
      setCurrentCardIdx((prev) => (prev + 1) % flashcardSet.cards.length);
    }, 150);
  };

  const handlePrev = () => {
    if (!flashcardSet) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIdx((prev) => (prev - 1 + flashcardSet.cards.length) % flashcardSet.cards.length);
    }, 150);
  };

  // Export Study Guide
  const handleExportMarkdown = () => {
    if (!flashcardSet) return;

    const currentPdfName = pdfs.find(p => p._id === selectedPdf)?.fileName || "notes";
    let docContent = `# Study Flashcards Sheet: ${currentPdfName}\n\nGenerated on: ${new Date().toLocaleDateString()}\n\n---\n\n`;

    flashcardSet.cards.forEach((card, idx) => {
      docContent += `### 📄 Card ${idx + 1}\n**Front (Term/Question):**\n${card.front}\n\n**Back (Definition/Answer):**\n${card.back}\n\n---\n\n`;
    });

    const blob = new Blob([docContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${currentPdfName.replace(".pdf", "")}_flashcards.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-550 dark:text-emerald-400 rounded-2xl">
              <FolderHeart className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Study Flashcards</h1>
              <p className="text-slate-550 dark:text-slate-400 mt-1 text-sm">
                Memorize critical concepts using visual 3D flip card visualizers.
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

            {selectedPdf && !flashcardSet && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow hover:shadow-lg disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2 self-end sm:self-center"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating Cards...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generate Flashcards
                  </>
                )}
              </button>
            )}
          </div>

          {/* Active Cards Area */}
          {flashcardSet && (
            <div className="flex flex-col items-center gap-6">
              
              {/* Header Card count & action */}
              <div className="w-full max-w-lg flex justify-between items-center text-sm font-semibold px-2">
                <span className="text-slate-400">
                  CARD {currentCardIdx + 1} OF {flashcardSet.cards.length}
                </span>
                <button
                  onClick={handleExportMarkdown}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="h-4 w-4" /> Export Study Sheet
                </button>
              </div>

              {/* 3D FLASHCARD CONTAINER */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full max-w-lg h-80 perspective-1000 cursor-pointer group"
              >
                <div
                  className={`relative w-full h-full duration-500 transform-style-3d border border-slate-200 dark:border-slate-800 rounded-3xl shadow-md hover:shadow-xl transition-all ${
                    isFlipped ? "rotate-y-180" : ""
                  }`}
                >
                  {/* FRONT SIDE (Question/Term) */}
                  <div className="absolute inset-0 w-full h-full p-8 bg-white dark:bg-slate-900 rounded-3xl backface-hidden flex flex-col justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FolderHeart className="h-4 w-4 text-emerald-500" /> Front Side (Question)
                    </span>
                    
                    <div className="flex-grow flex items-center justify-center">
                      <p className="text-lg md:text-xl font-extrabold text-slate-850 dark:text-slate-100 text-center leading-snug">
                        {flashcardSet.cards[currentCardIdx].front}
                      </p>
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 text-center flex items-center justify-center gap-1.5">
                      <RotateCw className="h-3.5 w-3.5" /> Click card to reveal definition
                    </span>
                  </div>

                  {/* BACK SIDE (Answer/Definition) */}
                  <div className="absolute inset-0 w-full h-full p-8 bg-slate-900 dark:bg-slate-950 text-white rounded-3xl backface-hidden rotate-y-180 flex flex-col justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FolderHeart className="h-4 w-4 text-blue-500" /> Back Side (Definition)
                    </span>

                    <div className="flex-grow flex items-center justify-center overflow-y-auto px-1 py-4">
                      <p className="text-sm md:text-base font-semibold leading-relaxed text-slate-100 text-center">
                        {flashcardSet.cards[currentCardIdx].back}
                      </p>
                    </div>

                    <span className="text-[10px] font-bold text-slate-500 text-center flex items-center justify-center gap-1.5">
                      <RotateCw className="h-3.5 w-3.5" /> Click card to flip back
                    </span>
                  </div>

                </div>
              </div>

              {/* CARD CONTROLS ROW */}
              <div className="flex items-center gap-6 mt-2">
                <button
                  onClick={handlePrev}
                  className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full shadow-sm transition active:scale-90 cursor-pointer"
                  title="Previous Card"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold rounded-2xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="h-4 w-4" /> Flip Card
                </button>

                <button
                  onClick={handleNext}
                  className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full shadow-sm transition active:scale-90 cursor-pointer"
                  title="Next Card"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

            </div>
          )}

          {/* Placeholder if PDF is selected but no flashcard exists */}
          {selectedPdf && !flashcardSet && !generating && (
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl shadow-sm p-16 text-center">
              <FileText className="mx-auto h-16 w-16 text-slate-350 dark:text-slate-750 mb-4" />
              <h3 className="text-xl font-bold tracking-tight">No flashcards generated for this PDF</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto mt-2 mb-6 leading-relaxed">
                Need to memorize key facts? Click the button below to have Gemini read your document and summarize it as a set of 8 visual rotating flashcards.
              </p>
              <button
                onClick={handleGenerate}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow hover:shadow-lg transition cursor-pointer inline-flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" /> Generate Study Cards
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default Flashcards;
