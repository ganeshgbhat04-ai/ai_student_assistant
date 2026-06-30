import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import {
  getPdfs,
  askQuestion,
  getChatsForPdf,
  getChatHistory,
  deleteChat,
} from "../services/chatService";
import ReactMarkdown from "react-markdown";
import {
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Download,
  Printer,
  Sparkles,
  Loader2,
  ChevronRight,
  AlertCircle,
  FileText,
} from "lucide-react";

function ChatPdf() {
  const messagesEndRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState("");
  const [chatSessions, setChatSessions] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  // Load PDFs on mount
  useEffect(() => {
    fetchPdfs();
  }, []);

  // Fetch chat sessions when selected PDF changes
  useEffect(() => {
    if (selectedPdf) {
      fetchChatSessions();
      handleNewChat(); // Reset state to new chat
    } else {
      setChatSessions([]);
      setMessages([]);
      setActiveChatId(null);
    }
  }, [selectedPdf]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const fetchPdfs = async () => {
    try {
      const res = await getPdfs();
      setPdfs(res.data);
      if (res.data.length > 0) {
        setSelectedPdf(res.data[0]._id); // Auto-select first PDF
      }
    } catch (err) {
      console.error(err);
      showAlert("Failed to load PDF library");
    }
  };

  const fetchChatSessions = async () => {
    try {
      const res = await getChatsForPdf(selectedPdf);
      setChatSessions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const showAlert = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(""), 3500);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setInputMessage("");
  };

  const handleSelectSession = async (chatId) => {
    try {
      setLoading(true);
      const res = await getChatHistory(chatId);
      setActiveChatId(res.data._id);
      setMessages(res.data.messages);
    } catch (err) {
      console.error(err);
      showAlert("Failed to load chat history");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (e, chatId) => {
    e.stopPropagation(); // Prevent trigger click select session
    if (!window.confirm("Are you sure you want to delete this chat session?")) return;

    try {
      await deleteChat(chatId);
      fetchChatSessions();
      if (activeChatId === chatId) {
        handleNewChat();
      }
    } catch (err) {
      console.error(err);
      showAlert("Failed to delete chat session");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedPdf) {
      showAlert("Please select a PDF to chat with first!");
      return;
    }
    if (!inputMessage.trim() || loading) return;

    const userQuestion = inputMessage.trim();
    setInputMessage("");

    // Append user message immediately for responsiveness
    const tempUserMsg = { sender: "user", text: userQuestion, timestamp: new Date() };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      setLoading(true);
      const res = await askQuestion({
        pdfId: selectedPdf,
        question: userQuestion,
        chatId: activeChatId,
      });

      // Update session ID if it's a new chat
      if (!activeChatId) {
        setActiveChatId(res.data.chatId);
        fetchChatSessions(); // Refresh sidebar sessions list
      }

      // Add AI response message
      const tempAiMsg = { sender: "ai", text: res.data.answer, timestamp: new Date() };
      setMessages((prev) => [...prev, tempAiMsg]);
    } catch (err) {
      console.error(err);
      // Append error message to chat
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "⚠️ *Error: Something went wrong while getting answers. Please try again.*", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Export Study Notes in Markdown
  const handleExportMarkdown = () => {
    if (messages.length === 0) {
      showAlert("Nothing to export! Start a chat first.");
      return;
    }

    const currentPdfName = pdfs.find(p => p._id === selectedPdf)?.fileName || "notes";
    let docContent = `# AI Study Chat Notes: ${currentPdfName}\n\nGenerated on: ${new Date().toLocaleDateString()}\n\n---\n\n`;

    messages.forEach((msg) => {
      if (msg.sender === "user") {
        docContent += `### 🙋 Student Question\n> ${msg.text}\n\n`;
      } else {
        docContent += `### 🤖 AI Study Assistant\n${msg.text}\n\n---\n\n`;
      }
    });

    const blob = new Blob([docContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${currentPdfName.replace(".pdf", "")}_study_notes.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Notes or Save as native PDF
  const handlePrint = () => {
    if (messages.length === 0) {
      showAlert("Nothing to print!");
      return;
    }
    window.print();
  };

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />

        {/* Global Warning Toast */}
        {alertMsg && (
          <div className="fixed top-6 right-6 z-50 animate-slide-in">
            <div className="bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-2xl shadow-xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-semibold">{alertMsg}</span>
            </div>
          </div>
        )}

        {/* Inner layout (Left Panel: Chat History, Right Panel: Chat Console) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT PANEL: Chat History for selected PDF */}
          <div className="hidden md:flex w-72 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/80 flex-col shrink-0">
            {/* PDF Dropdown Selector */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Active PDF Material
              </label>
              {pdfs.length === 0 ? (
                <div className="text-xs text-slate-400 py-2">
                  No PDFs uploaded.{" "}
                  <Link to="/upload" className="text-blue-500 font-bold hover:underline">
                    Upload here
                  </Link>
                </div>
              ) : (
                <select
                  value={selectedPdf}
                  onChange={(e) => setSelectedPdf(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-850 dark:text-slate-200 cursor-pointer"
                >
                  {pdfs.map((pdf) => (
                    <option key={pdf._id} value={pdf._id}>
                      {pdf.fileName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* New Chat Button */}
            <div className="p-4">
              <button
                onClick={handleNewChat}
                className="w-full py-2.5 px-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Start New Chat
              </button>
            </div>

            {/* Past Chat Sessions List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2">
                Chat History
              </p>
              
              {chatSessions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No previous chats</p>
              ) : (
                chatSessions.map((session) => (
                  <div
                    key={session._id}
                    onClick={() => handleSelectSession(session._id)}
                    className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer text-xs font-semibold group transition ${
                      activeChatId === session._id
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white"
                        : "text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850/50 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare className="h-4 w-4 text-blue-500 shrink-0" />
                      <span className="truncate pr-1">{session.title}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(e, session._id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 rounded transition shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Chat Console */}
          <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950/50 overflow-hidden relative">
            
            {/* PDF selection visible for mobile screens */}
            <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-850 flex md:hidden items-center justify-between gap-3 shrink-0">
              <select
                value={selectedPdf}
                onChange={(e) => setSelectedPdf(e.target.value)}
                className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value="">Select PDF Material</option>
                {pdfs.map((pdf) => (
                  <option key={pdf._id} value={pdf._id}>
                    {pdf.fileName}
                  </option>
                ))}
              </select>
              <button
                onClick={handleNewChat}
                className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Messages scroll area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 print:overflow-visible print:p-0 print:bg-white">
              {messages.length === 0 ? (
                /* Empty Chat Prompt Details */
                <div className="h-full flex flex-col items-center justify-center text-center p-8 print:hidden">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-3xl mb-4 pulse-ring-active">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">Chat with PDF notes</h3>
                  <p className="text-slate-550 dark:text-slate-400 text-xs max-w-sm mt-2 leading-relaxed">
                    Ask questions about your uploaded PDF. Gemini will run a semantic search and answer using content citations from the text.
                  </p>
                </div>
              ) : (
                /* Messages Bubble List */
                <div className="max-w-3xl mx-auto space-y-6 print:max-w-full">
                  {messages.map((msg, index) => {
                    const isUser = msg.sender === "user";
                    return (
                      <div
                        key={index}
                        className={`flex gap-3 max-w-[85%] md:max-w-[75%] print:max-w-full ${
                          isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${
                          isUser
                            ? "bg-slate-700 text-white"
                            : "bg-blue-600 text-white"
                        }`}>
                          {isUser ? "Me" : "AI"}
                        </div>

                        {/* Content bubble */}
                        <div className="space-y-1">
                          <div className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                            isUser
                              ? "bg-blue-600 text-white rounded-tr-none"
                              : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-tl-none text-slate-850 dark:text-slate-200"
                          }`}>
                            {isUser ? (
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                            ) : (
                              <div className="prose dark:prose-invert max-w-none text-sm space-y-2 whitespace-pre-wrap">
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                              </div>
                            )}
                          </div>
                          
                          {/* Message timestamp */}
                          <div className={`text-[10px] text-slate-400 px-2 ${isUser ? "text-right" : "text-left"}`}>
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Pulse Loading Indicator */}
                  {loading && (
                    <div className="flex gap-3 max-w-[75%] mr-auto items-center">
                      <div className="w-8.5 h-8.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        AI
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 rounded-3xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Bottom Input Console & Actions */}
            <div className="p-4 md:p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-850 print:hidden shrink-0">
              <div className="max-w-3xl mx-auto space-y-4">
                
                {/* Floating buttons: Export & Print */}
                {messages.length > 0 && (
                  <div className="flex items-center justify-end gap-2 text-xs">
                    <button
                      onClick={handleExportMarkdown}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
                      title="Export chat as Markdown file"
                    >
                      <Download className="h-3.5 w-3.5 text-blue-500" /> Export MD
                    </button>
                    <button
                      onClick={handlePrint}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
                      title="Print chat history or save as PDF"
                    >
                      <Printer className="h-3.5 w-3.5 text-slate-550 dark:text-slate-400" /> Print
                    </button>
                  </div>
                )}

                {/* Input Text Form */}
                <form onSubmit={handleSend} className="relative flex items-center">
                  <textarea
                    rows="1"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    placeholder={selectedPdf ? "Ask something about these notes..." : "Select a PDF to start chatting"}
                    disabled={!selectedPdf}
                    className="w-full pl-4 pr-14 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none disabled:opacity-55 disabled:cursor-not-allowed"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || !selectedPdf || loading}
                    className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <Send className="h-4.5 w-4.5" />
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPdf;