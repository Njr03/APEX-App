export const VOLUME_CHART_VIEWBOX = { width: 580, height: 200 } as const;
export const VOLUME_CHART_PADDING = {
  left: 44,
  right: 10,
  top: 10,
  bottom: 28,
} as const;

export const VOLUME_GRID_LEVELS = [6_000, 8_000, 10_000, 12_000, 14_000];

export function volumeChartBounds() {
  const chartLeft = VOLUME_CHART_PADDING.left;
  const chartRight = VOLUME_CHART_VIEWBOX.width - VOLUME_CHART_PADDING.right;
  const chartTop = VOLUME_CHART_PADDING.top;
  const chartBottom =
    VOLUME_CHART_VIEWBOX.height - VOLUME_CHART_PADDING.bottom;

  return {
    chartLeft,
    chartRight,
    chartTop,
    chartBottom,
    chartWidth: chartRight - chartLeft,
    chartHeight: chartBottom - chartTop,
  };
}

export function volumeChartX(index: number, count: number): number {
  const { chartLeft, chartWidth } = volumeChartBounds();
  if (count <= 1) return chartLeft + chartWidth / 2;
  return chartLeft + (index / (count - 1)) * chartWidth;
}

export function volumeChartY(
  value: number,
  min = 6_000,
  max = 14_000,
): number {
  const { chartTop, chartBottom, chartHeight } = volumeChartBounds();
  const clamped = Math.min(max, Math.max(min, value));
  const t = (clamped - min) / (max - min);
  return chartBottom - t * chartHeight;
}

export function formatVolumeAxisLabel(value: number): string {
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return String(value);
}

export interface ChartPoint {
  x: number;
  y: number;
  index: number;
  value: number;
}

export function buildVolumeChartPoints(values: number[]): ChartPoint[] {
  return values.map((value, index) => ({
    index,
    value,
    x: volumeChartX(index, values.length),
    y: volumeChartY(value),
  }));
}

export interface LineSegment {
  path: string;
  points: ChartPoint[];
}

/** Line segments broken at zero values (missed weeks). */
export function buildLineSegments(points: ChartPoint[]): LineSegment[] {
  const segments: LineSegment[] = [];
  let currentPoints: ChartPoint[] = [];

  const flush = () => {
    if (currentPoints.length === 0) return;
    const path = currentPoints
      .map((point, index) =>
        `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`,
      )
      .join(' ');
    segments.push({ path, points: [...currentPoints] });
    currentPoints = [];
  };

  for (const point of points) {
    if (point.value <= 0) {
      flush();
      continue;
    }
    currentPoints.push(point);
  }

  flush();
  return segments;
}

export function buildAreaPath(
  segment: LineSegment,
  chartBottom: number,
): string {
  if (segment.points.length === 0) return '';

  const first = segment.points[0]!;
  const last = segment.points[segment.points.length - 1]!;

  return `${segment.path} L ${last.x},${chartBottom} L ${first.x},${chartBottom} Z`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;
  const int = Number.parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
