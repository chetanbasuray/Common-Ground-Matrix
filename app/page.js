import { ArrowLeftRight, Globe2, Leaf, SignalHigh } from 'lucide-react';
import {
  compareIndicators,
  formatIndicatorValue,
  getCommonGroundScore,
  getCountries,
  getCountryIndicators,
  getMostSimilar
} from '../lib/worldbank';

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

function PyramidRow({ label, leftValue, rightValue, closeness, leftName, rightName }) {
  const leftWidth = Math.max(8, Math.min(100, closeness || 8));
  const rightWidth = Math.max(8, Math.min(100, closeness || 8));

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="rounded-full bg-sky px-3 py-1 text-xs font-semibold text-pine">
          {closeness ? `${closeness.toFixed(1)}% alike` : 'No overlap data'}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-500">{leftName}</p>
          <p className="font-medium text-slate-800">{leftValue}</p>
        </div>
        <ArrowLeftRight size={16} className="text-pine" />
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{rightName}</p>
          <p className="font-medium text-slate-800">{rightValue}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="h-3 overflow-hidden rounded-full bg-clay/70">
          <div className="h-full rounded-full bg-pine" style={{ width: `${leftWidth}%`, marginLeft: 'auto' }} />
        </div>
        <div className="h-1 w-6 rounded bg-slate-300" />
        <div className="h-3 overflow-hidden rounded-full bg-clay/70">
          <div className="h-full rounded-full bg-pine" style={{ width: `${rightWidth}%` }} />
        </div>
      </div>
    </div>
  );
}

export default async function Home({ searchParams }) {
  const countries = await getCountries();

  const countryA = searchParams?.a || 'DE';
  const countryB = searchParams?.b || 'JP';

  const countryAName = countries.find((c) => c.id === countryA)?.name || countryA;
  const countryBName = countries.find((c) => c.id === countryB)?.name || countryB;

  const [aData, bData] = await Promise.all([
    getCountryIndicators(countryA),
    getCountryIndicators(countryB)
  ]);

  const comparisons = compareIndicators(aData, bData);
  const commonGroundScore = getCommonGroundScore(comparisons);
  const topMatches = getMostSimilar(comparisons);

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
          <h2 className="mt-1 text-xl font-semibold text-slate-900">{countryAName} {'<>'} {countryBName}</h2>
          <p className="mt-2 text-sm text-slate-600">Mirrored profile based on 10 key indicators.</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Common Ground Score</p>
          <h2 className="mt-1 flex items-baseline gap-2 text-3xl font-semibold text-slate-900">
            {commonGroundScore}
            <span className="text-sm font-medium text-slate-500">/ 100</span>
          </h2>
          <p className="mt-2 text-sm text-slate-600">Average statistical closeness across available datasets.</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Closest Shared Indicators</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {topMatches.map((match) => (
              <li key={match.key} className="flex items-center justify-between">
                <span>{match.label}</span>
                <span className="font-semibold">{match.closeness.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mt-8 space-y-4">
        {comparisons.map((item) => (
          <PyramidRow
            key={item.key}
            label={item.label}
            leftValue={formatIndicatorValue(item.valueA, item.unit)}
            rightValue={formatIndicatorValue(item.valueB, item.unit)}
            closeness={item.closeness}
            leftName={countryAName}
            rightName={countryBName}
          />
        ))}
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
