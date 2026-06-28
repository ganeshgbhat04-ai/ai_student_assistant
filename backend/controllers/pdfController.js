const Pdf = require("../models/Pdf");
const pdfParse = require("pdf-parse");
const fs = require("fs");

// Function to split text into chunks
function chunkText(text, chunkSize = 1000) {
  const chunks = [];

  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  return chunks;
}

// Upload PDF
const uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No PDF uploaded",
      });
    }

    // Read PDF file
    const dataBuffer = fs.readFileSync(req.file.path);

    // Extract text
    const pdfData = await pdfParse(dataBuffer);

    // Split text into chunks
    const chunks = chunkText(pdfData.text);

    // Save in MongoDB
    const pdf = await Pdf.create({
      fileName: req.file.filename,
      filePath: req.file.path,
      extractedText: pdfData.text,
      chunks: chunks,
    });

    res.status(201).json({
      message: "PDF Uploaded Successfully",
      pages: pdfData.numpages,
      textLength: pdfData.text.length,
      totalChunks: chunks.length,
      pdf,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// Get all PDFs
const getAllPdfs = async (req, res) => {
  try {
    const pdfs = await Pdf.find().sort({
      createdAt: -1,
    });

    res.status(200).json(pdfs);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get one PDF by ID
const getPdfById = async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);

    if (!pdf) {
      return res.status(404).json({
        message: "PDF not found",
      });
    }

    res.status(200).json(pdf);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  uploadPdf,
  getAllPdfs,
  getPdfById,
};