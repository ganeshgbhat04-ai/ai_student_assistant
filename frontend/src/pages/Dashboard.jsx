import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { getDashboardSummary } from "../services/chatService";
import { Link } from "react-router-dom";
import {
  FileText,
  MessageSquare,
  HelpCircle,
  FolderHeart,
  FileCheck,
  Zap,
  Clock,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalPdfs: 0,
    totalQuestions: 0,
    lastPdf: null,
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load user profile
  const user = JSON.parse(localStorage.getItem("user") || '{"name": "Ganesh Bhat"}');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await getDashboardSummary();
      setStats(res.data.stats);
      setActivities(res.data.recentActivities || []);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const shortcuts = [
    {
      title: "Upload Notes",
      desc: "Upload PDFs & extract text chunks for AI analysis",
      path: "/upload",
      icon: FileText,
      color: "from-blue-500 to-cyan-500",
      shadow: "shadow-blue-500/20",
    },
    {
      title: "Chat with Notes",
      desc: "Ask Gemini questions and get semantic citations",
      path: "/chat",
      icon: MessageSquare,
      color: "from-indigo-500 to-purple-500",
      shadow: "shadow-indigo-500/20",
    },
    {
      title: "Generate Quiz",
      desc: "Test your knowledge with 5 customized MCQs",
      path: "/quiz",
      icon: HelpCircle,
      color: "from-amber-500 to-orange-500",
      shadow: "shadow-amber-500/20",
    },
    {
      title: "Study Flashcards",
      desc: "Review key definitions with 3D flip card sets",
      path: "/flashcards",
      icon: FolderHeart,
      color: "from-emerald-500 to-teal-500",
      shadow: "shadow-emerald-500/20",
    },
  ];

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main page content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto">
          {/* Welcome greeting header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Welcome back, {user.name.split(" ")[0]} 👋
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm md:text-base">
                Ready to optimize your learning today? Let's check your stats.
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-sm font-semibold transition shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="h-4 w-4 text-blue-500" /> Sync Stats
            </button>
          </div>

          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total PDFs */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 flex items-center justify-between shadow-sm transition">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Documents Uploaded
                </p>
                <h3 className="text-3xl font-extrabold">
                  {loading ? "..." : stats.totalPdfs}
                </h3>
                <p className="text-xs text-slate-500">Active Study Material</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                <FileCheck className="h-6 w-6" />
              </div>
            </div>

            {/* Questions Asked */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 flex items-center justify-between shadow-sm transition">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Questions Answered
                </p>
                <h3 className="text-3xl font-extrabold">
                  {loading ? "..." : stats.totalQuestions}
                </h3>
                <p className="text-xs text-slate-500">Resolved Queries</p>
              </div>
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <MessageSquare className="h-6 w-6" />
              </div>
            </div>

            {/* Last Upload */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 flex items-center justify-between shadow-sm transition">
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Last Active Notes
                </p>
                <h3 className="text-lg font-extrabold truncate pr-2 mt-1">
                  {loading ? "..." : stats.lastPdf ? stats.lastPdf.fileName : "No uploads yet"}
                </h3>
                <p className="text-xs text-slate-550 flex items-center gap-1 mt-1">
                  <Clock className="h-3.5 w-3.5" />
                  {stats.lastPdf ? getRelativeTime(stats.lastPdf.uploadedAt) : "Never"}
                </p>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Core Feature Shortcuts */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {shortcuts.map((sc) => {
                const Icon = sc.icon;
                return (
                  <Link
                    key={sc.title}
                    to={sc.path}
                    className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                  >
                    <div className={`p-3 bg-gradient-to-tr ${sc.color} text-white rounded-2xl w-fit mb-4 shadow-lg ${sc.shadow}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="font-extrabold text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {sc.title}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 flex-grow">
                      {sc.desc}
                    </p>
                    <div className="flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 mt-4 group-hover:translate-x-1.5 transition-transform">
                      Get Started <ChevronRight className="h-4 w-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity Log Feed */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" /> Recent Activities
            </h2>
            
            {loading ? (
              <p className="text-sm text-slate-500 text-center py-6">Loading activities...</p>
            ) : activities.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">No activity recorded yet</p>
                <p className="text-xs text-slate-400 mt-1">Upload a PDF or start a chat session to build your study history!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((act) => {
                  let actIcon = FileText;
                  let iconColor = "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400";
                  
                  if (act.type === "chat") {
                    actIcon = MessageSquare;
                    iconColor = "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400";
                  } else if (act.type === "quiz") {
                    actIcon = HelpCircle;
                    iconColor = "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400";
                  } else if (act.type === "flashcard") {
                    actIcon = FolderHeart;
                    iconColor = "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400";
                  }
                  
                  const Icon = actIcon;

                  return (
                    <div
                      key={act._id}
                      className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-850 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition duration-150"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 ${iconColor}`}>
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-750 dark:text-slate-200 truncate">
                            {act.description}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {act.type.charAt(0).toUpperCase() + act.type.slice(1)} Event
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-slate-400 shrink-0 ml-4">
                        {getRelativeTime(act.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;