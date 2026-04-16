# 2026-04-16-16-15-handle-gemini-429-quota

- **Date and Location**: 2026-04-16 16:15 UTC+3
- **Agent**: Amin Abbasi - Antigravity - Gemini 3.0 Flash
- **Context**: 
    - Gemini Free Tier quota exceeded (5/min).
    - Previous retry logic was too aggressive for quota-based 429 errors.
- **Architectural Shift**: 
    - Implemented a **Distributed Cooldown** system.
    - Backend extracts `retryAfter` from the Google `RetryInfo` RPC payload.
    - Frontend implements a live countdown and blocks execution via store-level guards.
- **Vibes**: 
    - Respecting boundaries makes the system feel more "intelligent" rather than "broken."
    - The countdown UI adds a layer of transparency that builds user trust.
