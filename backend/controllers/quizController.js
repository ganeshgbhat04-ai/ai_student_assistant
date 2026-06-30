const Pdf = require("../models/Pdf");
const Quiz = require("../models/Quiz");
const Activity = require("../models/Activity");
const geminiModel = require("../services/geminiService");
const mongoose = require("mongoose");

// Generate Quiz from PDF content
const generateQuiz = async (req, res) => {
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
You are an expert tutor. Please generate an educational quiz based on the following text from the document "${pdf.fileName}".
Generate exactly 5 high-quality, conceptual, and challenging multiple choice questions.

Each question must have:
- A clear, concise question statement.
- Exactly 4 options.
- A 0-based index representing the correct answer (0 = first option, 1 = second, etc.).
- A helpful explanation detailing why that option is correct and others are incorrect.

Return the results ONLY as a JSON array matching the following schema structure:
[
  {
    "question": "What is the primary function of...?",
    "options": ["Option 1 text", "Option 2 text", "Option 3 text", "Option 4 text"],
    "correctAnswer": 1,
    "explanation": "Option 2 is correct because..."
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
    let questions;
    try {
      questions = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error("JSON parsing of Gemini quiz failed:", jsonText);
      return res.status(500).json({ message: "AI response failed to match correct JSON format." });
    }

    // Save Quiz to database
    const quiz = await Quiz.create({
      userId: req.user.id,
      pdfId,
      title: `Quiz - ${pdf.fileName}`,
      questions,
    });

    // Log Activity
    await Activity.create({
      userId: req.user.id,
      type: "quiz",
      description: `Generated a 5-question quiz for "${pdf.fileName}"`,
    });

    res.status(201).json(quiz);
  } catch (error) {
    console.error("Quiz generation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get quizzes for a PDF
const getQuizzesForPdf = async (req, res) => {
  try {
    const { pdfId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(pdfId)) {
      return res.status(400).json({ message: "Invalid PDF ID" });
    }

    const quizzes = await Quiz.find({ pdfId, userId: req.user.id }).sort({
      createdAt: -1,
    });

    res.status(200).json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single quiz by ID
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user.id });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.status(200).json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateQuiz,
  getQuizzesForPdf,
  getQuizById,
};
