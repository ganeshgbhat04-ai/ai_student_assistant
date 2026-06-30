import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, LogOut, User, Menu } from "lucide-react";

function Navbar({ onToggleSidebar }) {
  const { theme, toggleTheme } = useTheme();

  // Get user details from localStorage
  const user = JSON.parse(localStorage.getItem("user") || '{"name": "Ganesh Bhat"}');

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const firstLetter = user.name ? user.name.charAt(0).toUpperCase() : "S";

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 flex justify-between items-center transition-colors duration-300">
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger menu toggle */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Study Assistant
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Powered by Google Gemini 2.5 Flash
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition cursor-pointer"
          aria-label="Toggle dark/light mode"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-amber-500" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-700 pl-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow">
            {firstLetter}
          </div>
          <span className="text-sm font-semibold text-slate-750 dark:text-slate-200 hidden md:block">
            {user.name}
          </span>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition cursor-pointer ml-1"
            title="Log Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;