import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { ArrowLeft, Code2 } from "lucide-react";

import ECNInputForm from "@/components/ECNInputForm";
import RiskScoreCard from "@/components/RiskScoreCard";
import ImpactSummary from "@/components/ImpactSummary";
import ConflictEvidenceCard from "@/components/ConflictEvidenceCard";
import ExplanationPanel from "@/components/ExplanationPanel";
import RemediationPanel from "@/components/RemediationPanel";
import ApprovalPanel from "@/components/ApprovalPanel";

import { analyzeECN, type AnalysisResult } from "@/lib/api";

// DependencyGraph uses ReactFlow which needs client-side rendering
const DependencyGraph = dynamic(() => import("@/components/DependencyGraph"), {
  ssr: false,
  loading: () => (
    <div className="h-80 rounded-xl border border-[#30363D] bg-[#0D1117] flex items-center justify-center text-gray-500 text-sm">
      Loading graph...
    </div>
  ),
});

type Stage = "idle" | "loading" | "done" | "error";

export default function AnalyzePage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>("");
  const [ecnTitle, setEcnTitle] = useState("");

  async function handleSubmit(title: string, description: string, effectiveYear: number) {
    setStage("loading");
    setError("");
    setEcnTitle(title);
    try {
      const data = await analyzeECN({ title, description, effective_year: effectiveYear });
      setResult(data);
      setStage("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unexpected error");
      setStage("error");
    }
  }

  const conflictIds = result?.conflicts
    .map((c) => c.evidence.rule_id || c.evidence.ecn_ref || c.type)
    .filter(Boolean) as string[] ?? [];

  return (
    <>
      <Head>
        <title>Analyze ECN — ECN Conflict Intelligence</title>
      </Head>

      <div className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
        {/* Nav */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <span className="text-gray-700">/</span>
          <span className="text-sm text-gray-400">ECN Analysis</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8">
          {/* Left: Input panel */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-5">
              <h2 className="text-sm font-semibold text-gray-200 mb-4">Submit ECN for Analysis</h2>
              <ECNInputForm onSubmit={handleSubmit} loading={stage === "loading"} />
            </div>

            {/* Structured extraction preview */}
            {result && (
              <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Code2 className="w-4 h-4 text-green-400" />
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Extracted Structure
                  </h3>
                </div>
                <pre className="text-xs font-mono text-green-300 bg-[#0D1117] rounded-lg p-3 overflow-x-auto">
                  {JSON.stringify(result.structured_change, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Right: Results */}
          <div className="space-y-5">
            {stage === "loading" && (
              <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-500">
                <div className="w-8 h-8 border-2 border-[#30363D] border-t-blue-500 rounded-full animate-spin" />
                <div className="text-sm space-y-1 text-center">
                  <p>Extracting ECN intent via Groq...</p>
                  <p className="text-xs text-gray-600">Running rule engine and cross-ECN checks</p>
                </div>
              </div>
            )}

            {stage === "error" && (
              <div className="rounded-xl border border-red-800 bg-red-950/30 p-5 text-red-300 text-sm">
                <p className="font-semibold mb-1">Analysis failed</p>
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {stage === "done" && result && (
              <>
                {/* Risk score */}
                <RiskScoreCard
                  severity={result.severity}
                  impactCount={result.impact_count}
                  conflictCount={result.conflicts.length}
                />

                {/* Impact summary stats */}
                <ImpactSummary
                  configurationsAffected={result.impact_count}
                  rulesViolated={result.rules_violated}
                  historicalFlags={result.historical_flags}
                  crossEcnConflicts={result.cross_ecn_conflicts}
                />

                {/* Dependency graph */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Dependency Graph
                  </h3>
                  <DependencyGraph
                    nodes={result.graph_data.nodes}
                    edges={result.graph_data.edges}
                  />
                </div>

                {/* Conflict evidence cards */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Conflict Evidence ({result.conflicts.length})
                  </h3>
                  <div className="space-y-2">
                    {result.conflicts.map((c, i) => (
                      <ConflictEvidenceCard key={i} conflict={c} index={i} />
                    ))}
                  </div>
                </div>

                {/* AI Explanation */}
                <ExplanationPanel explanation={result.explanation} />

                {/* Remediation */}
                <RemediationPanel remediation={result.remediation} />

                {/* Approval workflow (only for HIGH/MEDIUM) */}
                {result.severity !== "LOW" && (
                  <ApprovalPanel
                    ecnTitle={ecnTitle}
                    conflictIds={conflictIds}
                    initialStatus={result.approval_status}
                  />
                )}
              </>
            )}

            {stage === "idle" && (
              <div className="flex items-center justify-center h-64 text-gray-600 text-sm">
                Submit an ECN to see conflict analysis
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
