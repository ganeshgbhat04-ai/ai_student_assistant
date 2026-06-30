import API from "./api";

// PDF endpoints
export const getPdfs = () => {
  return API.get("/pdf");
};

export const getPdfById = (id) => {
  return API.get(`/pdf/${id}`);
};

export const deletePdf = (id) => {
  return API.delete(`/pdf/${id}`);
};

export const summarizePdf = (id) => {
  return API.post(`/pdf/${id}/summarize`);
};

// Chat endpoints
export const askQuestion = (data) => {
  // data: { pdfId, question, chatId }
  return API.post("/chat", data);
};

export const getChatsForPdf = (pdfId) => {
  return API.get(`/chat/pdf/${pdfId}`);
};

export const getChatHistory = (chatId) => {
  return API.get(`/chat/${chatId}`);
};

export const deleteChat = (chatId) => {
  return API.delete(`/chat/${chatId}`);
};

// Quiz endpoints
export const generateQuiz = (pdfId) => {
  return API.post("/quiz/generate", { pdfId });
};

export const getPdfQuizzes = (pdfId) => {
  return API.get(`/quiz/pdf/${pdfId}`);
};

export const getQuizById = (quizId) => {
  return API.get(`/quiz/${quizId}`);
};

// Flashcard endpoints
export const generateFlashcards = (pdfId) => {
  return API.post("/flashcards/generate", { pdfId });
};

export const getPdfFlashcards = (pdfId) => {
  return API.get(`/flashcards/pdf/${pdfId}`);
};

// Dashboard / Activity summary endpoint
export const getDashboardSummary = () => {
  return API.get("/activity/summary");
};