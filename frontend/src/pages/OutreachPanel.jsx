import React, { useState, useEffect } from "react";

export default function OutreachPanel({ selectedLeads, setSelectedLeads, showToast }) {
  const [activeLead, setActiveLead] = useState(null);
  const [tone, setTone] = useState("Professional");
  const [customGoal, setCustomGoal] = useState("Introduce our outreach pipeline automation solution and schedule a quick call.");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusText, setStatusText] = useState("");

  // Keep tracks of draft copy per lead id
  const [drafts, setDrafts] = useState({}); // { [leadId]: { subject, body } }

  useEffect(() => {
    if (selectedLeads.length > 0 && !activeLead) {
      setActiveLead(selectedLeads[0]);
    }
  }, [selectedLeads]);

  // Set default draft for active lead when it loads, if not already generated
  useEffect(() => {
    if (activeLead && !drafts[activeLead.person_id]) {
      // Create a default local template before AI is run
      const defaultSubject = `Partnership opportunity for ${activeLead.company}`;
      const defaultBody = `Dear ${activeLead.first_name || activeLead.full_name},\n\nI noticed your work as ${activeLead.current_job_title} at ${activeLead.company} and wanted to reach out.\n\nWe have built a B2B outreach platform that integrates database extraction with personalized messaging. Given your focus, I thought this might be interesting to look at.\n\nWould you be open to a quick 10-minute chat next Tuesday?\n\nSincerely,\nGokul`;
      
      setDrafts(prev => ({
        ...prev,
        [activeLead.person_id]: { subject: defaultSubject, body: defaultBody }
      }));
    }
  }, [activeLead]);

  const handleGenerateAI = async () => {
    if (!activeLead) return;
    setGenerating(true);
    setStatusText("Analyzing prospect's background...");

    const steps = [
      "Querying Google Gemini AI model...",
      "Structuring personalized hook matching role...",
      "Addressing key outbound pain points...",
      "Appending CTA and polishing text..."
    ];
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setStatusText(steps[stepIndex]);
        stepIndex++;
      }
    }, 1200);

    try {
      const response = await fetch("http://localhost:5000/api/outreach/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: activeLead.first_name || activeLead.full_name,
          role: activeLead.current_job_title,
          company: activeLead.company,
          tone: tone,
          goal: customGoal
        })
      });
      const data = await response.json();
      if (data.success) {
        setDrafts(prev => ({
          ...prev,
          [activeLead.person_id]: {
            ...prev[activeLead.person_id],
            body: data.text
          }
        }));
        showToast("Gemini AI personalized email drafted!", "success");
      } else {
        showToast(data.errorMsg || "Failed to generate AI email", "error");
      }
    } catch (error) {
      showToast("AI generation server error", "error");
    } finally {
      clearInterval(interval);
      setGenerating(false);
      setStatusText("");
    }
  };

  const handleSendEmail = async () => {
    if (!activeLead) return;
    const currentDraft = drafts[activeLead.person_id];
    if (!currentDraft || !currentDraft.body) {
      showToast("No email content to send", "error");
      return;
    }

    if (!activeLead.email) {
      showToast("Please enrich this lead's email first in the search tab!", "error");
      return;
    }

    setSending(true);
    setStatusText("Connecting to Brevo SMTP servers...");

    const steps = [
      "Wrapping email envelope...",
      "Resolving verified sender signature...",
      "Delivering personalized pitch inbox...",
      "Awaiting server receipt response..."
    ];
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setStatusText(steps[stepIndex]);
        stepIndex++;
      }
    }, 1000);

    try {
      const formattedHtml = currentDraft.body.replace(/\n/g, "<br>");
      const response = await fetch("http://localhost:5000/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: activeLead.email,
          toName: activeLead.full_name,
          subject: currentDraft.subject,
          htmlContent: formattedHtml,
          company: activeLead.company,
          role: activeLead.current_job_title
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast("Email dispatched successfully! logged to DB.", "success");
        // Remove active lead from selection list once sent to clean up queue
        setSelectedLeads(prev => prev.filter(l => l.person_id !== activeLead.person_id));
        setDrafts(prev => {
          const updated = { ...prev };
          delete updated[activeLead.person_id];
          return updated;
        });
        // Set new active lead
        const remaining = selectedLeads.filter(l => l.person_id !== activeLead.person_id);
        setActiveLead(remaining.length > 0 ? remaining[0] : null);
      } else {
        showToast(data.errorMsg || "Failed to dispatch email", "error");
      }
    } catch (error) {
      showToast("Outreach delivery server error", "error");
    } finally {
      clearInterval(interval);
      setSending(false);
      setStatusText("");
    }
  };

  const handleDraftChange = (field, val) => {
    if (!activeLead) return;
    setDrafts(prev => ({
      ...prev,
      [activeLead.person_id]: {
        ...prev[activeLead.person_id],
        [field]: val
      }
    }));
  };

  const removeLeadFromQueue = (leadId, e) => {
    e.stopPropagation();
    setSelectedLeads(prev => prev.filter(l => l.person_id !== leadId));
    if (activeLead && activeLead.person_id === leadId) {
      const remaining = selectedLeads.filter(l => l.person_id !== leadId);
      setActiveLead(remaining.length > 0 ? remaining[0] : null);
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="panel-header">
        <h1 className="panel-title">Outreach & Personalization</h1>
        <p className="panel-subtitle">Generate custom pitches with Gemini AI and dispatch them via Brevo.</p>
      </div>

      {selectedLeads.length === 0 ? (
        <div className="card" style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "400px", color: "var(--text-muted)" }}>
          <span style={{ fontSize: "40px", marginBottom: "16px" }}>🚀</span>
          <h3 style={{ color: "var(--text-main)", marginBottom: "8px", fontSize: "18px" }}>No prospects in the outreach queue</h3>
          <p style={{ textAlign: "center", maxWidth: "400px", fontSize: "14px" }}>
            Go to the <strong>Lead Search</strong> tab, filter contacts, tick the checkboxes, and send them here to personalize emails.
          </p>
        </div>
      ) : (
        <div className="outreach-layout">
          {/* Left panel: selected queue list */}
          <div className="outreach-sidebar">
            <div className="card" style={{ padding: "16px", marginBottom: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 600 }}>Queue ({selectedLeads.length})</h4>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: "4px 8px", fontSize: "11px" }}
                  onClick={() => { setSelectedLeads([]); setActiveLead(null); }}
                >
                  Clear All
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                {selectedLeads.map((lead) => {
                  const isActive = activeLead && activeLead.person_id === lead.person_id;
                  return (
                    <div
                      key={lead.person_id}
                      onClick={() => setActiveLead(lead)}
                      style={{
                        padding: "12px",
                        borderRadius: "8px",
                        backgroundColor: isActive ? "rgba(139, 92, 246, 0.1)" : "#111827",
                        border: isActive ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid var(--card-border)",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "8px" }}>
                        <div style={{ fontWeight: 600, fontSize: "13px", color: isActive ? "var(--text-main)" : "var(--text-main)" }}>
                          {lead.full_name}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {lead.company}
                        </div>
                      </div>
                      <button
                        style={{ background: "none", border: "none", color: "#6b7280", fontSize: "14px", cursor: "pointer" }}
                        onClick={(e) => removeLeadFromQueue(lead.person_id, e)}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Campaign Options */}
            <div className="card" style={{ padding: "16px", marginBottom: 0 }}>
              <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>AI Copywriting Controls</h4>

              <div className="form-group">
                <label className="form-label">Email Tone</label>
                <select
                  className="input-field select-field"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                >
                  <option value="Professional">👔 Professional</option>
                  <option value="Friendly">👋 Friendly</option>
                  <option value="Startup Casual">⚡ Startup Casual</option>
                  <option value="Sales Focused">💰 Sales Focused</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Outreach Goal</label>
                <textarea
                  className="input-field"
                  rows="3"
                  placeholder="e.g. Schedule a demo session next week"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  style={{ resize: "none", fontSize: "13px" }}
                />
              </div>

              <button
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={handleGenerateAI}
                disabled={generating || !activeLead}
              >
                {generating ? <div className="spinner" /> : "Personalize Draft with Gemini"}
              </button>
            </div>
          </div>

          {/* Right panel: Live Preview & Editor */}
          <div className="outreach-preview-panel">
            {activeLead ? (
              <div className="card" style={{ display: "flex", flexDirection: "column", height: "100%", margin: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: 600 }}>Draft Preview</h4>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "8px 16px", fontSize: "13px" }}
                      onClick={handleGenerateAI}
                      disabled={generating}
                    >
                      Regenerate
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ padding: "8px 20px", fontSize: "13px" }}
                      onClick={handleSendEmail}
                      disabled={sending || !activeLead.email}
                    >
                      {sending ? <div className="spinner" /> : "Send Email via Brevo"}
                    </button>
                  </div>
                </div>

                {!activeLead.email && (
                  <div style={{ padding: "10px 14px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "6px", color: "var(--text-red)", fontSize: "13px", marginBottom: "16px" }}>
                    ⚠️ No email address verified for this prospect. Please go back to Lead Search and click <strong>Find Email</strong> to enrich.
                  </div>
                )}

                <div style={{ position: "relative", flexGrow: 1, display: "flex", flexDirection: "column" }}>
                  {(generating || sending) && (
                    <div 
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(17, 24, 39, 0.85)",
                        backdropFilter: "blur(2px)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "16px",
                        borderRadius: "8px",
                        zIndex: 10
                      }}
                    >
                      <div className="spinner" style={{ width: "36px", height: "36px" }} />
                      <div style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "monospace", letterSpacing: "0.5px" }}>
                        {statusText}
                      </div>
                    </div>
                  )}

                  <div className="email-preview-card" style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                    <div className="email-meta-row">
                      <span className="email-meta-label">To:</span>
                      <span className="email-meta-val">
                        {activeLead.full_name} &lt;{activeLead.email || "no-email-sourced@domain.com"}&gt;
                      </span>
                    </div>
                    <div className="email-meta-row">
                      <span className="email-meta-label">Subject:</span>
                      <input
                        type="text"
                        className="email-meta-val"
                        style={{ background: "none", border: "none", outline: "none", color: "var(--text-main)", flexGrow: 1, padding: 0, fontFamily: "inherit" }}
                        value={drafts[activeLead.person_id]?.subject || ""}
                        onChange={(e) => handleDraftChange("subject", e.target.value)}
                      />
                    </div>

                    <textarea
                      className="email-body-editor"
                      value={drafts[activeLead.person_id]?.body || ""}
                      onChange={(e) => handleDraftChange("body", e.target.value)}
                      placeholder="Generating personalized copy..."
                      disabled={generating}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", margin: 0, color: "var(--text-muted)" }}>
                Select a lead from the queue list to start editing.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
