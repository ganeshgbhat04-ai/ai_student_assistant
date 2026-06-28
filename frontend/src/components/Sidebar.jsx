import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div className="w-64 h-screen bg-gradient-to-b from-slate-900 to-blue-900 text-white p-5">
      <h1 className="text-2xl font-bold mb-8">
        AI Study Assistant
      </h1>

      <ul className="space-y-5">
        <li>
          <Link to="/dashboard">
            Dashboard
          </Link>
        </li>

        <li>
          <Link to="/upload">
            Upload PDF
          </Link>
        </li>

        <li>
          <Link to="/chat">
            Chat with Notes
          </Link>
        </li>

        <li>
          <Link to="/quiz">
            Generate Quiz
          </Link>
        </li>

        <li>
          <Link to="/summary">
            Summarize Notes
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;