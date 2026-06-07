import React, { useState, useEffect } from "react";

export default function Settings() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/status");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Failed to fetch API status:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="panel-header">
        <h1 className="panel-title">System Settings</h1>
        <p className="panel-subtitle">Monitor service connection health and configure local environment variables.</p>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600 }}>API Connection Diagnostics</h3>
          <button className="btn btn-secondary" onClick={checkStatus} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: "12px", height: "12px" }} /> : "Re-Run Diagnostics"}
          </button>
        </div>

        {!status ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "120px" }}>
            <div className="spinner" />
          </div>
        ) : (
          <div className="status-grid">
            {/* Prospeo Card */}
            <div className="status-card">
              <div className="status-info">
                <span className="status-name">Prospeo Lead Finder</span>
                <span className="status-desc">Provides target leads, roles, and emails.</span>
              </div>
              <span className={`badge ${status.prospeo ? "badge-success" : "badge-warning"}`}>
                {status.prospeo ? "✅ Connected" : "⚠️ Mock Sourcing Active"}
              </span>
            </div>

            {/* Gemini Card */}
            <div className="status-card">
              <div className="status-info">
                <span className="status-name">Google Gemini AI</span>
                <span className="status-desc">Generates role-based outreach personalization.</span>
              </div>
              <span className={`badge ${status.gemini ? "badge-success" : "badge-warning"}`}>
                {status.gemini ? "✅ Connected" : "⚠️ Mock Copy Active"}
              </span>
            </div>

            {/* Brevo Card */}
            <div className="status-card">
              <div className="status-info">
                <span className="status-name">Brevo Transactional SMTP</span>
                <span className="status-desc">Handles automated outbound delivery.</span>
              </div>
              <span className={`badge ${status.brevo ? "badge-success" : "badge-warning"}`}>
                {status.brevo ? "✅ Connected" : "⚠️ Mock Send Active"}
              </span>
            </div>
          </div>
        )}

        {status && status.prospeoCredits && (
          <div 
            style={{ 
              marginTop: "24px", 
              paddingTop: "20px", 
              borderTop: "1px solid var(--card-border)", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center"
            }}
          >
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)" }}>Prospeo API Usage & Quota</h4>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                Active Plan: <strong style={{ color: "var(--accent-color)" }}>{status.prospeoCredits.plan}</strong> • Quota renewal in {status.prospeoCredits.renewalDays} days
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-green)" }}>
                {status.prospeoCredits.remaining}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Remaining Credits
              </div>
            </div>
          </div>
        )}
      </div>

      {status && status.mockMode && (
        <div 
          style={{
            padding: "16px",
            backgroundColor: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.15)",
            borderRadius: "12px",
            marginBottom: "24px",
            color: "#f59e0b",
            fontSize: "14px",
            lineHeight: "1.6"
          }}
        >
          <h4 style={{ fontWeight: 600, marginBottom: "6px" }}>⚠️ Mock Mode Fallback Active</h4>
          <p>
            One or more API keys are missing from your backend configuration. The application is running in **Mock Fallback Mode**, generating realistic static datasets and drafts so you can test features without API rate limits or failures.
          </p>
        </div>
      )}

      <div className="card">
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Environment Configuration</h3>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "20px", lineHeight: "1.6" }}>
          To connect your dashboard to real APIs and send genuine outbound campaigns, locate and edit the backend environment file:
          <br />
          <code style={{ display: "inline-block", backgroundColor: "#111827", padding: "4px 8px", borderRadius: "4px", marginTop: "8px", fontFamily: "monospace", color: "var(--accent-color)" }}>
            backend/.env
          </code>
        </p>

        <div 
          style={{ 
            backgroundColor: "#111827", 
            border: "1px solid var(--card-border)", 
            borderRadius: "8px", 
            padding: "16px", 
            fontFamily: "monospace", 
            fontSize: "13px", 
            lineHeight: "1.8",
            color: "var(--text-muted)"
          }}
        >
          <div># Port configuration</div>
          <div>PORT=5000</div>
          <br />
          <div># Sourcing key</div>
          <div>PROSPEO_API_KEY=<span style={{ color: "var(--text-main)" }}>your_prospeo_api_key</span></div>
          <br />
          <div># AI Generation key</div>
          <div>GEMINI_API_KEY=<span style={{ color: "var(--text-main)" }}>your_gemini_api_key</span></div>
          <br />
          <div># SMTP Sending key</div>
          <div>BREVO_API_KEY=<span style={{ color: "var(--text-main)" }}>your_brevo_api_key</span></div>
          <div>SENDER_EMAIL=<span style={{ color: "var(--text-main)" }}>your_verified_sender_email</span></div>
          <div>SENDER_NAME=<span style={{ color: "var(--text-main)" }}>your_sender_name</span></div>
        </div>
      </div>
    </div>
  );
}
