import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { getPdfs, deletePdf, summarizePdf } from "../services/chatService";
import API from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import {
  UploadCloud,
  FileText,
  Trash2,
  HelpCircle,
  FolderHeart,
  FileSearch,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

function UploadPdf() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pdfs, setPdfs] = useState([]);
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [activeSummary, setActiveSummary] = useState({ show: false, fileName: "", text: "" });
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    fetchPdfs();
  }, []);

  const fetchPdfs = async () => {
    try {
      const res = await getPdfs();
      setPdfs(res.data);
    } catch (err) {
      console.error("Error fetching PDFs:", err);
      showToast("Failed to load PDF library", "error");
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      showToast("Only PDF files are supported!", "error");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      // 10MB Limit
      showToast("File is too large! Maximum limit is 10MB.", "error");
      return;
    }

    setFile(selectedFile);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      showToast("Please select a PDF file first", "error");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      setUploading(true);
      setProgress(0);

      const res = await API.post("/pdf/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percent);
        },
      });

      showToast(`"${file.name}" uploaded and embedded successfully!`);
      setFile(null);
      fetchPdfs();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Upload failed. Try again.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (pdfId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"? This will clear its embeddings, chats, quizzes, and flashcards.`)) {
      return;
    }

    try {
      await deletePdf(pdfId);
      showToast(`Deleted "${fileName}" successfully.`);
      setPdfs(pdfs.filter((p) => p._id !== pdfId));
      if (activeSummary.show) {
        setActiveSummary({ show: false, fileName: "", text: "" });
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to delete PDF.", "error");
    }
  };

  const handleViewSummary = async (pdfId, fileName) => {
    try {
      setSummaryLoading(true);
      setActiveSummary({ show: true, fileName, text: "" });
      
      const res = await summarizePdf(pdfId);
      setActiveSummary({ show: true, fileName, text: res.data.summary });
    } catch (err) {
      console.error(err);
      showToast("Failed to generate/retrieve PDF summary.", "error");
      setActiveSummary({ show: false, fileName: "", text: "" });
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />

        {/* Custom Toast Alert */}
        {toast.show && (
          <div className="fixed top-6 right-6 z-50 animate-slide-in">
            <div className={`p-4 rounded-2xl shadow-xl border flex items-center gap-3 ${
              toast.type === "success"
                ? "bg-green-50 dark:bg-green-950/80 border-green-200 dark:border-green-800/80 text-green-800 dark:text-green-300"
                : "bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-800/80 text-red-800 dark:text-red-300"
            }`}>
              {toast.type === "success" ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span className="text-sm font-semibold">{toast.message}</span>
            </div>
          </div>
        )}

        <main className="flex-1 p-6 md:p-8 grid grid-cols-1 xl:grid-cols-3 gap-8 overflow-y-auto">
          {/* Left Column: Drag & Drop Zone */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-sm">
              <h2 className="text-xl font-bold tracking-tight mb-2">Upload Notes</h2>
              <p className="text-slate-400 dark:text-slate-500 text-xs mb-6">
                PDF text is split and embedded using Gemini's text-embedding-004 vector model.
              </p>

              <form onSubmit={handleUpload} className="space-y-6">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                  className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition duration-300 min-h-60 group ${
                    isDragOver
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                      : "border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-slate-50/30 dark:hover:bg-slate-800/20"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl mb-4 group-hover:scale-105 transition">
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <h4 className="font-extrabold text-sm mb-1.5">
                    Drag & Drop PDF or Click to Browse
                  </h4>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">
                    Support PDF files up to 10MB
                  </p>
                </div>

                {file && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-850/50 border border-slate-150 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-650 dark:text-red-400 rounded-xl">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-750 dark:text-slate-200 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="p-1 text-slate-400 hover:text-slate-650 rounded hover:bg-slate-200/50"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {uploading && (
                  <div className="space-y-2.5 animate-fade-in">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Chunking and Embedding...
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-150"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!file || uploading}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:shadow-blue-500/10 active:scale-98 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  Upload & Embed PDF
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: PDF Library list & Summary Panel */}
          <div className="xl:col-span-2 space-y-6">
            {activeSummary.show ? (
              /* PDF Summary Display Card */
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">
                        AI Study Summary
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs md:max-w-md">
                        {activeSummary.fileName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveSummary({ show: false, fileName: "", text: "" })}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Close Summary
                  </button>
                </div>

                {summaryLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                    <p className="text-sm text-slate-400">Gemini is analyzing the document text...</p>
                  </div>
                ) : (
                  <div className="prose dark:prose-invert max-w-none max-h-120 overflow-y-auto text-sm text-slate-605 leading-relaxed bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-900">
                    <div className="whitespace-pre-line">{activeSummary.text}</div>
                  </div>
                )}
              </div>
            ) : (
              /* PDF Library List */
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-sm">
                <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" /> Uploaded Study Notes ({pdfs.length})
                </h2>

                {pdfs.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Library is empty</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Drag and drop your lecture slides or textbook PDFs to begin.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pdfs.map((pdf) => (
                      <div
                        key={pdf._id}
                        className="p-5 border border-slate-150 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md rounded-2xl transition duration-200 flex flex-col justify-between"
                      >
                        <div className="flex gap-3.5 min-w-0">
                          <div className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-650 dark:text-red-400 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate pr-2" title={pdf.fileName}>
                              {pdf.fileName}
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">
                              Chunks: {pdf.chunks?.length || 0} • {new Date(pdf.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 mt-5 border-t border-slate-100 dark:border-slate-800 pt-3">
                          <button
                            onClick={() => handleViewSummary(pdf._id, pdf.fileName)}
                            className="flex-1 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                            title="Generate Summary"
                          >
                            <FileSearch className="h-3.5 w-3.5 text-blue-500" /> Summary
                          </button>
                          <button
                            onClick={() => navigate("/quiz", { state: { selectedPdfId: pdf._id } })}
                            className="flex-1 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                            title="Generate Quiz"
                          >
                            <HelpCircle className="h-3.5 w-3.5 text-amber-500" /> Quiz
                          </button>
                          <button
                            onClick={() => navigate("/flashcards", { state: { selectedPdfId: pdf._id } })}
                            className="flex-1 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                            title="Generate Flashcards"
                          >
                            <FolderHeart className="h-3.5 w-3.5 text-emerald-500" /> Cards
                          </button>
                          <button
                            onClick={() => handleDelete(pdf._id, pdf.fileName)}
                            className="p-2 border border-slate-200 dark:border-slate-800 hover:border-red-205 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-slate-400 hover:text-red-500 transition cursor-pointer"
                            title="Delete Notes"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default UploadPdf;