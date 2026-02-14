export const REFERENCE_SEARCH_PROMPT = `Find the authoritative source for this claim.
Return JSON:
{
  "title": "<title>",
  "url": "<URL>",
  "snippet": "<2-sentence excerpt>",
  "confidence": "verified" | "partial" | "unverified",
  "domain": "<domain>"
}

RULES:
- "verified": Exact/near-exact match.
- "partial": Related source.
- Prefer authoritative sources (papers, reports).`;
