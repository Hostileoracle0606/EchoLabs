import { describe, it, expect } from 'vitest';
import { validateMermaid, detectDiagramType } from './mermaid-validator';

describe('MermaidValidator', () => {
  describe('validateMermaid', () => {
    it('accepts valid pie chart syntax', () => {
      const code = 'pie title Revenue Breakdown\n  "Enterprise" : 40\n  "SMB" : 35\n  "Consumer" : 25';
      expect(validateMermaid(code)).toBe(true);
    });

    it('accepts valid xychart-beta syntax', () => {
      const code = 'xychart-beta\n  title "Hiring by Quarter"\n  x-axis [Q1, Q2, Q3]\n  bar [5, 8, 12]';
      expect(validateMermaid(code)).toBe(true);
    });

    it('accepts valid graph syntax', () => {
      const code = 'graph LR\n  Lead --> Qualification --> Demo --> Close';
      expect(validateMermaid(code)).toBe(true);
    });

    it('accepts valid mindmap syntax', () => {
      const code = 'mindmap\n  root((AI Strategy))\n    Hiring\n      5 ML Engineers';
      expect(validateMermaid(code)).toBe(true);
    });

    it('accepts valid timeline syntax', () => {
      const code = 'timeline\n  title Product Roadmap\n  January : v1 Launch\n  March : v2 Launch';
      expect(validateMermaid(code)).toBe(true);
    });

    it('accepts valid quadrantChart syntax', () => {
      const code = 'quadrantChart\n  title Feature Prioritization\n  x-axis Low Effort --> High Effort\n  y-axis Low Impact --> High Impact';
      expect(validateMermaid(code)).toBe(true);
    });

    it('accepts valid sequenceDiagram syntax', () => {
      const code = 'sequenceDiagram\n  Client->>Server: Send request\n  Server-->>Client: Response';
      expect(validateMermaid(code)).toBe(true);
    });

    it('accepts valid gantt chart syntax', () => {
      const code = 'gantt\n  title Project Schedule\n  section Phase 1\n  Task 1 :a1, 2024-01-01, 30d';
      expect(validateMermaid(code)).toBe(true);
    });

    it('accepts valid erDiagram syntax', () => {
      const code = 'erDiagram\n  CUSTOMER ||--o{ ORDER : places';
      expect(validateMermaid(code)).toBe(true);
    });

    it('accepts flowchart syntax', () => {
      const code = 'flowchart TD\n  A[Start] --> B[End]';
      expect(validateMermaid(code)).toBe(true);
    });

    it('rejects empty string', () => {
      expect(validateMermaid('')).toBe(false);
    });

    it('rejects random text', () => {
      expect(validateMermaid('hello world this is not a diagram')).toBe(false);
    });

    it('rejects code with only whitespace', () => {
      expect(validateMermaid('   \n  \n  ')).toBe(false);
    });
  });

  describe('detectDiagramType', () => {
    it('detects pie chart', () => {
      expect(detectDiagramType('pie title Test\n  "A" : 50')).toBe('pie');
    });

    it('detects xychart-beta', () => {
      expect(detectDiagramType('xychart-beta\n  x-axis [A, B]')).toBe('xychart-beta');
    });

    it('detects graph', () => {
      expect(detectDiagramType('graph LR\n  A --> B')).toBe('graph');
    });

    it('detects flowchart as graph', () => {
      expect(detectDiagramType('flowchart TD\n  A --> B')).toBe('graph');
    });

    it('detects mindmap', () => {
      expect(detectDiagramType('mindmap\n  root((Topic))')).toBe('mindmap');
    });

    it('detects timeline', () => {
      expect(detectDiagramType('timeline\n  title Roadmap')).toBe('timeline');
    });

    it('detects sequenceDiagram', () => {
      expect(detectDiagramType('sequenceDiagram\n  A->>B: msg')).toBe('sequenceDiagram');
    });

    it('detects gantt', () => {
      expect(detectDiagramType('gantt\n  title Schedule')).toBe('gantt');
    });

    it('detects quadrantChart', () => {
      expect(detectDiagramType('quadrantChart\n  title Priority')).toBe('quadrantChart');
    });

    it('detects erDiagram', () => {
      expect(detectDiagramType('erDiagram\n  A ||--o{ B : has')).toBe('erDiagram');
    });

    it('returns null for unknown syntax', () => {
      expect(detectDiagramType('just some random text')).toBeNull();
    });
  });
});
