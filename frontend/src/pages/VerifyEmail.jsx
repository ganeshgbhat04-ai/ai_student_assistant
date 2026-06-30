import { useEffect, useState } from "react";
import { verifyEmail } from "../services/authService";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, Sparkles } from "lucide-react";

function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const triggerVerification = async () => {
      try {
        setLoading(true);
        const res = await verifyEmail(token);
        setSuccess(res.data.message || "Email verified successfully!");
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Verification failed. The token may be invalid or expired.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      triggerVerification();
    } else {
      setError("No token provided");
      setLoading(false);
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-2xl border border-slate-100 dark:border-slate-800 p-8 relative overflow-hidden text-center transition-colors duration-300">
        
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="inline-flex items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl mb-6">
          <Sparkles className="h-6 w-6" />
        </div>

        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-4">
          Email Verification
        </h1>

        {loading && (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Verifying your email token, please wait...
            </p>
          </div>
        )}

        {!loading && success && (
          <div className="py-6 flex flex-col items-center justify-center gap-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {success}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              You will be automatically redirected to the login page shortly...
            </p>
            <Link
              to="/login"
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
            >
              Go to Sign In
            </Link>
          </div>
        )}

        {!loading && error && (
          <div className="py-6 flex flex-col items-center justify-center gap-4">
            <XCircle className="h-16 w-16 text-red-500" />
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">
              Verification Failed
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {error}
            </p>
            <Link
              to="/register"
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
            >
              Back to Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
