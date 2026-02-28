const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ECNInput {
  title: string;
  description: string;
  effective_year: number;
}

export interface ConflictEvidence {
  rule_id: string | null;
  ecn_ref: string | null;
  artifact_link: string | null;
  violated_constraint: string;
}

export interface Conflict {
  rule_id: string | null;
  type: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  description: string;
  evidence: ConflictEvidence;
}

export interface GraphNode {
  id: string;
  data: { label: string; partType: string; status: string };
  position: { x: number; y: number };
  style: Record<string, string | number>;
  type: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  style: Record<string, string | number>;
  animated: boolean;
  data: { conflict: boolean };
}

export interface AnalysisResult {
  structured_change: {
    part_removed: string | null;
    part_added: string | null;
    program: string | null;
    model_year: string | null;
    change_type: string;
    options_affected: string[];
    constraints: string[];
  };
  conflicts: Conflict[];
  impact_count: number;
  severity: "HIGH" | "MEDIUM" | "LOW";
  rules_violated: number;
  historical_flags: number;
  cross_ecn_conflicts: number;
  explanation: string;
  remediation: string[];
  approval_status: "PENDING" | "CLEAR" | "FLAGGED" | "APPROVED" | "REJECTED";
  graph_data: { nodes: GraphNode[]; edges: GraphEdge[] };
}

export async function analyzeECN(input: ECNInput): Promise<AnalysisResult> {
  const res = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

export async function logDecision(
  ecnTitle: string,
  conflictIds: string[],
  decision: "FLAGGED" | "APPROVED" | "REJECTED",
  reviewerNote: string = ""
): Promise<void> {
  await fetch(`${API_URL}/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ecn_title: ecnTitle,
      conflict_ids: conflictIds,
      decision,
      reviewer_note: reviewerNote,
    }),
  });
}
