import { ArrowLeftRight, BarChart3, Globe2, Leaf, SignalHigh, SplitSquareVertical } from 'lucide-react';
import ComparisonCharts from '../components/ComparisonCharts';
import {
  compareIndicators,
  formatIndicatorValue,
  getCommonGroundScore,
  getCountries,
  getCountryIndicatorSeries,
  getCountryIndicators,
  getMostSimilar
} from '../lib/worldbank';

const MATCH_THRESHOLD = 75;

const HUMANITY_FACTS = [
  'both spend roughly 33% of their life sleeping.',
  'both blink around 15,000 times in a day.',
  'both need clean water, fresh air, and kind neighbors to thrive.',
  'both are statistically likely to smile at least once today.',
  'both share the same sunrise and moonlight, just in different hours.'
];

function randomFact(countryAName, countryBName) {
  const seed = `${countryAName}-${countryBName}`.length;
  return `Despite different borders, a person in ${countryAName} and ${countryBName} ${HUMANITY_FACTS[seed % HUMANITY_FACTS.length]}`;
}

function getValueWidths(valueA, valueB) {
  if (valueA === null || valueB === null) return { left: 0, right: 0 };
  const max = Math.max(Math.abs(valueA), Math.abs(valueB), 1);
  return {
    left: (Math.abs(valueA) / max) * 100,
    right: (Math.abs(valueB) / max) * 100
  };
}

function getSimilarityBuckets(validComparisons) {
  return {
    elite: validComparisons.filter((c) => c.closeness >= 90).length,
    strong: validComparisons.filter((c) => c.closeness >= 80 && c.closeness < 90).length,
    fair: validComparisons.filter((c) => c.closeness >= 75 && c.closeness < 80).length,
    weak: validComparisons.filter((c) => c.closeness < 75).length
  };
}

function isoToFlag(isoCode) {
  if (!isoCode || isoCode.length !== 2) return '';
  return isoCode
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

function formatGapLabel(deltaPercent, direction) {
  if (deltaPercent < 1) return 'Very similar (<1% difference)';
  return `${deltaPercent.toFixed(1)}% ${direction}`;
}

function buildPopulationProjection(series, fertilityLatest, horizonYear = 2100) {
  if (!series.length) {
    return {
      scenarios: { baseline: [], fertilityAdjusted: [], stability: [] },
      latest: null
    };
  }

  const latest = series[series.length - 1];
  const recent = series.slice(-11);
  const start = recent[0];
  const years = Math.max(1, latest.year - start.year);
  const growthRate = start.value > 0 ? Math.pow(latest.value / start.value, 1 / years) - 1 : 0;

  const fertilityFactor = fertilityLatest && fertilityLatest > 0 ? Math.min(1.15, Math.max(0.45, fertilityLatest / 2.1)) : 1;
  const adjustedGrowthRate = growthRate * fertilityFactor;

  const baseline = [];
  const fertilityAdjusted = [];
  const stability = [];
  for (let year = latest.year + 1; year <= horizonYear; year += 1) {
    baseline.push({ year, value: latest.value * Math.pow(1 + growthRate, year - latest.year) });
    fertilityAdjusted.push({ year, value: latest.value * Math.pow(1 + adjustedGrowthRate, year - latest.year) });
    stability.push({ year, value: latest.value });
  }

  return {
    scenarios: { baseline, fertilityAdjusted, stability },
    latest,
    growthRate,
    adjustedGrowthRate
  };
}

function mergeSeriesByYear(leftSeries, rightSeries, keyA, keyB) {
  const byYear = new Map();
  leftSeries.forEach((item) => {
    byYear.set(item.year, { year: item.year, [keyA]: item.value });
  });
  rightSeries.forEach((item) => {
    const existing = byYear.get(item.year) || { year: item.year };
    existing[keyB] = item.value;
    byYear.set(item.year, existing);
  });
  return [...byYear.values()].sort((a, b) => a.year - b.year);
}

function buildSimilarityTimeline(leftSeries, rightSeries) {
  const merged = mergeSeriesByYear(leftSeries, rightSeries, 'left', 'right');
  return merged
    .filter((item) => item.left !== undefined && item.right !== undefined)
    .map((item) => {
      const max = Math.max(Math.abs(item.left), Math.abs(item.right), 1);
      const closeness = Math.max(0, (1 - Math.abs(item.left - item.right) / max) * 100);
      return { year: item.year, closeness: Number(closeness.toFixed(1)) };
    });
}

function MirrorRow({ item, leftName, rightName, leftFlag, rightFlag }) {
  const widths = getValueWidths(item.valueA, item.valueB);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-slate-700">{item.label}</span>
        <span className="rounded-full bg-sky px-3 py-1 text-xs font-semibold text-pine">
          {item.closeness.toFixed(1)}% alike
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-500">{leftFlag} {leftName}</p>
          <p className="font-medium text-slate-800">{formatIndicatorValue(item.valueA, item.unit)}</p>
        </div>
        <ArrowLeftRight size={16} className="text-pine" />
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{rightFlag} {rightName}</p>
          <p className="font-medium text-slate-800">{formatIndicatorValue(item.valueB, item.unit)}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="h-3 overflow-hidden rounded-full bg-clay/70">
          <div className="h-full rounded-full bg-pine" style={{ width: `${Math.max(8, widths.left)}%`, marginLeft: 'auto' }} />
        </div>
        <div className="h-1 w-6 rounded bg-slate-300" />
        <div className="h-3 overflow-hidden rounded-full bg-clay/70">
          <div className="h-full rounded-full bg-pine" style={{ width: `${Math.max(8, widths.right)}%` }} />
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">Bar lengths represent each country&apos;s value magnitude for this indicator.</p>
    </div>
  );
}

function SimilarityLadder({ items }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-slate-700">
        <BarChart3 size={18} className="text-pine" />
        <h3 className="font-semibold">Similarity Ladder</h3>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.key}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-slate-700">{item.label}</span>
              <span className="font-semibold text-slate-800">{item.closeness.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-pine" style={{ width: `${item.closeness}%` }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function DivergenceChart({ items, leftName, rightName, leftFlag, rightFlag }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-slate-700">
        <SplitSquareVertical size={18} className="text-pine" />
        <h3 className="font-semibold">Dominance Split</h3>
      </div>
      <p className="mb-3 text-xs text-slate-500">Shows who leads each indicator and by how much relative to the pair.</p>
      <div className="space-y-3">
        {items.map((item) => {
          const max = Math.max(Math.abs(item.valueA), Math.abs(item.valueB), 1);
          const delta = ((item.valueA - item.valueB) / max) * 100;
          const rightLead = delta < 0;
          const width = Math.min(100, Math.abs(delta));
          const leadName = rightLead ? rightName : leftName;
          const leadFlag = rightLead ? rightFlag : leftFlag;
          const direction = rightLead ? 'higher' : 'higher';

          return (
            <div key={item.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-slate-700">{item.label}</span>
                <span className="font-semibold text-slate-800">
                  {leadFlag} {leadName} {formatGapLabel(width, direction)}
                </span>
              </div>
              <div className="relative h-3 rounded-full bg-slate-200">
                <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-slate-400" />
                <div
                  className="absolute top-0 h-full rounded-full bg-pine"
                  style={
                    rightLead
                      ? { left: '50%', width: `${width / 2}%` }
                      : { right: '50%', width: `${width / 2}%` }
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function MatchDistribution({ validComparisons }) {
  const buckets = getSimilarityBuckets(validComparisons);
  const total = Math.max(1, validComparisons.length);
  const eliteWidth = (buckets.elite / total) * 100;
  const strongWidth = (buckets.strong / total) * 100;
  const fairWidth = (buckets.fair / total) * 100;
  const weakWidth = (buckets.weak / total) * 100;
  const strongestBand = buckets.elite + buckets.strong;
  const strongestShare = ((strongestBand / total) * 100).toFixed(0);
  const ringStyle = {
    background: `conic-gradient(#0f766e 0 ${eliteWidth}%, #06b6d4 ${eliteWidth}% ${eliteWidth + strongWidth}%, #f59e0b ${eliteWidth + strongWidth}% ${eliteWidth + strongWidth + fairWidth}%, #f43f5e ${eliteWidth + strongWidth + fairWidth}% 100%)`
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <h3 className="font-semibold text-slate-800">Match Distribution</h3>
      <p className="mt-1 text-xs text-slate-500">How similarities are distributed across all indicators.</p>
      <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-4">
        <div className="relative h-20 w-20 rounded-full" style={ringStyle}>
          <div className="absolute inset-2 flex items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-700">
            {strongestShare}%
          </div>
        </div>
        <div className="space-y-1 text-xs text-slate-700">
          <p className="flex items-center justify-between"><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-teal-700" />90-100%</span><span>{buckets.elite}</span></p>
          <p className="flex items-center justify-between"><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-500" />80-89%</span><span>{buckets.strong}</span></p>
          <p className="flex items-center justify-between"><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />75-79%</span><span>{buckets.fair}</span></p>
          <p className="flex items-center justify-between"><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" />&lt;75%</span><span>{buckets.weak}</span></p>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-600">{strongestShare}% of indicators are in the strong/elite similarity bands.</p>
    </article>
  );
}

export default async function Home({ searchParams }) {
  const countries = await getCountries();

  const countryA = searchParams?.a || 'DE';
  const countryB = searchParams?.b || 'JP';

  const countryAName = countries.find((c) => c.id === countryA)?.name || countryA;
  const countryBName = countries.find((c) => c.id === countryB)?.name || countryB;
  const countryAFlag = isoToFlag(countryA);
  const countryBFlag = isoToFlag(countryB);

  const [aData, bData] = await Promise.all([
    getCountryIndicators(countryA),
    getCountryIndicators(countryB)
  ]);
  const [
    populationSeriesA,
    populationSeriesB,
    populationGrowthSeriesA,
    populationGrowthSeriesB,
    fertilitySeriesA,
    fertilitySeriesB,
    internetSeriesA,
    internetSeriesB,
    lifeSeriesA,
    lifeSeriesB
  ] = await Promise.all([
    getCountryIndicatorSeries(countryA, 'SP.POP.TOTL', 1990),
    getCountryIndicatorSeries(countryB, 'SP.POP.TOTL', 1990),
    getCountryIndicatorSeries(countryA, 'SP.POP.GROW', 1990),
    getCountryIndicatorSeries(countryB, 'SP.POP.GROW', 1990),
    getCountryIndicatorSeries(countryA, 'SP.DYN.TFRT.IN', 1990),
    getCountryIndicatorSeries(countryB, 'SP.DYN.TFRT.IN', 1990),
    getCountryIndicatorSeries(countryA, 'IT.NET.USER.ZS', 1990),
    getCountryIndicatorSeries(countryB, 'IT.NET.USER.ZS', 1990),
    getCountryIndicatorSeries(countryA, 'SP.DYN.LE00.IN', 1990),
    getCountryIndicatorSeries(countryB, 'SP.DYN.LE00.IN', 1990)
  ]);

  const comparisons = compareIndicators(aData, bData);
  const validComparisons = comparisons.filter((item) => item.closeness !== null);
  const matchedComparisons = validComparisons
    .filter((item) => item.closeness >= MATCH_THRESHOLD)
    .sort((a, b) => b.closeness - a.closeness);
  const commonGroundScore = getCommonGroundScore(comparisons);
  const topMatches = getMostSimilar(matchedComparisons);
  const fertilityLatestA = fertilitySeriesA[fertilitySeriesA.length - 1]?.value ?? null;
  const fertilityLatestB = fertilitySeriesB[fertilitySeriesB.length - 1]?.value ?? null;
  const popProjectionA = buildPopulationProjection(populationSeriesA, fertilityLatestA, 2100);
  const popProjectionB = buildPopulationProjection(populationSeriesB, fertilityLatestB, 2100);
  const internetSimilarity = buildSimilarityTimeline(internetSeriesA, internetSeriesB);
  const lifeSimilarity = buildSimilarityTimeline(lifeSeriesA, lifeSeriesB);
  const trendSeries = {
      population: {
        history: mergeSeriesByYear(populationSeriesA, populationSeriesB, 'left', 'right'),
        projectionA: popProjectionA.scenarios,
        projectionB: popProjectionB.scenarios,
        latestA: popProjectionA.latest,
        latestB: popProjectionB.latest
      },
      internet: mergeSeriesByYear(internetSeriesA, internetSeriesB, 'left', 'right'),
      lifeExpectancy: mergeSeriesByYear(lifeSeriesA, lifeSeriesB, 'left', 'right'),
      populationGrowth: mergeSeriesByYear(populationGrowthSeriesA, populationGrowthSeriesB, 'left', 'right'),
      similarity: {
        internet: internetSimilarity,
        lifeExpectancy: lifeSimilarity
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <section className="rounded-3xl border border-slate-200/70 bg-white/75 p-6 shadow-lg backdrop-blur md:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <Globe2 className="text-pine" />
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Common Ground Matrix</h1>
        </div>
        <p className="mt-3 max-w-3xl text-slate-600">
          Compare two countries and discover where their realities converge using live World Bank indicators, refreshed daily.
        </p>

        <form className="mt-8 grid gap-4 rounded-2xl bg-sky/50 p-4 md:grid-cols-[1fr_auto_1fr_auto] md:items-end">
          <label className="text-sm font-medium text-slate-700">
            Country A
            <select name="a" defaultValue={countryA} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-pine focus:ring-2">
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>

          <div className="hidden justify-center pb-2 md:flex">
            <ArrowLeftRight className="text-pine" />
          </div>

          <label className="text-sm font-medium text-slate-700">
            Country B
            <select name="b" defaultValue={countryB} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-pine focus:ring-2">
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>

          <button className="rounded-xl bg-pine px-5 py-2.5 font-medium text-white transition hover:brightness-110">Find Common Ground</button>
        </form>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Comparison Hub</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">{countryAFlag} {countryAName} {'<>'} {countryBFlag} {countryBName}</h2>
          <p className="mt-2 text-sm text-slate-600">Mirrored profile based on 10 key indicators.</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Common Ground Score</p>
          <h2 className="mt-1 flex items-baseline gap-2 text-3xl font-semibold text-slate-900">
            {commonGroundScore}
            <span className="text-sm font-medium text-slate-500">/ 100</span>
          </h2>
          <p className="mt-2 text-sm text-slate-600">Average statistical closeness across available datasets.</p>
          <p className="mt-2 text-xs text-slate-500">
            Population now: {formatIndicatorValue(popProjectionA.latest?.value ?? null, 'people')} vs {formatIndicatorValue(popProjectionB.latest?.value ?? null, 'people')}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <p className="text-sm text-slate-500">High-Confidence Matches</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {topMatches.length ? (
              topMatches.map((match) => (
                <li key={match.key} className="flex items-center justify-between">
                  <span>{match.label}</span>
                  <span className="font-semibold">{match.closeness.toFixed(1)}%</span>
                </li>
              ))
            ) : (
              <li className="text-slate-500">No matches above {MATCH_THRESHOLD}%</li>
            )}
          </ul>
        </article>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <MatchDistribution validComparisons={validComparisons} />
        <SimilarityLadder items={validComparisons.slice().sort((a, b) => b.closeness - a.closeness)} />
        <DivergenceChart
          items={validComparisons}
          leftName={countryAName}
          rightName={countryBName}
          leftFlag={countryAFlag}
          rightFlag={countryBFlag}
        />
      </section>

      {validComparisons.length > 0 ? (
        <ComparisonCharts
          leftName={countryAName}
          rightName={countryBName}
          leftFlag={countryAFlag}
          rightFlag={countryBFlag}
          validComparisons={validComparisons}
          matchedComparisons={matchedComparisons}
          trendSeries={trendSeries}
        />
      ) : null}

      <section className="mt-8 space-y-4">
        {matchedComparisons.length ? (
          matchedComparisons.map((item) => (
            <MirrorRow
              key={item.key}
              item={item}
              leftName={countryAName}
              rightName={countryBName}
              leftFlag={countryAFlag}
              rightFlag={countryBFlag}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-center text-slate-600 shadow-sm">
            No matches above {MATCH_THRESHOLD}% for this country pair.
          </div>
        )}
      </section>

      <footer className="mt-10 rounded-2xl border border-pine/20 bg-pine/95 p-5 text-mist shadow-lg">
        <div className="flex items-start gap-3">
          <Leaf className="mt-0.5" size={18} />
          <div>
            <p className="text-sm uppercase tracking-wide text-clay">Shared Humanity</p>
            <p className="mt-1 text-sm md:text-base">{randomFact(countryAName, countryBName)}</p>
          </div>
          <SignalHigh className="ml-auto text-clay" size={18} />
        </div>
      </footer>
    </main>
  );
}
