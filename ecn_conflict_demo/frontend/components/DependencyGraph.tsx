"use client";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import type { GraphNode, GraphEdge } from "@/lib/api";

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export default function DependencyGraph({ nodes, edges }: Props) {
  const rfNodes: Node[] = nodes.map((n) => ({
    id: n.id,
    data: n.data,
    position: n.position,
    style: {
      ...n.style,
      fontSize: "11px",
      fontFamily: "'JetBrains Mono', monospace",
      borderRadius: "6px",
      padding: "8px 12px",
      minWidth: "140px",
      textAlign: "center" as const,
      whiteSpace: "pre-line" as const,
      ...(n.data.status === "conflict" ? { animation: "pulse-red 2s ease-in-out infinite" } : {}),
    },
    type: n.type,
  }));

  const rfEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    style: e.style,
    animated: e.animated,
    labelStyle: {
      fontSize: "9px",
      fill: e.data?.conflict ? "#F85149" : "#7D8590",
      fontFamily: "monospace",
    },
    labelBgStyle: {
      fill: "#0D1117",
      fillOpacity: 0.8,
    },
  }));

  if (rfNodes.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
        No graph data available
      </div>
    );
  }

  return (
    <div className="h-80 rounded-xl border border-[#30363D] bg-[#0D1117] overflow-hidden">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#30363D" gap={24} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => {
            const status = (n.data as { status?: string })?.status;
            if (status === "conflict") return "#F85149";
            if (status === "removed") return "#6B7280";
            if (status === "added") return "#3B82F6";
            if (status === "affected") return "#F59E0B";
            return "#4B5563";
          }}
          maskColor="rgba(13,17,23,0.8)"
        />
      </ReactFlow>
    </div>
  );
}
