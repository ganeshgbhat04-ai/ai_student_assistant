const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  generateQuiz,
  getQuizzesForPdf,
  getQuizById,
} = require("../controllers/quizController");

// Secure all routes
router.use(protect);

router.post("/generate", generateQuiz);
router.get("/pdf/:pdfId", getQuizzesForPdf);
router.get("/:id", getQuizById);

module.exports = router;
