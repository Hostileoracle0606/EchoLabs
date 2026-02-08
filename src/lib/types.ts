// EchoLens Shared Types

// ========================================
// Aura State Machine Types
// ========================================

export type AuraState =
    | 'idle'
    | 'listening'
    | 'morphing'
    | 'visualizing'
    | 'collapsing';

export interface AuraConfig {
    baseRadius: number;
    distortionAmount: number;
    noiseScale: number;
    breatheSpeed: number;
    audioReactivity: number;
}

// ========================================
// Visualization Types
// ========================================

export type VisualizationType =
    | 'bar_chart'
    | 'line_chart'
    | 'pie_chart'
    | 'area_chart'
    | 'kpi_card'
    | 'table'
    | 'comparison'
    | 'timeline'
    | 'donut';

export type MorphHint =
    | 'expand_bars'
    | 'trace_line'
    | 'segment_pie'
    | 'grid_table'
    | 'pulse_kpi'
    | 'scatter_points';

export interface VisualizationCard {
    id: string;
    type: VisualizationType;
    headline: string;
    data: Record<string, unknown>;
    sourceFile: string;
    chartConfig: ChartConfig;
    morphHint: MorphHint;
    displayDuration?: number;
}

export interface ChartConfig {
    xAxis?: string;
    yAxis?: string;
    dataKey?: string;
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
    valuePrefix?: string;
    valueSuffix?: string;
}

// ========================================
// Session Types
// ========================================

export type SessionStatus = 'DRAFT' | 'LIVE' | 'COMPLETED';

export interface Session {
    id: string;
    title: string;
    description?: string;
    status: SessionStatus;
    userId: string;
    audiencePin?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UploadedFile {
    id: string;
    sessionId: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    parsedData?: ParsedFileData;
    summary?: string;
    createdAt: Date;
}

export interface ParsedFileData {
    sheets?: SheetData[];
    tables?: TableData[];
    metrics?: MetricData[];
    textContent?: string;
}

export interface SheetData {
    name: string;
    columns: string[];
    rowCount: number;
    sample: Record<string, unknown>[];
}

export interface TableData {
    headers: string[];
    rows: string[][];
}

export interface MetricData {
    name: string;
    value: number | string;
    unit?: string;
    trend?: 'up' | 'down' | 'stable';
}

// ========================================
// Transcript Types
// ========================================

export interface TranscriptChunk {
    id: string;
    text: string;
    isFinal: boolean;
    confidence: number;
    timestamp: number;
    words?: TranscriptWord[];
}

export interface TranscriptWord {
    word: string;
    start: number;
    end: number;
    confidence: number;
}

// ========================================
// Gemini Response Types
// ========================================

export type GeminiAction = 'new_card' | 'keep_current' | 'dismiss_current';

export interface GeminiResponse {
    action: GeminiAction;
    card?: Partial<VisualizationCard>;
    audienceSummary?: string;
}

// ========================================
// Real-time Sync Types
// ========================================

export interface SyncState {
    auraState: AuraState;
    currentVisualization: VisualizationCard | null;
    audioLevel: number;
    summaries: SummaryItem[];
}

export interface SummaryItem {
    id: string;
    text: string;
    timestamp: number;
}

// ========================================
// Constants
// ========================================

export const AURA_DEFAULTS: AuraConfig = {
    baseRadius: 150,
    distortionAmount: 20,
    noiseScale: 1.5,
    breatheSpeed: 0.0005,
    audioReactivity: 50,
};

export const COLORS = {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    tertiary: '#F59E0B',
    background: '#0A0A0F',
    foreground: '#FAFAFA',
    muted: '#A1A1AA',
} as const;

export const MORPH_DURATION = {
    fast: 400,
    normal: 600,
    slow: 1000,
} as const;
