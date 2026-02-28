import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import type { Conflict } from "@/lib/api";

interface Props {
  conflict: Conflict;
  index: number;
}

const severityStyles = {
  HIGH:   "bg-red-900/50 text-red-300 border-red-700",
  MEDIUM: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  LOW:    "bg-green-900/50 text-green-300 border-green-700",
};

const typeLabels: Record<string, string> = {
  do_not_coexist:   "Do-Not-Coexist",
  freeze_window:    "Release Freeze",
  dependency_break: "Dependency Break",
  historical_flag:  "Historical Flag",
  cross_ecn_conflict: "Cross-ECN Conflict",
  cross_ecn_overlap:  "Cross-ECN Overlap",
};

export default function ConflictEvidenceCard({ conflict, index }: Props) {
  const [expanded, setExpanded] = useState(index === 0); // first card open by default

  const citation = conflict.evidence.rule_id || conflict.evidence.ecn_ref;
  const severityStyle = severityStyles[conflict.severity];

  return (
    <div className="rounded-lg border border-[#30363D] bg-[#161B22] overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#1C2128] transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
        )}

        {/* Severity badge */}
        <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${severityStyle} flex-shrink-0`}>
          {conflict.severity}
        </span>

        {/* Type label */}
        <span className="text-xs text-gray-400 flex-shrink-0">
          {typeLabels[conflict.type] || conflict.type}
        </span>

        {/* Citation chip */}
        {citation && (
          <span className="ml-auto text-xs font-mono bg-[#0D1117] border border-[#30363D] text-gray-300 px-2 py-0.5 rounded flex-shrink-0">
            [{citation}]
          </span>
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#30363D]">
          {/* Description */}
          <p className="text-sm text-gray-300 pt-3 leading-relaxed">{conflict.description}</p>

          {/* Violated constraint */}
          {conflict.evidence.violated_constraint && (
            <div className="rounded bg-[#0D1117] border border-[#30363D] p-3">
              <p className="text-xs text-gray-500 mb-1 font-mono">VIOLATED CONSTRAINT</p>
              <p className="text-xs font-mono text-amber-300 break-all">
                {conflict.evidence.violated_constraint}
              </p>
            </div>
          )}

          {/* Artifact link */}
          {conflict.evidence.artifact_link && (
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3 h-3 text-blue-400" />
              <span className="text-xs font-mono text-blue-400">
                {conflict.evidence.artifact_link}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
