require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const pipelineRoutes = require("./routes/pipelineRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend development
app.use(cors());

// Parse incoming JSON payloads
app.use(express.json());

// Simple API Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Mount consolidated pipeline routes
app.use("/api", pipelineRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("❌ Express unhandled error:", err.stack);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: err.message
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`🚀 Outreach Pipeline Backend running on port ${PORT}`);
  console.log(`🔗 API Healthcheck: http://localhost:${PORT}/api/health`);
});
