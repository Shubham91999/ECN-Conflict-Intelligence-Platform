# ECN Conflict Intelligence -- Web UI MVP Plan

## Objective

Build a demo-ready Web Application for AI-assisted ECN Conflict
Detection that:

-   Accepts ECN text input
-   Parses intent using LLM
-   Runs deterministic conflict checks
-   Detects cross-ECN conflicts
-   Displays impact visually
-   Generates clear explanations
-   Looks polished for management demos

------------------------------------------------------------------------

## High-Level Architecture

Frontend (Next.js / React) \| \| REST API ↓ Backend (FastAPI - Python)
\| ├── Intent Extraction (Claude API) ├── Deterministic Rule Engine ├──
Cross-ECN Checker ├── Synthetic Data Layer └── Conflict Aggregator

------------------------------------------------------------------------

## Project Structure

ecn_conflict_demo/ │ ├── backend/ │ ├── main.py (FastAPI app) │ ├──
engine/ │ │ ├── parser.py │ │ ├── rule_engine.py │ │ ├──
cross_ecn_checker.py │ │ ├── conflict_aggregator.py │ │ └──
explanation_generator.py │ ├── synthetic_data/ │ └── requirements.txt │
├── frontend/ │ ├── pages/ │ ├── components/ │ ├── styles/ │ └──
package.json │ └── docs/ └── MVP_PLAN.md

------------------------------------------------------------------------

## Backend Plan (FastAPI)

### Endpoint: POST /analyze

Input: { "title": "...", "description": "...", "effective_year": 2027 }

Output: { "structured_change": {...}, "conflicts": \[...\],
"impact_count": 48, "severity": "HIGH", "explanation": "...",
"graph_data": {...} }

------------------------------------------------------------------------

## Frontend UI Screens

### 1. Landing Page

-   Title: ECN Conflict Intelligence Platform
-   Button: Analyze ECN

### 2. ECN Input Page

-   Title field
-   Description field
-   Effective year dropdown
-   Analyze button
-   Live structured extraction preview

### 3. Results Dashboard

Sections:

1.  Risk Score Card
    -   Low (Green)
    -   Medium (Yellow)
    -   High (Red)
2.  Impact Summary
    -   Configurations affected
    -   Rules violated
    -   Historical conflicts
    -   Freeze proximity
3.  Dependency Graph Visualization
    -   Use React Flow or D3.js
    -   Highlight broken dependency in red
4.  Explanation Panel
    -   Plain-language conflict reasoning
5.  Suggested Remediation
    -   Replacement suggestion
    -   Scope restriction suggestion
    -   Rule update suggestion

------------------------------------------------------------------------

## Synthetic Data Requirements

Generate:

-   20 Parts
-   10 Assemblies
-   5 Options
-   3 Engine Programs
-   2 Model Years

Rule Types: - Dependency Rules - Do-Not-Coexist Rules - Release Freeze
Rules - Historical Corrective Flags

------------------------------------------------------------------------

## Demo Flow for Managers

1.  Paste ECN text.
2.  Click Analyze.
3.  Show structured extraction.
4.  Display conflict severity.
5.  Show visual dependency break.
6.  Display explanation.
7.  Modify scope.
8.  Re-run analysis.
9.  Show reduced risk.

------------------------------------------------------------------------

## Tech Stack

Backend: - Python - FastAPI - Claude API - JSON synthetic data

Frontend: - Next.js - React - Tailwind CSS - shadcn/ui - React Flow (for
graph)

------------------------------------------------------------------------

## Final MVP Goal

Deliver a visually appealing, interactive demo that clearly shows:

-   Automated conflict detection
-   Impact visualization
-   Evidence-backed reasoning
-   Intelligent remediation suggestions

This demo should convincingly show how AI can prevent engineering change
conflicts before approval.
