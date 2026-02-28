import json
import os
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

from engine import parser, rule_engine, cross_ecn_checker, conflict_aggregator, graph_builder, explanation_generator

app = FastAPI(title="ECN Conflict Intelligence API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory decision log (persisted to decisions.json)
DECISIONS_FILE = Path(__file__).parent / "decisions.json"

def _load_decisions() -> list[dict]:
    if DECISIONS_FILE.exists():
        with open(DECISIONS_FILE) as f:
            return json.load(f)
    return []

def _save_decisions(decisions: list[dict]) -> None:
    with open(DECISIONS_FILE, "w") as f:
        json.dump(decisions, f, indent=2)


# ── Pydantic models ──────────────────────────────────────────────────────────

class ECNInput(BaseModel):
    title: str
    description: str
    effective_year: int


class DecisionInput(BaseModel):
    ecn_title: str
    conflict_ids: list[str] = []
    decision: str  # "FLAGGED" | "APPROVED" | "REJECTED"
    reviewer_note: str = ""


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


@app.post("/analyze")
async def analyze(ecn: ECNInput):
    # 1. Extract structured change from free text via Groq
    structured_change = parser.extract(ecn.title, ecn.description, ecn.effective_year)

    # Ensure model_year is always set — fall back to effective_year from input
    if not structured_change.get("model_year"):
        structured_change["model_year"] = f"MY{ecn.effective_year}"

    # 2. Deterministic rule checks
    rule_conflicts = rule_engine.check_conflicts(structured_change)

    # 3. Cross-ECN outcome-aware checks
    cross_conflicts = cross_ecn_checker.check(structured_change)

    # 4. Aggregate: merge, deduplicate, compute severity + impact_count
    aggregated = conflict_aggregator.aggregate(rule_conflicts, cross_conflicts, structured_change)

    # 5. Generate explanation + remediation via Groq
    explanation, remediation = explanation_generator.generate(structured_change, aggregated)

    # 6. Build React Flow graph data from networkx
    graph_data = graph_builder.build_graph_data(structured_change, aggregated)

    return {
        "structured_change": structured_change,
        "conflicts": aggregated["conflicts"],
        "impact_count": aggregated["impact_count"],
        "severity": aggregated["severity"],
        "rules_violated": aggregated["rules_violated"],
        "historical_flags": aggregated["historical_flags"],
        "cross_ecn_conflicts": aggregated["cross_ecn_conflicts"],
        "explanation": explanation,
        "remediation": remediation,
        "approval_status": aggregated["approval_status"],
        "graph_data": graph_data,
    }


@app.post("/decision")
async def log_decision(body: DecisionInput):
    valid_decisions = {"FLAGGED", "APPROVED", "REJECTED"}
    if body.decision not in valid_decisions:
        raise HTTPException(status_code=400, detail=f"decision must be one of {valid_decisions}")

    decisions = _load_decisions()
    entry = {
        "id": f"DEC-{len(decisions) + 1:04d}",
        "ecn_title": body.ecn_title,
        "conflict_ids": body.conflict_ids,
        "decision": body.decision,
        "reviewer_note": body.reviewer_note,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    decisions.append(entry)
    _save_decisions(decisions)

    return {"status": "logged", "decision": entry}


@app.get("/decisions")
async def get_decisions():
    return {"decisions": _load_decisions()}
