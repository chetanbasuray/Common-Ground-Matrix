'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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

  const valueBars = matchedComparisons.map((item) => {
    const max = Math.max(Math.abs(item.valueA), Math.abs(item.valueB), 1);
    return {
      indicator: item.label,
      leftNormalized: Number(((Math.abs(item.valueA) / max) * 100).toFixed(1)),
      rightNormalized: Number(((Math.abs(item.valueB) / max) * 100).toFixed(1)),
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
  const popProjectionData = trendSeries.population.history.map((item) => ({
    year: item.year,
    left: item.left,
    right: item.right
  }));
  trendSeries.population.projectionA.baseline.forEach((item) => {
    popProjectionData.push({ year: item.year, leftBaseline: item.value });
  });
  trendSeries.population.projectionA.fertilityAdjusted.forEach((item) => {
    const found = popProjectionData.find((p) => p.year === item.year);
    if (found) found.leftFertilityAdjusted = item.value;
  });
  trendSeries.population.projectionA.stability.forEach((item) => {
    const found = popProjectionData.find((p) => p.year === item.year);
    if (found) found.leftStability = item.value;
  });
  trendSeries.population.projectionB.baseline.forEach((item) => {
    const found = popProjectionData.find((p) => p.year === item.year);
    if (found) {
      found.rightBaseline = item.value;
    } else {
      popProjectionData.push({ year: item.year, rightBaseline: item.value });
    }
  });
  trendSeries.population.projectionB.fertilityAdjusted.forEach((item) => {
    const found = popProjectionData.find((p) => p.year === item.year);
    if (found) found.rightFertilityAdjusted = item.value;
  });
  trendSeries.population.projectionB.stability.forEach((item) => {
    const found = popProjectionData.find((p) => p.year === item.year);
    if (found) found.rightStability = item.value;
  });
  popProjectionData.sort((a, b) => a.year - b.year);

  return (
    <section className="mt-8 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Section 1: Core Similarity</h3>
        <p className="text-sm text-slate-600">Snapshot comparisons of how aligned the two countries are right now.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
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
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900">Section 2: Population Dynamics</h3>
        <p className="text-sm text-slate-600">Historical population behavior and scenario-based pathways to 2100.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm lg:col-span-2">
        <h3 className="mb-2 font-semibold text-slate-800">Population Path to 2100 (Scenario View)</h3>
        <p className="mb-3 text-xs text-slate-500">Solid lines are historical. Dashed = baseline trend, dotted = fertility-adjusted trend, thin solid = stability scenario.</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={popProjectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `${(value / 1_000_000).toFixed(0)}M`} />
              <Tooltip formatter={(value) => Number(value).toLocaleString('en-US')} />
              <Legend />
              <Line type="monotone" dataKey="left" name={`${leftFlag} ${leftName} historical`} stroke="#1d4ed8" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="right" name={`${rightFlag} ${rightName} historical`} stroke="#7c3aed" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="leftBaseline" name={`${leftFlag} ${leftName} baseline`} stroke="#0ea5e9" strokeDasharray="6 6" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="rightBaseline" name={`${rightFlag} ${rightName} baseline`} stroke="#ec4899" strokeDasharray="6 6" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="leftFertilityAdjusted" name={`${leftFlag} ${leftName} fertility-adjusted`} stroke="#0369a1" strokeDasharray="2 4" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="rightFertilityAdjusted" name={`${rightFlag} ${rightName} fertility-adjusted`} stroke="#be185d" strokeDasharray="2 4" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="leftStability" name={`${leftFlag} ${leftName} stability`} stroke="#38bdf8" dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="rightStability" name={`${rightFlag} ${rightName} stability`} stroke="#f9a8d4" dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <h3 className="mb-2 font-semibold text-slate-800">Population Growth Rate Over Time</h3>
        <p className="mb-3 text-xs text-slate-500">Annual population growth rates from World Bank historical records.</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendSeries.populationGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
              <Legend />
              <Line type="monotone" dataKey="left" name={`${leftFlag} ${leftName}`} stroke="#0284c7" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="right" name={`${rightFlag} ${rightName}`} stroke="#d946ef" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900">Section 3: Human Development Over Time</h3>
        <p className="text-sm text-slate-600">Long-run shifts in internet access and longevity.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <h3 className="mb-2 font-semibold text-slate-800">Internet Access Over Time</h3>
        <p className="mb-3 text-xs text-slate-500">How internet adoption changed across the years.</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendSeries.internet}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
              <Legend />
              <Line type="monotone" dataKey="left" name={`${leftFlag} ${leftName}`} stroke="#0f766e" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="right" name={`${rightFlag} ${rightName}`} stroke="#f59e0b" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <h3 className="mb-2 font-semibold text-slate-800">Life Expectancy Over Time</h3>
        <p className="mb-3 text-xs text-slate-500">Comparative trajectory of average lifespan.</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendSeries.lifeExpectancy}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip formatter={(value) => `${Number(value).toFixed(1)} years`} />
              <Legend />
              <Line type="monotone" dataKey="left" name={`${leftFlag} ${leftName}`} stroke="#22c55e" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="right" name={`${rightFlag} ${rightName}`} stroke="#f97316" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <h3 className="mb-2 font-semibold text-slate-800">Similarity Over Time</h3>
        <p className="mb-3 text-xs text-slate-500">Tracks whether both countries stayed close across decades.</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" type="number" domain={['dataMin', 'dataMax']} tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
              <Legend />
              <Line data={trendSeries.similarity.internet} type="monotone" dataKey="closeness" name="Internet Similarity" stroke="#14b8a6" dot={false} strokeWidth={2} />
              <Line data={trendSeries.similarity.lifeExpectancy} type="monotone" dataKey="closeness" name="Life Expectancy Similarity" stroke="#f43f5e" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900">Section 4: High-Match Snapshot</h3>
        <p className="text-sm text-slate-600">Only indicators that clear the 75% similarity threshold.</p>
      </div>
      <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm lg:col-span-2">
        <h3 className="mb-2 font-semibold text-slate-800">High-Match Value Bars (&gt;=75%)</h3>
        <p className="mb-3 text-xs text-slate-500">Normalized per-indicator (0-100) so different units remain visible.</p>
        {valueBars.length ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valueBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="indicator" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value, name, ctx) => {
                    if (name === `${leftFlag} ${leftName}`) {
                      return [`${ctx.payload.leftRaw.toFixed(2)} ${ctx.payload.unit}`, `${leftFlag} ${leftName}`];
                    }
                    return [`${ctx.payload.rightRaw.toFixed(2)} ${ctx.payload.unit}`, `${rightFlag} ${rightName}`];
                  }}
                />
                <Legend />
                <Bar name={`${leftFlag} ${leftName}`} dataKey="leftNormalized" fill={COLORS.left} radius={[5, 5, 0, 0]} />
                <Bar name={`${rightFlag} ${rightName}`} dataKey="rightNormalized" fill={COLORS.right} radius={[5, 5, 0, 0]} />
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
