import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function Dashboard() {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-gray-100 min-h-screen">
        <Navbar />

        <div className="p-10">
          <h1 className="text-4xl font-bold mb-5">
           Welcome back, Ganesh 👋
          </h1>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:scale-105 hover:shadow-2xl transition duration-300 cursor-pointer">
              📄 Upload Notes
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 hover:scale-105 hover:shadow-2xl transition duration-300 cursor-pointer">
              💬 Chat with PDFs
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 hover:scale-105 hover:shadow-2xl transition duration-300 cursor-pointer">
              📝 Generate Quiz
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 hover:scale-105 hover:shadow-2xl transition duration-300 cursor-pointer">
              📚 Summarize Notes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;