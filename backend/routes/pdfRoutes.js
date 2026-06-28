const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");

const {
  uploadPdf,
  getAllPdfs,
  getPdfById,
} = require("../controllers/pdfController");

// Upload PDF
router.post(
  "/upload",
  upload.single("pdf"),
  uploadPdf
);

// Get all PDFs
router.get("/", getAllPdfs);

// Get single PDF
router.get("/:id", getPdfById);

module.exports = router;