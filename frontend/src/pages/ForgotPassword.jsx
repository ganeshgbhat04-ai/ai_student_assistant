import { useState } from "react";
import { forgotPassword } from "../services/authService";
import { Link } from "react-router-dom";
import { Mail, Loader2, KeyRound, ArrowLeft, CheckCircle } from "lucide-react";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mockLink, setMockLink] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setMockLink("");

    if (!email) {
      setError("Please enter your email");
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPassword(email);
      setSuccess("Reset link sent successfully!");
      if (res.data.mockResetLink) {
        setMockLink(res.data.mockResetLink);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-2xl border border-slate-100 dark:border-slate-800 p-8 relative overflow-hidden transition-colors duration-300">
        
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-200 transition gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Sign In
          </Link>
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-red-50 dark:bg-red-900/20 text-red-650 dark:text-red-400 rounded-2xl mb-3">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Forgot Password
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
            Enter your email to receive a password reset link
          </p>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-xl text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-r-xl text-green-700 dark:text-green-400 text-sm">
            {success} Check your email folder for the reset instructions.
          </div>
        )}

        {mockLink && (
          <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl text-slate-850 dark:text-blue-300 text-xs">
            <span className="font-bold flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-2">
              <CheckCircle className="h-4 w-4" /> local Dev Mock Reset Link
            </span>
            <p className="mb-3">Since no mail credentials are set in .env, click this button to simulate password reset immediately:</p>
            <a
              href={mockLink}
              className="inline-block px-4 py-2 bg-red-600 hover:bg-red-750 text-white rounded-lg font-bold text-center w-full"
            >
              Reset Password Now
            </a>
          </div>
        )}

        {!mockLink && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:shadow-blue-500/10 active:scale-98 transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
