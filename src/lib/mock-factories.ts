import { z } from 'zod';
import { 
    TranscriptChunk, 
    GeminiResponse 
} from './types';

// ========================================
// Zod Schemas for Runtime Validation
// ========================================

export const VisualizationCardSchema = z.object({
    id: z.string(),
    type: z.enum(['bar_chart', 'line_chart', 'pie_chart', 'area_chart', 'kpi_card', 'table', 'comparison', 'timeline', 'donut']),
    headline: z.string(),
    data: z.record(z.string(), z.any()),
    sourceFile: z.string(),
    chartConfig: z.object({
        xAxis: z.string().optional(),
        yAxis: z.string().optional(),
        dataKey: z.string().optional(),
        colors: z.array(z.string()).optional(),
        showLegend: z.boolean().optional(),
        showGrid: z.boolean().optional(),
        valuePrefix: z.string().optional(),
        valueSuffix: z.string().optional(),
    }),
    morphHint: z.enum(['expand_bars', 'trace_line', 'segment_pie', 'grid_table', 'pulse_kpi', 'scatter_points']),
    displayDuration: z.number().optional(),
});

export const GeminiResponseSchema = z.object({
    action: z.enum(['new_card', 'keep_current', 'dismiss_current']),
    card: VisualizationCardSchema.partial().optional(),
    audienceSummary: z.string().optional(),
});

// ========================================
// Factory Functions
// ========================================

/**
 * Generates a realistic transcript chunk with incremental timestamps.
 */
export function createMockTranscript(
    text: string, 
    isFinal: boolean = true, 
    startTime: number = Date.now()
): TranscriptChunk {
    const words = text.split(' ').map((word, i) => ({
        word,
        start: startTime + i * 300,
        end: startTime + (i + 1) * 300,
        confidence: 0.85 + Math.random() * 0.14,
    }));

    return {
        id: `chunk_${Math.random().toString(36).substr(2, 9)}`,
        text,
        isFinal,
        confidence: 0.92,
        timestamp: startTime,
        words
    };
}

/**
 * Generates a mock Gemini response based on a specific business context.
 */
export function createMockGeminiResponse(
    scenario: 'revenue_growth' | 'churn_risk' | 'pipeline_gap',
    overrides: Partial<GeminiResponse> = {}
): GeminiResponse {
    const scenarios: Record<string, GeminiResponse> = {
        revenue_growth: {
            action: 'new_card',
            card: {
                id: 'card_rev_growth',
                type: 'line_chart',
                headline: 'ARR Growth Trend (YoY)',
                data: {
                    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                    values: [30.2, 34.5, 38.1, 42.0]
                },
                chartConfig: {
                    xAxis: 'Quarter',
                    yAxis: 'ARR ($M)',
                    colors: ['#3B82F6']
                },
                morphHint: 'trace_line'
            },
            audienceSummary: "Revenue is up 38% YoY, primarily driven by enterprise expansion."
        },
        churn_risk: {
            action: 'new_card',
            card: {
                id: 'card_churn',
                type: 'bar_chart',
                headline: 'At-Risk Customer Segments',
                data: {
                    labels: ['Health', 'Logistics', 'Manuf.'],
                    values: [480, 310, 260]
                },
                chartConfig: {
                    xAxis: 'Segment',
                    yAxis: 'Risk ($K)',
                    colors: ['#EF4444']
                },
                morphHint: 'expand_bars'
            },
            audienceSummary: "Lena flagged 3 renewals at risk totaling $1.05M ARR."
        }
    };

    const base = scenarios[scenario] || scenarios.revenue_growth;
    const response = { ...base, ...overrides };
    
    // Validate against schema before returning
    return GeminiResponseSchema.parse(response);
}

/**
 * Simulates a realistic delay/jitter for WebSocket testing.
 */
export const simulateJitter = (min: number = 200, max: number = 800) => 
    new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));
