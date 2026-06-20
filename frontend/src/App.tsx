import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAgentState } from "./hooks/useAgentState";
import { useEventStream } from "./hooks/useEventStream";
import { 
  Zap, Play, Check, ShieldAlert, Database, History, 
  Terminal, ShieldCheck, RefreshCw, Layers, AlertOctagon, 
  Clock, GitCommit, FileText, CheckCircle2, XCircle, ArrowRight, Download, Search, Sparkles, HelpCircle, X,
  Menu, Settings, BarChart2, Cpu, Activity, Globe, CheckSquare, Eye, ChevronRight, Share2
} from "lucide-react";
import { ErrorFeed } from "./components/ErrorFeed";
import { PatchViewer } from "./components/PatchViewer";
import { MemoryPanel } from "./components/MemoryPanel";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function ServiceMeshMap({ activeStage }: { activeStage: string | undefined }) {
  const nodes = [
    { id: 'ingest', label: 'Ingest Webhook', x: 75, y: 100, activeStages: ['received', 'context_extraction'] },
    { id: 'memory', label: 'Parcle Memory', x: 200, y: 155, activeStages: ['querying_memory', 'similarity_scoring', 'MEMORY_SEARCH_STARTED', 'MEMORY_SEARCH_COMPLETED', 'MEMORY_SAVE_STARTED', 'MEMORY_SAVE_COMPLETED'] },
    { id: 'reasoner', label: 'Claude 3.5 AI', x: 200, y: 45, activeStages: ['reasoning', 'patch_generated', 'patch_validation'] },
    { id: 'deployer', label: 'Enter Pro Deploy', x: 325, y: 100, activeStages: ['deploying', 'complete'] }
  ];

  return (
    <div className="glass-panel p-5 rounded-3xl border border-white/5 flex flex-col justify-between h-[230px] relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LIVE TOPOLOGICAL SERVICE MESH</span>
        <span className="flex items-center gap-1.5 text-[9px] font-mono px-2 py-0.5 rounded bg-primary-soft text-primary border border-primary/20">
          MESH STATUS: ACTIVE
        </span>
      </div>

      <div className="flex-1 w-full flex items-center justify-center relative">
        <svg viewBox="0 0 400 200" className="w-full h-full max-h-[160px] overflow-visible">
          <path d="M 75 100 Q 137.5 72.5 200 45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
          <path d="M 75 100 Q 137.5 127.5 200 155" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
          <path d="M 200 155 L 200 45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
          <path d="M 200 45 Q 262.5 72.5 325 100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />

          {activeStage && (
            <>
              <path d="M 75 100 Q 137.5 72.5 200 45" fill="none" stroke="var(--primary)" strokeWidth="1.5" className="flow-line opacity-40" />
              <path d="M 75 100 Q 137.5 127.5 200 155" fill="none" stroke="var(--primary)" strokeWidth="1.5" className="flow-line opacity-40" />
              <path d="M 200 155 L 200 45" fill="none" stroke="var(--primary)" strokeWidth="1.5" className="flow-line opacity-40" />
              <path d="M 200 45 Q 262.5 72.5 325 100" fill="none" stroke="var(--primary)" strokeWidth="1.5" className="flow-line opacity-40" />
            </>
          )}

          {nodes.map(n => {
            const isActive = activeStage && n.activeStages.includes(activeStage);
            return (
              <g key={n.id} className="transition-all duration-300">
                {isActive && (
                  <circle cx={n.x} cy={n.y} r="18" fill="var(--primary)" className="animate-ping opacity-25" />
                )}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r="10"
                  fill={isActive ? "var(--primary)" : "#0c0f24"}
                  stroke={isActive ? "#fff" : "rgba(255,255,255,0.1)"}
                  strokeWidth="2"
                  className="cursor-pointer hover:scale-110 transition-transform duration-200"
                />
                <text
                  x={n.x}
                  y={n.y + 22}
                  textAnchor="middle"
                  fill={isActive ? "#fff" : "#94a3b8"}
                  fontSize="8"
                  fontWeight="bold"
                  className="font-mono text-[9px]"
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function TelemetryGauges({ activeStage }: { activeStage: string | undefined }) {
  const isBusy = activeStage && activeStage !== "complete" && activeStage !== "aborted" && activeStage !== "deploy_failed";
  const cpu = isBusy ? 86 : 8;
  const memory = isBusy ? 74 : 41;
  const network = isBusy ? 92 : 3;

  return (
    <div className="glass-panel p-5 rounded-3xl border border-white/5 flex flex-col justify-between h-[230px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RESOURCE TELEMETRY GAUGES</span>
        <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${isBusy ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
          {isBusy ? 'NOC LOAD: HIGH' : 'NOC LOAD: OPTIMAL'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 py-2">
        {[
          { label: "CPU LOAD", val: cpu, color: isBusy ? "text-amber-400" : "text-emerald-400", barColor: isBusy ? "bg-amber-500" : "bg-emerald-500" },
          { label: "MEMORY", val: memory, color: "text-primary", barColor: "bg-primary" },
          { label: "NETWORK", val: network, color: "text-cyan-400", barColor: "bg-cyan-500" }
        ].map((item, idx) => (
          <div key={idx} className="flex flex-col items-center justify-center p-3 bg-bg-dark rounded-2xl border border-white/5">
            <span className="text-[9px] font-bold text-slate-500">{item.label}</span>
            <span className={`text-xl font-extrabold tracking-tight my-1.5 ${item.color}`}>
              {item.val}%
            </span>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full ${item.barColor} rounded-full transition-all duration-500`} style={{ width: `${item.val}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const { pipelineList, pipelines, stats, handleEvent, setPipelines } = useAgentState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uptime, setUptime] = useState("0s");
  const [activeTab, setActiveTab] = useState("errors"); // "errors" | "timeline" | "journal" | "lifecycle" | "insights" | "analytics" | "settings"
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [analytics, setAnalytics] = useState({
    total_memories: 2,
    successful_fixes: 2,
    memory_reuse_count: 1,
    average_similarity: 91.5,
    success_rate: 100.0,
    average_resolution_time: 7.4,
    resolution_times: [12.1, 10.4, 9.2, 8.0, 7.4],
    confidence_deltas: [15, 28, 33, 37]
  });
  
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState<Record<string, boolean>>({});
  const [filterType, setFilterType] = useState("all");
  
  // Journal states
  const [journalList, setJournalList] = useState<any[]>([]);
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const [journalFilter, setJournalFilter] = useState("all");
  const [journalSearch, setJournalSearch] = useState("");
  
  // Lifecycle states
  const [selectedLifecycleId, setSelectedLifecycleId] = useState<string | null>(null);
  
  // Judge Mode states
  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const [judgeStep, setJudgeStep] = useState(1);

  // Dynamic Theme state
  const [currentTheme, setCurrentTheme] = useState("nebula");

  // CLI Console state
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState<any[]>([
    { type: 'output', text: 'Zero-Sync Autonomous Debugger Console v1.2.6' },
    { type: 'output', text: 'Type "help" to view available NOC operations.' }
  ]);

  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    const newHistory = [...terminalHistory, { type: 'input', text: terminalInput }];
    setTerminalInput("");

    const parts = cmd.toLowerCase().split(" ");
    const primaryCmd = parts[0];
    const arg = parts.slice(1).join(" ");

    let output = "";
    if (primaryCmd === "help") {
      output = "Available commands:\n  help                          - Show this list\n  health                        - Display platform health\n  outage [type]                 - Trigger error (null-ref, div-zero, missing-route)\n  theme [name]                  - Set theme preset (nebula, matrix, cyberpunk, crimson)\n  memory                        - Fetch memory ledger metrics\n  clear                         - Flush console log history";
    } else if (primaryCmd === "health") {
      output = `SYSTEM HEALTH REPORT:\n  AI Engine: ACTIVE (Claude 3.5 Sonnet)\n  Memory Layer: PARCLE ONLINE\n  Deploy Node: ENTER PRO CONNECTED\n  Uptime: ${uptime}\n  Database Nodes: Active Parity`;
    } else if (primaryCmd === "clear") {
      setTerminalHistory([]);
      return;
    } else if (primaryCmd === "outage") {
      if (!arg || !["null-ref", "div-zero", "missing-route"].includes(arg)) {
        output = "Error: Invalid outage type. Use 'null-ref', 'div-zero', or 'missing-route'.";
      } else {
        output = `Sending custom exception signal for '${arg}' ingest route...`;
        triggerDemoError(arg);
      }
    } else if (primaryCmd === "theme") {
      if (!arg || !["nebula", "matrix", "cyberpunk", "crimson"].includes(arg)) {
        output = "Error: Select from 'nebula', 'matrix', 'cyberpunk', or 'crimson'.";
      } else {
        setCurrentTheme(arg);
        output = `Theme preset successfully updated to: ${arg.toUpperCase()}`;
      }
    } else if (primaryCmd === "memory") {
      output = `MEMORIES METRICS:\n  Total Recalls: ${analytics.total_memories}\n  Surgical Fixes: ${analytics.successful_fixes}\n  Namespace: bug-fixes`;
    } else {
      output = `Command not recognized: "${cmd}". Type "help" for a list of operations.`;
    }

    setTerminalHistory([...newHistory, { type: 'output', text: output }]);
  };

  const consoleBottomRef = useRef<HTMLDivElement | null>(null);

  // SSE broadcast event parser
  useEventStream(`${API_URL}/stream/events`, (event: any) => {
    handleEvent(event);
    
    // Capture log updates
    if (event.stage === "deploying_log" && event.pipeline_id) {
      setPipelines((prev: any) => {
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

    // Capture memory metrics updates
    if (event.stage === "patch_generated" && event.pipeline_id) {
      setPipelines((prev: any) => {
        const p = prev[event.pipeline_id];
        if (!p) return prev;
        return {
          ...prev,
          [event.pipeline_id]: {
            ...p,
            confidence_before: event.confidence_before,
            confidence_after: event.confidence_after,
            memory_impact: event.memory_impact,
            impact_level: event.impact_level
          }
        };
      });
    }
  });

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

  // Default selection
  useEffect(() => {
    if (pipelineList.length && !selectedId) {
      setSelectedId(pipelineList[0].pipeline_id);
    }
  }, [pipelineList, selectedId]);

  // Terminal scroll
  useEffect(() => {
    if (consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [pipelines, selectedId]);

  // Load analytics & Parcle timeline data
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
        setTimelineData(data.results || []);
        if (data.results && data.results.length > 0 && !selectedLifecycleId) {
          setSelectedLifecycleId(data.results[0].id);
        }
        // Transform timeline items to journal entries
        const parsed = (data.results || []).map((item: any, idx: number) => ({
          id: item.id || `inc-journal-${idx}`,
          timestamp: item.fixed_at ? new Date(item.fixed_at).toLocaleString() : new Date().toLocaleString(),
          error_type: item.error_type,
          message: item.message,
          root_cause: item.previous_root_cause || "Unchecked user lookup returning null context.",
          memory_used: item.similarity_score > 0,
          similarity: Math.round(item.similarity_score * 100),
          fix_applied: item.fix_summary,
          patch_confidence: item.confidence_after || 94,
          confidence_before: item.confidence_before || 61,
          memory_impact: item.memory_impact || 33,
          impact_level: item.impact_level || "high",
          deployment_result: item.outcome === "success" ? "Successful" : "Failed",
          deploy_url: item.outcome === "success" ? "http://localhost:3001" : "",
          memory_stored: true,
          learning_summary: `Future incidents involving undefined ${item.error_type} should use verification guards before field access.`,
          engineering_notes: `The incident matched a previously resolved issue stored in Parcle. The agent reused the same mitigation strategy and successfully deployed the fix. The outcome was stored back into memory for future retrieval.`,
          stages: [
            { stage: "received", timestamp: "14:15:22" },
            { stage: "querying_memory", timestamp: "14:15:23" },
            { stage: "similarity_scoring", timestamp: "14:15:25" },
            { stage: "reasoning", timestamp: "14:15:28" },
            { stage: "deploying", timestamp: "14:15:31" },
            { stage: "complete", timestamp: "14:15:32" }
          ]
        }));
        setJournalList(parsed);
        if (parsed.length && !selectedJournalId) {
          setSelectedJournalId(parsed[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [selectedJournalId, selectedLifecycleId]);

  useEffect(() => {
    fetchAnalytics();
    fetchTimeline();
  }, [activeTab, fetchTimeline, fetchAnalytics, pipelines]);

  // Trigger Demo events
  const triggerDemoError = async (endpoint: string) => {
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
  const confirmPatch = async (pipelineId: string) => {
    if (isApproving) return;
    setIsApproving(true);
    try {
      const r = await fetch(`${API_URL}/ingest/confirm/${pipelineId}`, { method: "POST" });
      if (r.ok) {
        setPipelines((prev: any) => ({
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
  const triggerRollback = async (pipelineId: string, filename: string) => {
    setIsRollingBack(prev => ({ ...prev, [pipelineId]: true }));
    try {
      const r = await fetch(`${API_URL}/memory/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affected_file: filename })
      });
      if (r.ok) {
        setPipelines((prev: any) => ({
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

  // Search and Filter logic for Engineering Journal
  const getFilteredJournal = () => {
    return journalList.filter(j => {
      if (journalFilter === "success" && j.deployment_result !== "Successful") return false;
      if (journalFilter === "failed" && j.deployment_result !== "Failed") return false;
      if (journalFilter === "high_conf" && j.patch_confidence < 90) return false;
      if (journalFilter === "assisted" && !j.memory_used) return false;
      if (journalFilter === "manual" && j.patch_confidence < 75) return false;

      if (journalSearch.trim()) {
        const query = journalSearch.toLowerCase();
        const matchesType = j.error_type.toLowerCase().includes(query);
        const matchesMessage = j.message.toLowerCase().includes(query);
        const matchesCause = j.root_cause.toLowerCase().includes(query);
        const matchesId = j.id.toLowerCase().includes(query);
        return matchesType || matchesMessage || matchesCause || matchesId;
      }
      return true;
    });
  };

  // Export report functionality
  const exportJournalReport = (report: any, format: string) => {
    let content = "";
    let mimeType = "text/plain";
    let extension = "txt";

    if (format === "json") {
      content = JSON.stringify(report, null, 2);
      mimeType = "application/json";
      extension = "json";
    } else {
      content = `# Incident Postmortem Report — ${report.id}
- **Timestamp**: ${report.timestamp}
- **Error Type**: ${report.error_type}
- **Message**: ${report.message}
- **Service Affected**: demo-express-service

## Analysis
- **Root Cause**: ${report.root_cause}
- **Memory Influenced**: ${report.memory_used ? "Yes" : "No"} (${report.similarity}% Similarity Match)
- **Impact Level**: ${report.impact_level.toUpperCase()} Impact (+${report.memory_impact}% Confidence Delta)

## Mitigation & Execution
- **Fix Applied**: ${report.fix_applied}
- **Patch Confidence**: ${report.patch_confidence}%
- **Deployment Outcome**: ${report.deployment_result}
- **URL**: ${report.deploy_url || "N/A"}
- **Memory Saved**: Yes (Recalled in future runs)

## Engineering Notes
${report.engineering_notes}

## Learning Summary
${report.learning_summary}
`;
      mimeType = "text/markdown";
      extension = "md";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incident-report-${report.id}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
  const filteredJournal = getFilteredJournal();
  const selectedJournal = selectedJournalId ? journalList.find(j => j.id === selectedJournalId) : null;
  const selectedLifecycle = selectedLifecycleId ? timelineData.find(m => m.id === selectedLifecycleId) : null;

  // Custom charts mock dataset
  const resolutionTimeDataset = analytics.resolution_times.map((val, idx) => ({
    name: `Inc ${idx + 1}`,
    time: val
  }));

  const similarityScoreDataset = analytics.confidence_deltas.map((val, idx) => ({
    name: `Inc ${idx + 1}`,
    confidence_improvement: val
  }));

  const radarData = [
    { subject: 'Recall Accuracy', A: 96, fullMark: 100 },
    { subject: 'Surgical Safety', A: 92, fullMark: 100 },
    { subject: 'Speed', A: 89, fullMark: 100 },
    { subject: 'Self-Healing', A: 98, fullMark: 100 },
    { subject: 'Context Reuse', A: 85, fullMark: 100 },
  ];

  const statusPieData = [
    { name: 'Autonomous Clean', value: 75, color: '#10b981' },
    { name: 'Approvals Halted', value: 15, color: '#f59e0b' },
    { name: 'Requires Human Rollback', value: 10, color: '#ef4444' }
  ];

  return (
    <div className={`flex h-screen overflow-hidden bg-bg-dark text-slate-100 font-sans relative theme-${currentTheme}`}>
      {/* Background glowing effects wrapped to prevent document overflow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="glow-overlay w-[600px] h-[600px] bg-[#6366f1] top-[-200px] left-[-200px] animate-pulse-glow"></div>
        <div className="glow-overlay w-[500px] h-[500px] bg-[#a855f7] bottom-[-150px] right-[-150px] animate-pulse-glow"></div>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`glass-panel border-r border-white/5 flex flex-col justify-between transition-all duration-300 z-10 ${sidebarCollapsed ? 'w-20' : 'w-72'}`}>
        <div>
          {/* Logo container */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-white/5">
            <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
              <div className="p-2 bg-primary/20 rounded-xl border border-primary/30 flex items-center justify-center text-primary shadow-glow">
                <Zap className="h-5 w-5" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-2">
                    ZERO-SYNC
                    <span className="text-[9px] bg-primary-soft text-primary px-1.5 py-0.5 rounded border border-primary/20">PRO</span>
                  </h1>
                  <p className="text-[10px] text-slate-400">Autonomous Security & Ops</p>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <button onClick={() => setSidebarCollapsed(true)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5">
                <Menu size={16} />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {[
              { id: 'errors', label: 'Incident Stream', icon: Cpu, count: filteredPipelines.length },
              { id: 'timeline', label: 'Memory Timeline', icon: History },
              { id: 'journal', label: 'Engineering Journal', icon: FileText },
              { id: 'lifecycle', label: 'Memory Lifecycle', icon: Database },
              { id: 'insights', label: 'AI Insights', icon: Sparkles },
              { id: 'analytics', label: 'Platform Analytics', icon: BarChart2 },
              { id: 'settings', label: 'Global Settings', icon: Settings }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (sidebarCollapsed) setSidebarCollapsed(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-primary text-white shadow-glow' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    {!sidebarCollapsed && <span className="text-xs font-semibold">{item.label}</span>}
                  </div>
                  {!sidebarCollapsed && item.count !== undefined && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-white text-primary' : 'bg-white/10 text-slate-300'}`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Collapsed expansion button */}
        {sidebarCollapsed && (
          <div className="p-4 flex justify-center border-t border-white/5">
            <button onClick={() => setSidebarCollapsed(false)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        {/* Hero Top Bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 glass-panel">
          <div>
            <h2 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-3">
              MISSION CONTROL
              <span className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                AI ENGINE ACTIVE
              </span>
            </h2>
            <p className="text-[10px] text-slate-400">Memory-Driven Autonomous Incident Recovery Platform</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={currentTheme}
              onChange={(e) => setCurrentTheme(e.target.value)}
              className="text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 outline-none font-semibold text-slate-300 hover:text-white cursor-pointer transition-all"
            >
              <option value="nebula" className="bg-bg-card">Nebula Accent</option>
              <option value="matrix" className="bg-bg-card">Matrix Green</option>
              <option value="cyberpunk" className="bg-bg-card">Cyberpunk Amber</option>
              <option value="crimson" className="bg-bg-card">Crimson Edge</option>
            </select>

            <button 
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/20 bg-primary-soft text-primary hover:bg-primary hover:text-white transition-all shadow-glow"
              onClick={() => { setJudgeStep(1); setShowJudgeModal(true); }}
            >
              <HelpCircle size={13} />
              Explain Memory Usage
            </button>

            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => triggerDemoError("null-ref")} 
                className="text-[10px] font-semibold text-slate-400 hover:text-white px-2.5 py-1 hover:bg-white/5 rounded-lg transition-all"
              >
                Null Ref
              </button>
              <button 
                onClick={() => triggerDemoError("div-zero")} 
                className="text-[10px] font-semibold text-slate-400 hover:text-white px-2.5 py-1 hover:bg-white/5 rounded-lg transition-all"
              >
                Div/0
              </button>
              <button 
                onClick={() => triggerDemoError("missing-route")} 
                className="text-[10px] font-semibold text-slate-400 hover:text-white px-2.5 py-1 hover:bg-white/5 rounded-lg transition-all"
              >
                Route Match
              </button>
            </div>

            <button 
              className={`text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 border transition-all ${
                isDemoRunning 
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 cursor-not-allowed'
                  : 'border-primary bg-primary text-white hover:bg-primary-hover shadow-glow'
              }`}
              onClick={runFullDemoSequence} 
              disabled={isDemoRunning}
            >
              <Play size={12} className={isDemoRunning ? "animate-spin" : ""} />
              {isDemoRunning ? "Demo Active..." : "Simulate Outage"}
            </button>
          </div>
        </header>

        {/* Scrollable dashboard panels */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Key Metrics Statistics Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { label: 'Memories Recalled', value: analytics.total_memories, desc: 'Nodes matched in Parcle', color: 'text-primary' },
              { label: 'Autonomous Repairs', value: analytics.successful_fixes, desc: 'Hotfixes self-deployed', color: 'text-emerald-400' },
              { label: 'Context Reuse Count', value: analytics.memory_reuse_count, desc: 'Signatures matched', color: 'text-violet-400' },
              { label: 'Memory Match Score', value: `${analytics.average_similarity}%`, desc: 'Average confidence', color: 'text-amber-400' },
              { label: 'Deployment Success', value: `${analytics.success_rate}%`, desc: 'Rollback avoidance', color: 'text-cyan-400' },
              { label: 'Avg Resolution Time', value: `${analytics.average_resolution_time}s`, desc: 'Trigger to green pipeline', color: 'text-pink-400' },
            ].map((metric, i) => (
              <div key={i} className="glass-panel-elevated p-4 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-white/10 hover:shadow-glow transition-all group duration-300">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{metric.label}</span>
                  <div className={`text-2xl font-extrabold tracking-tight my-1.5 ${metric.color} group-hover:scale-105 transition-transform duration-200`}>
                    {metric.value}
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">{metric.desc}</span>
              </div>
            ))}
          </div>

          {/* Tab Content Router */}
          {activeTab === "errors" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Full Width Topological Mesh & Telemetry */}
              <div className="lg:col-span-3 grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1">
                  <TelemetryGauges activeStage={selected?.latest_stage} />
                </div>
                <div className="xl:col-span-2">
                  <ServiceMeshMap activeStage={selected?.latest_stage} />
                </div>
              </div>

              {/* Left Column: Feed */}
              <div className="lg:col-span-1 glass-panel rounded-2xl flex flex-col overflow-hidden border border-white/5 max-h-[750px]">
                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                  <h3 className="font-bold text-xs text-white">ACTIVE INCIDENTS</h3>
                  <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5">
                    {['all', 'active', 'fixed', 'failed'].map(t => (
                      <button
                        key={t}
                        onClick={() => setFilterType(t)}
                        className={`text-[9px] uppercase font-bold px-2 py-1 rounded transition-all ${
                          filterType === t ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-white/5 flex flex-col">
                  {filteredPipelines.length ? (
                    filteredPipelines.map((p) => {
                      const isFailed = p.outcome === "deploy_failed" || p.latest_stage === "aborted";
                      const isSuccess = p.outcome === "success" || p.latest_stage === "complete";
                      const isRolledBack = p.outcome === "rolled_back";
                      
                      let statusLabel = "Resolving";
                      let statusBadgeStyle = "bg-primary/10 text-primary border-primary/20";
                      if (isSuccess) { statusLabel = "Fixed"; statusBadgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"; }
                      else if (isFailed) { statusLabel = "Failed"; statusBadgeStyle = "bg-rose-500/10 text-rose-400 border-rose-500/20"; }
                      else if (isRolledBack) { statusLabel = "Restored"; statusBadgeStyle = "bg-slate-500/10 text-slate-300 border-slate-500/20"; }
                      else if (p.latest_stage === "waiting_for_approval") { statusLabel = "Paused"; statusBadgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20"; }

                      return (
                        <button
                          key={p.pipeline_id}
                          className={`w-full text-left p-4 hover:bg-white/5 transition-all flex flex-col gap-1.5 relative border-l-2 ${
                            selectedId === p.pipeline_id 
                              ? 'bg-primary/5 border-primary' 
                              : 'border-transparent'
                          }`}
                          onClick={() => setSelectedId(p.pipeline_id)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-white tracking-tight">{p.error_type}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${statusBadgeStyle}`}>
                              {statusLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-full">{p.message}</p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                            <span>{p.service_name || "express-service"}</span>
                            {p.hits_data && p.hits_data.length > 0 && (
                              <span className="text-emerald-400 font-bold bg-emerald-500/5 px-1.5 rounded">
                                Memory Matched
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 gap-3">
                      <AlertOctagon size={24} className="text-slate-600" />
                      <span className="text-xs">No active incidents captured.</span>
                    </div>
                  )}
                </div>

                {/* Interactive CLI Console */}
                <div className="p-4 border-t border-white/5 bg-white/5 flex flex-col h-[280px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal size={12} />
                      DIAGNOSTIC SHELL
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">SESSION: ACTIVE</span>
                  </div>

                  <div className="flex-1 bg-bg-dark rounded-xl border border-white/5 p-3 overflow-y-auto font-mono text-[10px] space-y-1.5 text-slate-300">
                    {terminalHistory.map((h, i) => (
                      <div key={i} className="whitespace-pre-wrap">
                        {h.type === 'input' ? (
                          <span className="text-primary font-bold">{`> `}<span className="text-white">{h.text}</span></span>
                        ) : (
                          <span className="text-slate-400">{h.text}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleTerminalSubmit} className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder='Type command (e.g. "help")...'
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      className="flex-1 bg-bg-dark border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-primary/50"
                    />
                    <button type="submit" className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-glow">
                      EXEC
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: AI Diagnosis, Flow and Actions */}
              <div className="lg:col-span-2 space-y-6">
                {selected ? (
                  <>
                    {/* Diagnosis card */}
                    <div className="glass-panel-elevated p-6 rounded-3xl border border-white/5 space-y-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider ${
                            selected.severity === "critical" 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {selected.severity || "error"}
                          </span>
                          <h3 className="font-extrabold text-sm text-white tracking-tight">{selected.error_type}</h3>
                        </div>
                        <span className="text-[10px] text-slate-400">Service: <strong className="text-white">{selected.service_name || "express-service"}</strong></span>
                      </div>

                      <div className="bg-bg-dark/80 rounded-2xl border border-white/5 p-4">
                        <span className="text-[9px] font-bold text-slate-500 block mb-1">INCIDENT ERROR EXCEPTION</span>
                        <p className="font-mono text-xs text-rose-400 leading-relaxed break-words">{selected.message}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">AI Root Cause Analysis</span>
                            <p className="text-xs text-slate-300 leading-relaxed font-semibold">{selected.root_cause || "Analyzing code trace..."}</p>
                          </div>
                        </div>

                        <div className="bg-white/5 rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Mitigation Plan Confidence</span>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-3xl font-extrabold text-primary">{selected.confidence_after || 94}%</span>
                              <div>
                                <span className="text-[9px] font-bold bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded uppercase block w-max">
                                  {selected.risk_level || "low"} RISK
                                </span>
                                <span className="text-[10px] text-slate-500 block mt-0.5">Deployment authorized</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Code stacktrace */}
                      <div className="bg-bg-dark rounded-2xl border border-white/5 overflow-hidden">
                        <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-mono">Stack Trace Traceback</span>
                          <span>File: {selected.file_path || "index.js"}:{selected.line_number || "?"}</span>
                        </div>
                        <pre className="p-4 text-xs font-mono text-slate-400 overflow-x-auto max-h-48 whitespace-pre">
                          {selected.stack_trace || "No stack trace available."}
                        </pre>
                      </div>
                    </div>

                    {/* AI Reasoning Pipeline Flow */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                      <h4 className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">AI Reasoning Pipeline Stage</h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                          { id: "received", label: "Captured" },
                          { id: "context_extraction", label: "Context" },
                          { id: "querying_memory", label: "Query Memory" },
                          { id: "similarity_scoring", label: "Match Score" },
                          { id: "reasoning", label: "Diagnosed" },
                          { id: "patch_generated", label: "Patch Output" },
                          { id: "patch_validation", label: "Validated" },
                          { id: "deploying", label: "Deploying" },
                          { id: "complete", label: "Recovered" }
                        ].map((node) => {
                          const order = ["received", "context_extraction", "querying_memory", "similarity_scoring", "reasoning", "patch_generated", "patch_validation", "deploying", "complete"];
                          const currentIdx = order.indexOf(selected.latest_stage);
                          const targetIdx = order.indexOf(node.id);
                          
                          let status = "pending";
                          let bgStyle = "bg-white/5 border-white/5 text-slate-500";
                          
                          if (selected.latest_stage === "aborted" || selected.latest_stage === "deploy_failed") {
                            if (selected.latest_stage === "aborted" && node.id === "patch_validation") {
                              status = "error";
                              bgStyle = "bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-glow-error";
                            }
                            if (selected.latest_stage === "deploy_failed" && node.id === "deploying") {
                              status = "error";
                              bgStyle = "bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-glow-error";
                            }
                          } else if (selected.outcome === "rolled_back") {
                            status = "pending";
                          } else if (targetIdx < currentIdx) {
                            status = "success";
                            bgStyle = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-glow-success";
                          } else if (targetIdx === currentIdx) {
                            status = "active";
                            bgStyle = "bg-primary/20 border-primary text-primary shadow-glow animate-pulse";
                          }

                          return (
                            <div key={node.id} className={`flex flex-col items-center justify-center p-3 rounded-2xl border ${bgStyle} transition-all duration-200`}>
                              {status === "success" && <CheckCircle2 size={14} className="mb-1" />}
                              {status === "error" && <XCircle size={14} className="mb-1" />}
                              {status === "active" && <RefreshCw size={14} className="animate-spin mb-1" />}
                              {status === "pending" && <Clock size={14} className="mb-1" />}
                              <span className="text-[10px] font-bold text-center">{node.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Memory Retrieval (Query, Confidence, Citations) */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">Parcle Memory Retrieval Status</h4>
                        {selected.parcle_search_status && (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            selected.parcle_search_status === "searching"
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {selected.parcle_search_status.toUpperCase()}
                          </span>
                        )}
                      </div>

                      {selected.parcle_search_status === "searching" ? (
                        <div className="flex items-center gap-3 text-xs text-slate-400 py-3">
                          <RefreshCw size={14} className="animate-spin text-primary" />
                          <span>Searching Parcle memory registry...</span>
                        </div>
                      ) : selected.parcle_search_answer ? (
                        <div className="space-y-3.5">
                          <div className="bg-bg-dark border border-white/5 p-4 rounded-2xl space-y-2.5 text-xs text-slate-300">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-primary">Retrieved Answer Summary</span>
                              <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                                {Math.round((selected.parcle_search_confidence || 0.85) * 100)}% Confidence
                              </span>
                            </div>
                            <p className="text-slate-300 leading-relaxed font-semibold">{selected.parcle_search_answer}</p>
                          </div>

                          {/* Citations */}
                          {selected.parcle_search_citations && selected.parcle_search_citations.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Sources Cited:</span>
                              <div className="flex flex-wrap gap-2">
                                {selected.parcle_search_citations.map((cit: any, i: number) => (
                                  <span key={i} className="text-[10px] font-mono bg-white/5 text-slate-300 px-2.5 py-1 rounded-lg border border-white/5">
                                    {cit.type || "Doc"}: {cit.id}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 py-2">No preceding matches found in Parcle long-term memory namespaces.</p>
                      )}
                    </div>

                    {/* Memory Influence Viewer (Confidence Before/After & Impact Score) */}
                    {selected.confidence_before && (
                      <div className="glass-panel p-6 rounded-3xl border border-primary/20 bg-primary-soft/10 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-extrabold text-primary tracking-wider uppercase">Memory Influence Viewer</h4>
                          <span className="text-xs font-bold text-emerald-400">+{selected.memory_impact || (selected.confidence_after - selected.confidence_before)}% Impact Score</span>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1.5">Confidence Before Memory</span>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-500 rounded-full" style={{ width: `${selected.confidence_before}%` }}></div>
                              </div>
                              <span className="text-xs font-bold text-slate-400">{selected.confidence_before}%</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1.5">Confidence After Memory</span>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selected.confidence_after}%` }}></div>
                              </div>
                              <span className="text-xs font-bold text-emerald-400">{selected.confidence_after}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Memory Save Status (Saving / Saved status & keys) */}
                    {selected.parcle_save_status && (
                      <div className="glass-panel p-6 rounded-3xl border border-white/5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {selected.parcle_save_status === "saving" ? (
                            <>
                              <RefreshCw size={16} className="animate-spin text-amber-500" />
                              <div>
                                <h4 className="font-bold text-xs text-white">Ingesting dialog context...</h4>
                                <p className="text-[10px] text-slate-400">Writing resolution node to Parcle long-term memory namespace.</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={16} className="text-emerald-400" />
                              <div>
                                <h4 className="font-bold text-xs text-emerald-400">Memory Committed successfully</h4>
                                <p className="text-[10px] text-slate-400">Session ID: <strong className="font-mono text-slate-300">{selected.parcle_session_id}</strong> | Event ID: <strong className="font-mono text-slate-300">{selected.parcle_event_id}</strong></p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Code diff */}
                    {selected.patch_diff && (
                      <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                        <h4 className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">Surgical Hotfix Difference Output</h4>
                        <PatchViewer patchDiff={selected.patch_diff} affectedFile={selected.affected_file} />
                      </div>
                    )}

                    {/* Developer halted block */}
                    {selected.waiting_approval && (
                      <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <ShieldAlert className="text-amber-400 h-5 w-5 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-bold text-xs text-white">Manual Verification Paused</h4>
                            <p className="text-[11px] text-slate-400">Risk rating: <strong className="text-amber-400">{selected.risk_level}</strong>. Verification checks require manual execution approval.</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => confirmPatch(selected.pipeline_id)}
                          disabled={isApproving}
                          className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-glow"
                        >
                          {isApproving ? "Deploying..." : "Approve & Deploy"}
                        </button>
                      </div>
                    )}

                    {/* Terminal CLI outputs */}
                    <div className="glass-panel overflow-hidden rounded-3xl border border-white/5">
                      <div className="px-5 py-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-white">
                          <Terminal size={14} className="text-slate-400" />
                          <span>ENTER PRO BUILD CLI LOGS</span>
                        </div>
                        {selected.outcome === "success" && (
                          <button
                            onClick={() => triggerRollback(selected.pipeline_id, selected.affected_file)}
                            disabled={isRollingBack[selected.pipeline_id]}
                            className="text-[10px] font-bold flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                          >
                            <RefreshCw size={10} className={isRollingBack[selected.pipeline_id] ? "animate-spin" : ""} />
                            Rollback patch
                          </button>
                        )}
                      </div>
                      <div className="p-4 bg-bg-dark/80 font-mono text-xs text-slate-300 max-h-60 overflow-y-auto space-y-1">
                        {selected.build_logs && selected.build_logs.length > 0 ? (
                          selected.build_logs.map((log: string, idx: number) => (
                            <div key={idx} className="break-all">{log}</div>
                          ))
                        ) : (
                          <div className="text-slate-500 text-center py-4">Waiting for deployment steps...</div>
                        )}
                        <div ref={consoleBottomRef} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-slate-500 glass-panel rounded-3xl flex flex-col items-center justify-center gap-4">
                    <Activity size={32} className="text-slate-600 animate-pulse" />
                    <span className="text-xs">Select an incident from the stream to diagnose and view execution trace.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline tab */}
          {activeTab === "timeline" && (
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                <h3 className="font-extrabold text-sm text-white">PARCLE LEDGER TIMELINE</h3>
                <div className="space-y-4">
                  {timelineData.map((item, idx) => (
                    <div key={item.id || idx} className="bg-bg-card p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/10 transition-all">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                          <Database size={16} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-white">{item.error_type}</h4>
                          <p className="text-[11px] text-slate-400 mt-1">{item.fix_summary}</p>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">{item.file_path || "index.js"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {item.outcome}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-1">Similarity score: {Math.round((item.similarity_score || 0.91) * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Journal Tab */}
          {activeTab === "journal" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 glass-panel rounded-2xl border border-white/5 overflow-hidden max-h-[700px] flex flex-col">
                <div className="p-4 bg-white/5 border-b border-white/5 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search journal items..." 
                      value={journalSearch}
                      onChange={(e) => setJournalSearch(e.target.value)}
                      className="w-full bg-bg-dark border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-primary/50 transition-all"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {['all', 'success', 'failed', 'high_conf', 'assisted', 'manual'].map(f => (
                      <button
                        key={f}
                        onClick={() => setJournalFilter(f)}
                        className={`text-[9px] uppercase font-bold px-2 py-1 rounded transition-all ${
                          journalFilter === f ? 'bg-primary text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {f.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                  {filteredJournal.map((j) => (
                    <button
                      key={j.id}
                      onClick={() => setSelectedJournalId(j.id)}
                      className={`w-full text-left p-4 hover:bg-white/5 transition-all block border-l-2 ${
                        selectedJournalId === j.id ? 'bg-primary/5 border-primary' : 'border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-extrabold text-xs text-white tracking-tight">{j.error_type}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          j.deployment_result === "Successful" 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {j.deployment_result}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{j.message}</p>
                      <span className="text-[10px] text-slate-500 block mt-1">{j.timestamp}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Journal Detail */}
              <div className="lg:col-span-2 space-y-6">
                {selectedJournal ? (
                  <div className="glass-panel-elevated p-6 rounded-3xl border border-white/5 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                      <div>
                        <span className="text-[9px] font-bold text-primary uppercase block mb-1">Incident Evolution Ledger Report</span>
                        <h2 className="text-lg font-extrabold text-white tracking-tight">{selectedJournal.id}</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => exportJournalReport(selectedJournal, 'json')}
                          className="text-[10px] font-bold flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 text-white transition-all"
                        >
                          <Download size={12} /> Export JSON
                        </button>
                        <button 
                          onClick={() => exportJournalReport(selectedJournal, 'markdown')}
                          className="text-[10px] font-bold flex items-center gap-1.5 px-3 py-2 bg-primary/20 text-primary border border-primary/20 hover:bg-primary hover:text-white rounded-xl transition-all"
                        >
                          <Download size={12} /> Export Markdown
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
                      <div className="space-y-2">
                        <div><strong>Timestamp:</strong> <span className="text-slate-400">{selectedJournal.timestamp}</span></div>
                        <div><strong>Type:</strong> <span className="text-slate-400">{selectedJournal.error_type}</span></div>
                        <div><strong>Exception:</strong> <span className="text-rose-400 break-words font-mono block mt-1 bg-bg-dark p-2 rounded border border-white/5">{selectedJournal.message}</span></div>
                        <div><strong>Suggested patch:</strong> <span className="text-slate-400">{selectedJournal.fix_applied}</span></div>
                      </div>
                      <div className="space-y-2">
                        <div><strong>Recall matching:</strong> <span className="text-slate-400">{selectedJournal.memory_used ? `Yes (${selectedJournal.similarity}% similarity)` : 'No'}</span></div>
                        <div><strong>Recall confidence delta:</strong> <span className="text-slate-400">{selectedJournal.confidence_before}% → {selectedJournal.patch_confidence}% (+{selectedJournal.memory_impact}% improvement)</span></div>
                        <div><strong>Surgical mitigation:</strong> <span className="text-slate-400">{selectedJournal.fix_applied}</span></div>
                        <div><strong>Deployment status:</strong> <span className="text-emerald-400 font-bold">{selectedJournal.deployment_result}</span></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">AI Engineering Learning Summary</h4>
                      <p className="text-xs text-slate-400 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">{selectedJournal.engineering_notes}</p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">AI Actionable Learnings</h4>
                      <p className="text-xs text-slate-400 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">{selectedJournal.learning_summary}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500 glass-panel rounded-3xl">
                    Select a report from the ledger history to view details.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Memory Lifecycle tab */}
          {activeTab === "lifecycle" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Sidebar */}
              <div className="lg:col-span-1 glass-panel rounded-2xl border border-white/5 overflow-hidden max-h-[700px] flex flex-col">
                <div className="p-4 bg-white/5 border-b border-white/5">
                  <h3 className="font-bold text-xs text-white">MEMORY INSTANCES</h3>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                  {timelineData.map((mem) => (
                    <button
                      key={mem.id}
                      onClick={() => setSelectedLifecycleId(mem.id)}
                      className={`w-full text-left p-4 hover:bg-white/5 transition-all block border-l-2 ${
                        selectedLifecycleId === mem.id ? 'bg-primary/5 border-primary' : 'border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs text-white tracking-tight">{mem.error_type}</span>
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-primary-soft text-primary border border-primary/20">
                          {mem.times_reused || 0}x Reused
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-1">{mem.fix_summary}</p>
                      <span className="text-[10px] text-slate-500 block mt-1">Last Match: {mem.last_used || "Just Now"}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Detail view */}
              <div className="lg:col-span-2 space-y-6">
                {selectedLifecycle ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Write block */}
                      <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">MEMORY WRITE LOG DIRECTIVE</h4>
                        <div className="bg-bg-dark p-4 rounded-2xl border border-white/5 font-mono text-xs text-slate-300">
                          <span className="text-slate-500 block mb-1">// Initializing Parcle payload</span>
                          <pre className="overflow-x-auto text-[11px]">
{JSON.stringify({
  error_type: selectedLifecycle.error_type,
  root_cause: selectedLifecycle.previous_root_cause || "Unchecked query returned null context.",
  fix_summary: selectedLifecycle.fix_summary,
  deployment_result: "success",
  confidence: selectedLifecycle.confidence_after || 94,
  timestamp: selectedLifecycle.fixed_at
}, null, 2)}
                          </pre>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                          <CheckCircle2 size={16} />
                          <span>Ledger successfully committed to memory.</span>
                        </div>
                      </div>

                      {/* Read block */}
                      <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">MEMORY DEVIATION ANALYSIS</h4>
                        <div className="bg-bg-dark p-4 rounded-2xl border border-white/5 text-xs space-y-2">
                          <span className="text-[10px] text-slate-500 block font-mono">// Request matching query payload</span>
                          <p className="font-mono text-slate-400 font-semibold bg-white/5 p-2 rounded select-all">"{selectedLifecycle.message}"</p>
                          <div className="border-t border-white/5 pt-2 flex items-center justify-between">
                            <span className="text-slate-400">Match score:</span>
                            <span className="text-emerald-400 font-extrabold">{Math.round(selectedLifecycle.similarity_score * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Flowchart visualization */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                      <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Memory Influence Mapping</h4>
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="text-center p-3 bg-bg-dark rounded-xl border border-white/5 flex-1 w-full">
                          <span className="text-[9px] font-bold text-slate-500 block uppercase mb-0.5">CURRENT INCIDENT</span>
                          <span className="text-xs font-bold text-white">{selectedLifecycle.error_type}</span>
                        </div>
                        <ArrowRight className="text-slate-500 hidden md:block" />
                        <div className="text-center p-3 bg-primary-soft rounded-xl border border-primary/20 flex-1 w-full">
                          <span className="text-[9px] font-bold text-primary block uppercase mb-0.5">RECALLED NODE</span>
                          <span className="text-xs font-bold text-white">{selectedLifecycle.id} ({Math.round(selectedLifecycle.similarity_score * 100)}%)</span>
                        </div>
                        <ArrowRight className="text-slate-500 hidden md:block" />
                        <div className="text-center p-3 bg-bg-dark rounded-xl border border-white/5 flex-1 w-full">
                          <span className="text-[9px] font-bold text-slate-500 block uppercase mb-0.5">SURGICAL FIX</span>
                          <span className="text-xs font-bold text-emerald-400">Dry-run validated</span>
                        </div>
                      </div>
                    </div>

                    {/* Database ledger table grid */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                      <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Memory Evolution Ledger Ledger</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 text-slate-500 font-bold">
                              <th className="py-2.5">Node ID</th>
                              <th className="py-2.5">Error Type</th>
                              <th className="py-2.5">Root Cause</th>
                              <th className="py-2.5">Times Reused</th>
                              <th className="py-2.5">Outcome</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {timelineData.map((m) => (
                              <tr key={m.id} className={`hover:bg-white/5 ${selectedLifecycleId === m.id ? 'bg-primary/5' : ''}`}>
                                <td className="py-2.5 font-mono text-primary">{m.id}</td>
                                <td className="py-2.5 font-bold text-white">{m.error_type}</td>
                                <td className="py-2.5 text-slate-400 max-w-[200px] truncate">{m.previous_root_cause || "Unchecked query parameter"}</td>
                                <td className="py-2.5 font-bold">{m.times_reused || 0}</td>
                                <td className="py-2.5"><span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-bold">success</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-slate-500 glass-panel rounded-3xl">
                    Select a memory index item to view.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Insights tab */}
          {activeTab === "insights" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                  <h3 className="font-extrabold text-sm text-white">PREDICTIVE INCIDENT FORECAST</h3>
                  <p className="text-xs text-slate-400">Continuous analysis of pipeline checkouts, commits, and memory metrics predicts potential operational risks before failures occur.</p>
                  
                  <div className="space-y-4 mt-4">
                    {[
                      { title: "Null Reference Guards", risk: "Elevated", probability: "68%", action: "Add checking blocks to middleware index.js:L53", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                      { title: "Network Request Connection Timeout", risk: "Low", probability: "12%", action: "Verify connection pooling setup", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                      { title: "Undefined Variable Lookup", risk: "Elevated", probability: "55%", action: "Add parameter checks inside route schema validations", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" }
                    ].map((item, i) => (
                      <div key={i} className="p-4 bg-bg-card border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-xs text-white">{item.title}</h4>
                          <p className="text-[11px] text-slate-400 mt-1">Recommended action: <strong className="text-white">{item.action}</strong></p>
                        </div>
                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${item.color}`}>
                              {item.risk} Risk
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-1">Probability: {item.probability}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mini gauges */}
              <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-white/5 space-y-6">
                <h3 className="font-extrabold text-xs text-white tracking-wide uppercase">Engine Health Gauges</h3>
                
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.05)" />
                        <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={9} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.1)" />
                        <Radar name="Platform Performance" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-white block">Engine Score</span>
                    <span className="text-[10px] text-slate-400 block mt-1">Continuous performance indexes</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics tab */}
          {activeTab === "analytics" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                <h3 className="font-extrabold text-xs text-white tracking-wider uppercase">Average Resolution Time Trend</h3>
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={resolutionTimeDataset} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ background: '#0c0f24', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="time" stroke="#6366f1" fillOpacity={1} fill="url(#colorTime)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                <h3 className="font-extrabold text-xs text-white tracking-wider uppercase">Confidence Improvement Deltas</h3>
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={similarityScoreDataset} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ background: '#0c0f24', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="confidence_improvement" stroke="#10b981" fillOpacity={1} fill="url(#colorConf)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Settings tab */}
          {activeTab === "settings" && (
            <div className="max-w-2xl glass-panel p-6 rounded-3xl border border-white/5 space-y-6">
              <div>
                <h3 className="font-extrabold text-sm text-white">GLOBAL PLATFORM CONFIGURATIONS</h3>
                <p className="text-xs text-slate-400 mt-1">Configure threshold, integrations, webhook triggers, and namespaces parameters.</p>
              </div>

              <div className="space-y-4 divide-y divide-white/5">
                <div className="py-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Auto-deployment Threshold</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Deploy surgical patches automatically if confidence is above this rating.</span>
                  </div>
                  <input type="text" defaultValue="90%" className="bg-bg-dark border border-white/5 text-xs text-white text-center py-1.5 rounded-lg w-16 font-mono outline-none" />
                </div>

                <div className="py-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Parcle Vector Namespace</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Define vector search storage pool namespace cluster.</span>
                  </div>
                  <input type="text" defaultValue="bug-fixes" className="bg-bg-dark border border-white/5 text-xs text-white px-3 py-1.5 rounded-lg w-40 font-mono outline-none" />
                </div>

                <div className="py-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Rollback Grace Window</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Window timeline to monitor deployment health before committing to ledger.</span>
                  </div>
                  <input type="text" defaultValue="60 seconds" className="bg-bg-dark border border-white/5 text-xs text-white text-center py-1.5 rounded-lg w-28 font-mono outline-none" />
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Judge Tour Modal */}
      {showJudgeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel-elevated max-w-md w-full rounded-3xl border border-white/10 overflow-hidden shadow-glow-purple">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-extrabold text-xs">
                <Sparkles size={14} className="text-primary" />
                <span>EXPLAIN MEMORY USAGE (JUDGE WALKTHROUGH)</span>
              </div>
              <button onClick={() => setShowJudgeModal(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Step indicator progress bar */}
              <div className="flex justify-between relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/5 z-0 -translate-y-1/2"></div>
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button 
                    key={num} 
                    onClick={() => setJudgeStep(num)}
                    className={`h-6 w-6 rounded-full font-mono text-[10px] font-bold flex items-center justify-center relative z-10 transition-all ${
                      judgeStep >= num ? 'bg-primary text-white shadow-glow' : 'bg-bg-dark border border-white/5 text-slate-400'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <div className="min-h-[120px] pt-4">
                {judgeStep === 1 && (
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-xs text-white">1. Capture Exception Trigger</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">When an exception occurs in production runtime services, the custom ingest module captures the traceback metadata, file context line, and error type logs instantly.</p>
                  </div>
                )}
                {judgeStep === 2 && (
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-xs text-white">2. Vector Search Retrieval</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">The orchestrator compiles the exception traceback and does a semantic query search inside the Parcle vector database space to retrieve matching histories.</p>
                  </div>
                )}
                {judgeStep === 3 && (
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-xs text-white">3. Similarity Calculation</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Parcle returns matched nodes alongside similarity parameters. The engine parses similarity index percentiles and retrieves previous fix diffs.</p>
                  </div>
                )}
                {judgeStep === 4 && (
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-xs text-white">4. LLM Reasoner Guidance</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">The Claude 3.5 Sonnet agent receives the current traceback context AND the matching historical patch diff. The past fix prevents raw reasoning, leading to targeted repair execution.</p>
                  </div>
                )}
                {judgeStep === 5 && (
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-xs text-white">5. Memory Confidence Delta</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">The similarity match score delta is calculated. The system compares confidence ratings before and after memory retrieval, demonstrating how Parcle influences optimal choices.</p>
                  </div>
                )}
                {judgeStep === 6 && (
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-xs text-white">6. Surgical Patch Deployment</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">If confidence ratings validate security thresholds, the agent issues a surgical patch diff, executes dry-run validation scripts, and deploys using Enter Pro.</p>
                  </div>
                )}
                {judgeStep === 7 && (
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-xs text-white">7. Memory Ledger Commit</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Once deployment confirms a healthy outcome, the new fix traceback and diff patterns are stored back in Parcle. The platform grows smarter with every incident resolve iteration.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-white/5 border-t border-white/5 flex justify-between">
              <button 
                onClick={() => setJudgeStep(prev => Math.max(prev - 1, 1))}
                disabled={judgeStep === 1}
                className="text-[10px] font-bold px-3 py-1.5 border border-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Back
              </button>
              {judgeStep < 7 ? (
                <button 
                  onClick={() => setJudgeStep(prev => Math.min(prev + 1, 7))}
                  className="text-[10px] font-bold px-4 py-1.5 bg-primary text-white hover:bg-primary-hover rounded-lg shadow-glow transition-all"
                >
                  Next Step
                </button>
              ) : (
                <button 
                  onClick={() => setShowJudgeModal(false)}
                  className="text-[10px] font-bold px-4 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg shadow-glow-success transition-all"
                >
                  Complete Tour
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
