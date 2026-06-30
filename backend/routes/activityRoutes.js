const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getDashboardSummary } = require("../controllers/activityController");

// Secure all routes
router.use(protect);

router.get("/summary", getDashboardSummary);

module.exports = router;
