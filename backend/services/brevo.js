const SibApiV3Sdk = require("sib-api-v3-sdk");

// Initialize Brevo SDK if key is present
let apiInstance = null;
const brevoKey = process.env.BREVO_API_KEY;

if (brevoKey) {
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications["api-key"];
  apiKey.apiKey = brevoKey;
  apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
}

/**
 * Sends a transactional email using Brevo SMTP (with Mock Fallback).
 */
async function sendBrevoEmail({ toEmail, toName, subject, htmlContent }) {
  const senderEmail = process.env.SENDER_EMAIL || "test-outreach@gmail.com";
  const senderName = process.env.SENDER_NAME || "Outreach SDR";

  // Check if we should use mock
  if (!brevoKey || !apiInstance) {
    console.log("🔌 [Brevo] API key missing. Running in Mock Send Mode.");
    return {
      success: true,
      messageId: `<mock-${Date.now()}.${Math.random().toString(36).substring(7)}@smtp-relay.mailin.fr>`,
      mock: true
    };
  }

  try {
    const response = await apiInstance.sendTransacEmail({
      sender: {
        email: senderEmail,
        name: senderName
      },
      to: [
        {
          email: toEmail,
          name: toName || toEmail
        }
      ],
      subject: subject,
      htmlContent: htmlContent
    });

    return {
      success: true,
      messageId: response.messageId,
      mock: false
    };
  } catch (error) {
    console.warn("⚠️ [Brevo] Dispatch failure. Falling back to Mock Send:", error.response?.body || error.message);
    return {
      success: true,
      messageId: `<mock-fallback-${Date.now()}@smtp-relay.mailin.fr>`,
      mock: true,
      errorMsg: error.response?.body || error.message
    };
  }
}

module.exports = {
  sendBrevoEmail
};
