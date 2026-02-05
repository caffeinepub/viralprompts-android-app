# Specification

## Summary
**Goal:** Improve reliability of loading prompts, add a persistent dark/light/system theme toggle and a simple Settings area, and refine the warm color styling for a more polished look in both light and dark mode.

**Planned changes:**
- Make prompts fetching more robust and add UI error recovery: clear error state, Retry action, and “clear local cache and retry” option; continue showing cached prompts when available and clearly indicate cached mode; add diagnostic logging for fetch/parse/shape failures.
- Add a visible theme toggle in the main UI using class-based dark mode, with the selected theme persisted to localStorage and restored on load.
- Add a Settings/Options entry point (e.g., dialog/sheet) with locally persisted preferences including Theme (Light/Dark/System) plus at least two additional UI options (e.g., compact spacing, show/hide images in list, default sort order like Newest vs Most copied).
- Refine and standardize the warm color palette across core UI components (header, buttons, cards, badges, dialogs) for consistent contrast and readability in both themes without breaking existing navigation/layout.

**User-visible outcome:** Prompts load reliably without needing hard reloads; if loading fails, users can retry or clear cache and retry while still seeing cached prompts when available. Users can toggle Light/Dark/System theme and adjust a few UI preferences from a Settings area, with all choices saved across refreshes, and the UI looks more consistent with an improved warm palette.
