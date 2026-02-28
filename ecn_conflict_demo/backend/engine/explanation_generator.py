import json
import os
import re
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are a senior automotive engineering advisor writing a conflict analysis report for a management presentation.
Given an ECN structured change and a list of conflicts, return ONLY valid JSON — no explanation, no markdown, no code fences.

Return this exact JSON structure:
{
  "explanation": "<2-3 sentence plain English explanation of why this ECN is problematic, suitable for a non-technical manager>",
  "remediation": [
    "<specific action 1 — e.g., 'Restrict scope to EP-V6 where FI-2027 has no do-not-coexist rule violation'>",
    "<specific action 2 — e.g., 'Submit formal derogation request to bypass the MY2025 freeze window'>",
    "<specific action 3 — e.g., 'Complete FP-44 qualification and integrate into EP-V8 BOM before proceeding'>"
  ]
}

Be specific and reference the actual part IDs, rule IDs, and ECN IDs from the input."""


def generate(structured_change: dict, aggregated: dict) -> tuple[str, list[str]]:
    conflicts = aggregated.get("conflicts", [])

    user_message = json.dumps({
        "structured_change": structured_change,
        "conflicts": [
            {
                "type": c["type"],
                "severity": c["severity"],
                "description": c["description"],
                "evidence": c.get("evidence", {}),
            }
            for c in conflicts
        ],
        "severity": aggregated.get("severity"),
        "impact_count": aggregated.get("impact_count"),
    }, indent=2)

    try:
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.6,
            max_tokens=700,
        )
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
        raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)

        parsed = json.loads(raw)
        explanation = parsed.get("explanation", "")
        remediation = parsed.get("remediation", [])
        if isinstance(remediation, list) and len(remediation) == 3:
            return explanation, remediation

    except Exception:
        pass

    # Fallback: generate based on conflict types
    return _fallback_generate(structured_change, aggregated)


def _fallback_generate(structured_change: dict, aggregated: dict) -> tuple[str, list[str]]:
    part_added = structured_change.get("part_added", "the new part")
    part_removed = structured_change.get("part_removed", "the existing part")
    program = structured_change.get("program", "the program")
    severity = aggregated.get("severity", "HIGH")
    impact = aggregated.get("impact_count", 0)

    explanation = (
        f"This ECN proposes replacing {part_removed} with {part_added} in {program}, "
        f"but the change violates {aggregated.get('rules_violated', 0)} active engineering rules "
        f"and conflicts with {aggregated.get('cross_ecn_conflicts', 0)} previously approved ECN(s). "
        f"The overall risk is rated {severity}, affecting approximately {impact} vehicle configurations."
    )

    remediation = [
        f"Restrict the scope of this ECN to programs where {part_added} has no do-not-coexist violations.",
        f"Submit a formal derogation request with engineering sign-off to address the release freeze constraint.",
        f"Conduct full PPAP Level 3 qualification for {part_added} in {program} before re-submitting this ECN.",
    ]

    return explanation, remediation
