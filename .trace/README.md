# Vibe-Trace Directory

This directory contains meta-level engineering audit logs for "vibe coding" sessions.

## Purpose
To provide a human-readable (and agent-readable) history of architectural decisions, major logic shifts, and high-level summaries of work performed by AI agents and developers.

## Protocol
- **When**: Every time a task or session is completed.
- **Where**: A new file in `.trace/YYYY-MM-DD-short-description.md`.
- **Who**: Both humans and AI agents must follow this.

## Format
```markdown
# Vibe Log: [Brief Title]

- **Date**: YYYY-MM-DD
- **Agent**: [Agent Name / Human Name]
- **Task**: [Task Description]

## Architectural Shifts
- [List any major changes to how the code is structured or how modules interact]

## Key Changes
- [High-level bullet points of what was done]

## Vibes
- [Informal notes on how it went, blockers, or future things to look out for]
```
