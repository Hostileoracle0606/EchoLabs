type LegacyMermaidChartType =
  | 'pie'
  | 'xychart-beta'
  | 'graph'
  | 'mindmap'
  | 'timeline'
  | 'quadrantChart'
  | 'sequenceDiagram'
  | 'gantt'
  | 'erDiagram';

const DIAGRAM_PATTERNS: { pattern: RegExp; type: LegacyMermaidChartType }[] = [
  { pattern: /^pie\b/m, type: 'pie' },
  { pattern: /^xychart-beta\b/m, type: 'xychart-beta' },
  { pattern: /^flowchart\b/m, type: 'graph' },
  { pattern: /^graph\b/m, type: 'graph' },
  { pattern: /^mindmap\b/m, type: 'mindmap' },
  { pattern: /^timeline\b/m, type: 'timeline' },
  { pattern: /^sequenceDiagram\b/m, type: 'sequenceDiagram' },
  { pattern: /^gantt\b/m, type: 'gantt' },
  { pattern: /^quadrantChart\b/m, type: 'quadrantChart' },
  { pattern: /^erDiagram\b/m, type: 'erDiagram' },
];

export function detectDiagramType(code: string): LegacyMermaidChartType | null {
  const trimmed = code.trim();
  for (const { pattern, type } of DIAGRAM_PATTERNS) {
    if (pattern.test(trimmed)) {
      return type;
    }
  }
  return null;
}

export function validateMermaid(code: string): boolean {
  if (!code || !code.trim()) {
    return false;
  }
  return detectDiagramType(code) !== null;
}
