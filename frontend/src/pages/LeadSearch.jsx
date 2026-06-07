import React, { useState, useEffect } from "react";

export default function LeadSearch({ selectedLeads, setSelectedLeads, onNavigateToOutreach, showToast }) {
  const [query, setQuery] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [enrichingId, setEnrichingId] = useState(null);

  // Load default mock leads on mount
  useEffect(() => {
    handleSearch(true);
  }, []);

  const handleSearch = async (isInitial = false) => {
    let searchDomain = query.trim().toLowerCase();

    if (!isInitial) {
      if (!searchDomain) {
        showToast("Please enter a target company domain", "error");
        return;
      }

      // Clean domain query
      searchDomain = searchDomain.replace(/^(https?:\/\/)?(www\.)?/, "");

      // Strict domain regex validation
      const domainPattern = /^([a-z0-9-]+\.)+[a-z]{2,}$/;
      if (!domainPattern.test(searchDomain)) {
        showToast("Invalid domain format (use e.g. openai.com)", "error");
        return;
      }
    }

    setLoading(true);
    setStatusText(isInitial ? "Loading target contacts..." : `Querying Prospeo B2B database for ${searchDomain}...`);
    try {
      const response = await fetch("http://localhost:5000/api/leads/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_search: isInitial ? "" : searchDomain,
          person_job_title: isInitial ? "" : jobTitle
        })
      });
      const data = await response.json();
      if (data.success) {
        setLeads(data.results);
        if (!isInitial) {
          showToast(`Found ${data.results.length} prospects at ${searchDomain}!`, "success");
        }
      } else {
        showToast(data.errorMsg || "Failed to search prospects", "error");
      }
    } catch (error) {
      showToast("Backend connection failed", "error");
    } finally {
      setLoading(false);
      setStatusText("");
    }
  };

  const handleEnrich = async (leadId, firstName, companyWebsite) => {
    setEnrichingId(leadId);
    try {
      const response = await fetch("http://localhost:5000/api/leads/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_id: leadId,
          first_name: firstName,
          company_website: companyWebsite
        })
      });
      const data = await response.json();
      if (data.success) {
        setLeads(prev =>
          prev.map(l => (l.person_id === leadId ? { ...l, email: data.email, email_status: "verified" } : l))
        );
        showToast(`Email enriched: ${data.email}`, "success");
      } else {
        showToast(data.errorMsg || "Enrichment failed", "error");
      }
    } catch (error) {
      showToast("Enrichment server connection failed", "error");
    } finally {
      setEnrichingId(null);
    }
  };

  const toggleSelectLead = (lead) => {
    const isSelected = selectedLeads.some(l => l.person_id === lead.person_id);
    if (isSelected) {
      setSelectedLeads(prev => prev.filter(l => l.person_id !== lead.person_id));
    } else {
      setSelectedLeads(prev => [...prev, lead]);
    }
  };

  const toggleSelectAll = () => {
    if (leads.length === 0) return;
    const allSelectedOnPage = leads.every(lead => selectedLeads.some(l => l.person_id === lead.person_id));
    if (allSelectedOnPage) {
      // remove all leads on current page from selectedLeads
      setSelectedLeads(prev => prev.filter(l => !leads.some(pageLead => pageLead.person_id === l.person_id)));
    } else {
      // add all leads on current page that aren't already selected
      const toAdd = leads.filter(lead => !selectedLeads.some(l => l.person_id === lead.person_id));
      setSelectedLeads(prev => [...prev, ...toAdd]);
    }
  };

  const isAllSelected = leads.length > 0 && leads.every(lead => selectedLeads.some(l => l.person_id === lead.person_id));

  return (
    <div>
      <div className="panel-header">
        <h1 className="panel-title">Prospect Sourcing</h1>
        <p className="panel-subtitle">Search leads from the B2B directory and queue them for AI campaigns.</p>
      </div>

      <div className="search-grid">
        {/* Left Search Filters */}
        <div className="card" style={{ height: "fit-content" }}>
          <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: 600 }}>Filter Prospects</h3>
          
          <div className="form-group">
            <label className="form-label">Target Domain</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. stripe.com, openai.com"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Job Title</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. CTO, Product Manager"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: "100%", marginTop: "8px" }}
            onClick={() => handleSearch()}
            disabled={loading}
          >
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div className="spinner" style={{ width: "14px", height: "14px" }} />
                <span>Searching...</span>
              </div>
            ) : "Find Leads"}
          </button>
        </div>

        {/* Right Search Results */}
        <div className="card" style={{ minHeight: "400px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600 }}>
              Search Results {leads.length > 0 && `(${leads.length})`}
            </h3>
            {selectedLeads.length > 0 && (
              <button className="btn btn-primary btn-secondary" onClick={onNavigateToOutreach}>
                Proceed to Outreach ({selectedLeads.length} selected) →
              </button>
            )}
          </div>

          {loading && leads.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "250px", gap: "12px" }}>
              <div className="spinner" style={{ width: "40px", height: "40px" }} />
              <div style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "monospace" }}>{statusText}</div>
            </div>
          ) : leads.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "250px", color: "var(--text-muted)" }}>
              <span style={{ fontSize: "32px", marginBottom: "12px" }}>🔍</span>
              <p>No prospects found matching your search filters.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: "50px" }}>
                      <input
                        type="checkbox"
                        className="checkbox-custom"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>Name</th>
                    <th>Role & Company</th>
                    <th>Email Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => {
                    const isSelected = selectedLeads.some(l => l.person_id === lead.person_id);
                    return (
                      <tr key={lead.person_id} style={isSelected ? { backgroundColor: "rgba(139, 92, 246, 0.03)" } : {}}>
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox-custom"
                            checked={isSelected}
                            onChange={() => toggleSelectLead(lead)}
                          />
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{lead.full_name}</div>
                          {lead.linkedin_url && (
                            <a 
                              href={lead.linkedin_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ fontSize: "11px", color: "var(--accent-color)", textDecoration: "none" }}
                            >
                              LinkedIn ↗
                            </a>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: "13px" }}>{lead.current_job_title}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{lead.company} ({lead.company_website})</div>
                        </td>
                        <td>
                          {lead.email ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "13px", fontFamily: "monospace" }}>{lead.email}</span>
                              <span className="badge badge-success">Verified</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>
                              Not enriched
                            </span>
                          )}
                        </td>
                        <td>
                          {!lead.email ? (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                              onClick={() => handleEnrich(lead.person_id, lead.first_name, lead.company_website)}
                              disabled={enrichingId === lead.person_id}
                            >
                              {enrichingId === lead.person_id ? <div className="spinner" style={{ width: "12px", height: "12px" }} /> : "Find Email"}
                            </button>
                          ) : (
                            <button
                              className="btn btn-primary"
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                              onClick={() => {
                                if (!isSelected) toggleSelectLead(lead);
                                onNavigateToOutreach();
                              }}
                            >
                              Draft Email
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
