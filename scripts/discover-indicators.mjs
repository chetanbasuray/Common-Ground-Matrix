const BASE = 'https://api.worldbank.org/v2';

const CATEGORIES = {
  education: [
    'school enrollment',
    'learning poverty',
    'student teacher ratio',
    'secondary completion',
    'education expenditure'
  ],
  pollution: [
    'pm2.5',
    'air pollution',
    'water pollution',
    'wastewater',
    'solid waste',
    'noise'
  ],
  water: [
    'drinking water',
    'safely managed drinking water services',
    'water quality',
    'sanitation'
  ],
  health_environment: [
    'mortality attributable to household and ambient air pollution',
    'lead exposure',
    'unsafe water'
  ]
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function searchIndicators(term) {
  const url = `${BASE}/indicator?format=json&per_page=20000`;
  const [, rows] = await fetchJson(url);
  const needle = term.toLowerCase();
  return rows
    .filter((row) => row.name?.toLowerCase().includes(needle))
    .slice(0, 20)
    .map((row) => ({
      id: row.id,
      name: row.name,
      source: row.source?.value || null,
      sourceNote: row.sourceNote || null,
      unit: row.unit || null
    }));
}

async function main() {
  const out = {
    generatedAt: new Date().toISOString(),
    categories: {}
  };

  for (const [category, terms] of Object.entries(CATEGORIES)) {
    const termResults = {};
    for (const term of terms) {
      termResults[term] = await searchIndicators(term);
    }
    out.categories[category] = termResults;
  }

  await writeFile('generated/indicator-discovery.json', JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
import { writeFile } from 'node:fs/promises';
