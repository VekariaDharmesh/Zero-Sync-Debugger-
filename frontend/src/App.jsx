import React, { useState, useEffect, useCallback } from "react";
import { useAgentState } from "./hooks/useAgentState";
import { useEventStream } from "./hooks/useEventStream";
import { StatsBar } from "./components/StatsBar";
import { ErrorFeed } from "./components/ErrorFeed";
import { AgentTrace } from "./components/AgentTrace";
import { PatchViewer } from "./components/PatchViewer";
import { MemoryPanel } from "./components/MemoryPanel";
import { Zap, Play, Check, ShieldAlert, Database, History, HelpCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const { pipelineList, pipelines, stats, handleEvent, setPipelines } = useAgentState();
  const [selectedId, setSelectedId] = useState(null);
  const [uptime, setUptime] = useState("0s");
  const [activeTab, setActiveTab] = useState("errors"); // "errors" or "timeline"
  const [timeline, setTimeline] = useState([]);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  useEventStream(`${API_URL}/stream/events`, handleEvent);

  // Uptime Timer
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => {
      const s = Math.floor((Date.now() - start) / 1000);
      if (s < 60) setUptime(`${s}s`);
      else if (s < 3600) setUptime(`${Math.floor(s / 60)}m`);
      else setUptime(`${Math.floor(s / 3600)}h`);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Set default selection
  useEffect(() => {
    if (pipelineList.length && !selectedId) {
      setSelectedId(pipelineList[0].pipeline_id);
    }
  }, [pipelineList, selectedId]);

  // Fetch Parcle memory history for the timeline tab
  const fetchTimeline = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/memory/recent`);
      if (r.ok) {
        const data = await r.json();
        setTimeline(data.results || []);
      }
    } catch (e) {
      console.error("Failed to load memory timeline", e);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "timeline") {
      fetchTimeline();
    }
  }, [activeTab, fetchTimeline]);

  // Trigger individual test errors
  const triggerError = async (type) => {
    const payloads = {
      nullRef: {
        error_type: "TypeError",
        message: "Cannot read properties of undefined (reading 'name') at get user route",
        stack_trace: "  at /app/index.js:15\n  at Layer.handle",
        file_path: "index.js",
        line_number: 15,
        language: "javascript"
      },
      receiver: {
        error_type: "TypeError",
        message: "Cannot read properties of undefined (reading 'balance') on receiver update",
        stack_trace: "  at /app/index.js:23\n  at Layer.handle",
        file_path: "index.js",
        line_number: 23,
        language: "javascript"
      },
      divZero: {
        error_type: "RangeError",
        message: "Division by zero produces Infinity on fee calculation",
        stack_trace: "  at /app/index.js:22\n  at Layer.handle",
        file_path: "index.js",
        line_number: 22,
        language: "javascript"
      }
    };

    try {
      await fetch(`${API_URL}/ingest/custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloads[type])
      });
    } catch (e) {
      console.error("Trigger error failed", e);
    }
  };

  // Run all three errors in sequence with a 5-second gap
  const runDemoSequence = async () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);
    
    // Clear current lists for clean demo view
    setPipelines({});
    setSelectedId(null);

    await triggerError("nullRef");
    await new Promise(r => setTimeout(r, 6000));
    
    await triggerError("receiver");
    await new Promise(r => setTimeout(r, 6000));
    
    await triggerError("divZero");
    
    setIsDemoRunning(false);
  };

  // Manual deployment confirmation
  const confirmPatch = async (pipelineId) => {
    if (isApproving) return;
    setIsApproving(true);
    try {
      const r = await fetch(`${API_URL}/ingest/confirm/${pipelineId}`, {
        method: "POST"
      });
      if (r.ok) {
        // Optimistically transition state locally
        setPipelines(prev => ({
          ...prev,
          [pipelineId]: {
            ...prev[pipelineId],
            latest_stage: "deploying",
            waiting_approval: false
          }
        }));
      }
    } catch (e) {
      console.error("Confirmation failed", e);
    } finally {
      setIsApproving(false);
    }
  };

  // Keyboard Navigation: J/K to browse, Enter to select, D to trigger nullRef error
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeTab !== "errors" || !pipelineList.length) return;
      
      const currentIndex = pipelineList.findIndex(p => p.pipeline_id === selectedId);
      
      if (e.key.toLowerCase() === "j") {
        const nextIndex = Math.min(currentIndex + 1, pipelineList.length - 1);
        setSelectedId(pipelineList[nextIndex].pipeline_id);
      } else if (e.key.toLowerCase() === "k") {
        const prevIndex = Math.max(currentIndex - 1, 0);
        setSelectedId(pipelineList[prevIndex].pipeline_id);
      } else if (e.key.toLowerCase() === "d") {
        triggerError("nullRef");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pipelineList, selectedId, activeTab]);

  const selected = selectedId ? pipelines[selectedId] : null;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <Zap size={16} />
          <span>Zero-Sync Debugger</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button 
            className="btn btn-secondary" 
            onClick={runDemoSequence} 
            disabled={isDemoRunning}
            style={{ fontSize: "11px", padding: "6px 12px" }}
          >
            <Play size={12} className={isDemoRunning ? "spin" : ""} />
            {isDemoRunning ? "Running Demo..." : "Run Demo Sequence"}
          </button>
          <StatsBar stats={stats} uptime={uptime} />
        </div>
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <div className="tabs-container">
            <button 
              className={`tab-btn ${activeTab === "errors" ? "active" : ""}`}
              onClick={() => setActiveTab("errors")}
            >
              Error Stream
            </button>
            <button 
              className={`tab-btn ${activeTab === "timeline" ? "active" : ""}`}
              onClick={() => setActiveTab("timeline")}
            >
              Parcle Timeline
            </button>
          </div>

          {activeTab === "errors" ? (
            <>
              <ErrorFeed
                pipelines={pipelineList}
                selected={selectedId}
                onSelect={setSelectedId}
              />
              <div className="keyboard-shortcut-guide">
                <span>Navigate: <kbd>J</kbd> / <kbd>K</kbd></span>
                <span>Trigger Test: <kbd>D</kbd></span>
              </div>
            </>
          ) : (
            <div className="timeline-panel">
              {timeline.length ? (
                timeline.map((item, idx) => (
                  <div key={item.id || idx} className="timeline-item">
                    <div className="timeline-item-header">
                      <span className="timeline-item-type">{item.error_type}</span>
                      <span className={`timeline-item-outcome ${item.outcome === "success" ? "outcome-success" : "outcome-fail"}`}>
                        {item.outcome}
                      </span>
                    </div>
                    <p className="timeline-item-summary">{item.fix_summary}</p>
                    <div className="timeline-item-footer">
                      <span className="timeline-item-file">{item.file_path || "index.js"}</span>
                      <span>{item.fixed_at ? new Date(item.fixed_at).toLocaleTimeString() : ""}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="detail-empty">
                  <History size={20} />
                  <span>No recorded Parcle memories found.</span>
                </div>
              )}
            </div>
          )}
        </aside>

        <section className="detail">
          {activeTab === "errors" && selected ? (
            <>
              <AgentTrace pipeline={selected} />
              
              <MemoryPanel pipeline={selected} />
              
              {selected.patch_diff && (
                <div className="detail-section">
                  <div className="detail-section-label">Proposed Patch Output</div>
                  <PatchViewer patchDiff={selected.patch_diff} affectedFile={selected.affected_file} />
                </div>
              )}

              {/* Action Box for Paused Pipelines awaiting confirmation */}
              {selected.waiting_approval && (
                <div className="patch-action-box" style={{ borderColor: "var(--warning)" }}>
                  <div className="patch-action-text">
                    <span className="patch-action-title" style={{ color: "var(--warning)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <ShieldAlert size={14} />
                      Deployment Paused
                    </span>
                    <span className="patch-action-desc">
                      This patch has {selected.confidence || "medium"} confidence. Please review the diff above before deploying.
                    </span>
                  </div>
                  <button 
                    className="btn" 
                    style={{ background: "var(--warning)" }}
                    onClick={() => confirmPatch(selected.pipeline_id)}
                    disabled={isApproving}
                  >
                    <Check size={14} />
                    {isApproving ? "Deploying..." : "Approve & Deploy Fix"}
                  </button>
                </div>
              )}

              {selected.deploy_url && selected.outcome === "success" && (
                <div className="deploy-link">
                  <span>Deployment Link: </span>
                  <a href={selected.deploy_url} target="_blank" rel="noreferrer">
                    {selected.deploy_url}
                  </a>
                </div>
              )}
            </>
          ) : activeTab === "errors" ? (
            <div className="detail-empty">
              <Zap size={24} className="spin-slow" />
              <span>Select an error or fire the sequence to view the autonomous trace</span>
            </div>
          ) : (
            <div className="detail-empty">
              <Database size={24} />
              <span>Browsing Parcle persistent engineering memories. Select "Error Stream" to return.</span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
