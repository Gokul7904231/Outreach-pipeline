import React, { useState, useEffect } from "react";
import OutreachQueue from "../components/outreach/OutreachQueue";
import OutreachControls from "../components/outreach/OutreachControls";
import OutreachPreview from "../components/outreach/OutreachPreview";

export default function OutreachPanel({ selectedLeads, setSelectedLeads, onNavigateToSearch, showToast }) {
  const [activeLead, setActiveLead] = useState(null);
  const [tone, setTone] = useState("Professional");
  const [customGoal, setCustomGoal] = useState("Introduce our outreach pipeline automation solution and schedule a quick call.");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [useTestRecipient, setUseTestRecipient] = useState(true);

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
          role: activeLead.current_job_title,
          useTestRecipient: useTestRecipient
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast("Email dispatched successfully! logged to DB.", "success");
        setSelectedLeads(prev => prev.filter(l => l.person_id !== activeLead.person_id));
        setDrafts(prev => {
          const updated = { ...prev };
          delete updated[activeLead.person_id];
          return updated;
        });
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
        <div className="card" style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "400px", color: "var(--text-muted)", gap: "16px" }}>
          <span style={{ fontSize: "36px", background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "var(--radius-full)" }}>✉️</span>
          <h3 style={{ color: "var(--text-main)", fontWeight: 600, fontSize: "18px" }}>No prospects in the outreach queue</h3>
          <p style={{ textAlign: "center", maxWidth: "360px", fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>
            Go to the Lead Search tab, filter contacts, tick the checkboxes, and click "Proceed to Outreach" to personalize your campaigns.
          </p>
          <button className="btn btn-primary" onClick={onNavigateToSearch} style={{ marginTop: "8px" }}>
            Find Prospects
          </button>
        </div>
      ) : (
        <div className="outreach-layout">
          {/* Left panel: Queue Sidebar */}
          <div className="outreach-sidebar">
            <OutreachQueue
              selectedLeads={selectedLeads}
              setSelectedLeads={setSelectedLeads}
              activeLead={activeLead}
              setActiveLead={setActiveLead}
              removeLeadFromQueue={removeLeadFromQueue}
            />

            <OutreachControls
              tone={tone}
              setTone={setTone}
              customGoal={customGoal}
              setCustomGoal={setCustomGoal}
              handleGenerateAI={handleGenerateAI}
              generating={generating}
              activeLead={activeLead}
              useTestRecipient={useTestRecipient}
              setUseTestRecipient={setUseTestRecipient}
            />
          </div>

          {/* Right panel: Editor Card */}
          <div className="outreach-preview-panel">
            <OutreachPreview
              activeLead={activeLead}
              drafts={drafts}
              generating={generating}
              sending={sending}
              statusText={statusText}
              handleDraftChange={handleDraftChange}
              handleGenerateAI={handleGenerateAI}
              handleSendEmail={handleSendEmail}
              useTestRecipient={useTestRecipient}
            />
          </div>
        </div>
      )}
    </div>
  );
}
