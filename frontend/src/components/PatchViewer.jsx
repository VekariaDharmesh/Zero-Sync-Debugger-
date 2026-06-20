import React from "react";

export function PatchViewer({ patchDiff, affectedFile }) {
  if (!patchDiff) return null;

  const lines = patchDiff.split("\n");
  const parsedLines = [];
  
  let oldLineNum = 1;
  let newLineNum = 1;

  for (const line of lines) {
    if (line.startsWith("---") || line.startsWith("+++")) {
      continue;
    }
    
    // Parse hunk header
    const hunkMatch = line.match(/^@@ -(\d+),?\d* \+(\d+),?\d* @@/);
    if (hunkMatch) {
      oldLineNum = parseInt(hunkMatch[1], 10);
      newLineNum = parseInt(hunkMatch[2], 10);
      parsedLines.push({
        type: "hunk",
        content: line,
        oldLine: "",
        newLine: "",
        sign: ""
      });
      continue;
    }

    if (line.startsWith("-")) {
      parsedLines.push({
        type: "removed",
        content: line.slice(1),
        oldLine: oldLineNum,
        newLine: "",
        sign: "-"
      });
      oldLineNum++;
    } else if (line.startsWith("+")) {
      parsedLines.push({
        type: "added",
        content: line.slice(1),
        oldLine: "",
        newLine: newLineNum,
        sign: "+"
      });
      newLineNum++;
    } else {
      // Normal context line
      // Strip leading space if it exists
      const content = line.startsWith(" ") ? line.slice(1) : line;
      parsedLines.push({
        type: "context",
        content: content,
        oldLine: oldLineNum,
        newLine: newLineNum,
        sign: " "
      });
      oldLineNum++;
      newLineNum++;
    }
  }

  return (
    <div className="flex flex-col w-full bg-[#0a0a0c] rounded-2xl border border-white/5 overflow-hidden">
      {/* Header separated cleanly */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/5">
        <span className="text-xs font-bold text-slate-300 font-mono">File: {affectedFile || "unknown"}</span>
        <span className="text-[10px] bg-primary-soft text-primary px-2.5 py-1 rounded-lg border border-primary/20 font-bold uppercase tracking-wider">
          Surgical Unified Diff
        </span>
      </div>

      {/* Code diff block with responsive CSS Grid */}
      <div className="overflow-x-auto w-full bg-bg-dark/20">
        <div className="min-w-[600px] flex flex-col font-mono text-xs select-text">
          {parsedLines.map((line, idx) => {
            if (line.type === "hunk") {
              return (
                <div key={idx} className="grid grid-cols-[3.5rem_3.5rem_2rem_1fr] bg-primary-soft/10 border-y border-white/5 text-primary/70 select-none py-2 px-4 font-bold text-center">
                  <div className="col-span-4 font-mono tracking-wide text-[10px]">
                    {line.content}
                  </div>
                </div>
              );
            }

            let rowClass = "hover:bg-white/5";
            let signClass = "text-slate-600";
            let codeClass = "text-slate-300";

            if (line.type === "added") {
              rowClass = "bg-emerald-500/10 hover:bg-emerald-500/15";
              signClass = "text-emerald-400 font-bold";
              codeClass = "text-emerald-300";
            } else if (line.type === "removed") {
              rowClass = "bg-rose-500/10 hover:bg-rose-500/15";
              signClass = "text-rose-400 font-bold";
              codeClass = "text-rose-300";
            }

            return (
              <div key={idx} className={`grid grid-cols-[3.5rem_3.5rem_2rem_1fr] ${rowClass} transition-colors items-center py-1 border-b border-white/[0.02]`}>
                {/* Column 1: Old Line Number */}
                <div className="pr-3 text-right text-slate-500 select-none border-r border-white/5">
                  {line.oldLine || " "}
                </div>
                {/* Column 2: New Line Number */}
                <div className="pr-3 text-right text-slate-500 select-none border-r border-white/5">
                  {line.newLine || " "}
                </div>
                {/* Column 3: Diff Operator */}
                <div className={`text-center select-none font-bold ${signClass}`}>
                  {line.sign || " "}
                </div>
                {/* Column 4: Code Text */}
                <div className={`px-4 whitespace-pre overflow-x-auto ${codeClass}`}>
                  {line.content}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
