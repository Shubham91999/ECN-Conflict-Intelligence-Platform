import json
import os
import re
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are an automotive engineering ECN (Engineering Change Notice) parser.
Extract structured information from ECN text and return ONLY valid JSON — no explanation, no markdown, no code fences.

Return this exact JSON structure:
{
  "part_removed": "<part ID being removed, exactly as written in the text, or null>",
  "part_added": "<part ID being added or replacing, exactly as written, or null>",
  "program": "<engine or vehicle program identifier exactly as written, or null>",
  "model_year": "<model year formatted as MY####, e.g. MY2027 — derive from any year mention such as '2027MY', '2027 model year', 'effective 2027', or the provided Effective Year>",
  "change_type": "<part_substitution|scope_expansion|spec_update|removal|addition|other>",
  "options_affected": ["<any option, package, or trim codes mentioned, exactly as written>"],
  "constraints": ["<any stated conditions, caveats, or validation requirements>"]
}

Rules:
- Extract values EXACTLY as they appear — do not substitute or normalise to other known IDs.
- For model_year: always produce MY#### format using the year from the text or from Effective Year.
- If a field cannot be determined, use null.
- Never invent values not present in the text."""


def extract(ecn_title: str, ecn_description: str, effective_year: int) -> dict:
    user_message = (
        f"ECN Title: {ecn_title}\n"
        f"Description: {ecn_description}\n"
        f"Effective Year: {effective_year}"
    )

    try:
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.1,
            max_tokens=512,
        )
        raw = response.choices[0].message.content.strip()

        # Strip code fences if model adds them despite instructions
        raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
        raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)

        return json.loads(raw)

    except (json.JSONDecodeError, Exception):
        # Fallback: best-effort regex extraction
        return _fallback_extract(ecn_title, ecn_description, effective_year)


def _fallback_extract(title: str, description: str, effective_year: int) -> dict:
    text = f"{title} {description}"

    # Generic part-ID pattern: uppercase letters + hyphen + alphanumerics (e.g. F-442, FI-2024, A-900)
    part_candidates = re.findall(r'\b[A-Z]{1,4}-\d{2,5}\b', text)
    part_removed = part_candidates[0] if len(part_candidates) > 0 else None
    part_added = part_candidates[1] if len(part_candidates) > 1 else None

    # Program: any word ending in digits preceded by letters (MX-13, EP-V8, etc.)
    program_match = re.search(r'\b([A-Z]{1,4}-[A-Z0-9]{1,4})\b', text)
    program = program_match.group(1) if program_match else None

    # Model year: derive from effective_year or any 4-digit year in text
    year_match = re.search(r'\b(20\d{2})\b', text)
    model_year = f"MY{effective_year}" if effective_year else (
        f"MY{year_match.group(1)}" if year_match else None
    )

    has_removal = any(w in text.lower() for w in ["remov", "delet", "eliminat"])
    change_type = "removal" if (has_removal and not part_added) else (
        "part_substitution" if (part_removed and part_added) else "other"
    )

    return {
        "part_removed": part_removed,
        "part_added": part_added,
        "program": program,
        "model_year": model_year,
        "change_type": change_type,
        "options_affected": [],
        "constraints": [],
    }
