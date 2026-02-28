import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "synthetic_data"


def _load_history() -> list[dict]:
    with open(DATA_DIR / "ecn_history.json") as f:
        return json.load(f)


def check(structured_change: dict) -> list[dict]:
    part_added = structured_change.get("part_added")
    part_removed = structured_change.get("part_removed")
    program = structured_change.get("program")
    model_year = structured_change.get("model_year")

    history = _load_history()
    conflicts = []

    for prior_ecn in history:
        prior_parts = prior_ecn.get("parts_affected", [])
        prior_program = prior_ecn.get("program")
        prior_model_year = prior_ecn.get("model_year")
        outcome = prior_ecn.get("outcome", {})

        # Only consider ECNs on the same program + model year
        same_scope = (prior_program == program and prior_model_year == model_year)

        # --- Incompatible outcome: prior ECN approved the part being removed ---
        if (same_scope
                and part_removed in prior_parts
                and outcome.get("action") == "APPROVED"
                and outcome.get("status") == "sole_supplier"):
            rollback_needed = prior_ecn.get("requires_rollback_if_reversed", False)
            steps = prior_ecn.get("rollback_steps", [])
            desc = (
                f"{prior_ecn['ecn_id']} approved {part_removed} as sole-source supplier "
                f"for {program}/{model_year}. Removing it without formal rollback violates "
                f"the prior approval."
            )
            if rollback_needed:
                desc += f" Required rollback steps: {'; '.join(steps)}."

            conflicts.append({
                "rule_id": None,
                "type": "cross_ecn_conflict",
                "severity": "HIGH",
                "description": desc,
                "evidence": {
                    "rule_id": None,
                    "ecn_ref": prior_ecn["ecn_id"],
                    "artifact_link": f"ecn://{prior_ecn['ecn_id']}",
                    "violated_constraint": (
                        f"OUTCOME_CONFLICT: {prior_ecn['ecn_id']} set {part_removed} "
                        f"as sole-approved; removal requires rollback procedure"
                    )
                }
            })

        # --- Incompatible outcome: prior ECN flagged the part being added ---
        elif (part_added in prior_parts
              and outcome.get("action") == "FLAGGED"
              and outcome.get("status") == "conditional_use"):
            conflicts.append({
                "rule_id": None,
                "type": "cross_ecn_conflict",
                "severity": "MEDIUM",
                "description": (
                    f"{prior_ecn['ecn_id']} conditionally flagged {part_added}: "
                    f"{outcome.get('note', '')}. "
                    f"This ECN proposes adding the part without resolving the flag."
                ),
                "evidence": {
                    "rule_id": None,
                    "ecn_ref": prior_ecn["ecn_id"],
                    "artifact_link": f"ecn://{prior_ecn['ecn_id']}",
                    "violated_constraint": (
                        f"CONDITIONAL_USE_VIOLATION: {part_added} is under conditional "
                        f"use per {prior_ecn['ecn_id']} — flag must be cleared first"
                    )
                }
            })

        # --- Spec update on a part in scope ---
        elif (same_scope
              and outcome.get("action") == "SPEC_UPDATE"
              and (part_added in prior_parts or part_removed in prior_parts)):
            affected_part = part_added if part_added in prior_parts else part_removed
            conflicts.append({
                "rule_id": None,
                "type": "cross_ecn_overlap",
                "severity": "LOW",
                "description": (
                    f"{prior_ecn['ecn_id']} updated the specification for {affected_part}. "
                    f"This ECN must be validated against the updated spec: {outcome.get('note', '')}."
                ),
                "evidence": {
                    "rule_id": None,
                    "ecn_ref": prior_ecn["ecn_id"],
                    "artifact_link": f"ecn://{prior_ecn['ecn_id']}",
                    "violated_constraint": (
                        f"SPEC_OVERLAP: {affected_part} spec updated by {prior_ecn['ecn_id']}; "
                        f"verify compatibility"
                    )
                }
            })

    return conflicts
