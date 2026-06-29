import { useState } from "react";
import axios from "axios";

function UploadPdf() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a PDF");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/pdf/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage(res.data.message);
      alert("PDF Uploaded Successfully!");
    } catch (error) {
      console.log(error);
      alert("Upload Failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6">
          Upload PDF 📄
        </h1>

        <form onSubmit={handleUpload}>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) =>
              setFile(e.target.files[0])
            }
            className="mb-6"
          />

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            Upload
          </button>
        </form>

        {message && (
          <p className="mt-5 text-green-600">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default UploadPdf;