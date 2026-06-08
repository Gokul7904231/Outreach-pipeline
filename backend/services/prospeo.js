const axios = require("axios");

/**
 * Searches B2B leads using Prospeo API (with Mock Fallback).
 */
async function searchProspeoLeads({ person_search, person_job_title }) {
  const apiKey = process.env.PROSPEO_API_KEY;

  if (!person_search) {
    console.log("🔌 [Prospeo] Target domain is empty. Returning demo Mock Sourcing.");
    return {
      success: true,
      results: getMockLeads({ person_search, person_job_title }),
      mock: true
    };
  }

  if (!apiKey) {
    console.log("🔌 [Prospeo] API key missing. Using Mock Sourcing.");
    return {
      success: true,
      results: getMockLeads({ person_search, person_job_title }),
      mock: true
    };
  }

  try {
    const filters = {};
    if (person_search) {
      filters.person_search = { company_domain: person_search };
    }
    if (person_job_title) {
      filters.person_job_title = { include: [ person_job_title ] };
    }

    const response = await axios.post(
      "https://api.prospeo.io/search-person",
      { filters, page: 1 },
      {
        headers: {
          "Content-Type": "application/json",
          "X-KEY": apiKey
        },
        timeout: 25000
      }
    );

    console.log("[Prospeo Search Raw Response]", JSON.stringify(response.data, null, 2));

    if (response.data && response.data.error === true) {
      console.warn("⚠️ [Prospeo Search API error] Falling back to Mock Sourcing:", response.data.error_code);
      return {
        success: true,
        results: getMockLeads({ person_search, person_job_title }),
        mock: true,
        errorMsg: response.data.filter_error || response.data.error_code
      };
    }

    if (response.data && !response.data.error) {
      const results = (response.data.results || []).map(r => {
        const p = r.person || {};
        const c = r.company || {};
        
        // Parse email safely from search result if available and revealed
        const emailObj = p.email || {};
        let email = "";
        let email_status = "not_found";
        
        if (typeof emailObj === "object" && emailObj !== null) {
          if (emailObj.revealed === true && typeof emailObj.email === "string") {
            email = emailObj.email;
            email_status = typeof emailObj.status === "string" ? emailObj.status : "verified";
          }
        } else if (typeof emailObj === "string" && emailObj && !emailObj.includes("*")) {
          email = emailObj;
          email_status = "verified";
        }

        return {
          person_id: p.person_id,
          first_name: p.first_name,
          last_name: p.last_name,
          full_name: p.full_name || `${p.first_name} ${p.last_name}`,
          current_job_title: p.current_job_title || p.headline || "Professional",
          company: c.name || "Target Company",
          company_website: c.website || "",
          linkedin_url: p.linkedin_url || "",
          email,
          email_status,
          isMock: false
        };
      });

      return {
        success: true,
        results,
        mock: false,
        debug: {
          rawResponse: response.data,
          parsedCount: results.length
        }
      };
    } else {
      throw new Error(response.data?.message || "Prospeo search returned unknown response structure");
    }
  } catch (error) {
    console.warn("⚠️ [Prospeo Search API failure] Falling back to Mock Sourcing:", error.message);
    return {
      success: true,
      results: getMockLeads({ person_search, person_job_title }),
      mock: true,
      errorMsg: error.message
    };
  }
}

/**
 * Enriches a specific lead using Prospeo API to find their email address.
 */
async function enrichProspeoLead(person_id, nameInfo = {}) {
  const apiKey = process.env.PROSPEO_API_KEY;

  if (person_id && person_id.startsWith("mock_")) {
    const mockLeads = getMockLeads();
    const lead = mockLeads.find(l => l.person_id === person_id);
    return {
      success: true,
      email: lead ? lead.email : "test@example.com",
      email_status: "verified",
      mock: true
    };
  }

  if (!apiKey) {
    const fallbackEmail = `${(nameInfo.first_name || "contact").toLowerCase()}@${(nameInfo.company_website || "company.com").toLowerCase()}`;
    return {
      success: true,
      email: fallbackEmail,
      email_status: "verified",
      mock: true
    };
  }

  try {
    const response = await axios.post(
      "https://api.prospeo.io/enrich-person",
      {
        data: {
          person_id
        }
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-KEY": apiKey
        },
        timeout: 25000
      }
    );

    console.log("[Prospeo Enrich Raw Response]", JSON.stringify(response.data, null, 2));

    if (response.data && response.data.error === true) {
      console.warn("⚠️ [Prospeo Enrich API error] Falling back to mock email:", response.data.error_code);
      const fallbackEmail = `${(nameInfo.first_name || "contact").toLowerCase()}@${(nameInfo.company_website || "company.com").toLowerCase()}`;
      return {
        success: true,
        email: fallbackEmail,
        email_status: "verified",
        mock: true,
        errorMsg: response.data.error_code
      };
    }

    if (response.data && !response.data.error) {
      const p = response.data.person || {};
      const emailObj = p.email || {};
      
      let email = "";
      let email_status = "verified";
      
      if (typeof emailObj === "object" && emailObj !== null) {
        email = typeof emailObj.email === "string" ? emailObj.email : "";
        email_status = typeof emailObj.status === "string" ? emailObj.status : "verified";
      } else if (typeof emailObj === "string") {
        email = emailObj;
      }

      return {
        success: true,
        email,
        email_status,
        mock: false,
        debug: {
          rawResponse: response.data
        }
      };
    } else {
      throw new Error(response.data?.message || "Prospeo enrichment returned unknown response structure");
    }
  } catch (error) {
    console.warn("⚠️ [Prospeo Enrich API failure] Falling back to mock email:", error.message);
    const fallbackEmail = `${(nameInfo.first_name || "contact").toLowerCase()}@${(nameInfo.company_website || "company.com").toLowerCase()}`;
    return {
      success: true,
      email: fallbackEmail,
      email_status: "verified",
      mock: true,
      errorMsg: error.message
    };
  }
}

/**
 * Checks remaining API credits from Prospeo account-information endpoint (with fallback).
 */
async function getAccountInfo() {
  const apiKey = process.env.PROSPEO_API_KEY;

  if (!apiKey) {
    return {
      success: true,
      credits: {
        remaining: 75,
        plan: "FREE (MOCK)",
        renewalDays: 30
      },
      mock: true
    };
  }

  try {
    const response = await axios.get("https://api.prospeo.io/account-information", {
      headers: {
        "X-KEY": apiKey
      },
      timeout: 25000
    });

    if (response.data && !response.data.error) {
      const resp = response.data.response || {};
      return {
        success: true,
        credits: {
          remaining: resp.remaining_credits || 0,
          plan: resp.current_plan || "STARTER",
          renewalDays: resp.next_quota_renewal_days || 0
        },
        mock: false
      };
    } else {
      throw new Error(response.data?.message || "Failed to fetch account info");
    }
  } catch (error) {
    console.warn("⚠️ [Prospeo] Failed to fetch account information, returning fallback balance:", error.message);
    return {
      success: true,
      credits: {
        remaining: 75,
        plan: "STARTER (FALLBACK)",
        renewalDays: 14
      },
      mock: true,
      errorMsg: error.message
    };
  }
}

/**
 * Static mock data provider containing 5 premium target B2B leads.
 */
function getMockLeads({ person_search, person_job_title } = {}) {
  const allMocks = [
    {
      person_id: "mock_1",
      first_name: "Sarah",
      last_name: "Chen",
      full_name: "Sarah Chen",
      current_job_title: "Marketing Director",
      company: "OpenAI",
      company_website: "openai.com",
      linkedin_url: "https://linkedin.com/in/sarahchen",
      email: "sarah.chen@openai.com",
      email_status: "verified",
      isMock: true
    },
    {
      person_id: "mock_2",
      first_name: "Simon",
      last_name: "Last",
      full_name: "Simon Last",
      current_job_title: "Co-founder & Designer",
      company: "Notion",
      company_website: "notion.so",
      linkedin_url: "https://linkedin.com/in/simonlast",
      email: "simon@notion.so",
      email_status: "verified",
      isMock: true
    },
    {
      person_id: "mock_3",
      first_name: "Jessica",
      last_name: "Taylor",
      full_name: "Jessica Taylor",
      current_job_title: "VP of Product",
      company: "Stripe",
      company_website: "stripe.com",
      linkedin_url: "https://linkedin.com/in/jessicataylor",
      email: "jessica.taylor@stripe.com",
      email_status: "verified",
      isMock: true
    },
    {
      person_id: "mock_4",
      first_name: "Aris",
      last_name: "Vasilopoulos",
      full_name: "Aris Vasilopoulos",
      current_job_title: "CTO",
      company: "Vercel",
      company_website: "vercel.com",
      linkedin_url: "https://linkedin.com/in/arisvasilopoulos",
      email: "aris@vercel.com",
      email_status: "verified",
      isMock: true
    },
    {
      person_id: "mock_5",
      first_name: "Gokul",
      last_name: "Developer",
      full_name: "Gokul (Developer)",
      current_job_title: "Lead Engineer",
      company: "Outreach.AI",
      company_website: "outreach-pipeline.com",
      linkedin_url: "https://linkedin.com/in/gokul",
      email: "asgokul2004@gmail.com",
      email_status: "verified",
      isMock: true
    }
  ];

  return allMocks.filter(lead => {
    let match = true;
    if (person_search) {
      const q = person_search.toLowerCase();
      match = match && (
        lead.full_name.toLowerCase().includes(q) ||
        lead.company.toLowerCase().includes(q) ||
        lead.company_website.toLowerCase().includes(q)
      );
    }
    if (person_job_title) {
      const q = person_job_title.toLowerCase();
      match = match && lead.current_job_title.toLowerCase().includes(q);
    }
    return match;
  });
}

module.exports = {
  searchProspeoLeads,
  enrichProspeoLead,
  getAccountInfo,
  getMockLeads
};
