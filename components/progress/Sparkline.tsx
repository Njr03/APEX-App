import Svg, { Circle, Polyline } from 'react-native-svg';

interface SparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

export function Sparkline({
  data,
  color,
  width = 80,
  height = 32,
}: SparklineProps) {
  if (data.length === 0) {
    return <Svg height={height} viewBox={`0 0 ${width} ${height}`} width={width} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(max - min, 1);

  const points = data.map((value, index) => {
    const x =
      data.length === 1
        ? width / 2
        : (index / (data.length - 1)) * (width - 4) + 2;
    const y = height - 4 - ((value - min) / range) * (height - 8);
    return { x, y, value, index };
  });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(' ');
  const last = points[points.length - 1]!;

  const strokeColor =
    color.startsWith('#') && color.length >= 7
      ? `${color}B3`
      : color;

  return (
    <Svg height={height} viewBox={`0 0 ${width} ${height}`} width={width}>
      <Polyline
        fill="none"
        points={polylinePoints}
        stroke={strokeColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <Circle cx={last.x} cy={last.y} fill={color} r={2.5} />
    </Svg>
  );
}
