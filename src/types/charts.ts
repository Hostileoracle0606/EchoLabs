export type ChartKind = 'bar' | 'pie' | 'metric';

export interface ChartDatum {
  label: string;
  value: number;
}

interface BaseChartSpec {
  kind: ChartKind;
  title: string;
  subtitle?: string;
}

export interface BarChartSpec extends BaseChartSpec {
  kind: 'bar';
  xLabel?: string;
  yLabel?: string;
  data: ChartDatum[];
}

export interface PieChartSpec extends BaseChartSpec {
  kind: 'pie';
  data: ChartDatum[];
}

export interface MetricChartSpec extends BaseChartSpec {
  kind: 'metric';
  value: string;
  trend?: 'up' | 'down' | 'flat';
  detail?: string;
}

export type ChartSpec = BarChartSpec | PieChartSpec | MetricChartSpec;
