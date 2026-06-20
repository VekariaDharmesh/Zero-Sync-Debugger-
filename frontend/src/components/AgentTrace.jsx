import React from "react";
import { CheckCircle, Circle, XCircle, Loader, Brain, Zap, Database, Send, HelpCircle } from "lucide-react";

const STAGE_SEQUENCE = [
  { id: "received", label: "Error received", icon: Circle },
  { id: "querying_memory", label: "Querying Parcle memory", icon: Database },
  { id: "memory_results", label: "Memory hits retrieved", icon: Database },
  { id: "reasoning", label: "Root cause reasoning", icon: Brain },
  { id: "patch_generated", label: "Patch generated", icon: Zap },
  { id: "deploying", label: "Deploying via Enter Pro", icon: Send },
  { id: "complete", label: "Fix fully deployed", icon: CheckCircle }
];

export function AgentTrace({ pipeline }) {
  if (!pipeline) return null;

  const currentStageIndex = STAGE_SEQUENCE.findIndex(s => s.id === pipeline.latest_stage);
  const isFailed = pipeline.latest_stage === "aborted" || pipeline.latest_stage === "deploy_failed";
  const isWaitingApproval = pipeline.latest_stage === "waiting_for_approval";

  return (
    <div className="agent-trace">
      <div className="trace-header">
        <span className="trace-error-type">{pipeline.error_type}</span>
        {pipeline.duration_seconds && (
          <span className="trace-duration">{pipeline.duration_seconds}s execution</span>
        )}
      </div>
      <p className="trace-message">{pipeline.message}</p>

      <div className="trace-stages">
        {STAGE_SEQUENCE.map((stage, idx) => {
          let status = "pending"; // pending, active, success, error
          let badgeText = null;
          let badgeClass = "";

          if (isFailed && idx === currentStageIndex) {
            status = "error";
          } else if (isWaitingApproval && stage.id === "deploying") {
            status = "active";
            badgeText = "awaiting approval";
            badgeClass = "confidence-medium";
          } else if (idx < currentStageIndex) {
            status = "success";
          } else if (idx === currentStageIndex) {
            status = "active";
          }

          // Special metadata badges for stages
          if (stage.id === "memory_results" && pipeline.hits !== undefined) {
            badgeText = `${pipeline.hits} hits`;
            badgeClass = pipeline.hits > 0 ? "confidence-high" : "";
          }

          if (stage.id === "patch_generated" && pipeline.confidence) {
            badgeText = `${pipeline.confidence} confidence`;
            badgeClass = `confidence-${pipeline.confidence}`;
          }

          const Icon = stage.icon;

          return (
            <div key={stage.id} className={`trace-stage ${status}`}>
              <div className="trace-stage-icon">
                {status === "active" && stage.id !== "complete" ? (
                  <Loader size={8} className="spin" style={{ color: "white" }} />
                ) : null}
              </div>
              <span>{stage.label}</span>
              {badgeText && (
                <span className={`trace-badge ${badgeClass}`}>{badgeText}</span>
              )}
            </div>
          );
        })}

        {/* Surface termination state if aborted or failed */}
        {pipeline.latest_stage === "aborted" && (
          <div className="trace-stage error">
            <div className="trace-stage-icon"></div>
            <span>Aborted: {pipeline.stages.find(s => s.stage === "aborted")?.reason || "Reason unknown"}</span>
          </div>
        )}

        {pipeline.latest_stage === "deploy_failed" && (
          <div className="trace-stage error">
            <div className="trace-stage-icon"></div>
            <span>Deploy failed: {pipeline.stages.find(s => s.stage === "deploy_failed")?.error || "Connection error"}</span>
          </div>
        )}
      </div>

      {pipeline.root_cause && (
        <div className="trace-root-cause">
          <span className="trace-section-label">Agent Reasoning Explanation</span>
          <p>{pipeline.root_cause}</p>
        </div>
      )}
    </div>
  );
}
