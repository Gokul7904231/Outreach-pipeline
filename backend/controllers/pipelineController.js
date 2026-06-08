const prospeoService = require("../services/prospeo");
const aiService = require("../services/ai");
const brevoService = require("../services/brevo");
const dbService = require("../services/dbService");

/**
 * Endpoint: GET /api/status
 * Returns connectivity status and active API modes.
 */
async function getStatus(req, res) {
  const prospeoKey = !!process.env.PROSPEO_API_KEY;
  const geminiKey = !!process.env.GEMINI_API_KEY;
  const brevoKey = !!process.env.BREVO_API_KEY;

  const prospeoInfo = await prospeoService.getAccountInfo();

  return res.json({
    prospeo: prospeoKey,
    gemini: geminiKey,
    brevo: brevoKey,
    mockMode: !prospeoKey || !geminiKey || !brevoKey,
    prospeoCredits: prospeoInfo.success ? prospeoInfo.credits : null
  });
}

/**
 * Endpoint: POST /api/leads/search
 * Searches leads via Prospeo (with fallback).
 */
async function searchLeads(req, res) {
  const { person_search, person_job_title } = req.body;
  const result = await prospeoService.searchProspeoLeads({ person_search, person_job_title });
  return res.json({
    ...result,
    source: result.mock ? "MOCK" : "REAL"
  });
}

/**
 * Endpoint: POST /api/leads/enrich
 * Enriches a lead to find their email address.
 */
async function enrichLead(req, res) {
  const { person_id, first_name, company_website } = req.body;
  const result = await prospeoService.enrichProspeoLead(person_id, { first_name, company_website });
  return res.json(result);
}

/**
 * Endpoint: POST /api/outreach/generate
 * Generates email draft text using Gemini (with fallback).
 */
async function generateEmail(req, res) {
  const { name, role, company, tone } = req.body;
  const result = await aiService.generateOutreach({ name, role, company, tone });
  return res.json(result);
}

/**
 * Endpoint: POST /api/outreach/send
 * Sends an email via Brevo and logs to db.json.
 */
async function sendEmail(req, res) {
  const { toEmail, toName, subject, htmlContent, company, role, useTestRecipient } = req.body;

  if (!toEmail) {
    return res.status(400).json({ success: false, error: "Recipient email is required" });
  }

  const SAFE_TEST_EMAIL = "asgokul2004@gmail.com";
  const targetEmail = useTestRecipient ? SAFE_TEST_EMAIL : toEmail;

  const result = await brevoService.sendBrevoEmail({ toEmail: targetEmail, toName, subject, htmlContent });

  // Add to database logs
  const log = dbService.addHistoryLog({
    recipientEmail: targetEmail,
    recipientName: toName || targetEmail,
    company: company || "N/A",
    jobTitle: role || "N/A",
    subject: subject,
    bodyText: htmlContent.replace(/<[^>]*>/g, ""), // strip html for logs
    status: result.success ? "Sent" : "Failed",
    mode: result.mock ? "Mock Mode" : "Real API",
    errorMsg: result.errorMsg || null
  });

  return res.json({
    ...result,
    log
  });
}

/**
 * Endpoint: POST /api/outreach/generate-send
 * Multi-service orchestrator: Sourcing/Enrichment -> AI Personalization -> Brevo dispatch -> Logging
 */
async function generateAndSend(req, res) {
  const { 
    person_id, 
    first_name, 
    last_name, 
    current_job_title, 
    company, 
    company_website, 
    tone,
    useTestRecipient
  } = req.body;

  const fullName = `${first_name} ${last_name}`;
  let email = req.body.email;
  let enrichMock = false;

  // Step 1: Enrich lead if email is not pre-provided
  if (!email) {
    const enrichResult = await prospeoService.enrichProspeoLead(person_id, { first_name, company_website });
    email = enrichResult.email;
    enrichMock = enrichResult.mock;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "Failed to source email address for this lead." 
      });
    }
  }

  // Step 2: Generate personalized email copy via Gemini
  const genResult = await aiService.generateOutreach({
    name: first_name || fullName,
    role: current_job_title,
    company,
    tone
  });

  const emailSubject = `Partnership opportunity for ${company}`;
  const formattedHtml = genResult.text.replace(/\n/g, "<br>");

  const SAFE_TEST_EMAIL = "asgokul2004@gmail.com";
  const targetEmail = useTestRecipient ? SAFE_TEST_EMAIL : email;

  // Step 3: Send via Brevo
  const sendResult = await brevoService.sendBrevoEmail({
    toEmail: targetEmail,
    toName: fullName,
    subject: emailSubject,
    htmlContent: formattedHtml
  });

  // Step 4: Write to History logs
  const log = dbService.addHistoryLog({
    recipientEmail: targetEmail,
    recipientName: fullName,
    company: company,
    jobTitle: current_job_title,
    subject: emailSubject,
    bodyText: genResult.text,
    status: sendResult.success ? "Sent" : "Failed",
    mode: (enrichMock || genResult.mock || sendResult.mock) ? "Mock Mode" : "Real API",
    errorMsg: sendResult.errorMsg || null
  });

  return res.json({
    success: sendResult.success,
    email: targetEmail,
    generatedText: genResult.text,
    messageId: sendResult.messageId,
    log
  });
}

/**
 * Endpoint: GET /api/history
 * Retrieves sent logs from db.json.
 */
async function getHistory(req, res) {
  const history = dbService.fetchHistoryLogs();
  return res.json(history);
}

module.exports = {
  getStatus,
  searchLeads,
  enrichLead,
  generateEmail,
  sendEmail,
  generateAndSend,
  getHistory
};
