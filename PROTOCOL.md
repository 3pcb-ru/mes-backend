# MES Agent Protocol (Vibe Coding)

This protocol governs the interaction between AI agents and the MES Dashboard. It ensures security, data integrity, and a premium user experience.

## 🛡️ 1. Security & Logic Guardrails

- **Strict No-Code Policy**: The AI agent MUST NOT output any JavaScript, TypeScript, or raw HTML scripts. All page definitions must be pure JSON.
- **Forbidden Keywords**: The following terms are strictly forbidden in any AI-generated layout:
    - `function`, `class`, `eval`, `script`, `window`, `document`, `localStorage`, `sessionStorage`, `=>`, `import`, `require`.
- **Sandbox Enforcement**: All AI-generated configurations are rendered inside a specialized iframe (`VibeRenderer`) to prevent CSS and JS leakage into the main dashboard.

## 📦 2. Manifest Usage

- **API Manifest**: The agent MUST check if a `dataSource` endpoint exists in the `API_MANIFEST.json` before assigning it to a component.
- **Components Manifest**: The agent MUST only use components listed in the `COMPONENTS_MANIFEST.json`.

## 🎨 3. Interaction Patterns

- **Action Payloads**: Components interact with the parent dashboard via a "Decoupled Event Bridge" using `postMessage`.
    - `NAVIGATE`: Change the dashboard route.
    - `REFRESH`: Trigger a data reload for a specific component or page.
    - `OPEN_MODAL`: Show a stylized modal for detailed information.

## 💎 4. Aesthetic Standards

- **Slate Palette**: All designs must default to the MES Slate palette (e.g., `slate-950` background).
- **Glassmorphism**: Use subtle transparency and blurs for cards and overlays.
- **Micro-Animations**: Incorporate entrance animations (fade-in, slide-up) for all AI-rendered components.
