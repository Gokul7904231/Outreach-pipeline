const path = require("path");
// Configure dotenv pointing to backend/.env
require("dotenv").config({ path: path.join(__dirname, "backend", ".env") });

const prospeo = require("./backend/services/prospeo");
const ai = require("./backend/services/ai");
const brevo = require("./backend/services/brevo");
const dbService = require("./backend/services/dbService");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log("==========================================");
  console.log("⚡ Outreach.AI Command-Line SDR Pipeline ⚡");
  console.log("==========================================\n");

  const domainInput = await askQuestion("Enter the target company domain (e.g. openai.com, stripe.com): ");
  const cleanDomain = domainInput.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "");

  if (!cleanDomain) {
    console.error("❌ Target domain cannot be empty. Exiting.");
    rl.close();
    return;
  }

  // 1. Sourcing Prospects
  console.log(`\n🔍 Sourcing prospects for domain: ${cleanDomain}...`);
  let searchResult = await prospeo.searchProspeoLeads({ person_search: cleanDomain });
  
  if (!searchResult.success || !searchResult.results || searchResult.results.length === 0) {
    console.log(`⚠️ Sourcing failed or no prospects found for ${cleanDomain}.`);
    if (searchResult.errorMsg) {
      console.log(`   Reason: ${searchResult.errorMsg}`);
    }
    
    const useMockInput = await askQuestion("Do you want to fall back to Mock Sourcing demo/fallback leads to continue? (y/n): ");
    if (useMockInput.trim().toLowerCase() === "y") {
      console.log("🔌 Loading demo Mock Sourcing leads...");
      searchResult = {
        success: true,
        results: prospeo.getMockLeads({ person_search: cleanDomain }),
        mock: true
      };
    } else {
      console.log("❌ Sourcing aborted. Exiting.");
      rl.close();
      return;
    }
  }

  console.log(`\n✅ Found ${searchResult.results.length} leads. (Source: ${searchResult.mock ? "MOCK DATA" : "REAL API"})`);
  
  // 2. Lead Enrichment & Draft Copy Generation
  const leadsToOutreach = [];
  
  for (let i = 0; i < searchResult.results.length; i++) {
    const lead = searchResult.results[i];
    console.log(`\n--------------------------------------------------`);
    console.log(`Lead [${i+1}/${searchResult.results.length}]: ${lead.full_name} (${lead.current_job_title})`);

    // Safe enrichment
    let email = lead.email;
    let emailStatus = lead.email_status;
    let enrichMock = searchResult.mock;

    if (!email) {
      console.log(`   ✉️ Enriching contact details via Prospeo...`);
      // Introduce a slight delay (2s) if querying the real API to prevent rate limits
      if (!searchResult.mock && i > 0) {
        await new Promise(r => setTimeout(r, 2200));
      }
      try {
        const enrichRes = await prospeo.enrichProspeoLead(lead.person_id, {
          first_name: lead.first_name,
          company_website: lead.company_website
        });
        if (enrichRes.success && enrichRes.email) {
          email = enrichRes.email;
          emailStatus = enrichRes.email_status;
          enrichMock = enrichRes.mock;
          console.log(`   ✅ Sourced email: ${email} (${emailStatus})`);
        } else {
          console.log(`   ⚠️ Enrichment failed or rate limited: ${enrichRes.errorMsg || "Not found"}. Skipping SMTP outbound for this prospect.`);
          continue;
        }
      } catch (err) {
        console.log(`   ⚠️ Enrichment error: ${err.message}. Skipping this prospect.`);
        continue;
      }
    } else {
      console.log(`   ✅ Pre-existing email available: ${email}`);
    }

    // AI Copywriting
    console.log(`   ✍️ Generating personalized outreach pitch via Gemini...`);
    try {
      const copyRes = await ai.generateOutreach({
        name: lead.first_name || lead.full_name,
        role: lead.current_job_title,
        company: lead.company,
        tone: "Professional"
      });

      if (copyRes.success && copyRes.text) {
        leadsToOutreach.push({
          lead,
          email,
          emailStatus,
          enrichMock,
          subject: `Partnership opportunity for ${lead.company}`,
          body: copyRes.text,
          aiMock: copyRes.mock
        });
        console.log(`   ✅ Generated pitch copy. (AI: ${copyRes.mock ? "MOCK" : "REAL"})`);
      } else {
        console.log(`   ⚠️ AI copywriting failed: ${copyRes.errorMsg || "Unknown error"}. Skipping.`);
      }
    } catch (err) {
      console.log(`   ⚠️ Copywriting error: ${err.message}. Skipping.`);
    }
  }

  if (leadsToOutreach.length === 0) {
    console.log("\n❌ No outreach drafts could be successfully prepared. Exiting.");
    rl.close();
    return;
  }

  // 3. The Safety Checkpoint
  console.log("\n==================================================");
  console.log("🛑 SAFETY CHECKPOINT: OUTBOUND CAMPAIGN SUMMARY 🛑");
  console.log("==================================================");
  console.log(`You have prepared ${leadsToOutreach.length} personalized outreach email(s).\n`);

  for (let i = 0; i < leadsToOutreach.length; i++) {
    const draft = leadsToOutreach[i];
    console.log(`--- [Email Draft #${i+1}] -----------------------------`);
    console.log(`Recipient: ${draft.lead.full_name} <${draft.email}>`);
    console.log(`Company:   ${draft.lead.company} | Role: ${draft.lead.current_job_title}`);
    console.log(`Subject:   ${draft.subject}`);
    console.log(`Body:\n${draft.body}\n`);
  }

  console.log("--------------------------------------------------");
  const testModeInput = await askQuestion("Enable Safe Test Recipient Mode (redirects all emails to asgokul2004@gmail.com)? [Y/n]: ");
  const useTestRecipient = testModeInput.trim().toLowerCase() !== "n";

  if (useTestRecipient) {
    console.log("🛡️ [Safe Test Recipient Mode Enabled] All outbound emails will be routed to: asgokul2004@gmail.com");
  } else {
    console.log("⚠️ [WARNING] Live campaign mode active! Emails will be sent to the actual recipients.");
  }

  const confirmSend = await askQuestion("\nDo you want to fire these outreach emails now? (y/n): ");
  if (confirmSend.trim().toLowerCase() !== "y") {
    console.log("❌ Campaign canceled. No emails were sent.");
    rl.close();
    return;
  }

  // 4. SMTP Dispatch and History Logging
  console.log("\n🚀 Dispatching campaign outbound...");
  const SAFE_TEST_EMAIL = "asgokul2004@gmail.com";

  for (let i = 0; i < leadsToOutreach.length; i++) {
    const draft = leadsToOutreach[i];
    const targetEmail = useTestRecipient ? SAFE_TEST_EMAIL : draft.email;
    
    console.log(`📧 Sending to ${draft.lead.full_name} via Brevo...`);
    try {
      const formattedHtml = draft.body.replace(/\n/g, "<br>");
      const sendRes = await brevo.sendBrevoEmail({
        toEmail: targetEmail,
        toName: draft.lead.full_name,
        subject: draft.subject,
        htmlContent: formattedHtml
      });

      // Write to audit log database
      const log = dbService.addHistoryLog({
        recipientEmail: targetEmail,
        recipientName: draft.lead.full_name,
        company: draft.lead.company,
        jobTitle: draft.lead.current_job_title,
        subject: draft.subject,
        bodyText: draft.body,
        status: sendRes.success ? "Sent" : "Failed",
        mode: (draft.enrichMock || draft.aiMock || sendRes.mock) ? "Mock Mode" : "Real API",
        errorMsg: sendRes.errorMsg || null
      });

      if (sendRes.success) {
        console.log(`   ✅ Successfully sent email #${i+1}! Message ID: ${sendRes.messageId}`);
      } else {
        console.log(`   ❌ Failed to send email #${i+1}: ${sendRes.errorMsg}`);
      }
    } catch (err) {
      console.log(`   ❌ Error dispatching email #${i+1}: ${err.message}`);
    }
  }

  console.log("\n🎉 Outreach campaign execution complete!");
  rl.close();
}

main().catch(err => {
  console.error("❌ Fatal execution error:", err);
  rl.close();
});
