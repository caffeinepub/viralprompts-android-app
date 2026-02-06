# Specification

## Summary
**Goal:** Fix prompt-loading failures (network/Cloudflare vs data-format issues) without breaking cached prompts, and display an always-visible footer version label “v15”.

**Planned changes:**
- Deep-check and harden the prompt-loading pipeline across backend fetch + frontend handling to correctly distinguish network/Cloudflare/server failures from true JSON data validation errors.
- Ensure the backend preserves the last-known-good cached prompts and does not overwrite cache when upstream returns invalid/non-JSON/HTML/blocked content.
- Keep retry and “Clear cache & retry” flows working without UI crashes, and keep all user-facing error strings in English.
- Add an unobtrusive footer version label that always displays “v15” across all app states (list and detail views) on mobile and desktop.

**User-visible outcome:** Prompts reliably load when the upstream JSON is valid; when the upstream is blocked/returns HTML or network fails, users see the correct existing guidance and can retry/clear-cache without the app getting stuck, and the footer always shows “v15”.
