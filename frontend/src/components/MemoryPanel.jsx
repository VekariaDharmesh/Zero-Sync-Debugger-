import React from "react";
import { Database, TrendingUp, AlertTriangle } from "lucide-react";

export function MemoryPanel({ pipeline }) {
  if (!pipeline) return null;
  
  const hasMemoryEvent = pipeline.stages.some(s => s.stage === "memory_results");
  if (!hasMemoryEvent) return null;

  const hits = pipeline.hits || 0;
  const topSimilarity = pipeline.top_similarity || 0;
  const hitsData = pipeline.hits_data || [];

  return (
    <div className="memory-panel">
      <div className="memory-header">
        <Database size={14} />
        <span>Parcle long-term memory</span>
        <span className="memory-hits-badge">{hits} match{hits !== 1 ? "es" : ""}</span>
      </div>

      {hits > 0 ? (
        <>
          <div className="similarity-graph-container">
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
              <span style={{ color: "var(--text-muted)" }}>Memory Match Confidence</span>
              <span style={{ color: "var(--success)", fontWeight: 600 }}>
                {Math.round(topSimilarity * 100)}% Match
              </span>
            </div>
            <div className="similarity-graph-bar">
              <div 
                className="similarity-graph-fill" 
                style={{ width: `${Math.round(topSimilarity * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="memory-hits-list">
            {hitsData.slice(0, 3).map((hit, idx) => (
              <div key={hit.id || idx} className="memory-hit-item">
                <div className="memory-hit-top">
                  <span className="memory-hit-type">{hit.error_type}</span>
                  <span className="memory-hit-score">
                    {Math.round(hit.similarity_score * 100)}% Match
                  </span>
                </div>
                <div className="memory-hit-summary">
                  {hit.fix_summary}
                </div>
              </div>
            ))}
          </div>

          {pipeline.memory_used && (
            <div className="memory-used-indicator">
              <TrendingUp size={14} />
              <span>Prior fix experiences successfully guided current patch generation</span>
            </div>
          )}
        </>
      ) : (
        <p className="memory-empty">
          No prior fixes found for this bug pattern. This issue's resolution will be recorded as a new long-term engineering memory upon successful deployment.
        </p>
      )}
    </div>
  );
}
