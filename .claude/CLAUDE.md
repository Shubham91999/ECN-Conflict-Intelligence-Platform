# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The **ECN Conflict Intelligence Platform** is a demo-ready full-stack web app for AI-assisted Engineering Change Notice (ECN) conflict detection in an automotive context. It accepts ECN free text, extracts structured intent via Groq LLM, runs deterministic rule checks, scans for cross-ECN conflicts, and displays results with evidence-backed explanations and an interactive dependency graph.

## Development Commands

### Backend
```bash
cd ecn_conflict_demo/backend
cp .env.example .env          # add GROQ_API_KEY
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd ecn_conflict_demo/frontend
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev                        # http://localhost:3000
```

Start backend first, then frontend in a second terminal.

---

## Architecture

```
Frontend (Next.js/React/Tailwind)
    └── POST /analyze  ──→  Backend (FastAPI)
                                ├── parser.py            ← Groq API: free text → structured JSON
                                ├── rule_engine.py       ← deterministic checks vs. rules.json
                                ├── cross_ecn_checker.py ← outcome-aware vs. ecn_history.json
                                ├── conflict_aggregator.py
                                ├── graph_builder.py     ← networkx → React Flow graph_data
                                └── explanation_generator.py  ← Groq API: explanation + remediation
```

### Key API Endpoints

- `POST /analyze` — main pipeline; returns conflicts, severity, impact_count, graph_data, explanation, remediation
- `POST /decision` — log approval decision (FLAGGED / APPROVED / REJECTED) to `decisions.json`
- `GET /decisions` — return decision audit log

### Conflict Types

| Type | Source | Severity |
|---|---|---|
| `do_not_coexist` | rules.json | HIGH |
| `freeze_window` | rules.json + engine_programs.json | HIGH |
| `dependency_break` | rules.json + bom.json | MEDIUM |
| `historical_flag` | rules.json | MEDIUM |
| `cross_ecn_conflict` | ecn_history.json outcome comparison | HIGH/MEDIUM |
| `cross_ecn_overlap` | ecn_history.json spec overlap | LOW |

### Dependency Graph (Hybrid)

`graph_builder.py` loads all synthetic data into a `networkx.DiGraph` at startup. On each `/analyze` call, it extracts the relevant subgraph (involved parts + 1-hop neighbors), annotates nodes/edges with conflict status, and serializes to React Flow `{ nodes, edges }` format. The rule engine stays as flat JSON lookups — the graph is only used for visualization.

---

## Tech Stack

**Backend:** Python, FastAPI, Groq API (`llama3-70b-8192`), networkx, python-dotenv

**Frontend:** Next.js 14, React, Tailwind CSS, ReactFlow (`reactflow`), lucide-react

**Deployment:** Vercel (frontend) + Railway or Render (backend); env vars: `GROQ_API_KEY` (backend), `NEXT_PUBLIC_API_URL` (frontend)

---

## Project Structure

```
ecn_conflict_demo/
├── backend/
│   ├── main.py                        # FastAPI app + all endpoints
│   ├── engine/
│   │   ├── parser.py                  # Groq: ECN text → structured JSON
│   │   ├── rule_engine.py             # 4 rule type checks
│   │   ├── cross_ecn_checker.py       # Outcome-aware cross-ECN detection
│   │   ├── conflict_aggregator.py     # Merge, deduplicate, BOM-based impact_count
│   │   ├── graph_builder.py           # networkx → React Flow graph_data
│   │   └── explanation_generator.py  # Groq: explanation + 3 remediation actions
│   ├── synthetic_data/
│   │   ├── parts.json                 # 20 parts with program membership
│   │   ├── assemblies.json            # 10 assemblies with edge relationships
│   │   ├── bom.json                   # Config matrix: (program, model_year, option) → parts[]
│   │   ├── rules.json                 # 4 rules (R-001–R-004) with artifact_link
│   │   ├── ecn_history.json           # Prior ECNs with outcome + requires_rollback_if_reversed
│   │   ├── engine_programs.json       # EP-V8, EP-V6, EP-I4 with freeze_dates
│   │   └── options.json               # 5 option codes
│   └── requirements.txt
└── frontend/
    ├── pages/
    │   ├── index.tsx                  # Landing page
    │   └── analyze.tsx                # Input form + full results dashboard
    ├── components/
    │   ├── ECNInputForm.tsx           # Title, description, year dropdown; pre-fills demo scenario
    │   ├── RiskScoreCard.tsx          # HIGH/MEDIUM/LOW badge + impact count
    │   ├── ImpactSummary.tsx          # 4-stat grid
    │   ├── DependencyGraph.tsx        # ReactFlow (dynamic import, SSR disabled)
    │   ├── ConflictEvidenceCard.tsx   # Expandable per-conflict card with citation chips
    │   ├── ExplanationPanel.tsx       # Typewriter animation
    │   ├── RemediationPanel.tsx       # 3 action cards
    │   └── ApprovalPanel.tsx          # Flag/Approve/Reject + POST /decision
    └── lib/api.ts                     # Typed fetch wrappers for all endpoints
```

## Demo Scenario

The input form pre-fills with: **"Replace FI-2024 with FI-2027 in EP-V8 / MY2025"**. This always produces 5 conflicts (4 rule-based + 1 cross-ECN outcome from ECN-2024-089), severity=HIGH, ~48 configurations affected.

To demo a LOW-severity result: change the program to EP-I4 — no rules fire for that program.
