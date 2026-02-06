# Specification

## Summary
**Goal:** Use a same-origin local `/data.json` path as the frontend source for viral prompts data.

**Planned changes:**
- Update `frontend/src/services/viralPromptsClient.ts` to change `DATA_URL` from `https://viralprompts.in/data.json` to `'/data.json'`.
- Remove any remaining frontend references to the hardcoded `https://viralprompts.in/data.json` URL.

**User-visible outcome:** The app loads prompt data from `/data.json` on the same origin instead of fetching it from `viralprompts.in`.
