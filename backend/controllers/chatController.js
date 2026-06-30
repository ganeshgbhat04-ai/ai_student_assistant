const Pdf = require("../models/Pdf");
const Chunk = require("../models/Chunk");
const Chat = require("../models/Chat");
const Activity = require("../models/Activity");
const geminiModel = require("../services/geminiService");
const mongoose = require("mongoose");

// Helper: Cosine similarity calculation for vector fallback
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Chat with PDF (RAG + History)
const chatWithPdf = async (req, res) => {
  try {
    const { pdfId, question, chatId } = req.body;

    if (!pdfId || !question) {
      return res.status(400).json({ message: "PDF ID and question are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(pdfId)) {
      return res.status(400).json({ message: "Invalid PDF ID" });
    }

    const pdf = await Pdf.findOne({ _id: pdfId, userId: req.user.id });
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    // 1. Generate query embedding using text-embedding-004
    const embeddingModel = geminiModel.embeddingModel;
    const queryEmbeddingResult = await embeddingModel.embedContent(question);
    const queryEmbedding = queryEmbeddingResult.embedding.values;

    // 2. Retrieve relevant chunks (RAG)
    let relevantChunks = [];
    let methodUsed = "Atlas Vector Search";

    try {
      // Attempt Atlas Vector Search
      relevantChunks = await Chunk.aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: 40,
            limit: 5,
            filter: {
              pdfId: { $eq: new mongoose.Types.ObjectId(pdfId) },
            },
          },
        },
      ]);
    } catch (vectorSearchError) {
      // Fallback: In-memory JavaScript Cosine Similarity
      methodUsed = "In-memory Cosine Similarity Fallback";
      const allChunks = await Chunk.find({ pdfId });
      
      const chunksWithScore = allChunks.map((c) => ({
        text: c.text,
        score: cosineSimilarity(queryEmbedding, c.embedding),
      }));

      // Sort by score descending and take top 5
      chunksWithScore.sort((a, b) => b.score - a.score);
      relevantChunks = chunksWithScore.slice(0, 5);
    }

    const context = relevantChunks.map((c) => c.text).join("\n\n");

    // 3. Load or create Chat Session
    let chatSession;
    if (chatId && mongoose.Types.ObjectId.isValid(chatId)) {
      chatSession = await Chat.findOne({ _id: chatId, userId: req.user.id });
    }

    if (!chatSession) {
      // Auto-set title to first 30 chars of first question
      const title = question.length > 35 ? question.substring(0, 35) + "..." : question;
      chatSession = await Chat.create({
        userId: req.user.id,
        pdfId,
        title,
        messages: [],
      });
    }

    // Load recent history (up to last 8 messages)
    const history = chatSession.messages.slice(-8);
    const historyText = history
      .map((msg) => `${msg.sender === "user" ? "Student" : "Assistant"}: ${msg.text}`)
      .join("\n");

    // 4. Construct Prompt
    const prompt = `
You are an expert academic tutor and study assistant.
Help the student answer their questions using the context provided below from the PDF document "${pdf.fileName}".

Context from PDF:
${context}

Recent Chat History:
${historyText || "No chat history yet."}

Current Student Question:
${question}

Guidelines:
1. Base your answer primarily on the Context from the PDF. If the answer cannot be found in the context, use your general knowledge, but clearly state that you are expanding beyond the document contents.
2. Provide a detailed, easy-to-understand explanation.
3. Use clean Markdown formatting (bullet points, bold text, code blocks, or simple tables if applicable) to present the information clearly.
4. Keep the tone helpful, encouraging, and academic.
`;

    // 5. Generate Answer
    const result = await geminiModel.generateContent(prompt);
    const answer = result.response.text();

    // 6. Save Messages to Chat Session
    chatSession.messages.push({ sender: "user", text: question });
    chatSession.messages.push({ sender: "ai", text: answer });
    await chatSession.save();

    // Log Activity
    await Activity.create({
      userId: req.user.id,
      type: "chat",
      description: `Asked question on PDF "${pdf.fileName}"`,
    });

    res.status(200).json({
      chatId: chatSession._id,
      title: chatSession.title,
      answer,
      methodUsed,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all chats for a PDF
const getChatsForPdf = async (req, res) => {
  try {
    const { pdfId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(pdfId)) {
      return res.status(400).json({ message: "Invalid PDF ID" });
    }

    const chats = await Chat.find({ pdfId, userId: req.user.id })
      .select("title createdAt updatedAt")
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single chat message history
const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user.id });

    if (!chat) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Clear/Delete chat session
const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user.id });

    if (!chat) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    await Chat.deleteOne({ _id: chat._id });

    res.status(200).json({ message: "Chat history cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  chatWithPdf,
  getChatsForPdf,
  getChatById,
  deleteChat,
};