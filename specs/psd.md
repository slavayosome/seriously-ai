# Product Specification Document: **Seriously AI**

## 1. Executive Summary

### Elevator Pitch

**Seriously AI** turns scattered information into concise, reference-rich insights and auto-drafted posts, giving busy professionals a one-click research pipeline and AI co-writer to grow their thought-leadership with credibility and consistency.

### Vision Statement

Enable every serious thinker to transform expertise into influence—building sustainable personal brands and income streams—by democratizing access to intelligent, trustworthy content-creation workflows.

---

## 2. Problem Statement

| Aspect | Current State | Pain Point | Opportunity Cost |
|--------|---------------|------------|------------------|
| **Content Ideation** | Users rely on ad-hoc ChatGPT/Claude prompts. | Struggle to find timely, trending angles with credible sources. | Miss engagement waves; appear out-of-touch. |
| **Consistency** | Sporadic posting (1-3×/quarter). | Low follower growth; algorithms deprioritise. | Personal brand stagnates; fewer monetisation options. |
| **Time & Workflow** | Manual research, drafting, scheduling across tools. | Consumes scarce after-work hours. | Experts stay silent; marketable knowledge unused. |

---

## 3. Target Audience

### Primary Persona: "Serious Thinker in Transition"

- **Profile:** 30-something specialist (e.g., product manager, consultant, engineer)
- **Followers:** < 5k total across LinkedIn & X
- **Goal:** Monetise expertise, exit sole dependency on employer
- **Behaviour:** Reads deeply, posts rarely; values evidence over hot-takes

### Market Sizing

- **TAM (global):** ≈ 1M professionals fitting the above archetype
- **SAM (initial EN market):** ~250k English-speaking professionals active on LinkedIn
- **SOM (Year 1 target):** 10k free users → 500 paid

### Secondary Segments (post-MVP)

- Solopreneurs / micro-founders seeking inbound leads
- Niche newsletter writers & independent analysts
- Early-stage marketing teams needing credibility posts

---

## 4. Proposed Solution

### Core Concept

A web app and Telegram bot that run a **deep-research pipeline**: crawl trusted sources → distill insight atoms → surface ranked highlights → let users save to a knowledge library → instantly draft platform-specific posts with proven templates.

### Key Features (v1 scope ✓)

1. **Intelligent Search Pipeline:**
   - Google News RSS → article fetch → clean & embed → relevance scoring by LLM

2. **Insight Explorer:**
   - Ranked list with inline citation badges; save/unsave

3. **AI Draft Generator:**
   - Select insight → choose template → one-click draft (LinkedIn, X)

4. **Knowledge Library:**
   - Taggable, searchable repository of saved insights & drafts

### Deferred (post-MVP ✗)

- Autopilot scheduling / direct posting
- Multi-channel alerts (WhatsApp, Slack)
- Additional sources (Perplexity, podcasts, PDFs)

### User Journey

```mermaid
flowchart LR
A[Prompt topic] --> B[Pipeline runs]
B --> C[Insights ranked]
C --> D[User saves preferred]
D --> E[Select template]
E --> F[AI draft shown]
F --> G[User edits & exports]
```

---

## 5. Unique Selling Proposition (USP)

- **Credibility-First:** All insights carry source links & citation scores
- **One-Click Depth:** Full research workflow hidden behind a single prompt
- **Template Intelligence:** Library of high-performing content frameworks tuned for LinkedIn/X voice
- **Built for Individuals, not Brands:** Pricing & UX optimised for solo experts, not marketing agencies

### Competitive Landscape

| Competitor | Focus | Gap Seriously AI Exploits |
|------------|-------|---------------------------|
| ChatGPT / Claude | Generic Q&A | No pipeline, manual prompting, no scheduling |
| Jasper / Copy.ai | Marketing copy | Ads/SEO focus, thin references |
| Up-and-coming micro-SaaS | Single feature | Lack integrated research + drafting |

---

## 6. Success Metrics

| Area | Metric | Target |
|------|--------|--------|
| **Adoption** | Sign-ups/mo | 500 free, 10 paid (Month 3) |
| **Engagement** | Weekly Active Users (WAU) | ≥ 30% of sign-ups |
| **Activation** | First saved insight + draft | 50% of new users |
| **Revenue** | Paying customers | 50 by Month 6 |

---

## 7. Constraints & Considerations

### Technical
- **Stack:** Next.js 14 (App Router), Node workers, Upstash Redis, Supabase (Postgres)
- **AI:** Vercel AI SDK wrapping OpenAI GPT-4o; budget-aware fallback to GPT-3.5

### Business
- Solo founder; lean on free tiers, OSS components
- Usage-based freemium (Starter $0/mo, Plus $19, Pro $49)

### Regulatory / API Limits
- Google News ToS compliance; LinkedIn API for eventual posting (not MVP)
- GDPR-ready data storage in Supabase EU region

---

## 8. MVP Definition (Launch Goal)

### Core Feature Set

1. Prompt-based research pipeline (Google News only)
2. Insight ranking screen with citations
3. Save-to-Library (+ simple tagging)
4. Template-based AI draft generation
5. Manual export (copy or markdown) to LinkedIn/X

### Acceptance Criteria

- User can go from prompt → saved insight → draft in **< 2 minutes**
- First paying customer validates Plus plan at $19/mo
- System operates on free-tier infrastructure without breaking SLA during beta (≤ 5k users)

### Out of Scope for MVP

- Automated scheduling / autoposting
- Multi-channel notifications & approvals
- Source expansion beyond Google News
- Team collaboration / multi-seat accounts

---

## Appendix

- **Roadmap Next 6 Months:** Source plugins → Telegram alerts → Autopilot scheduling → Team workspaces
- **Potential Partnerships:** AI influencers for launch webinars; content template marketplace

*Last updated: 19 Jun 2025*