import React from "react";
import { AlertCircle, CheckCircle, XCircle, Clock, Database } from "lucide-react";

export function ErrorFeed({ pipelines, selected, onSelect }) {
  if (!pipelines.length) {
    return (
      <div className="feed-empty">
        <AlertCircle size={24} />
        <span>Watching for errors...</span>
        <span className="feed-empty-sub">Errors fired at /ingest/custom will appear here</span>
      </div>
    );
  }

  return (
    <div className="error-feed">
      {pipelines.map((p) => {
        // Calculate historical fix count from Parcle query results
        let fixCount = 0;
        if (p.hits_data) {
          fixCount = p.hits_data.filter(h => h.outcome === "success").length;
        }

        const isFailed = p.outcome === "deploy_failed" || p.latest_stage === "aborted";
        const isSuccess = p.outcome === "success" || p.latest_stage === "complete";

        return (
          <button
            key={p.pipeline_id}
            className={`feed-item ${selected === p.pipeline_id ? "selected" : ""} ${isSuccess ? "fixed" : ""} ${isFailed ? "failed" : ""}`}
            onClick={() => onSelect(p.pipeline_id)}
          >
            <StatusIcon pipeline={p} />
            <div className="feed-item-content">
              <span className="feed-error-type">{p.error_type}</span>
              <span className="feed-message">
                {p.message?.slice(0, 50)}{p.message?.length > 50 ? "…" : ""}
              </span>
              <div className="feed-item-meta">
                {p.duration_seconds && (
                  <span className="feed-duration">{p.duration_seconds}s</span>
                )}
                {fixCount > 0 && (
                  <span className="feed-tag">Fixed {fixCount}x</span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function StatusIcon({ pipeline }) {
  const isFailed = pipeline.outcome === "deploy_failed" || pipeline.latest_stage === "aborted";
  const isSuccess = pipeline.outcome === "success" || pipeline.latest_stage === "complete";

  if (isSuccess) return <CheckCircle size={14} className="icon-success" />;
  if (isFailed) return <XCircle size={14} className="icon-error" />;
  return <Clock size={14} className="icon-running spin-slow" />;
}
