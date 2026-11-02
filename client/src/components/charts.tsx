import { View, Text, Dimensions } from 'react-native';
import Svg, { Path, Circle, Polyline, Line, Text as SvgText } from 'react-native-svg';

const PALETTE = ['#0a7ea4', '#f5a623', '#2e7d32', '#c62828', '#6a1b9a', '#00838f', '#8d6e63'];

export function PieChart({ data, size = 170 }: { data: { label: string; value: number }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <Text style={{ color: '#666' }}>No bookings in this period.</Text>;

  const r = size / 2;
  let a0 = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const color = PALETTE[i % PALETTE.length];
    if (data.length === 1) return <Circle key={i} cx={r} cy={r} r={r} fill={color} />; // a single arc can't draw a full circle
    const a1 = a0 + (d.value / total) * Math.PI * 2;
    const path = `M${r},${r} L${r + r * Math.cos(a0)},${r + r * Math.sin(a0)} ` +
      `A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${r + r * Math.cos(a1)},${r + r * Math.sin(a1)} Z`;
    a0 = a1;
    return <Path key={i} d={path} fill={color} />;
  });

  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      <Svg width={size} height={size}>{slices}</Svg>
      <View style={{ alignSelf: 'stretch', gap: 4 }}>
        {data.map((d, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: PALETTE[i % PALETTE.length] }} />
            <Text style={{ flex: 1 }} numberOfLines={1}>{d.label}</Text>
            <Text>{d.value} ({Math.round((d.value / total) * 100)}%)</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

type Point = { date: string; confirmed: number; cancelled: number };

export function TrendChart({ data, width }: { data: Point[]; width?: number }) {
  const W = width ?? Dimensions.get('window').width - 32, H = 170, L = 28, R = 8, T = 8, B = 22;
  const n = data.length;
  const max = Math.max(1, ...data.flatMap((d) => [d.confirmed, d.cancelled]));
  const x = (i: number) => L + (n === 1 ? 0 : (i * (W - L - R)) / (n - 1));
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const line = (k: 'confirmed' | 'cancelled') => data.map((d, i) => `${x(i)},${y(d[k])}`).join(' ');
  const ticks = [...new Set([0, Math.floor((n - 1) / 2), n - 1])];

  return (
    <View style={{ gap: 6 }}>
      <Svg width={W} height={H}>
        <Line x1={L} y1={y(0)} x2={W - R} y2={y(0)} stroke="#ccc" />
        <Line x1={L} y1={y(max)} x2={W - R} y2={y(max)} stroke="#eee" />
        <SvgText x={L - 4} y={y(max) + 4} fontSize="10" textAnchor="end" fill="#666">{max}</SvgText>
        <SvgText x={L - 4} y={y(0) + 4} fontSize="10" textAnchor="end" fill="#666">0</SvgText>
        <Polyline points={line('confirmed')} fill="none" stroke="#2e7d32" strokeWidth={2} />
        <Polyline points={line('cancelled')} fill="none" stroke="#c62828" strokeWidth={2} />
     
        {n <= 31 && data.map((d, i) => <Circle key={`c${i}`} cx={x(i)} cy={y(d.confirmed)} r={2.5} fill="#2e7d32" />)}
        {n <= 31 && data.map((d, i) => <Circle key={`x${i}`} cx={x(i)} cy={y(d.cancelled)} r={2.5} fill="#c62828" />)}
        {ticks.map((i) => (
          <SvgText key={i} x={x(i)} y={H - 6} fontSize="10" fill="#666"
            textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>{data[i].date.slice(5)}</SvgText>
        ))}
      </Svg>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Text style={{ color: '#2e7d32' }}>● Confirmed (paid)</Text>
        <Text style={{ color: '#c62828' }}>● Cancelled by customer</Text>
      </View>
    </View>
  );
}