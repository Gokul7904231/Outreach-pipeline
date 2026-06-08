import React from "react";

export default function OutreachQueue({ 
  selectedLeads, 
  setSelectedLeads, 
  activeLead, 
  setActiveLead, 
  removeLeadFromQueue 
}) {
  return (
    <div className="outreach-sidebar-card card" style={{ padding: "16px", marginBottom: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
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
                <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-main)" }}>
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
  );
}
