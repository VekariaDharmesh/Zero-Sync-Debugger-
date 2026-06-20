import { useState, useCallback } from "react";

const MAX_PIPELINES = 50;

export function useAgentState() {
  const [pipelines, setPipelines] = useState({});
  const [stats, setStats] = useState({ fixed: 0, memory_hits: 0, total: 0 });

  const handleEvent = useCallback((event) => {
    const { pipeline_id, stage } = event;
    if (!pipeline_id) return;

    setPipelines((prev) => {
      const existing = prev[pipeline_id] || { stages: [] };
      const updated = {
        ...existing,
        pipeline_id,
        latest_stage: stage,
        stages: [...existing.stages, event],
        ...(stage === "received" && {
          error_type: event.error_type,
          message: event.message,
          stack_trace: event.stack_trace,
          file_path: event.file_path,
          line_number: event.line_number,
          language: event.language,
          started_at: Date.now(),
        }),
        ...(stage === "memory_results" && {
          hits: event.hits,
          top_similarity: event.top_similarity,
          hits_data: event.hits_data
        }),
        ...(stage === "patch_generated" && {
          patch_diff: event.patch_diff,
          root_cause: event.root_cause,
          fix_summary: event.fix_summary,
          confidence: event.confidence,
          memory_used: event.memory_used,
          affected_file: event.affected_file
        }),
        ...(stage === "waiting_for_approval" && {
          waiting_approval: true
        }),
        ...(stage === "deploying" && {
          waiting_approval: false // clear waiting once approved
        }),
        ...(stage === "complete" && {
          outcome: event.outcome,
          deploy_url: event.deploy_url,
          duration_seconds: event.duration_seconds,
          completed_at: Date.now(),
        }),
      };
      const allPipelines = { ...prev, [pipeline_id]: updated };
      return allPipelines;
    });

    if (stage === "memory_results" && event.hits > 0) {
      setStats((s) => ({ ...s, memory_hits: s.memory_hits + 1 }));
    }
    if (stage === "received") {
      setStats((s) => ({ ...s, total: s.total + 1 }));
    }
    if (stage === "complete" && event.outcome === "success") {
      setStats((s) => ({ ...s, fixed: s.fixed + 1 }));
    }
  }, []);

  const pipelineList = Object.values(pipelines).sort(
    (a, b) => (b.started_at || 0) - (a.started_at || 0)
  );

  return { pipelines, pipelineList, stats, handleEvent, setPipelines };
}
