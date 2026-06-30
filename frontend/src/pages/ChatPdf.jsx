import { useEffect, useState } from "react";
import { getPdfs, askQuestion } from "../services/chatService";

function ChatPdf() {
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPdfs();
  }, []);

  const fetchPdfs = async () => {
    try {
      const res = await getPdfs();
      setPdfs(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleAsk = async () => {
    if (!selectedPdf || !question) {
      alert("Select a PDF and enter a question.");
      return;
    }

    try {
      setLoading(true);

      const res = await askQuestion({
        pdfId: selectedPdf,
        question,
      });

      setAnswer(res.data.answer);
    } catch (err) {
      console.log(err);
      alert("Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8">

        <h1 className="text-3xl font-bold mb-6">
          Chat with PDF 🤖
        </h1>

        <select
          className="border p-3 rounded w-full mb-5"
          value={selectedPdf}
          onChange={(e) =>
            setSelectedPdf(e.target.value)
          }
        >
          <option value="">
            Select PDF
          </option>

          {pdfs.map((pdf) => (
            <option
              key={pdf._id}
              value={pdf._id}
            >
              {pdf.fileName}
            </option>
          ))}
        </select>

        <textarea
          className="border p-3 rounded w-full mb-5"
          rows="4"
          placeholder="Ask a question..."
          value={question}
          onChange={(e) =>
            setQuestion(e.target.value)
          }
        />

        <button
          onClick={handleAsk}
          className="bg-blue-600 text-white px-6 py-3 rounded"
        >
          Ask AI
        </button>

        {loading && (
          <p className="mt-5">
            Thinking...
          </p>
        )}

        {answer && (
          <div className="mt-8 p-5 bg-gray-100 rounded-lg">
            <h2 className="font-bold mb-3">
              AI Answer
            </h2>

            <p>{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatPdf;