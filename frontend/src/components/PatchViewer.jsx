import React from "react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";

export function PatchViewer({ patchDiff, affectedFile }) {
  if (!patchDiff) return null;

  const lines = patchDiff.split("\n");
  const oldLines = [];
  const newLines = [];

  for (const line of lines) {
    if (line.startsWith("---") || line.startsWith("+++") || line.startsWith("@@")) continue;
    if (line.startsWith("-")) {
      oldLines.push(line.slice(1));
    } else if (line.startsWith("+")) {
      newLines.push(line.slice(1));
    } else {
      oldLines.push(line);
      newLines.push(line);
    }
  }

  return (
    <div className="patch-viewer">
      <div className="patch-viewer-header">
        <span className="patch-viewer-filename">File: {affectedFile || "unknown"}</span>
      </div>
      <div className="patch-viewer-content">
        <ReactDiffViewer
          oldValue={oldLines.join("\n")}
          newValue={newLines.join("\n")}
          splitView={false}
          compareMethod={DiffMethod.LINES}
          useDarkTheme={true}
          hideLineNumbers={false}
          styles={{
            variables: {
              dark: {
                diffViewerBackground: "#0a0a0c",
                addedBackground: "rgba(16, 185, 129, 0.08)",
                removedBackground: "rgba(239, 68, 68, 0.08)",
                wordAddedBackground: "rgba(16, 185, 129, 0.25)",
                wordRemovedBackground: "rgba(239, 68, 68, 0.25)",
                addedGutterBackground: "rgba(16, 185, 129, 0.12)",
                removedGutterBackground: "rgba(239, 68, 68, 0.12)",
                codeFoldBackground: "#111115",
                emptyLineBackground: "#030303",
                gutterColor: "#5c5c6d",
                addedGutterColor: "#10b981",
                removedGutterColor: "#ef4444"
              },
            },
            codeFold: {
              fontFamily: "var(--font-mono)",
            },
            titleBlock: {
              fontFamily: "var(--font-mono)",
            }
          }}
        />
      </div>
    </div>
  );
}
