'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const COLORS = {
  left: '#1d4ed8',
  right: '#7c3aed',
  high: '#16a34a',
  mid: '#f59e0b',
  low: '#ef4444',
  elitePie: '#0f766e',
  strongPie: '#06b6d4',
  fairPie: '#f59e0b',
  weakPie: '#f43f5e'
};

export default function ComparisonCharts({ leftName, rightName, leftFlag, rightFlag, validComparisons, matchedComparisons }) {
  const radarData = validComparisons.slice(0, 8).map((item) => {
    const max = Math.max(Math.abs(item.valueA), Math.abs(item.valueB), 1);
    return {
      indicator: item.label,
      [leftName]: Number(((Math.abs(item.valueA) / max) * 100).toFixed(1)),
      [rightName]: Number(((Math.abs(item.valueB) / max) * 100).toFixed(1))
    };
  });

  const closenessData = validComparisons.map((item) => ({
    indicator: item.label,
    closeness: Number(item.closeness.toFixed(1)),
    fill: item.closeness >= 90 ? COLORS.high : item.closeness >= 75 ? COLORS.mid : COLORS.low
  }));

  const valueBars = matchedComparisons.map((item) => ({
    indicator: item.label,
    [leftName]: Number(item.valueA.toFixed(2)),
    [rightName]: Number(item.valueB.toFixed(2))
  }));

  const bucketData = [
    { name: '90-100%', value: validComparisons.filter((i) => i.closeness >= 90).length, fill: COLORS.elitePie },
    { name: '80-89%', value: validComparisons.filter((i) => i.closeness >= 80 && i.closeness < 90).length, fill: COLORS.strongPie },
    { name: '75-79%', value: validComparisons.filter((i) => i.closeness >= 75 && i.closeness < 80).length, fill: COLORS.fairPie },
    { name: '<75%', value: validComparisons.filter((i) => i.closeness < 75).length, fill: COLORS.weakPie }
  ];

  return (
    <section className="mt-8 grid gap-4 lg:grid-cols-2">
      <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <h3 className="mb-2 font-semibold text-slate-800">Profile Shape Radar</h3>
        <p className="mb-3 text-xs text-slate-500">Relative shape across indicators (normalized within each indicator).</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#cbd5e1" />
              <PolarAngleAxis dataKey="indicator" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name={`${leftFlag} ${leftName}`} dataKey={leftName} stroke={COLORS.left} fill={COLORS.left} fillOpacity={0.28} />
              <Radar name={`${rightFlag} ${rightName}`} dataKey={rightName} stroke={COLORS.right} fill={COLORS.right} fillOpacity={0.28} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <h3 className="mb-2 font-semibold text-slate-800">Indicator Closeness</h3>
        <p className="mb-3 text-xs text-slate-500">Color-coded similarity levels for every indicator.</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={closenessData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="indicator" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="closeness" radius={[6, 6, 0, 0]}>
                {closenessData.map((entry) => (
                  <Cell key={entry.indicator} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <h3 className="mb-2 font-semibold text-slate-800">Similarity Mix</h3>
        <p className="mb-3 text-xs text-slate-500">Distribution of indicator similarity tiers.</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={bucketData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                {bucketData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm lg:col-span-2">
        <h3 className="mb-2 font-semibold text-slate-800">High-Match Value Bars (&gt;=75%)</h3>
        <p className="mb-3 text-xs text-slate-500">Absolute value comparison for indicators that pass the match threshold.</p>
        {valueBars.length ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valueBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="indicator" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar name={`${leftFlag} ${leftName}`} dataKey={leftName} fill={COLORS.left} radius={[5, 5, 0, 0]} />
                <Bar name={`${rightFlag} ${rightName}`} dataKey={rightName} fill={COLORS.right} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600">No matches above 75%, so this chart is intentionally hidden.</div>
        )}
      </article>
    </section>
  );
}
