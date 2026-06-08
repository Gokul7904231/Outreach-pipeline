import React from "react";

export default function OutreachControls({ 
  tone, 
  setTone, 
  customGoal, 
  setCustomGoal, 
  handleGenerateAI, 
  generating, 
  activeLead,
  useTestRecipient,
  setUseTestRecipient
}) {
  return (
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

      <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px", borderTop: "1px solid var(--card-border)", paddingTop: "12px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="checkbox"
            id="use-test-recipient"
            className="checkbox-custom"
            checked={useTestRecipient}
            onChange={(e) => setUseTestRecipient(e.target.checked)}
          />
          <label htmlFor="use-test-recipient" style={{ fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "var(--text-main)" }}>
            Use Test Recipient
          </label>
        </div>
        {useTestRecipient && (
          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
            🔒 Safe Mode: Redirects to asgokul2004@gmail.com
          </div>
        )}
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
  );
}
