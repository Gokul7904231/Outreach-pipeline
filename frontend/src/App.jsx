import React, { useState } from "react";
import LeadSearch from "./pages/LeadSearch";
import OutreachPanel from "./pages/OutreachPanel";
import HistoryLog from "./pages/HistoryLog";
import Settings from "./pages/Settings";

export default function App() {
  const [activeTab, setActiveTab] = useState("search");
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Toast helper
  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatically remove after 3.5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // renderActiveView helper is deprecated in favor of hidden display divs to preserve component state

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <aside className="sidebar">
        <div className="logo-container">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">Outreach.AI</span>
        </div>

        <nav className="sidebar-nav">
          <div
            className={`nav-item ${activeTab === "search" ? "active" : ""}`}
            onClick={() => setActiveTab("search")}
          >
            <span className="nav-icon">🔍</span>
            <span className="nav-text">Lead Search</span>
          </div>

          <div
            className={`nav-item ${activeTab === "outreach" ? "active" : ""}`}
            onClick={() => setActiveTab("outreach")}
            style={{ display: "flex", justifyContent: "space-between", width: "100%" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span className="nav-icon">✉️</span>
              <span className="nav-text">Outreach</span>
            </div>
            {selectedLeads.length > 0 && (
              <span 
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  backgroundColor: "var(--accent-color)",
                  color: "var(--text-main)",
                  padding: "2px 6px",
                  borderRadius: "999px"
                }}
              >
                {selectedLeads.length}
              </span>
            )}
          </div>

          <div
            className={`nav-item ${activeTab === "logs" ? "active" : ""}`}
            onClick={() => setActiveTab("logs")}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">History Logs</span>
          </div>

          <div
            className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Settings</span>
          </div>
        </nav>

        <footer className="sidebar-footer">
          <div>Outreach Automation Pipeline</div>
          <div style={{ marginTop: "4px" }}>v1.0.0 • MVP Demo</div>
        </footer>
      </aside>

      {/* Main Panel Viewport */}
      <main className="main-panel">
        <div style={{ display: activeTab === "search" ? "block" : "none" }}>
          <LeadSearch
            selectedLeads={selectedLeads}
            setSelectedLeads={setSelectedLeads}
            onNavigateToOutreach={() => setActiveTab("outreach")}
            showToast={showToast}
          />
        </div>
        <div style={{ display: activeTab === "outreach" ? "block" : "none" }}>
          <OutreachPanel
            selectedLeads={selectedLeads}
            setSelectedLeads={setSelectedLeads}
            onNavigateToSearch={() => setActiveTab("search")}
            showToast={showToast}
          />
        </div>
        <div style={{ display: activeTab === "logs" ? "block" : "none" }}>
          <HistoryLog active={activeTab === "logs"} />
        </div>
        <div style={{ display: activeTab === "settings" ? "block" : "none" }}>
          <Settings active={activeTab === "settings"} />
        </div>
      </main>

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span style={{ fontSize: "16px" }}>
              {toast.type === "success" ? "✅" : "❌"}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
