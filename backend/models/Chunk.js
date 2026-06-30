const mongoose = require("mongoose");

const chunkSchema = new mongoose.Schema(
  {
    pdfId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pdf",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number], // 768 dimensions
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Chunk", chunkSchema);
