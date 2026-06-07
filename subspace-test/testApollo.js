require("dotenv").config();
const axios = require("axios");

async function testApollo() {
    try {
        const response = await axios.post(
            "https://api.apollo.io/api/v1/organizations/search",
            {
                q_organization_name: "OpenAI",
                page: 1,
                per_page: 5
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-Api-Key": process.env.APOLLO_API_KEY
                }
            }
        );

        console.log("SUCCESS ✅");
        console.log(response.data);

    } catch (error) {
        console.log("ERROR ❌");

        if (error.response) {
            console.log(error.response.data);
        } else {
            console.log(error.message);
        }
    }
}

testApollo();