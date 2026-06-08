import React, { useState, useEffect } from "react";

export default function HistoryLog({ active }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (active) {
      fetchHistory();
    }
  }, [active]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/history");
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.recipientName.toLowerCase().includes(search.toLowerCase()) ||
    log.company.toLowerCase().includes(search.toLowerCase()) ||
    log.recipientEmail.toLowerCase().includes(search.toLowerCase())
  );

  const renderSkeletons = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "8px" }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ display: "flex", gap: "16px", alignItems: "center", borderBottom: "1px solid var(--card-border)", paddingBottom: "16px" }}>
          <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
            <div className="skeleton skeleton-title" style={{ width: "30%" }} />
            <div className="skeleton skeleton-text" style={{ width: "60%" }} />
          </div>
          <div className="skeleton" style={{ width: "120px", height: "32px", borderRadius: "8px", flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="panel-header">
        <h1 className="panel-title">Outreach Audit Logs</h1>
        <p className="panel-subtitle">View and audit all past campaigns, dispatch reports, and message payloads.</p>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "16px" }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search logs by recipient, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: "360px" }}
          />
          <button className="btn btn-secondary" onClick={fetchHistory} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: "12px", height: "12px" }} /> : "Refresh Logs"}
          </button>
        </div>

        {loading ? (
          renderSkeletons()
        ) : logs.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "280px", color: "var(--text-muted)", gap: "12px" }}>
            <span style={{ fontSize: "36px", background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "var(--radius-full)" }}>📂</span>
            <h4 style={{ color: "var(--text-main)", fontWeight: 600, fontSize: "16px" }}>No outreach history yet</h4>
            <p style={{ fontSize: "13px", maxWidth: "320px", textAlign: "center" }}>Deploy campaigns to see your email dispatch logs, statuses, and payload audits here.</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "280px", color: "var(--text-muted)", gap: "12px" }}>
            <span style={{ fontSize: "36px", background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "var(--radius-full)" }}>🔍</span>
            <h4 style={{ color: "var(--text-main)", fontWeight: 600, fontSize: "16px" }}>No matching logs found</h4>
            <p style={{ fontSize: "13px", maxWidth: "320px", textAlign: "center" }}>No logs match "{search}". Try searching with a different recipient name, email, or company.</p>
            <button className="btn btn-secondary" style={{ marginTop: "8px", padding: "8px 16px", fontSize: "13px" }} onClick={() => setSearch("")}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table responsive-table">
              <thead>
                <tr>
                  <th>Dispatch Date</th>
                  <th>Recipient</th>
                  <th>Company & Role</th>
                  <th>Subject</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td data-label="Dispatch Date" style={{ fontSize: "13px" }}>
                      {new Date(log.timestamp).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td data-label="Recipient">
                      <div style={{ fontWeight: 600 }}>{log.recipientName}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>{log.recipientEmail}</div>
                    </td>
                    <td data-label="Company & Role">
                      <div style={{ fontSize: "13px" }}>{log.company}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{log.jobTitle}</div>
                    </td>
                    <td data-label="Subject" style={{ fontSize: "13px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.subject}
                    </td>
                    <td data-label="Mode">
                      <span className={`badge ${log.mode === "Real API" ? "badge-success" : "badge-warning"}`}>
                        {log.mode}
                      </span>
                    </td>
                    <td data-label="Status">
                      <span className={`badge ${log.status === "Sent" ? "badge-success" : "badge-danger"}`}>
                        {log.status}
                      </span>
                    </td>
                    <td data-label="Details">
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                        onClick={() => setSelectedLog(log)}
                      >
                        Inspect Payload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px"
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div 
            className="card" 
            style={{ 
              maxWidth: "600px", 
              width: "100%", 
              maxHeight: "85vh", 
              overflowY: "auto", 
              margin: 0,
              backgroundColor: "var(--card-bg)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--card-border)", paddingBottom: "12px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Inspect Outreach Payload</h3>
              <button 
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "18px", cursor: "pointer" }}
                onClick={() => setSelectedLog(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
              <div>
                <span style={{ fontWeight: 600, color: "var(--text-muted)", marginRight: "8px" }}>To:</span>
                <span>{selectedLog.recipientName} ({selectedLog.recipientEmail})</span>
              </div>
              <div>
                <span style={{ fontWeight: 600, color: "var(--text-muted)", marginRight: "8px" }}>Company:</span>
                <span>{selectedLog.company} | {selectedLog.jobTitle}</span>
              </div>
              <div>
                <span style={{ fontWeight: 600, color: "var(--text-muted)", marginRight: "8px" }}>Subject:</span>
                <span>{selectedLog.subject}</span>
              </div>
              <div>
                <span style={{ fontWeight: 600, color: "var(--text-muted)", marginRight: "8px" }}>Timestamp:</span>
                <span>{new Date(selectedLog.timestamp).toLocaleString()}</span>
              </div>
              <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: "16px", marginTop: "4px" }}>
                <span style={{ fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>Generated Email Body:</span>
                <div 
                  style={{
                    backgroundColor: "#111827",
                    padding: "16px",
                    borderRadius: "8px",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.6",
                    border: "1px solid var(--card-border)"
                  }}
                >
                  {selectedLog.bodyText}
                </div>
              </div>
              {selectedLog.errorMsg && (
                <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: "16px", color: "var(--text-red)" }}>
                  <span style={{ fontWeight: 600, display: "block", marginBottom: "8px" }}>Error Log:</span>
                  <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "12px", borderRadius: "8px", fontSize: "13px", fontFamily: "monospace" }}>
                    {selectedLog.errorMsg}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
              <button className="btn btn-secondary" onClick={() => setSelectedLog(null)}>
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
