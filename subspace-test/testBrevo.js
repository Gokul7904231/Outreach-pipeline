require("dotenv").config();

const SibApiV3Sdk = require("sib-api-v3-sdk");

const defaultClient = SibApiV3Sdk.ApiClient.instance;

const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async () => {
    try {
        const response = await apiInstance.sendTransacEmail({
            sender: {
                email: "your_verified_brevo_email@gmail.com",
                name: "Gokul"
            },

            to: [
                {
                    email: "YOUR_PERSONAL_EMAIL@gmail.com"
                }
            ],

            subject: "Subspace Assignment Test",

            htmlContent: `
        <h1>Hello from Brevo 🚀</h1>
        <p>This is my first automated outreach email.</p>
      `
        });

        console.log("SUCCESS ✅");
        console.log(response);

    } catch (error) {
        console.log("ERROR ❌");
        console.log(error.response?.body || error.message);
    }
};

sendEmail();