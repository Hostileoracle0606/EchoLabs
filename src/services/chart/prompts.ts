export const CHART_GENERATION_PROMPT = `Generate a structured chart spec for the data claim.

Allowed chart kinds:
- "bar" for comparisons or time-series
- "pie" for shares of a whole
- "metric" for a single headline number

Output JSON:
{
  "chart": {
    "kind": "bar" | "pie" | "metric",
    "title": "<short title>",
    "subtitle": "<optional short subtitle>",
    "xLabel": "<optional x axis label, bar only>",
    "yLabel": "<optional y axis label, bar only>",
    "data": [{"label":"<label>","value":123}],
    "value": "<headline value, metric only>",
    "trend": "up" | "down" | "flat",
    "detail": "<optional metric detail>"
  },
  "narration": "<1-sentence summary>"
}

RULES:
- Return valid JSON only.
- Use at most 6 data points.
- Use numeric values for bar/pie data.
- Prefer bar or pie when the claim contains multiple comparable values.
- Prefer metric when there is only one primary figure.
- Do not return Mermaid.`;
