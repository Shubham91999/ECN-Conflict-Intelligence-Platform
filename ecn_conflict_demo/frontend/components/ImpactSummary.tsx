import { GitBranch, ShieldAlert, Clock, History } from "lucide-react";

interface Props {
  configurationsAffected: number;
  rulesViolated: number;
  historicalFlags: number;
  crossEcnConflicts: number;
}

export default function ImpactSummary({
  configurationsAffected,
  rulesViolated,
  historicalFlags,
  crossEcnConflicts,
}: Props) {
  const stats = [
    {
      label: "Configurations Affected",
      value: configurationsAffected,
      icon: <GitBranch className="w-5 h-5 text-blue-400" />,
      color: "text-blue-400",
    },
    {
      label: "Rules Violated",
      value: rulesViolated,
      icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
      color: "text-red-400",
    },
    {
      label: "Historical Flags",
      value: historicalFlags,
      icon: <History className="w-5 h-5 text-yellow-400" />,
      color: "text-yellow-400",
    },
    {
      label: "Cross-ECN Conflicts",
      value: crossEcnConflicts,
      icon: <Clock className="w-5 h-5 text-purple-400" />,
      color: "text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-lg border border-[#30363D] bg-[#161B22] p-4 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {s.icon}
            <span>{s.label}</span>
          </div>
          <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}
