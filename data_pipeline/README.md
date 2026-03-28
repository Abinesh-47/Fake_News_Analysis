# ORBIT-X Data Pipeline

This directory is the centralized source of truth for the forensic intelligence engine.

## File Roles

| File | Role | Source |
|------|------|--------|
| `raw_news.json` | **Ingestion**: Raw search signals and snippets. | `server.ts` (API Search) |
| `processed_news.json` | **Big Data**: Analyzed credibility and status scores. | `analyze_news.py` (Spark Engine) |
| `final_results.json` | **Intelligence**: The merged, production-ready payload. | `server.ts` (Unified Result) |

## Data Flow
1. **Search API**: Results are gathered and written to `raw_news.json`.
2. **Spark Job**: Triggered automatically to process `raw_news.json` into `processed_news.json`.
3. **Core AI**: Simultaneously performs agentic analysis and combines its results with `processed_news.json` into `final_results.json`.
