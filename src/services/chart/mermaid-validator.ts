import type { MermaidChartType } from '@/types/agents';

const DIAGRAM_PATTERNS: { pattern: RegExp; type: MermaidChartType }[] = [
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

export function detectDiagramType(code: string): MermaidChartType | null {
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
