const { GoogleGenerativeAI } = require("@google/generative-ai");

const geminiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (geminiKey) {
  genAI = new GoogleGenerativeAI(geminiKey);
}

/**
 * Generates a personalized outreach email using Gemini API (with Mock Fallback).
 */
async function generateOutreach({ name, role, company, tone }) {
  const selectedTone = tone || "Professional";

  if (!geminiKey || !genAI) {
    console.log("🔌 [Gemini] API key missing. Generating mock email copy.");
    return {
      success: true,
      text: getMockEmail({ name, role, company, tone: selectedTone }),
      mock: true
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
You are an expert SDR (Sales Development Representative) assistant.
Write a highly personalized cold outreach email to a prospect.

Prospect Details:
- Name: ${name || "there"}
- Role: ${role || "Professional"}
- Company: ${company || "your company"}

Tone requirements:
- Tone category: ${selectedTone}
- Make the email short, professional, and startup-style.
- Mention the company "${company || "their company"}" naturally.
- Reference their role "${role || "Professional"}" in the context of their daily work.
- Address a key B2B prospecting pain point (such as time wasted doing manual lead research or low email reply rates).
- Include a clear Call to Action (CTA) asking for a brief chat or feedback.
- Do NOT sound robotic. Avoid generic cliches (like "hope this email finds you well").
- Keep the length strictly under 150 words.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    return {
      success: true,
      text: text,
      mock: false
    };
  } catch (error) {
    console.warn("⚠️ [Gemini] Generation failure. Falling back to local template:", error.message);
    return {
      success: true,
      text: getMockEmail({ name, role, company, tone: selectedTone }),
      mock: true,
      errorMsg: error.message
    };
  }
}

/**
 * Local mock email generator for offline / fallback operations.
 */
function getMockEmail({ name, company, role, tone }) {
  const prospectName = name || "there";
  const prospectRole = role || "Professional";
  const prospectCompany = company || "your company";
  const cta = "Would you be open to a quick 10-minute chat next Tuesday at 2 PM EST to see if this could speed up your workflows?";

  switch (tone) {
    case "Friendly":
      return `Hi ${prospectName},

Hope your week is going great! 

I came across your profile and was really impressed by your background as ${prospectRole} at ${prospectCompany}. Love what your team is building there.

We recently launched a pipeline that helps growth teams automate cold email outreach. It uses Gemini to draft personalized templates and Brevo to send them, saving hours of manual prospecting every day.

${cta}

Best regards,
Gokul`;

    case "Startup Casual":
      return `Hey ${prospectName},

Quick question—are you guys currently scaling outbound operations at ${prospectCompany}?

We built a lightweight prospecting app that searches B2B targets, drafts contextual templates (just like this one!), and handles transactional SMTP delivery in one place.

With your focus as ${prospectRole}, I thought this might save your team a ton of repetitive research work.

${cta}

Cheers,
Gokul`;

    case "Sales Focused":
      return `Hello ${prospectName},

I'm reaching out because we help companies like ${prospectCompany} expand their outbound sales pipeline and book more qualified calls.

Our automated system finds leads, uses Gemini to write custom pitches matching their role (${prospectRole}), and sends them with high deliverability.

I'd love to share how we can help increase your outbound reply rates.

${cta}

Sincerely,
Gokul`;

    case "Professional":
    default:
      return `Dear ${prospectName},

I am writing to you regarding your role as ${prospectRole} at ${prospectCompany}.

We have developed a streamlined cold outreach system that automates prospect sourcing, generates customized outreach copy using Gemini AI, and schedules delivery. 

Given your focus at ${prospectCompany}, I wanted to introduce our solution to see if it aligns with your team's current growth objectives.

${cta}

Sincerely,
Gokul`;
  }
}

module.exports = {
  generateOutreach,
  getMockEmail
};
