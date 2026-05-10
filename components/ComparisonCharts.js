'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
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
  left: '#2c84e0',
  right: '#7c44a6',
  high: '#2c8c66',
  mid: '#f7a501',
  low: '#cd4239',
  elitePie: '#2c8c66',
  strongPie: '#2c84e0',
  fairPie: '#f7a501',
  weakPie: '#cd4239'
};

function shortNum(value) {
  if (value === null || value === undefined) return 'N/A';
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(2);
}

export default function ComparisonCharts({
  leftName,
  rightName,
  leftFlag,
  rightFlag,
  validComparisons,
  matchedComparisons,
  trendSeries
}) {
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

  const valueComparisonData = matchedComparisons.map((item) => {
    const max = Math.max(Math.abs(item.valueA), Math.abs(item.valueB), 1);
    const gap = Math.abs(item.valueA - item.valueB);
    return {
      indicator: item.label,
      leftPct: Number(((Math.abs(item.valueA) / max) * 100).toFixed(1)),
      rightPct: Number(((Math.abs(item.valueB) / max) * 100).toFixed(1)),
      gap: Number(((gap / max) * 100).toFixed(1)),
      leftRaw: item.valueA,
      rightRaw: item.valueB,
      unit: item.unit
    };
  });

  const bucketData = [
    { name: '90-100%', value: validComparisons.filter((i) => i.closeness >= 90).length, fill: COLORS.elitePie },
    { name: '80-89%', value: validComparisons.filter((i) => i.closeness >= 80 && i.closeness < 90).length, fill: COLORS.strongPie },
    { name: '75-79%', value: validComparisons.filter((i) => i.closeness >= 75 && i.closeness < 80).length, fill: COLORS.fairPie },
    { name: '<75%', value: validComparisons.filter((i) => i.closeness < 75).length, fill: COLORS.weakPie }
  ];

  return (
    <section className="mt-8 space-y-6">
      <details open className="rounded-2xl border border-slate-200 bg-white/60 p-3">
        <summary className="cursor-pointer list-none text-lg font-semibold text-slate-900">Section 1: Core Similarity</summary>
        <p className="mt-1 text-sm text-slate-600">Snapshot comparisons of how aligned the two countries are right now.</p>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <h3 className="mb-2 font-semibold text-slate-800">Profile Shape Radar</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis dataKey="indicator" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name={`${leftFlag} ${leftName}`} dataKey={leftName} stroke={COLORS.left} fill={COLORS.left} fillOpacity={0.26} isAnimationActive />
                <Radar name={`${rightFlag} ${rightName}`} dataKey={rightName} stroke={COLORS.right} fill={COLORS.right} fillOpacity={0.26} isAnimationActive />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <h3 className="mb-2 font-semibold text-slate-800">Indicator Closeness</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={closenessData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="indicator" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="closeness" radius={[6, 6, 0, 0]} isAnimationActive>
                  {closenessData.map((entry) => (
                    <Cell key={entry.indicator} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-2 font-semibold text-slate-800">Similarity Mix</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bucketData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={96} label isAnimationActive>
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
        </div>
      </details>

      <details open className="rounded-2xl border border-slate-200 bg-white/60 p-3">
        <summary className="cursor-pointer list-none text-lg font-semibold text-slate-900">Section 2: Population Dynamics</summary>
        <p className="mt-1 text-sm text-slate-600">Official historical population and growth series from World Bank (no unofficial 2100 projection).</p>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <h3 className="mb-2 font-semibold text-slate-800">Population Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendSeries.population.history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => shortNum(v)} />
                <Tooltip formatter={(v) => Number(v).toLocaleString('en-US')} />
                <Legend />
                <Area type="monotone" dataKey="left" name={`${leftFlag} ${leftName}`} stroke={COLORS.left} fill={COLORS.left} fillOpacity={0.2} isAnimationActive />
                <Area type="monotone" dataKey="right" name={`${rightFlag} ${rightName}`} stroke={COLORS.right} fill={COLORS.right} fillOpacity={0.2} isAnimationActive />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <h3 className="mb-2 font-semibold text-slate-800">Population Growth Rate Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendSeries.populationGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                <Legend />
                <Line type="monotone" dataKey="left" name={`${leftFlag} ${leftName}`} stroke="#0284c7" dot={false} strokeWidth={2} isAnimationActive />
                <Line type="monotone" dataKey="right" name={`${rightFlag} ${rightName}`} stroke="#d946ef" dot={false} strokeWidth={2} isAnimationActive />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
        </div>
      </details>

      <details open className="rounded-2xl border border-slate-200 bg-white/60 p-3">
        <summary className="cursor-pointer list-none text-lg font-semibold text-slate-900">Section 3: Human Development Over Time</summary>
        <p className="mt-1 text-sm text-slate-600">How digital access and longevity evolve, plus closeness trends.</p>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <h3 className="mb-2 font-semibold text-slate-800">Internet Access Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendSeries.internet}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                <Legend />
                <Line type="monotone" dataKey="left" name={`${leftFlag} ${leftName}`} stroke="#0f766e" dot={false} strokeWidth={2} isAnimationActive />
                <Line type="monotone" dataKey="right" name={`${rightFlag} ${rightName}`} stroke="#f59e0b" dot={false} strokeWidth={2} isAnimationActive />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <h3 className="mb-2 font-semibold text-slate-800">Life Expectancy Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendSeries.lifeExpectancy}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)} years`} />
                <Legend />
                <Line type="monotone" dataKey="left" name={`${leftFlag} ${leftName}`} stroke="#22c55e" dot={false} strokeWidth={2} isAnimationActive />
                <Line type="monotone" dataKey="right" name={`${rightFlag} ${rightName}`} stroke="#f97316" dot={false} strokeWidth={2} isAnimationActive />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-2 font-semibold text-slate-800">Similarity Momentum</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendSeries.similarity.internet.map((d, i) => ({ year: d.year, internet: d.closeness, life: trendSeries.similarity.lifeExpectancy[i]?.closeness }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="internet" name="Internet similarity" fill="#14b8a6" radius={[4, 4, 0, 0]} isAnimationActive />
                <Line dataKey="life" name="Life expectancy similarity" stroke="#f43f5e" dot={false} strokeWidth={2} isAnimationActive />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </article>
        </div>
      </details>

      <details open className="rounded-2xl border border-slate-200 bg-white/60 p-3">
        <summary className="cursor-pointer list-none text-lg font-semibold text-slate-900">Section 4: High-Match Snapshot</summary>
        <p className="mt-1 text-sm text-slate-600">More readable than the old bars: normalized value levels plus explicit gap intensity.</p>
      <article className="mt-3 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm lg:col-span-2">
        <h3 className="mb-2 font-semibold text-slate-800">High-Match Comparison Matrix (&gt;=75%)</h3>
        {valueComparisonData.length ? (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={valueComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="indicator" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={70} />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value, name, ctx) => {
                    if (name.includes(leftName)) return [`${ctx.payload.leftRaw.toFixed(2)} ${ctx.payload.unit}`, name];
                    if (name.includes(rightName)) return [`${ctx.payload.rightRaw.toFixed(2)} ${ctx.payload.unit}`, name];
                    return [`${value}%`, name];
                  }}
                />
                <Legend />
                <Bar name={`${leftFlag} ${leftName} level`} dataKey="leftPct" fill={COLORS.left} radius={[4, 4, 0, 0]} isAnimationActive />
                <Bar name={`${rightFlag} ${rightName} level`} dataKey="rightPct" fill={COLORS.right} radius={[4, 4, 0, 0]} isAnimationActive />
                <Line name="Gap intensity" type="monotone" dataKey="gap" stroke="#cd4239" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600">No matches above 75%, so this panel is intentionally hidden.</div>
        )}
      </article>
      </details>

      <details className="rounded-2xl border border-slate-200 bg-white/60 p-3">
        <summary className="cursor-pointer list-none text-lg font-semibold text-slate-900">Section 5: Education (Collapsible Roadmap)</summary>
        <p className="mt-2 text-sm text-slate-600">Planned: literacy quality, school enrollment, completion rates, student-teacher ratio, learning poverty.</p>
      </details>

      <details className="rounded-2xl border border-slate-200 bg-white/60 p-3">
        <summary className="cursor-pointer list-none text-lg font-semibold text-slate-900">Section 6: Pollution & Environmental Health (Collapsible Roadmap)</summary>
        <p className="mt-2 text-sm text-slate-600">Planned: air quality (PM2.5/AQI), water quality and drinkability, noise pollution exposure, waste treatment, emissions intensity.</p>
      </details>
    </section>
  );
}
