# Vibe-Trace Directory

This directory contains meta-level engineering audit logs for "vibe coding" sessions.

## Purpose

To provide a human-readable (and agent-readable) history of architectural decisions, major logic shifts, and high-level summaries of work performed by AI agents and developers.

## Protocol

- **When**: Every time a task or session is completed.
- **Where**: A new file in `.trace/YYYY-MM-DD-HH-MM-short-description.md`.
- **Who**: Both humans and AI agents must follow this.

## Format

```markdown
# Vibe Log: [Brief Title]

- **Date and Location**: Date, time, location, timezone. (e.g., 2026-04-15 15:44 Turkey +3:00GMT)
- **Agent**: Human Name - AI Tool - AI Model (e.g., Amin Abbasi - Antigravity - Gemini 3.0 Flash).
- **Task**: [Task Description]

## Architectural Shifts

- [List any major changes to how the code is structured or how modules interact]

## Key Changes

- [High-level bullet points of what was done]

## Vibes

- [Informal notes on how it went, blockers, or future things to look out for]
```
