export const CHART_GENERATION_PROMPT = `Generate a Mermaid diagram for the data claim.
Types: pie, xychart-beta (trends/bars), graph (flows), mindmap, timeline, quadrantChart, sequenceDiagram, gantt, erDiagram.

Output JSON:
{
  "mermaid": "<raw Mermaid code, no fences>",
  "narration": "<1-sentence desc>",
  "diagramType": "<type>",
  "title": "<short title>"
}

RULES:
- Raw Mermaid code in "mermaid".
- Infer missing data reasonably.
- Keep simple (max 8 items).`;
