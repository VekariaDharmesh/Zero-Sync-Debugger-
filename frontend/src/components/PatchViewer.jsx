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
    <div className="flex flex-col gap-3 w-full bg-[#0a0a0c] rounded-2xl border border-white/5 overflow-hidden">
      {/* Header separated cleanly with flex flex-row/col */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/5">
        <span className="text-xs font-bold text-slate-300 font-mono">File: {affectedFile || "unknown"}</span>
        <span className="text-[10px] bg-primary-soft text-primary px-2 py-0.5 rounded border border-primary/20 font-bold uppercase tracking-wider">
          Surgical unified Diff
        </span>
      </div>

      {/* Code diff block with a custom structured table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full border-collapse font-mono text-xs text-left">
          <tbody>
            {parsedLines.map((line, idx) => {
              if (line.type === "hunk") {
                return (
                  <tr key={idx} className="bg-primary/5 border-y border-white/5 text-primary/70 select-none">
                    <td className="py-2.5 px-4 font-bold text-center" colSpan={4}>
                      {line.content}
                    </td>
                  </tr>
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
                <tr key={idx} className={`${rowClass} transition-colors border-none`}>
                  {/* Column 1: Old Line Number */}
                  <td className="w-12 py-1 px-3 text-right text-slate-500 select-none border-r border-white/5 font-mono">
                    {line.oldLine}
                  </td>
                  {/* Column 2: New Line Number */}
                  <td className="w-12 py-1 px-3 text-right text-slate-500 select-none border-r border-white/5 font-mono">
                    {line.newLine}
                  </td>
                  {/* Column 3: Diff Operator */}
                  <td className={`w-8 py-1 px-2 text-center select-none font-bold ${signClass}`}>
                    {line.sign}
                  </td>
                  {/* Column 4: Code Text */}
                  <td className={`py-1 px-4 whitespace-pre break-all ${codeClass}`}>
                    {line.content}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
