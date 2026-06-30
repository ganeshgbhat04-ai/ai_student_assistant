const Pdf = require("../models/Pdf");
const Chat = require("../models/Chat");
const Activity = require("../models/Activity");

// Get dashboard summary statistics and recent activity feed
const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Count PDFs
    const totalPdfs = await Pdf.countDocuments({ userId });

    // Count Questions Asked (messages sent by user)
    const chats = await Chat.find({ userId });
    let totalQuestions = 0;
    chats.forEach((c) => {
      totalQuestions += c.messages.filter((m) => m.sender === "user").length;
    });

    // Get last uploaded PDF details
    const lastPdf = await Pdf.findOne({ userId })
      .sort({ createdAt: -1 })
      .select("fileName createdAt");

    // Get recent activity list (last 8)
    const recentActivities = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(8);

    res.status(200).json({
      stats: {
        totalPdfs,
        totalQuestions,
        lastPdf: lastPdf
          ? {
              id: lastPdf._id,
              fileName: lastPdf.fileName,
              uploadedAt: lastPdf.createdAt,
            }
          : null,
      },
      recentActivities,
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardSummary,
};
