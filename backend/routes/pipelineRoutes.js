const express = require("express");
const router = express.Router();
const pipelineController = require("../controllers/pipelineController");

// System status and audit logs
router.get("/status", pipelineController.getStatus);
router.get("/history", pipelineController.getHistory);

// Lead management
router.post("/leads/search", pipelineController.searchLeads);
router.post("/leads/enrich", pipelineController.enrichLead);

// AI SDR outreach pipeline
router.post("/outreach/generate", pipelineController.generateEmail);
router.post("/outreach/send", pipelineController.sendEmail);
router.post("/outreach/generate-send", pipelineController.generateAndSend);

module.exports = router;
