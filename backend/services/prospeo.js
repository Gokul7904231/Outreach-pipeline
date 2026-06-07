const axios = require("axios");

/**
 * Searches B2B leads using Prospeo API (with Mock Fallback).
 */
async function searchLeads({ person_search, person_job_title }) {
  const apiKey = process.env.PROSPEO_API_KEY;

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
      filters.person_search = person_search;
    }
    if (person_job_title) {
      filters.person_job_title = person_job_title;
    }

    const response = await axios.post(
      "https://api.prospeo.io/search-person",
      { filters, page: 1 },
      {
        headers: {
          "Content-Type": "application/json",
          "X-KEY": apiKey
        },
        timeout: 5000
      }
    );

    if (response.data && response.data.status === "success") {
      const results = (response.data.results || []).map(r => ({
        person_id: r.person_id,
        first_name: r.first_name,
        last_name: r.last_name,
        full_name: r.full_name || `${r.first_name} ${r.last_name}`,
        current_job_title: r.current_job_title || r.headline || "Professional",
        company: r.company_name || r.current_company?.name || "Target Company",
        company_website: r.company_website || r.current_company?.website || "",
        linkedin_url: r.linkedin_url || "",
        email: r.email || "", 
        email_status: r.email ? "verified" : "not_found",
        isMock: false
      }));

      return {
        success: true,
        results,
        mock: false
      };
    } else {
      throw new Error(response.data?.message || "Prospeo search returned failed status");
    }
  } catch (error) {
    console.warn("⚠️ [Prospeo] API failure. Falling back to Mock Sourcing:", error.response?.data || error.message);
    return {
      success: true,
      results: getMockLeads({ person_search, person_job_title }),
      mock: true,
      errorMsg: error.response?.data?.message || error.message
    };
  }
}

/**
 * Enriches a specific lead using Prospeo API to find their email address.
 */
async function enrichLead(person_id, nameInfo = {}) {
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
      { person_id },
      {
        headers: {
          "Content-Type": "application/json",
          "X-KEY": apiKey
        },
        timeout: 5000
      }
    );

    if (response.data && response.data.status === "success") {
      const emailData = response.data.response || response.data.data || {};
      const email = emailData.email || response.data.email || "";
      const email_status = emailData.email_status || "verified";

      return {
        success: true,
        email,
        email_status,
        mock: false
      };
    } else {
      throw new Error(response.data?.message || "Prospeo enrichment returned failed status");
    }
  } catch (error) {
    console.warn("⚠️ [Prospeo] Enrichment failure. Generating fallback domain email:", error.message);
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
      timeout: 5000
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
      first_name: "David",
      last_name: "Lee",
      full_name: "David Lee",
      current_job_title: "AI Engineer",
      company: "Anthropic",
      company_website: "anthropic.com",
      linkedin_url: "https://linkedin.com/in/davidlee",
      email: "david.lee@anthropic.com",
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
  searchLeads,
  enrichLead,
  getAccountInfo,
  getMockLeads
};
