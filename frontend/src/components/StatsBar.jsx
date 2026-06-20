import React from "react";
import { Activity, Database, CheckCircle, Clock } from "lucide-react";

export function StatsBar({ stats, uptime }) {
  return (
    <div className="stats-bar">
      <Stat icon={<Activity size={14} />} label="Total errors" value={stats.total} />
      <Stat icon={<CheckCircle size={14} />} label="Auto-fixed" value={stats.fixed} />
      <Stat icon={<Database size={14} />} label="Memory hits" value={stats.memory_hits} />
      <Stat icon={<Clock size={14} />} label="Uptime" value={uptime} />
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat">
      <span className="stat-icon">{icon}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
