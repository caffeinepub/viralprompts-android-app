# Play Store Release Planning & Compliance Notes

## Overview
This document outlines key compliance considerations and operational requirements for releasing the ViralPrompts app to the Google Play Store under 2025–2026 policies.

## Architecture Summary
- **Hybrid approach**: Native React UI for list/detail screens; external browser navigation for full canonical pages at https://viralprompts.in/{urlTitle}
- **Data source**: Live JSON from https://viralprompts.in/data.json (no backend changes required)
- **Offline support**: Local caching with manual refresh

## Play Store Compliance Risks

### 1. Thin Content / Wrapper Policy
**Risk**: Apps that primarily display web content without substantial native functionality may be rejected as "thin wrappers."

**Mitigation**:
- Native list and detail UI with custom components (not just a WebView)
- Offline caching and manual refresh functionality
- Copy-to-clipboard feature
- Client-side data transformation (howToUse parsing)
- Full pages opened in external browser (not in-app WebView), positioning the website as the canonical source

**Recommendation**: Emphasize native features in store listing; avoid language suggesting the app is merely a "browser" for the website.

### 2. WebView Usage Considerations
**Current approach**: Full prompt pages open in external browser via `window.open()`, not in-app WebView.

**Benefit**: This approach avoids Play Store scrutiny around in-app WebView content policies and clearly positions the website as the primary content platform.

**Alternative (if in-app WebView is desired in future)**: Ensure WebView content is clearly supplementary and that the app provides substantial native value beyond web browsing.

### 3. Privacy & Network Access Disclosure
**Requirements**:
- Privacy policy must disclose that the app fetches data from https://viralprompts.in/data.json
- Privacy policy must explain local caching behavior (localStorage)
- Store listing must clearly state the app requires internet connectivity for latest content

**Action items**:
- Create/update privacy policy on viralprompts.in
- Link privacy policy in Play Console
- Add "Internet" permission disclosure in store listing

### 4. Content Policy & Misleading Claims
**Prohibited claims**: "No.1", "Best", "Guaranteed", or other superlatives without substantiation.

**Current status**: App copy avoids these claims.

**Recommendation**: Review store listing description and screenshots to ensure compliance before submission.

### 5. Testing Requirements (2025–2026)
**Closed testing track**: Minimum 20 testers for 14 consecutive days before production release.

**Action plan**:
1. Create closed testing track in Play Console
2. Recruit 20+ testers (colleagues, beta users, community members)
3. Distribute test build via closed track
4. Monitor for 14 days, collect feedback, fix critical issues
5. After 14 days + approval, promote to production

**Timeline estimate**: Add 3–4 weeks to release schedule for testing period.

## SEO & Canonical Content Strategy

### Current Implementation
- App does NOT generate SEO-focused meta tags or crawlable prompt detail pages
- Full prompt pages open at https://viralprompts.in/{urlTitle} (canonical source)
- JSON endpoint (data.json) should be blocked via robots.txt on website (already handled per user)

### Compliance
✅ No duplicate content issues: App does not compete with website for search rankings  
✅ Website remains the ranking asset  
✅ App clearly discloses it fetches content from viralprompts.in (About dialog)

## Operational Notes

### Content Updates
- Content changes on website/JSON are reflected in app immediately after user refresh
- No app updates required for new prompts, categories, or content changes
- App version updates only needed for feature changes or bug fixes

### Monitoring
- Monitor Play Console for policy violation warnings
- Track user reviews for content/functionality issues
- Keep privacy policy and store listing synchronized with app behavior

## Recommendations (No Backend Changes Required)

### Short-term
1. Ensure privacy policy is published and linked
2. Prepare store listing assets (screenshots, description, icon)
3. Set up closed testing track with 20+ testers
4. Test offline caching thoroughly across devices

### Long-term
1. Consider adding search/filter functionality (client-side)
2. Add user favorites/bookmarks (localStorage)
3. Implement analytics (privacy-compliant) to understand usage patterns
4. Consider push notifications for new prompt categories (requires backend)

## Conclusion
The current architecture is well-positioned for Play Store compliance. The hybrid approach with native UI, offline caching, and external browser navigation for full pages avoids thin-wrapper concerns while maintaining the website as the SEO-canonical source. Follow the 20-tester / 14-day testing requirement and ensure privacy disclosures are complete before production release.
