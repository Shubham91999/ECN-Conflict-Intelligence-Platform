import json
from pathlib import Path
import networkx as nx

DATA_DIR = Path(__file__).parent.parent / "synthetic_data"

# Node status → visual style mapping for React Flow
STATUS_STYLES = {
    "removed":   {"background": "#374151", "color": "#9CA3AF", "border": "2px dashed #6B7280"},
    "added":     {"background": "#1E3A5F", "color": "#93C5FD", "border": "2px solid #3B82F6"},
    "conflict":  {"background": "#7F1D1D", "color": "#FCA5A5", "border": "2px solid #EF4444"},
    "affected":  {"background": "#78350F", "color": "#FCD34D", "border": "2px solid #F59E0B"},
    "ok":        {"background": "#1F2937", "color": "#D1D5DB", "border": "1px solid #374151"},
}

EDGE_STYLES = {
    "conflict":  {"stroke": "#EF4444", "strokeWidth": 2, "animated": True},
    "normal":    {"stroke": "#4B5563", "strokeWidth": 1},
}


def _load(filename: str):
    with open(DATA_DIR / filename) as f:
        return json.load(f)


def build_full_graph() -> nx.DiGraph:
    """Build the full dependency graph from synthetic data (called once at startup)."""
    G = nx.DiGraph()

    parts = _load("parts.json")
    assemblies = _load("assemblies.json")
    rules = _load("rules.json")

    # Add part nodes
    for p in parts:
        G.add_node(p["id"], label=p["name"], node_type="part", part_type=p["type"])

    # Add assembly-derived edges
    for asm in assemblies:
        for edge in asm.get("edges", []):
            G.add_edge(
                edge["from"], edge["to"],
                edge_type=edge["type"],
                assembly=asm["id"]
            )

    # Add explicit dependency edges from rules
    for rule in rules:
        if rule["type"] == "dependency":
            G.add_edge(rule["part"], rule["requires"], edge_type="requires", rule_id=rule["id"])
        elif rule["type"] == "do_not_coexist":
            parts_list = rule.get("parts", [])
            if len(parts_list) == 2:
                G.add_edge(
                    parts_list[0], parts_list[1],
                    edge_type="conflicts_with",
                    rule_id=rule["id"]
                )

    return G


# Module-level graph — built once on import
_GRAPH: nx.DiGraph | None = None


def get_graph() -> nx.DiGraph:
    global _GRAPH
    if _GRAPH is None:
        _GRAPH = build_full_graph()
    return _GRAPH


def build_graph_data(structured_change: dict, aggregated: dict) -> dict:
    """
    Extract the relevant subgraph for the ECN and return React Flow nodes + edges.
    """
    G = get_graph()
    part_added = structured_change.get("part_added")
    part_removed = structured_change.get("part_removed")
    program = structured_change.get("program")

    conflicts = aggregated.get("conflicts", [])

    # Identify conflict part IDs mentioned in evidence
    conflict_parts: set[str] = set()
    for c in conflicts:
        constraint = c["evidence"].get("violated_constraint", "")
        for node in G.nodes():
            if node in constraint:
                conflict_parts.add(node)

    # Collect relevant nodes: directly involved + their immediate neighbors
    focal_nodes: set[str] = set()
    for seed in [part_added, part_removed]:
        if seed and seed in G:
            focal_nodes.add(seed)
            focal_nodes.update(G.predecessors(seed))
            focal_nodes.update(G.successors(seed))
    focal_nodes.update(conflict_parts)

    # Filter to nodes that exist in graph
    focal_nodes = {n for n in focal_nodes if n in G}

    if not focal_nodes:
        return {"nodes": [], "edges": []}

    # Assign status to each node
    def node_status(node_id: str) -> str:
        if node_id == part_removed:
            return "removed"
        if node_id == part_added:
            return "conflict" if node_id in conflict_parts else "added"
        if node_id in conflict_parts:
            return "conflict"
        return "affected" if node_id != part_removed else "ok"

    # Build React Flow nodes with a simple grid layout
    rf_nodes = []
    positions = _compute_positions(focal_nodes, part_added, part_removed, G)

    for node_id in focal_nodes:
        status = node_status(node_id)
        style = STATUS_STYLES.get(status, STATUS_STYLES["ok"])
        label = G.nodes[node_id].get("label", node_id)
        part_type = G.nodes[node_id].get("part_type", "component")
        rf_nodes.append({
            "id": node_id,
            "data": {
                "label": f"{node_id}\n{label}",
                "partType": part_type,
                "status": status,
            },
            "position": positions.get(node_id, {"x": 0, "y": 0}),
            "style": style,
            "type": "default",
        })

    # Build React Flow edges for the subgraph
    conflict_edge_keys: set[tuple] = set()
    for c in conflicts:
        constraint = c["evidence"].get("violated_constraint", "")
        for u, v in G.edges():
            if u in constraint and v in constraint:
                conflict_edge_keys.add((u, v))

    rf_edges = []
    subgraph = G.subgraph(focal_nodes)
    for u, v, data in subgraph.edges(data=True):
        is_conflict = (u, v) in conflict_edge_keys or data.get("edge_type") == "conflicts_with"
        edge_style = EDGE_STYLES["conflict"] if is_conflict else EDGE_STYLES["normal"]
        edge_type = data.get("edge_type", "related")
        rf_edges.append({
            "id": f"{u}-{v}",
            "source": u,
            "target": v,
            "label": edge_type.replace("_", " "),
            "style": edge_style,
            "animated": is_conflict,
            "data": {"conflict": is_conflict},
        })

    return {"nodes": rf_nodes, "edges": rf_edges}


def _compute_positions(
    nodes: set[str],
    part_added: str | None,
    part_removed: str | None,
    G: nx.DiGraph,
) -> dict[str, dict]:
    """Simple left-to-right layered layout."""
    positions: dict[str, dict] = {}
    x_gap, y_gap = 220, 120

    # Layer 0: added/removed parts
    # Layer 1: their direct neighbors
    # Layer 2: further neighbors
    layers: list[list[str]] = [[], [], []]
    placed: set[str] = set()

    for seed, layer_idx in [(part_added, 0), (part_removed, 0)]:
        if seed and seed in nodes:
            layers[0].append(seed)
            placed.add(seed)

    for node in nodes:
        if node in placed:
            continue
        preds = set(G.predecessors(node)) & nodes
        succs = set(G.successors(node)) & nodes
        if preds & placed or succs & placed:
            layers[1].append(node)
            placed.add(node)

    for node in nodes:
        if node not in placed:
            layers[2].append(node)

    for layer_idx, layer_nodes in enumerate(layers):
        for row_idx, node_id in enumerate(layer_nodes):
            positions[node_id] = {
                "x": layer_idx * x_gap,
                "y": row_idx * y_gap - (len(layer_nodes) * y_gap) / 2,
            }

    return positions
