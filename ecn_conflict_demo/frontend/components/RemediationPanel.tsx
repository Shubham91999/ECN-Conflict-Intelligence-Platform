import { Wrench, Minimize2, RefreshCw } from "lucide-react";

interface Props {
  remediation: string[];
}

const icons = [
  <Wrench key="0" className="w-5 h-5 text-blue-400" />,
  <Minimize2 key="1" className="w-5 h-5 text-yellow-400" />,
  <RefreshCw key="2" className="w-5 h-5 text-purple-400" />,
];

const labels = ["Replacement Path", "Scope Restriction", "Rule / Process Update"];

export default function RemediationPanel({ remediation }: Props) {
  return (
    <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Suggested Remediation
      </h3>
      <div className="space-y-3">
        {remediation.slice(0, 3).map((action, i) => (
          <div
            key={i}
            className="flex gap-3 rounded-lg bg-[#0D1117] border border-[#30363D] p-4"
          >
            <div className="flex-shrink-0 mt-0.5">{icons[i] || icons[0]}</div>
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">{labels[i] || `Action ${i + 1}`}</p>
              <p className="text-sm text-gray-200 leading-relaxed">{action}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
