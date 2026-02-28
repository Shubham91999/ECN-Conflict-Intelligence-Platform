import { useState } from "react";
import { Flag, CheckCircle, XCircle, Clock } from "lucide-react";
import { logDecision } from "@/lib/api";

interface Props {
  ecnTitle: string;
  conflictIds: string[];
  initialStatus: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:  { label: "Pending Review",  color: "text-yellow-400", icon: <Clock className="w-4 h-4" /> },
  FLAGGED:  { label: "Flagged",         color: "text-orange-400", icon: <Flag className="w-4 h-4" /> },
  APPROVED: { label: "Approved",        color: "text-green-400",  icon: <CheckCircle className="w-4 h-4" /> },
  REJECTED: { label: "Rejected",        color: "text-red-400",    icon: <XCircle className="w-4 h-4" /> },
  CLEAR:    { label: "No Review Needed", color: "text-green-400", icon: <CheckCircle className="w-4 h-4" /> },
};

export default function ApprovalPanel({ ecnTitle, conflictIds, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const s = statusConfig[status] || statusConfig["PENDING"];

  async function handleDecision(decision: "FLAGGED" | "APPROVED" | "REJECTED") {
    setLoading(true);
    try {
      await logDecision(ecnTitle, conflictIds, decision, note);
      setStatus(decision);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Approval Workflow
        </h3>
        <div className={`flex items-center gap-1.5 text-xs font-mono ${s.color}`}>
          {s.icon}
          <span>{s.label}</span>
        </div>
      </div>

      {!submitted && status === "PENDING" && (
        <div className="space-y-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional reviewer note..."
            rows={2}
            className="w-full text-sm bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-[#58A6FF]"
          />
          <div className="flex gap-2">
            <button
              disabled={loading}
              onClick={() => handleDecision("FLAGGED")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-900/50 border border-orange-700 text-orange-300 text-sm font-medium hover:bg-orange-900/70 transition-colors disabled:opacity-50"
            >
              <Flag className="w-3.5 h-3.5" />
              Flag for Review
            </button>
            <button
              disabled={loading}
              onClick={() => handleDecision("APPROVED")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-900/50 border border-green-700 text-green-300 text-sm font-medium hover:bg-green-900/70 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Approve
            </button>
            <button
              disabled={loading}
              onClick={() => handleDecision("REJECTED")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-900/50 border border-red-700 text-red-300 text-sm font-medium hover:bg-red-900/70 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </button>
          </div>
        </div>
      )}

      {submitted && (
        <p className={`text-sm ${s.color}`}>
          Decision logged: <span className="font-mono font-semibold">{status}</span>
          {note && ` — "${note}"`}
        </p>
      )}
    </div>
  );
}
