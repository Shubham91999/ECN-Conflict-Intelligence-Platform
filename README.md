# ECN Conflict Intelligence Platform

A full-stack AI-assisted platform that detects engineering conflicts in Engineering Change Notices (ECNs) before they reach approval, reducing costly late-stage rework in automotive product programs.

---

## Overview

Engineering Change Notices are a critical part of the automotive product lifecycle. A single unvalidated part substitution can violate supplier agreements, break freeze windows, conflict with prior approvals, or introduce downstream assembly failures. This platform automates that conflict detection by combining a deterministic rule engine with an LLM-powered explanation layer, giving engineering teams and program managers a clear, evidence-backed risk assessment before any change is committed.

---

## Key Capabilities

**ECN Intent Extraction** — The free-text ECN description is parsed by Groq's `llama3-70b-8192` model into a structured change object (part removed, part added, program, model year), eliminating manual data entry errors.

**Deterministic Conflict Detection** — A rule engine checks the structured change against four conflict types (do-not-coexist, freeze window, dependency, historical flag), producing traceable violations with rule IDs and artifact links.

**Outcome-Aware Cross-ECN Checking** — Prior approved ECNs are scanned for incompatible outcomes (e.g., a part designated sole-source being silently removed), surfacing rollback requirements that would otherwise be missed.

**BOM-Derived Impact Count** — The platform traverses a real Bill of Materials config matrix to count the exact number of vehicle configurations affected, replacing guesswork with data.

**Dependency Graph Visualization** — A React Flow graph renders the affected parts and their relationships, with conflict edges highlighted in red so the scope of a change is immediately visible.

**AI-Generated Remediation** — Groq generates three specific, actionable remediation paths tailored to the actual conflicts detected, giving engineers a clear starting point for resolution.

**Approval Workflow** — HIGH-severity changes surface a Flag for Review control that logs decisions (Flagged, Approved, Rejected) with reviewer notes, creating a lightweight audit trail.

---

## Architecture

```
Frontend (Next.js + React Flow)
        |
        | POST /analyze
        v
Backend (FastAPI)
   |
   |-- parser.py              Groq API: free-text ECN -> structured JSON
   |-- rule_engine.py         Deterministic checks vs. rules.json
   |-- cross_ecn_checker.py   Outcome-aware checks vs. ecn_history.json
   |-- conflict_aggregator.py Merge conflicts, compute severity + impact_count
   |-- graph_builder.py       networkx graph -> React Flow nodes/edges
   |-- explanation_generator.py  Groq API: conflicts -> explanation + remediation
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, Tailwind CSS, React Flow, lucide-react |
| Backend | FastAPI, Python 3.12, uvicorn |
| LLM | Groq API (llama3-70b-8192) |
| Graph | networkx (server), React Flow (client) |
| Data | JSON synthetic data (parts, BOM, rules, ECN history) |
| Deployment | Vercel (frontend), Render (backend) |

---

## Demo Scenarios

Five pre-loaded scenarios demonstrate the full range of conflict types:

| Scenario | Program | Severity | Conflicts Triggered |
|----------|---------|----------|-------------------|
| Fuel Injector Substitution | EP-V8 | HIGH | Do-not-coexist, freeze window, dependency, historical flag, cross-ECN sole-source conflict |
| ECU Module Upgrade | EP-V8 MY2024 | HIGH | Production freeze (post-Job-1), wiring harness incompatibility, sole-source cross-ECN conflict |
| Exhaust Manifold Swap | EP-V6 MY2025 | MEDIUM | Dimensional incompatibility with V6 cylinder block, thermal durability flag |
| Sensor Cluster Replacement | EP-I4 MY2025 | MEDIUM | RF interference with throttle body, cold-start calibration drift flag, cold-start baseline conflict |
| Sport Throttle Body Addition | EP-V6 MY2025 | LOW | No conflicts (clean change, demonstrates passing analysis) |

---

## Local Development

### Prerequisites

- Python 3.12+
- Node.js 18+
- Groq API key from [console.groq.com](https://console.groq.com)

### Backend

```bash
cd ecn_conflict_demo/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
echo "GROQ_API_KEY=your_key_here" > .env
uvicorn main:app --reload --port 8000
```

Health check: `http://localhost:8000/health`

### Frontend

```bash
cd ecn_conflict_demo/frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

App runs at: `http://localhost:3000`

---

## API Reference

### POST /analyze

Accepts an ECN and returns a full conflict analysis.

**Request:**
```json
{
  "title": "Fuel Injector Substitution -- EP-V8 Program",
  "description": "Replace FI-2024 with FI-2027 across all EP-V8 configurations...",
  "effective_year": 2025
}
```

**Response:**
```json
{
  "structured_change": { "part_removed": "FI-2024", "part_added": "FI-2027", "program": "EP-V8", "model_year": "MY2025" },
  "conflicts": [ { "rule_id": "R-001", "type": "do_not_coexist", "severity": "HIGH", "evidence": { ... } } ],
  "impact_count": 10,
  "severity": "HIGH",
  "explanation": "...",
  "remediation": ["...", "...", "..."],
  "approval_status": "PENDING",
  "graph_data": { "nodes": [...], "edges": [...] }
}
```

### POST /decision

Logs a reviewer decision against a HIGH-severity ECN analysis.

### GET /decisions

Returns the full decision log for audit purposes.

---

## Deployment

### Backend (Render)

1. Create a new Web Service on [render.com](https://render.com) connected to this repository.
2. Set Build Command: `cd ecn_conflict_demo/backend && pip install -r requirements.txt`
3. Set Start Command: `cd ecn_conflict_demo/backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variable: `GROQ_API_KEY`

### Frontend (Vercel)

1. Import the repository on [vercel.com](https://vercel.com).
2. Set Root Directory to `ecn_conflict_demo/frontend` and Framework Preset to Next.js.
3. Add environment variable: `NEXT_PUBLIC_API_URL` pointing to the Render backend URL.

---

## Project Structure

```
ecn_conflict_demo/
├── backend/
│   ├── main.py                        # FastAPI app, CORS, /analyze, /decision, /decisions
│   ├── engine/
│   │   ├── parser.py                  # Groq: free-text -> structured change JSON
│   │   ├── rule_engine.py             # Deterministic rule checks
│   │   ├── cross_ecn_checker.py       # Outcome-aware prior ECN conflict detection
│   │   ├── conflict_aggregator.py     # Merge, deduplicate, compute severity + impact
│   │   ├── graph_builder.py           # networkx -> React Flow graph data
│   │   └── explanation_generator.py  # Groq: conflicts -> explanation + remediation
│   └── synthetic_data/
│       ├── parts.json                 # 26 parts across EP-V8, EP-V6, EP-I4
│       ├── bom.json                   # Config matrix: (program, model_year, option) -> parts
│       ├── rules.json                 # 10 rules: do_not_coexist, freeze_window, dependency, historical_flag
│       └── ecn_history.json          # 5 prior ECNs with outcomes and rollback requirements
└── frontend/
    ├── pages/
    │   ├── index.tsx                  # Landing page
    │   └── analyze.tsx                # Main analysis dashboard
    └── components/
        ├── ECNInputForm.tsx           # Scenario picker + free-text input
        ├── RiskScoreCard.tsx          # Severity badge + impact count
        ├── ImpactSummary.tsx          # 4-stat grid
        ├── DependencyGraph.tsx        # React Flow visualization
        ├── ConflictEvidenceCard.tsx   # Per-conflict expandable card with citations
        ├── ExplanationPanel.tsx       # AI-generated explanation with typewriter animation
        ├── RemediationPanel.tsx       # 3 AI-generated remediation action cards
        └── ApprovalPanel.tsx          # Flag/Approve/Reject workflow
```
