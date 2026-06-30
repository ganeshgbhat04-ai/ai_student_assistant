const { GoogleGenerativeAI } = require(
  "@google/generative-ai"
);

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// Attach genAI instance and embedding model helper
model.genAI = genAI;
model.embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

module.exports = model;