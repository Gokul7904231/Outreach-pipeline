import React from "react";

export default function OutreachPreview({
  activeLead,
  drafts,
  generating,
  sending,
  statusText,
  handleDraftChange,
  handleGenerateAI,
  handleSendEmail,
  useTestRecipient
}) {
  if (!activeLead) {
    return (
      <div className="card" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", margin: 0, color: "var(--text-muted)" }}>
        Select a lead from the queue list to start editing.
      </div>
    );
  }

  const currentDraft = drafts[activeLead.person_id] || { subject: "", body: "" };

  return (
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
          <div className="email-meta-row" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <span className="email-meta-label">To:</span>
            <span className="email-meta-val" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {activeLead.full_name} &lt;{useTestRecipient ? "asgokul2004@gmail.com" : (activeLead.email || "no-email-sourced@domain.com")}&gt;
              {useTestRecipient && <span className="badge badge-warning" style={{ fontSize: "10px", padding: "1px 6px", margin: 0 }}>Test Recipient Active</span>}
            </span>
          </div>
          <div className="email-meta-row">
            <span className="email-meta-label">Subject:</span>
            <input
              type="text"
              className="email-meta-val"
              style={{ background: "none", border: "none", outline: "none", color: "var(--text-main)", flexGrow: 1, padding: 0, fontFamily: "inherit" }}
              value={currentDraft.subject}
              onChange={(e) => handleDraftChange("subject", e.target.value)}
            />
          </div>

          <textarea
            className="email-body-editor"
            value={currentDraft.body}
            onChange={(e) => handleDraftChange("body", e.target.value)}
            placeholder="Generating personalized copy..."
            disabled={generating}
          />
        </div>
      </div>
    </div>
  );
}
