const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  generateFlashcards,
  getFlashcardsForPdf,
} = require("../controllers/flashcardController");

// Secure all routes
router.use(protect);

router.post("/generate", generateFlashcards);
router.get("/pdf/:pdfId", getFlashcardsForPdf);

module.exports = router;
