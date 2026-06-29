const Pdf = require("../models/Pdf");
const model = require("../services/geminiService");
const mongoose = require("mongoose");

const chatWithPdf = async (req, res) => {
    try {
        const { pdfId, question } = req.body;

        if (!mongoose.Types.ObjectId.isValid(pdfId)) {
            return res.status(400).json({
                message: "Invalid PDF ID",
            });
        }
        
        const pdf = await Pdf.findById(pdfId);

        if (!pdf) {
            return res.status(404).json({
                message: "PDF not found",
            });
        }

        // For now use the first few chunks
        const context = pdf.chunks
            .slice(0, 5)
            .join("\n");

        const prompt = `
You are a study assistant.

Context:
${context}

Question:
${question}

Answer only from the provided context.
`;

        const result =
            await model.generateContent(prompt);

        const answer =
            result.response.text();

        res.json({
            answer,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: error.message,
        });
    }
};

module.exports = {
    chatWithPdf,
};