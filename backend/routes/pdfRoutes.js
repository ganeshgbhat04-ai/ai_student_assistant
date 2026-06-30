const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/auth");
const {
  uploadPdf,
  getAllPdfs,
  getPdfById,
  deletePdf,
  summarizePdf,
} = require("../controllers/pdfController");

// Secure all PDF routes
router.use(protect);

router.post("/upload", upload.single("pdf"), uploadPdf);
router.get("/", getAllPdfs);
router.get("/:id", getPdfById);
router.delete("/:id", deletePdf);
router.post("/:id/summarize", summarizePdf);

module.exports = router;