import json
from datetime import date
from typing import Any

DATA_DIR = __import__("pathlib").Path(__file__).parent.parent / "synthetic_data"


def _load(filename: str) -> Any:
    with open(DATA_DIR / filename) as f:
        return json.load(f)


def check_conflicts(structured_change: dict) -> list[dict]:
    rules = _load("rules.json")
    parts = {p["id"]: p for p in _load("parts.json")}

    part_added = structured_change.get("part_added")
    part_removed = structured_change.get("part_removed")
    program = structured_change.get("program")
    model_year = structured_change.get("model_year")

    conflicts = []

    for rule in rules:
        rtype = rule["type"]

        if rtype == "do_not_coexist":
            rule_parts = rule.get("parts", [])
            rule_programs = rule.get("programs", [])
            # Conflict if the new part AND its forbidden coexistence partner are both in scope
            if (part_added in rule_parts and program in rule_programs):
                other_parts = [p for p in rule_parts if p != part_added]
                conflicts.append({
                    "rule_id": rule["id"],
                    "type": "do_not_coexist",
                    "severity": rule["severity"],
                    "description": rule["description"],
                    "evidence": {
                        "rule_id": rule["id"],
                        "ecn_ref": None,
                        "artifact_link": rule["artifact_link"],
                        "violated_constraint": f"DO_NOT_COEXIST: {part_added} + {', '.join(other_parts)} in {program}"
                    }
                })

        elif rtype == "freeze_window":
            rule_program = rule.get("program")
            rule_model_year = rule.get("model_year")
            freeze_date = date.fromisoformat(rule.get("freeze_date", "9999-01-01"))
            if (rule_program == program and rule_model_year == model_year
                    and date.today() >= freeze_date):
                days_since_freeze = (date.today() - freeze_date).days
                conflicts.append({
                    "rule_id": rule["id"],
                    "type": "freeze_window",
                    "severity": rule["severity"],
                    "description": rule["description"],
                    "evidence": {
                        "rule_id": rule["id"],
                        "ecn_ref": None,
                        "artifact_link": rule["artifact_link"],
                        "violated_constraint": (
                            f"FREEZE_WINDOW: {program}/{model_year} frozen since "
                            f"{rule['freeze_date']} ({days_since_freeze} days ago)"
                        )
                    }
                })

        elif rtype == "dependency":
            rule_part = rule.get("part")
            requires = rule.get("requires")
            conflicts_with = rule.get("conflicts_with")
            rule_programs = rule.get("programs", [])
            if (part_added == rule_part and program in rule_programs):
                # New part requires X, but program has Y (incompatible)
                program_parts = set()
                bom = _load("bom.json")
                for row in bom:
                    if row["program"] == program and row["model_year"] == model_year:
                        program_parts.update(row["parts"])

                if conflicts_with in program_parts and requires not in program_parts:
                    conflicts.append({
                        "rule_id": rule["id"],
                        "type": "dependency_break",
                        "severity": rule["severity"],
                        "description": rule["description"],
                        "evidence": {
                            "rule_id": rule["id"],
                            "ecn_ref": None,
                            "artifact_link": rule["artifact_link"],
                            "violated_constraint": (
                                f"DEPENDENCY: {part_added} requires {requires}, "
                                f"but {program} has {conflicts_with} (incompatible)"
                            )
                        }
                    })

        elif rtype == "historical_flag":
            rule_part = rule.get("part")
            if part_added == rule_part:
                conflicts.append({
                    "rule_id": rule["id"],
                    "type": "historical_flag",
                    "severity": rule["severity"],
                    "description": rule["description"],
                    "evidence": {
                        "rule_id": rule["id"],
                        "ecn_ref": None,
                        "artifact_link": rule["artifact_link"],
                        "violated_constraint": (
                            f"HISTORICAL_FLAG: {part_added} flagged under "
                            f"{rule['corrective_action_id']} — durability confirmation pending"
                        )
                    }
                })

    return conflicts
