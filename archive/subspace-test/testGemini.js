require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateEmail() {

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash"
    });

    const prompt = `
Write a professional cold outreach email.

Target Company: OpenAI
Target Role: AI Engineer

Goal:
Introduce our AI outreach automation solution.

Tone:
Professional, concise, startup style.
`;

    const result = await model.generateContent(prompt);

    const response = await result.response;

    console.log("AI EMAIL GENERATED 🚀");
    console.log(response.text());
}

generateEmail();