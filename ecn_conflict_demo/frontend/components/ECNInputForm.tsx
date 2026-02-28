import { useState } from "react";
import { Zap, ChevronDown } from "lucide-react";

interface Scenario {
  label: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  effective_year: number;
}

const SCENARIOS: Scenario[] = [
  {
    label: "Fuel Injector Substitution — EP-V8 (HIGH)",
    severity: "HIGH",
    title: "Fuel Injector Substitution — EP-V8 Program",
    description:
      "Replace current production fuel injector FI-2024 with next-generation FI-2027 across all EP-V8 engine configurations. FI-2027 offers improved atomization efficiency (+12%) and reduced NOx emissions. Change required by Tier-1 supplier transition effective Q2 2025.",
    effective_year: 2025,
  },
  {
    label: "ECU Module Upgrade — EP-V8 MY2024 (HIGH)",
    severity: "HIGH",
    title: "ECU Module Upgrade — EP-V8 MY2024 Production",
    description:
      "Replace ECU Module EC-501 with next-generation EC-505 across all EP-V8 MY2024 configurations. EC-505 provides enhanced OBD-III diagnostics, expanded calibration memory, and 15% faster processing speed. Change is driven by EC-501 end-of-life supplier notification received Q3 2023.",
    effective_year: 2024,
  },
  {
    label: "Exhaust Manifold Swap — EP-V6 MY2025 (MEDIUM)",
    severity: "MEDIUM",
    title: "Exhaust Manifold Weight Reduction — EP-V6 Program",
    description:
      "Replace standard exhaust manifold EX-202 with lightweight aluminum variant EX-203 Lite in EP-V6 engine program for MY2025. EX-203 provides a 1.4 kg weight saving per unit and is intended to improve fuel economy rating by approximately 0.3 mpg. Change proposed by the Weight Reduction Task Force under program WR-2024.",
    effective_year: 2025,
  },
  {
    label: "Sensor Cluster Replacement — EP-I4 MY2025 (MEDIUM)",
    severity: "MEDIUM",
    title: "Sensor Cluster Gen2 Integration — EP-I4 Hybrid Program",
    description:
      "Replace current sensor cluster SC-012 with next-generation SC-015 Gen2 across all EP-I4 MY2025 hybrid configurations. SC-015 provides enhanced lambda sensing accuracy (±0.5% vs ±1.2%) and integrated knock detection, eliminating the need for a separate knock sensor module. Cost saving of $4.20 per vehicle unit.",
    effective_year: 2025,
  },
  {
    label: "Sport Throttle Body Addition — EP-V6 MY2025 (LOW)",
    severity: "LOW",
    title: "Sport Throttle Body TH-305 — EP-V6 High Performance Option",
    description:
      "Add Sport Throttle Body TH-305 as a standard component for the EP-V6 High Performance (OPT-HP) configuration for MY2025. TH-305 features a 62mm bore (vs 56mm on TH-301) and a revised throttle response curve tuned for performance driving. Part is supplier-qualified and has completed all required EP-V6 bench validation.",
    effective_year: 2025,
  },
];

const SEVERITY_COLORS = {
  HIGH:   "text-red-400 bg-red-950/40 border-red-800",
  MEDIUM: "text-yellow-400 bg-yellow-950/40 border-yellow-800",
  LOW:    "text-green-400 bg-green-950/40 border-green-800",
};

interface Props {
  onSubmit: (title: string, description: string, effectiveYear: number) => void;
  loading: boolean;
}

export default function ECNInputForm({ onSubmit, loading }: Props) {
  const [title, setTitle] = useState(SCENARIOS[0].title);
  const [description, setDescription] = useState(SCENARIOS[0].description);
  const [year, setYear] = useState(SCENARIOS[0].effective_year);
  const [selectedScenario, setSelectedScenario] = useState(0);

  function loadScenario(index: number) {
    const s = SCENARIOS[index];
    setSelectedScenario(index);
    setTitle(s.title);
    setDescription(s.description);
    setYear(s.effective_year);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onSubmit(title, description, year);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Scenario picker */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Demo Scenarios
        </label>
        <div className="space-y-1.5">
          {SCENARIOS.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => loadScenario(i)}
              className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors flex items-center justify-between gap-2 ${
                selectedScenario === i
                  ? "border-blue-700 bg-blue-950/40 text-blue-300"
                  : "border-[#30363D] bg-[#0D1117] text-gray-400 hover:bg-[#1C2128]"
              }`}
            >
              <span className="truncate">{s.label.split(" (")[0]}</span>
              <span className={`flex-shrink-0 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${SEVERITY_COLORS[s.severity]}`}>
                {s.severity}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[#30363D] pt-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            ECN Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Fuel Injector Substitution — EP-V8 Program"
            className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#58A6FF] transition-colors"
          />
        </div>

        <div className="mt-3">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe the engineering change in detail..."
            className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#58A6FF] transition-colors resize-none"
          />
        </div>

        <div className="mt-3">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Effective Model Year
          </label>
          <div className="relative w-40">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full appearance-none bg-[#0D1117] border border-[#30363D] rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-[#58A6FF] transition-colors"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        <div className="flex gap-3 pt-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Analyze ECN
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
