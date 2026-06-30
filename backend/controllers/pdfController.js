const Pdf = require("../models/Pdf");
const Chunk = require("../models/Chunk");
const Activity = require("../models/Activity");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const geminiModel = require("../services/geminiService");

// Custom Recursive Character Splitter with Overlap
function recursiveSplitText(text, chunkSize = 1200, chunkOverlap = 200) {
  const separators = ["\n\n", "\n", " ", ""];
  
  const split = (textStr, separatorIndex) => {
    if (textStr.length <= chunkSize) {
      return [textStr];
    }
    const separator = separators[separatorIndex];
    const parts = textStr.split(separator);
    const result = [];
    let currentChunk = "";
    
    for (const part of parts) {
      const prospectiveChunk = currentChunk ? currentChunk + separator + part : part;
      if (prospectiveChunk.length <= chunkSize) {
        currentChunk = prospectiveChunk;
      } else {
        if (currentChunk) result.push(currentChunk);
        currentChunk = part;
        if (currentChunk.length > chunkSize && separatorIndex < separators.length - 1) {
          result.push(...split(currentChunk, separatorIndex + 1));
          currentChunk = "";
        }
      }
    }
    if (currentChunk) result.push(currentChunk);
    return result;
  };
  
  const rawChunks = split(text, 0);
  
  // Merge chunks with overlap
  const mergedChunks = [];
  for (let i = 0; i < rawChunks.length; i++) {
    const chunk = rawChunks[i];
    if (i === 0) {
      mergedChunks.push(chunk);
    } else {
      const prevChunk = rawChunks[i - 1];
      const overlapText = prevChunk.slice(-chunkOverlap);
      mergedChunks.push(overlapText + chunk);
    }
  }
  
  return mergedChunks.filter(c => c.trim().length > 10);
}

// Upload PDF
const uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No PDF uploaded" });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);

    // Clean text
    const cleanText = pdfData.text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n");

    // Split text into chunks
    const textChunks = recursiveSplitText(cleanText);

    if (textChunks.length === 0) {
      return res.status(400).json({ message: "Unable to extract readable text from this PDF" });
    }

    // Save PDF document first (without embeddings)
    const pdf = await Pdf.create({
      userId: req.user.id,
      fileName: req.file.originalname,
      filePath: req.file.path,
      extractedText: cleanText,
      chunks: textChunks,
    });

    // Generate embeddings in batches of 20
    const embeddingModel = geminiModel.embeddingModel;
    const batchSize = 20;
    const chunkDocs = [];

    console.log(`Generating embeddings for ${textChunks.length} chunks...`);

    for (let i = 0; i < textChunks.length; i += batchSize) {
      const batchChunks = textChunks.slice(i, i + batchSize);
      
      const requests = batchChunks.map(chunk => ({
        content: { parts: [{ text: chunk }] },
        model: "models/text-embedding-004"
      }));

      const result = await embeddingModel.batchEmbedContents({
        requests: requests
      });

      if (result && result.embeddings) {
        result.embeddings.forEach((emb, index) => {
          chunkDocs.push({
            pdfId: pdf._id,
            userId: req.user.id,
            text: batchChunks[index],
            embedding: emb.values,
          });
        });
      }
    }

    // Bulk insert chunks
    if (chunkDocs.length > 0) {
      await Chunk.insertMany(chunkDocs);
    }

    // Log Activity
    await Activity.create({
      userId: req.user.id,
      type: "upload",
      description: `Uploaded PDF "${req.file.originalname}"`,
    });

    res.status(201).json({
      message: "PDF Uploaded Successfully",
      pages: pdfData.numpages,
      textLength: cleanText.length,
      totalChunks: textChunks.length,
      pdf,
    });
  } catch (error) {
    console.error("PDF upload error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all PDFs for user
const getAllPdfs = async (req, res) => {
  try {
    const pdfs = await Pdf.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json(pdfs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single PDF
const getPdfById = async (req, res) => {
  try {
    const pdf = await Pdf.findOne({ _id: req.params.id, userId: req.user.id });

    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    res.status(200).json(pdf);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete PDF
const deletePdf = async (req, res) => {
  try {
    const pdf = await Pdf.findOne({ _id: req.params.id, userId: req.user.id });

    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    // Delete local file
    if (fs.existsSync(pdf.filePath)) {
      try {
        fs.unlinkSync(pdf.filePath);
      } catch (err) {
        console.error("Failed to delete local file:", err);
      }
    }

    // Delete associated Chunks
    await Chunk.deleteMany({ pdfId: pdf._id });

    // Delete PDF document
    await Pdf.deleteOne({ _id: pdf._id });

    // Log Activity
    await Activity.create({
      userId: req.user.id,
      type: "upload",
      description: `Deleted PDF "${pdf.fileName}"`,
    });

    res.status(200).json({ message: "PDF deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Summarize PDF
const summarizePdf = async (req, res) => {
  try {
    const pdf = await Pdf.findOne({ _id: req.params.id, userId: req.user.id });

    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    if (pdf.summary) {
      return res.status(200).json({ summary: pdf.summary });
    }

    // Truncate input to avoid excessive context length
    const sampleText = pdf.extractedText.slice(0, 35000);

    const prompt = `
You are a brilliant study assistant. Review the following text extracted from the document "${pdf.fileName}".
Write a highly structured, comprehensive study summary.

Structure:
1. **Overview**: A high-level description of what the document is about (2-3 sentences).
2. **Key Concepts & Definitions**: List the core ideas, keywords, or topics with concise definitions.
3. **Core Explanation**: Detailed bulleted notes grouping important findings, methods, theories, or formulas.
4. **Summary & Takeaways**: A brief wrap-up of the most critical points.

Make it clean, clear, and easy for students to read. Use Markdown formatting.

Document Content:
${sampleText}
`;

    const result = await geminiModel.generateContent(prompt);
    const summary = result.response.text();

    // Save summary
    pdf.summary = summary;
    await pdf.save();

    // Log Activity
    await Activity.create({
      userId: req.user.id,
      type: "summary",
      description: `Generated summary for "${pdf.fileName}"`,
    });

    res.status(200).json({ summary });
  } catch (error) {
    console.error("Summarization error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadPdf,
  getAllPdfs,
  getPdfById,
  deletePdf,
  summarizePdf,
};