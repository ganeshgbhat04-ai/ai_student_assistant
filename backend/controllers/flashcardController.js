const Pdf = require("../models/Pdf");
const Flashcard = require("../models/Flashcard");
const Activity = require("../models/Activity");
const geminiModel = require("../services/geminiService");
const mongoose = require("mongoose");

// Generate Flashcards from PDF content
const generateFlashcards = async (req, res) => {
  try {
    const { pdfId } = req.body;

    if (!pdfId) {
      return res.status(400).json({ message: "PDF ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(pdfId)) {
      return res.status(400).json({ message: "Invalid PDF ID" });
    }

    const pdf = await Pdf.findOne({ _id: pdfId, userId: req.user.id });
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    const sampleText = pdf.extractedText.slice(0, 30000);

    const prompt = `
You are a brilliant study coach. Create a set of exactly 8 comprehensive flashcards to help a student study the core concepts in the document "${pdf.fileName}".
For each flashcard, define a front (a question, concept, or term) and a back (the answer, explanation, or definition).

Make the fronts clean and challenging, and make the backs highly informative yet concise.

Return the results ONLY as a JSON array matching the following schema structure:
[
  {
    "front": "What is the formula for...?",
    "back": "The formula is... where each variable represents..."
  }
]

Document Content:
${sampleText}
`;

    // Call Gemini with JSON enforcement
    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const jsonText = result.response.text();
    let cards;
    try {
      cards = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error("JSON parsing of Gemini flashcards failed:", jsonText);
      return res.status(500).json({ message: "AI response failed to match correct JSON format." });
    }

    // Save Flashcard set to database
    const flashcardSet = await Flashcard.create({
      userId: req.user.id,
      pdfId,
      title: `Flashcards - ${pdf.fileName}`,
      cards,
    });

    // Log Activity
    await Activity.create({
      userId: req.user.id,
      type: "flashcard",
      description: `Generated a set of 8 flashcards for "${pdf.fileName}"`,
    });

    res.status(201).json(flashcardSet);
  } catch (error) {
    console.error("Flashcards generation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get flashcards for a PDF
const getFlashcardsForPdf = async (req, res) => {
  try {
    const { pdfId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(pdfId)) {
      return res.status(400).json({ message: "Invalid PDF ID" });
    }

    const flashcards = await Flashcard.find({ pdfId, userId: req.user.id }).sort({
      createdAt: -1,
    });

    res.status(200).json(flashcards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateFlashcards,
  getFlashcardsForPdf,
};
