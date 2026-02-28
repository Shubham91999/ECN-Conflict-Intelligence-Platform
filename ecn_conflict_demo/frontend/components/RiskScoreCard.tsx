import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  severity: "HIGH" | "MEDIUM" | "LOW";
  impactCount: number;
  conflictCount: number;
}

const config = {
  HIGH: {
    bg: "bg-red-950/60",
    border: "border-red-700",
    badge: "bg-red-900 text-red-300 border border-red-700",
    icon: <AlertTriangle className="w-8 h-8 text-red-400" />,
    label: "HIGH RISK",
    glow: "shadow-[0_0_30px_rgba(239,68,68,0.15)]",
  },
  MEDIUM: {
    bg: "bg-yellow-950/60",
    border: "border-yellow-700",
    badge: "bg-yellow-900 text-yellow-300 border border-yellow-700",
    icon: <AlertCircle className="w-8 h-8 text-yellow-400" />,
    label: "MEDIUM RISK",
    glow: "shadow-[0_0_30px_rgba(234,179,8,0.15)]",
  },
  LOW: {
    bg: "bg-green-950/60",
    border: "border-green-700",
    badge: "bg-green-900 text-green-300 border border-green-700",
    icon: <CheckCircle className="w-8 h-8 text-green-400" />,
    label: "LOW RISK",
    glow: "shadow-[0_0_30px_rgba(34,197,94,0.1)]",
  },
};

export default function RiskScoreCard({ severity, impactCount, conflictCount }: Props) {
  const c = config[severity];
  return (
    <div className={`rounded-xl border p-6 ${c.bg} ${c.border} ${c.glow}`}>
      <div className="flex items-center gap-4">
        {c.icon}
        <div>
          <span className={`text-xs font-mono font-semibold px-2 py-1 rounded ${c.badge}`}>
            {c.label}
          </span>
          <p className="text-3xl font-bold text-white mt-2">
            {impactCount}
            <span className="text-sm font-normal text-gray-400 ml-2">configurations affected</span>
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {conflictCount} conflict{conflictCount !== 1 ? "s" : ""} detected
          </p>
        </div>
      </div>
    </div>
  );
}
