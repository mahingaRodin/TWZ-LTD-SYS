import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const TOOLTIP_STYLE = {
  background: '#1B232D',
  border: '1px solid #2D3748',
  borderRadius: 8,
  color: '#F8FAFC',
};

const CURSOR_FILL = 'rgba(42, 157, 143, 0.15)';

interface ReportBarChartProps {
  data: { name: string; count: number }[];
  colors?: string[];
  singleColor?: string;
}

export function ReportBarChart({ data, colors, singleColor = '#2A9D8F' }: ReportBarChartProps) {
  const multi = Boolean(colors?.length);

  return (
    <div className="chart-dark h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={{ stroke: '#2D3748' }}
            tickLine={{ stroke: '#2D3748' }}
          />
          <YAxis
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            axisLine={{ stroke: '#2D3748' }}
            tickLine={{ stroke: '#2D3748' }}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: CURSOR_FILL }}
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: '#F8FAFC', fontWeight: 600 }}
            itemStyle={{ color: singleColor }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} fill={singleColor}>
            {multi &&
              colors!.map((color, i) => (
                <Cell key={i} fill={color} />
              ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
