const BASE_URL = 'https://api.worldbank.org/v2';
const ONE_DAY = 86400;

export const INDICATORS = [
  { key: 'lifeExpectancy', label: 'Life Expectancy', code: 'SP.DYN.LE00.IN', unit: 'years' },
  { key: 'electricity', label: 'Access to Electricity', code: 'EG.ELC.ACCS.ZS', unit: '%' },
  { key: 'literacy', label: 'Literacy Rate', code: 'SE.ADT.LITR.ZS', unit: '%' },
  { key: 'urbanPopulation', label: 'Urban Population', code: 'SP.URB.TOTL.IN.ZS', unit: '%' },
  { key: 'forestArea', label: 'Forest Area', code: 'AG.LND.FRST.ZS', unit: '%' },
  { key: 'internet', label: 'Individuals Using Internet', code: 'IT.NET.USER.ZS', unit: '%' },
  { key: 'gdpPerCapita', label: 'GDP Per Capita', code: 'NY.GDP.PCAP.CD', unit: 'USD' },
  { key: 'infantMortality', label: 'Infant Mortality', code: 'SP.DYN.IMRT.IN', unit: 'per 1k births' },
  { key: 'fertility', label: 'Fertility Rate', code: 'SP.DYN.TFRT.IN', unit: 'births/woman' },
  { key: 'co2', label: 'CO2 Emissions', code: 'EN.ATM.CO2E.PC', unit: 'tons/person' }
];

async function fetchJson(url) {
  const response = await fetch(url, {
    next: { revalidate: ONE_DAY }
  });

  if (!response.ok) {
    throw new Error(`World Bank API error: ${response.status}`);
  }

  return response.json();
}

function getLatestValue(rows) {
  if (!Array.isArray(rows)) return null;
  for (const row of rows) {
    if (row?.value !== null && row?.value !== undefined) {
      return {
        value: Number(row.value),
        year: row.date
      };
    }
  }
  return null;
}

export async function getCountries() {
  const url = `${BASE_URL}/country?format=json&per_page=400`;
  const [meta, rows] = await fetchJson(url);

  if (!meta || !rows) return [];

  return rows
    .filter((country) => country.region?.value !== 'Aggregates')
    .map((country) => ({
      id: country.id,
      name: country.name
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCountryIndicators(countryIso) {
  const indicatorData = await Promise.all(
    INDICATORS.map(async (indicator) => {
      const url = `${BASE_URL}/country/${countryIso}/indicator/${indicator.code}?format=json&per_page=70`;
      const [, rows] = await fetchJson(url);
      const latest = getLatestValue(rows);
      return {
        ...indicator,
        value: latest?.value ?? null,
        year: latest?.year ?? null
      };
    })
  );

  return indicatorData;
}

export function compareIndicators(countryAData, countryBData) {
  return countryAData.map((itemA) => {
    const itemB = countryBData.find((entry) => entry.key === itemA.key);

    if (!itemB || itemA.value === null || itemB.value === null) {
      return {
        ...itemA,
        valueA: itemA.value,
        valueB: itemB?.value ?? null,
        closeness: null,
        withinMargin: false
      };
    }

    const higher = Math.max(Math.abs(itemA.value), Math.abs(itemB.value));
    const diff = Math.abs(itemA.value - itemB.value);
    const closeness = higher === 0 ? 100 : Math.max(0, (1 - diff / higher) * 100);

    return {
      ...itemA,
      valueA: itemA.value,
      valueB: itemB.value,
      yearA: itemA.year,
      yearB: itemB.year,
      closeness,
      withinMargin: closeness >= 90
    };
  });
}

export function getCommonGroundScore(comparisons) {
  const valid = comparisons.filter((entry) => entry.closeness !== null);
  if (!valid.length) return 0;

  const avg = valid.reduce((sum, item) => sum + item.closeness, 0) / valid.length;
  return Number(avg.toFixed(1));
}

export function getMostSimilar(comparisons) {
  return comparisons
    .filter((item) => item.closeness !== null)
    .sort((a, b) => b.closeness - a.closeness)
    .slice(0, 3);
}

export function formatIndicatorValue(value, unit) {
  if (value === null || value === undefined) return 'No recent data';

  const maxFraction = Math.abs(value) < 10 ? 2 : 1;
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maxFraction
  }).format(value);

  return unit === 'USD' ? `$${formatted}` : `${formatted} ${unit}`;
}
