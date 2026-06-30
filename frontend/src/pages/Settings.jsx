import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { getMe, updateProfile, changePassword, deleteAccount } from "../services/authService";
import { useTheme } from "../context/ThemeContext";
import {
  Settings as SettingsIcon,
  User,
  ShieldAlert,
  Moon,
  Sun,
  Lock,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Profile Form States
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form States
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Danger Zone States
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Alerts
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await getMe();
      setProfileData({
        name: res.data.name,
        email: res.data.email,
      });
    } catch (err) {
      console.error(err);
      showToast("Failed to load profile details", "error");
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.name.trim()) {
      showToast("Name cannot be empty", "error");
      return;
    }

    try {
      setProfileLoading(true);
      const res = await updateProfile({
        name: profileData.name,
      });

      // Update cached user in localStorage
      const cachedUser = JSON.parse(localStorage.getItem("user") || "{}");
      cachedUser.name = res.data.user.name;
      localStorage.setItem("user", JSON.stringify(cachedUser));

      showToast("Profile details updated successfully!");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = passwordData;

    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast("Please fill in all password fields", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters long", "error");
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword({
        oldPassword,
        newPassword,
      });

      showToast("Password updated successfully!");
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to change password. Double check your old password.", "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE MY ACCOUNT") {
      showToast("Please type the confirmation text exactly", "error");
      return;
    }

    try {
      setDeleteLoading(true);
      await deleteAccount();
      
      showToast("Account deleted. Clearing storage...");
      setTimeout(() => {
        localStorage.clear();
        window.location.href = "/register";
      }, 1500);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete account", "error");
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />

        {/* Global Toast */}
        {toast.show && (
          <div className="fixed top-6 right-6 z-50 animate-slide-in">
            <div className={`p-4 rounded-2xl shadow-xl border flex items-center gap-3 ${
              toast.type === "success"
                ? "bg-green-50 dark:bg-green-955 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300"
                : "bg-red-50 dark:bg-red-955 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
            }`}>
              {toast.type === "success" ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span className="text-sm font-semibold">{toast.message}</span>
            </div>
          </div>
        )}

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-4xl mx-auto w-full space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 dark:bg-slate-900 text-slate-655 dark:text-slate-400 rounded-2xl">
              <SettingsIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Settings & Profile</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                Manage your study assistant profile preferences and security credentials.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* LEFT COLUMN: Profile info & Theme */}
            <div className="space-y-8">
              {/* Profile details Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
                <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" /> Account details
                </h2>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                      Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      placeholder="Ganesh Bhat"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                      Email Address (Locked)
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl text-slate-400 dark:text-slate-500 text-sm cursor-not-allowed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow transition text-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {profileLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save Details
                  </button>
                </form>
              </div>

              {/* Theme Preference Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
                <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
                  {theme === "dark" ? <Moon className="h-5 w-5 text-indigo-400" /> : <Sun className="h-5 w-5 text-amber-500" />} Theme Preferences
                </h2>
                
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Toggle between Light and Dark visual modes. Dark mode saves battery and reduces eye strain during late-night study sessions.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => theme === "dark" && toggleTheme()}
                    className={`flex-1 py-3 px-4 border rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                      theme === "light"
                        ? "border-blue-500 bg-blue-50/20 text-blue-600 dark:text-blue-400"
                        : "border-slate-200 dark:border-slate-850 hover:bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Sun className="h-4 w-4" /> Light Mode
                  </button>
                  <button
                    onClick={() => theme === "light" && toggleTheme()}
                    className={`flex-1 py-3 px-4 border rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                      theme === "dark"
                        ? "border-blue-500 bg-blue-50/20 text-blue-600 dark:text-blue-400"
                        : "border-slate-250 dark:border-slate-800 hover:bg-slate-800/55 text-slate-400"
                    }`}
                  >
                    <Moon className="h-4 w-4" /> Dark Mode
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Change password & Danger zone */}
            <div className="space-y-8">
              {/* Change password Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
                <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-amber-500" /> Update Password
                </h2>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                      Old Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow transition text-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {passwordLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Update Password
                  </button>
                </form>
              </div>

              {/* Danger Zone: Delete Account */}
              <div className="bg-red-50/30 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-3xl p-6 shadow-sm">
                <h2 className="text-lg font-bold tracking-tight mb-2 flex items-center gap-2 text-red-700 dark:text-red-400">
                  <ShieldAlert className="h-5 w-5" /> Danger Zone
                </h2>
                
                <p className="text-xs text-slate-550 dark:text-slate-400 mb-4 leading-relaxed">
                  Permanently delete your account. This action is **irreversible** and will immediately wipe all your PDFs, vector index chunks, quizzes, flashcards, and chat history from the servers.
                </p>

                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow hover:shadow-red-550/10 transition text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="h-4 w-4" /> Delete My Account
                  </button>
                ) : (
                  <div className="space-y-4 animate-fade-in border-t border-red-100 dark:border-red-950/40 pt-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                        Type <span className="font-extrabold text-red-600 select-all">DELETE MY ACCOUNT</span> to confirm
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Type verification text"
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-red-200 dark:border-red-900/40 rounded-2xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading || deleteConfirmText !== "DELETE MY ACCOUNT"}
                        className="px-4 py-2 bg-red-650 hover:bg-red-750 text-white font-bold rounded-xl text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                      >
                        {deleteLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Confirm Delete
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDelete(false);
                          setDeleteConfirmText("");
                        }}
                        className="px-4 py-2 border border-slate-205 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Settings;
