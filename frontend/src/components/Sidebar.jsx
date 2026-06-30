import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Sparkles,
  HelpCircle,
  FolderHeart,
  Settings,
  X,
} from "lucide-react";

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Upload Notes",
      path: "/upload",
      icon: FileText,
    },
    {
      name: "Chat with PDFs",
      path: "/chat",
      icon: MessageSquare,
    },
    {
      name: "Generate Quiz",
      path: "/quiz",
      icon: HelpCircle,
    },
    {
      name: "Flashcards",
      path: "/flashcards",
      icon: FolderHeart,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-slate-900 dark:bg-slate-950 text-white p-5 border-r border-slate-800 transition-colors duration-300">
      <div className="flex items-center justify-between mb-8 mt-2">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-xl">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Study.AI
          </span>
        </Link>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-850"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1.5">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-255 group ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-transform duration-250 ${
                  isActive ? "scale-105" : "text-slate-400 group-hover:scale-105 group-hover:text-slate-200"
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        © 2026 AI Study Assistant
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          ></div>
          {/* Drawer content */}
          <div className="relative w-64 h-full animate-slide-in">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;