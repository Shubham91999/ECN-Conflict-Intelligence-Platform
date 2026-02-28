import { useEffect, useState } from "react";
import { BrainCircuit } from "lucide-react";

interface Props {
  explanation: string;
}

export default function ExplanationPanel({ explanation }: Props) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < explanation.length) {
        setDisplayed(explanation.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, 12); // ~83 chars/sec — fast enough to not be annoying
    return () => clearInterval(interval);
  }, [explanation]);

  return (
    <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-5">
      <div className="flex items-center gap-2 mb-3">
        <BrainCircuit className="w-4 h-4 text-blue-400" />
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          AI Explanation
        </h3>
      </div>
      <p className="text-sm text-gray-200 leading-relaxed">
        {displayed}
        {!done && <span className="typewriter-cursor" />}
      </p>
    </div>
  );
}
