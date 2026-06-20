import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAgentState } from "./hooks/useAgentState";
import { useEventStream } from "./hooks/useEventStream";
import { 
  Zap, Play, Check, ShieldAlert, Database, History, 
  Terminal, ShieldCheck, RefreshCw, Layers, AlertOctagon, 
  Clock, GitCommit, FileText, CheckCircle2, XCircle, ArrowRight
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const { pipelineList, pipelines, stats, handleEvent, setPipelines } = useAgentState();
  const [selectedId, setSelectedId] = useState(null);
  const [uptime, setUptime] = useState("0s");
  const [activeTab, setActiveTab] = useState("errors"); // "errors" or "timeline"
  const [timeline, setTimeline] = useState([]);
  const [analytics, setAnalytics] = useState({
    total_memories: 2,
    successful_fixes: 2,
    memory_reuse_count: 1,
    average_similarity: 91.5,
    success_rate: 100.0,
    average_resolution_time: 7.4
  });
  
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState({});
  const [filterType, setFilterType] = useState("all"); // "all", "active", "fixed", "failed"
  const consoleBottomRef = useRef(null);

  // SSE Broadcast hook
  useEventStream(`${API_URL}/stream/events`, (event) => {
    handleEvent(event);
    
    // Capture streaming console logs for active incident
    if (event.stage === "deploying_log" && event.pipeline_id) {
      setPipelines(prev => {
        const p = prev[event.pipeline_id];
        if (!p) return prev;
        const currentLogs = p.build_logs || [];
        return {
          ...prev,
          [event.pipeline_id]: {
            ...p,
            build_logs: [...currentLogs, event.log]
          }
        };
      });
    }
  });

  // Uptime Counter
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

  // Scroll terminal logs to bottom
  useEffect(() => {
    if (consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [pipelines, selectedId]);

  // Fetch Timeline & Analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/memory/analytics`);
      if (r.ok) {
        const data = await r.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchTimeline = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/memory/recent`);
      if (r.ok) {
        const data = await r.json();
        setTimeline(data.results || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    if (activeTab === "timeline") {
      fetchTimeline();
    }
  }, [activeTab, fetchTimeline, fetchAnalytics, pipelines]);

  // Run Demo error endpoints
  const triggerDemoError = async (endpoint) => {
    try {
      await fetch(`${API_URL}/ingest/demo/trigger/${endpoint}`, { method: "POST" });
    } catch (e) {
      console.error(e);
    }
  };

  const runFullDemoSequence = async () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);
    setPipelines({});
    setSelectedId(null);

    await triggerDemoError("null-ref");
    await new Promise(r => setTimeout(r, 7000));
    
    await triggerDemoError("missing-route");
    await new Promise(r => setTimeout(r, 7000));
    
    await triggerDemoError("div-zero");
    
    setIsDemoRunning(false);
  };

  // Manual deployment confirmation
  const confirmPatch = async (pipelineId) => {
    if (isApproving) return;
    setIsApproving(true);
    try {
      const r = await fetch(`${API_URL}/ingest/confirm/${pipelineId}`, { method: "POST" });
      if (r.ok) {
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
      console.error(e);
    } finally {
      setIsApproving(false);
    }
  };

  // Rollback Action
  const triggerRollback = async (pipelineId, filename) => {
    setIsRollingBack(prev => ({ ...prev, [pipelineId]: true }));
    try {
      const r = await fetch(`${API_URL}/memory/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affected_file: filename })
      });
      if (r.ok) {
        setPipelines(prev => ({
          ...prev,
          [pipelineId]: {
            ...prev[pipelineId],
            outcome: "rolled_back",
            stages: [...prev[pipelineId].stages, { stage: "rolled_back", timestamp: new Date().toLocaleTimeString() }]
          }
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRollingBack(prev => ({ ...prev, [pipelineId]: false }));
    }
  };

  // Keyboard Shortcuts: J/K navigation, Enter select, D test trigger
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeTab !== "errors" || !pipelineList.length) return;
      const filtered = getFilteredPipelines();
      const currentIndex = filtered.findIndex(p => p.pipeline_id === selectedId);
      
      if (e.key.toLowerCase() === "j") {
        const nextIndex = Math.min(currentIndex + 1, filtered.length - 1);
        if (filtered[nextIndex]) setSelectedId(filtered[nextIndex].pipeline_id);
      } else if (e.key.toLowerCase() === "k") {
        const prevIndex = Math.max(currentIndex - 1, 0);
        if (filtered[prevIndex]) setSelectedId(filtered[prevIndex].pipeline_id);
      } else if (e.key.toLowerCase() === "d") {
        triggerDemoError("null-ref");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pipelineList, selectedId, activeTab, filterType]);

  const getFilteredPipelines = () => {
    return pipelineList.filter(p => {
      if (filterType === "active") return p.latest_stage !== "complete" && p.latest_stage !== "aborted" && p.latest_stage !== "deploy_failed";
      if (filterType === "fixed") return p.outcome === "success";
      if (filterType === "failed") return p.outcome === "deploy_failed" || p.latest_stage === "aborted";
      return true;
    });
  };

  const filteredPipelines = getFilteredPipelines();
  const selected = selectedId ? pipelines[selectedId] : null;

  return (
    <div className="app">
      {/* Top Main Navigation Header */}
      <header className="app-header">
        <div className="app-logo">
          <Zap size={18} />
          <span>Zero-Sync</span>
          <span className="trace-badge" style={{ fontSize: "9px", background: "var(--accent-soft)", color: "var(--accent)" }}>PRO CONTROL CENTER</span>
        </div>

        {/* Demo Mode Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="demo-btn-group">
            <button className="demo-btn" onClick={() => triggerDemoError("null-ref")}>Null Ref</button>
            <button className="demo-btn" onClick={() => triggerDemoError("div-zero")}>Div By Zero</button>
            <button className="demo-btn" onClick={() => triggerDemoError("missing-route")}>Route Check</button>
          </div>
          <button className="btn" onClick={runFullDemoSequence} disabled={isDemoRunning}>
            <Play size={12} className={isDemoRunning ? "spin" : ""} />
            {isDemoRunning ? "Demo Sequence Running..." : "Run Full Demo Sequence"}
          </button>
        </div>
      </header>

      {/* Memory Evolution Dashboard Metric Strip */}
      <div className="analytics-bar">
        <div className="analytics-card">
          <span className="analytics-val">{analytics.total_memories}</span>
          <span className="analytics-lbl">Memories Recalled</span>
        </div>
        <div className="analytics-card">
          <span className="analytics-val" style={{ color: "var(--success)" }}>{analytics.successful_fixes}</span>
          <span className="analytics-lbl">Autonomous Repairs</span>
        </div>
        <div className="analytics-card">
          <span className="analytics-val">{analytics.memory_reuse_count}</span>
          <span className="analytics-lbl">Context Reuse Count</span>
        </div>
        <div className="analytics-card">
          <span className="analytics-val" style={{ color: "var(--warning)" }}>{analytics.average_similarity}%</span>
          <span className="analytics-lbl">Avg Memory Match</span>
        </div>
        <div className="analytics-card">
          <span className="analytics-val">{analytics.success_rate}%</span>
          <span className="analytics-lbl">Deployment Success</span>
        </div>
        <div className="analytics-card">
          <span className="analytics-val">{analytics.average_resolution_time}s</span>
          <span className="analytics-lbl">Avg Resolution Time</span>
        </div>
      </div>

      <div className="app-main">
        {/* Sidebar Navigation & Feed */}
        <aside className="sidebar">
          <div className="tabs-container">
            <button 
              className={`tab-btn ${activeTab === "errors" ? "active" : ""}`}
              onClick={() => setActiveTab("errors")}
            >
              Incidents
            </button>
            <button 
              className={`tab-btn ${activeTab === "timeline" ? "active" : ""}`}
              onClick={() => setActiveTab("timeline")}
            >
              Parcle Ledger
            </button>
          </div>

          {activeTab === "errors" ? (
            <>
              {/* Sidebar Filters */}
              <div className="feed-filters">
                <button className={`filter-tag ${filterType === "all" ? "active" : ""}`} onClick={() => setFilterType("all")}>All</button>
                <button className={`filter-tag ${filterType === "active" ? "active" : ""}`} onClick={() => setFilterType("active")}>Active</button>
                <button className={`filter-tag ${filterType === "fixed" ? "active" : ""}`} onClick={() => setFilterType("fixed")}>Fixed</button>
                <button className={`filter-tag ${filterType === "failed" ? "active" : ""}`} onClick={() => setFilterType("failed")}>Failed</button>
              </div>

              <div className="error-feed">
                {filteredPipelines.length ? (
                  filteredPipelines.map((p) => {
                    const isFailed = p.outcome === "deploy_failed" || p.latest_stage === "aborted";
                    const isSuccess = p.outcome === "success" || p.latest_stage === "complete";
                    const isRolledBack = p.outcome === "rolled_back";
                    
                    let statusLabel = "Running";
                    let statusClass = "status-running";
                    if (isSuccess) { statusLabel = "Fixed"; statusClass = "status-fixed"; }
                    else if (isFailed) { statusLabel = "Failed"; statusClass = "status-failed"; }
                    else if (isRolledBack) { statusLabel = "Restored"; statusClass = "status-rolled"; }
                    else if (p.latest_stage === "waiting_for_approval") { statusLabel = "Paused"; statusClass = "status-paused"; }

                    return (
                      <button
                        key={p.pipeline_id}
                        className={`feed-item ${selectedId === p.pipeline_id ? "selected" : ""} ${isSuccess ? "fixed" : ""} ${isFailed ? "failed" : ""}`}
                        onClick={() => setSelectedId(p.pipeline_id)}
                      >
                        <div className="feed-item-content">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span className="feed-error-type">{p.error_type}</span>
                            <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
                          </div>
                          <span className="feed-message">{p.message}</span>
                          <div className="feed-item-meta">
                            <span className="feed-duration">{p.service_name || "unknown-service"}</span>
                            {p.hits_data && p.hits_data.length > 0 && (
                              <span className="feed-tag" style={{ background: "rgba(16, 185, 129, 0.05)", color: "var(--success)" }}>
                                Match Found
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="feed-empty">
                    <AlertOctagon size={24} />
                    <span>No incidents in this feed.</span>
                  </div>
                )}
              </div>
              <div className="keyboard-shortcut-guide">
                <span>Browse: <kbd>J</kbd> / <kbd>K</kbd></span>
                <span>Test: <kbd>D</kbd></span>
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
                    </div>
                  </div>
                ))
              ) : (
                <div className="detail-empty">
                  <History size={20} />
                  <span>Ledger records empty.</span>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Main Content Investigation Panels */}
        <section className="detail">
          {activeTab === "errors" && selected ? (
            <>
              {/* 1. Error Intelligence Panel */}
              <div className="agent-trace">
                <span className="detail-section-label">1. Incident Intelligence</span>
                <div className="trace-header" style={{ marginTop: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className={`severity-badge ${selected.severity || "error"}`}>
                      {selected.severity?.toUpperCase() || "ERROR"}
                    </span>
                    <span className="trace-error-type">{selected.error_type}</span>
                  </div>
                  <span className="trace-duration">Service: {selected.service_name || "unknown-service"}</span>
                </div>
                <p className="trace-message" style={{ margin: "10px 0 14px", background: "#060608" }}>{selected.message}</p>
                <div className="stacktrace-container">
                  <pre>{selected.stack_trace || "No stack trace available."}</pre>
                </div>
                <div style={{ display: "flex", gap: "16px", marginTop: "12px", fontSize: "11px", color: "var(--text-dim)" }}>
                  <span>Filename: <strong style={{ color: "var(--text-muted)" }}>{selected.file_path || "index.js"}</strong></span>
                  <span>Line number: <strong style={{ color: "var(--text-muted)" }}>{selected.line_number || "?"}</strong></span>
                  <span>Triggered at: <strong style={{ color: "var(--text-muted)" }}>{selected.timestamp || new Date().toLocaleTimeString()}</strong></span>
                </div>
              </div>

              {/* 2. Live Agent Trace & Incident Timeline */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="agent-trace" style={{ display: "flex", flexDirection: "column" }}>
                  <span className="detail-section-label">2. Agent Investigation Steps</span>
                  <div className="trace-stages" style={{ marginTop: "12px", flex: 1 }}>
                    <TraceStep id="received" label="Error Captured" activeStage={selected.latest_stage} outcome={selected.outcome} />
                    <TraceStep id="context_extraction" label="Context Extraction" activeStage={selected.latest_stage} outcome={selected.outcome} />
                    <TraceStep id="querying_memory" label="Parcle Memory Query" activeStage={selected.latest_stage} outcome={selected.outcome} />
                    <TraceStep id="similarity_scoring" label="Similarity Scoring" activeStage={selected.latest_stage} outcome={selected.outcome} />
                    <TraceStep id="reasoning" label="Root Cause Analysis" activeStage={selected.latest_stage} outcome={selected.outcome} />
                    <TraceStep id="patch_generated" label="Patch Generation" activeStage={selected.latest_stage} outcome={selected.outcome} />
                    <TraceStep id="patch_validation" label="Patch Validation" activeStage={selected.latest_stage} outcome={selected.outcome} />
                    <TraceStep id="deploying" label="Enter Pro Deployment" activeStage={selected.latest_stage} outcome={selected.outcome} />
                    <TraceStep id="complete" label="Memory Write Complete" activeStage={selected.latest_stage} outcome={selected.outcome} />
                  </div>
                </div>

                <div className="agent-trace">
                  <span className="detail-section-label">3. Live Incident Timeline</span>
                  <div className="timeline-stages" style={{ marginTop: "12px" }}>
                    {selected.stages.map((st, i) => (
                      <div key={i} className="timeline-step">
                        <Clock size={11} className="timeline-time-icon" />
                        <span className="timeline-time-val">{st.timestamp || "12:00:00"}</span>
                        <span className="timeline-time-desc">
                          {st.stage === "received" && "Incident Captured & Logged"}
                          {st.stage === "context_extraction" && "Extracting local context snapshot"}
                          {st.stage === "querying_memory" && "Querying similar past incidents in Parcle"}
                          {st.stage === "similarity_scoring" && `Parcle memory match found (${st.hits} hits)`}
                          {st.stage === "reasoning" && "Generating root cause hypothesis"}
                          {st.stage === "patch_generated" && `Patch created (${st.confidence_score}% confidence)`}
                          {st.stage === "patch_validation" && "Executing local dry-runs & syntax validation"}
                          {st.stage === "deploying" && "Deployment triggered via Enter Pro"}
                          {st.stage === "complete" && "Surgical patch deployed. Parcle ledger updated."}
                          {st.stage === "waiting_for_approval" && "Incident verification halted. Approval required."}
                          {st.stage === "rolled_back" && "Rollback executed. Reverted to unpatched state."}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Parcle Memory Explorer */}
              <div className="memory-panel">
                <span className="detail-section-label">4. Parcle Memory Query Results</span>
                {selected.hits_data && selected.hits_data.length > 0 ? (
                  <>
                    <div className="similarity-graph-container">
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                        <span style={{ color: "var(--text-muted)" }}>Error Match Similarity Level</span>
                        <span style={{ color: "var(--success)", fontWeight: 600 }}>
                          {Math.round(selected.top_similarity * 100)}% Similarity
                        </span>
                      </div>
                      <div className="similarity-graph-bar">
                        <div 
                          className="similarity-graph-fill" 
                          style={{ width: `${Math.round(selected.top_similarity * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="memory-hits-list">
                      {selected.hits_data.slice(0, 2).map((hit, idx) => (
                        <div key={hit.id || idx} className="memory-hit-item" style={{ background: "#050507" }}>
                          <div className="memory-hit-top">
                            <span className="memory-hit-type" style={{ color: "var(--accent)" }}>{hit.error_type}</span>
                            <span className="memory-hit-score">{Math.round(hit.similarity_score * 100)}% similarity score</span>
                          </div>
                          <div className="memory-history-fields">
                            <div><strong>Previous Error:</strong> {hit.message}</div>
                            <div><strong>Previous Root Cause:</strong> {hit.previous_root_cause || "Unchecked query return."}</div>
                            <div><strong>Previous Fix Summary:</strong> {hit.previous_fix_summary || hit.fix_summary}</div>
                            <div><strong>Previous Outcome:</strong> <span style={{ color: "var(--success)" }}>{hit.previous_deployment_result || "Deployment Successful"}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="memory-empty" style={{ marginTop: "8px" }}>
                    No matching incidents stored in Parcle. The resolution of this incident will be recorded.
                  </p>
                )}
              </div>

              {/* 4. Root Cause Analysis Panel & Confidence Engine */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
                <div className="agent-trace">
                  <span className="detail-section-label">5. Root Cause Analysis</span>
                  {selected.root_cause ? (
                    <p style={{ fontSize: "12px", color: "var(--text)", lineHeight: "1.6", marginTop: "10px" }}>
                      {selected.root_cause}
                    </p>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-dim)", marginTop: "10px" }}>
                      <Loader size={12} className="spin" />
                      <span>Investigating...</span>
                    </div>
                  )}
                </div>

                <div className="agent-trace">
                  <span className="detail-section-label">6. Confidence Engine</span>
                  {selected.confidence_score ? (
                    <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "20px", fontWeight: "700", color: "var(--accent)" }}>{selected.confidence_score}%</span>
                        <span className={`confidence-badge confidence-${selected.risk_level}`}>
                          {selected.risk_level?.toUpperCase()} RISK
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {selected.risk_level === "low" ? "Low Risk: Deployment authorized automatically." : "Elevated Risk: Requires developer authorization."}
                      </span>
                    </div>
                  ) : (
                    <span style={{ display: "block", color: "var(--text-dim)", marginTop: "10px" }}>Analyzing risk...</span>
                  )}
                </div>
              </div>

              {/* 5. Diff Viewer */}
              {selected.patch_diff && (
                <div className="detail-section">
                  <span className="detail-section-label">7. Git Surgical Patch Output</span>
                  <div style={{ marginTop: "8px" }}>
                    <PatchViewer patchDiff={selected.patch_diff} affectedFile={selected.affected_file} />
                  </div>
                </div>
              )}

              {/* Approval controls */}
              {selected.waiting_approval && (
                <div className="patch-action-box" style={{ borderColor: "var(--warning)" }}>
                  <div className="patch-action-text">
                    <span className="patch-action-title" style={{ color: "var(--warning)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <ShieldAlert size={14} />
                      Developer Approval Halting Deployment
                    </span>
                    <span className="patch-action-desc">
                      Patch risk is {selected.risk_level?.toUpperCase()}. Review the surgical diff above before triggering deployment.
                    </span>
                  </div>
                  <button 
                    className="btn" 
                    style={{ background: "var(--warning)" }}
                    onClick={() => confirmPatch(selected.pipeline_id)}
                    disabled={isApproving}
                  >
                    <Check size={14} />
                    {isApproving ? "Executing..." : "Authorize Deployment"}
                  </button>
                </div>
              )}

              {/* 6. Deployment Center & Terminal Console */}
              <div className="agent-trace" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="detail-section-label">8. Deployment Center (Enter Pro Execution)</span>
                  {selected.outcome === "success" && (
                    <button 
                      className="rollback-btn" 
                      onClick={() => triggerRollback(selected.pipeline_id, selected.affected_file)}
                      disabled={isRollingBack[selected.pipeline_id]}
                    >
                      <RefreshCw size={11} className={isRollingBack[selected.pipeline_id] ? "spin" : ""} />
                      {isRollingBack[selected.pipeline_id] ? "Rolling back..." : "Rollback Fix"}
                    </button>
                  )}
                </div>

                <div className="terminal-container">
                  <div className="terminal-header">
                    <Terminal size={11} />
                    <span>Enter Pro Deployment CLI Output</span>
                  </div>
                  <div className="terminal-logs">
                    {selected.build_logs && selected.build_logs.length > 0 ? (
                      selected.build_logs.map((log, idx) => (
                        <div key={idx} className="terminal-log-line">{log}</div>
                      ))
                    ) : (
                      <div className="terminal-log-line" style={{ color: "var(--text-dim)" }}>
                        {selected.latest_stage === "waiting_for_approval" ? "Halted. Waiting for manual approval..." : "Waiting for deployment trigger..."}
                      </div>
                    )}
                    <div ref={consoleBottomRef} />
                  </div>
                </div>

                {selected.deploy_url && selected.outcome === "success" && (
                  <div className="deploy-link" style={{ alignSelf: "stretch", marginTop: "4px" }}>
                    <span>Production URL: </span>
                    <a href={selected.deploy_url} target="_blank" rel="noreferrer">
                      {selected.deploy_url}
                    </a>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="detail-empty">
              <Zap size={28} className="spin-slow" />
              <span>Select an incident from the stream, or trigger a test simulation above to watch the agent work.</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// Subcomponents helper for Trace stages rendering
const STAGE_ORDER = ["received", "context_extraction", "querying_memory", "similarity_scoring", "reasoning", "patch_generated", "patch_validation", "deploying", "complete"];

function TraceStep({ id, label, activeStage, outcome }) {
  const currentIdx = STAGE_ORDER.indexOf(activeStage);
  const targetIdx = STAGE_ORDER.indexOf(id);

  let status = "pending"; // pending, active, success, error
  
  if (activeStage === "aborted" || activeStage === "deploy_failed") {
    // If the pipeline halted, mark current as error
    if (activeStage === "aborted" && id === "patch_validation") status = "error";
    if (activeStage === "deploy_failed" && id === "deploying") status = "error";
  } else if (outcome === "rolled_back") {
    status = "pending";
  } else if (targetIdx < currentIdx) {
    status = "success";
  } else if (targetIdx === currentIdx) {
    status = "active";
  }

  return (
    <div className={`trace-stage ${status}`}>
      <div className="trace-stage-icon" />
      <span>{label}</span>
    </div>
  );
}
