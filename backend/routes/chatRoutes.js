const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  chatWithPdf,
  getChatsForPdf,
  getChatById,
  deleteChat,
} = require("../controllers/chatController");

// Secure all chat routes
router.use(protect);

router.post("/", chatWithPdf);
router.get("/pdf/:pdfId", getChatsForPdf);
router.get("/:id", getChatById);
router.delete("/:id", deleteChat);

module.exports = router;