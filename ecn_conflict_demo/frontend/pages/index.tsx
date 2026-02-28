import Head from "next/head";
import Link from "next/link";
import { Zap, GitBranch, ShieldAlert, BrainCircuit } from "lucide-react";

export default function Landing() {
  return (
    <>
      <Head>
        <title>ECN Conflict Intelligence Platform</title>
      </Head>

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 bg-blue-950/40 border border-blue-800 rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            AI-Powered Engineering Change Intelligence
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            ECN Conflict<br />
            <span className="text-blue-400">Intelligence Platform</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Detect engineering change conflicts before approval. Powered by LLM-based intent extraction,
            deterministic rule engines, and cross-ECN consistency scanning.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full mb-10">
          {[
            {
              icon: <BrainCircuit className="w-5 h-5 text-blue-400" />,
              title: "Intent Extraction",
              desc: "LLM parses ECN free text into structured part IDs, program scope, and constraints",
            },
            {
              icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
              title: "Rule Engine",
              desc: "Deterministic checks against do-not-coexist matrices, freeze windows, and BOM dependencies",
            },
            {
              icon: <GitBranch className="w-5 h-5 text-purple-400" />,
              title: "Cross-ECN Scanner",
              desc: "Detects outcome conflicts with prior approved ECNs and missing rollback steps",
            },
            {
              icon: <Zap className="w-5 h-5 text-yellow-400" />,
              title: "Evidence-Backed",
              desc: "Every flag includes rule ID, ECN reference, artifact link, and plain-language explanation",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-[#30363D] bg-[#161B22] p-4 flex gap-3"
            >
              <div className="mt-0.5 flex-shrink-0">{f.icon}</div>
              <div>
                <p className="text-sm font-semibold text-gray-200">{f.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/analyze"
          className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-base transition-colors"
        >
          <Zap className="w-5 h-5" />
          Analyze an ECN
        </Link>
      </div>
    </>
  );
}
