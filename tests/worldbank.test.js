import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  compareIndicators,
  formatIndicatorValue,
  getCommonGroundScore,
  getCountries,
  getCountryIndicatorSeries,
  getCountryIndicators,
  getMostSimilar,
  INDICATORS
} from '../lib/worldbank';

describe('worldbank helpers', () => {
  it('computes closeness and margin correctly', () => {
    const a = [
      { key: 'lifeExpectancy', label: 'Life', value: 80, year: '2023' },
      { key: 'internet', label: 'Internet', value: 90, year: '2023' }
    ];

    const b = [
      { key: 'lifeExpectancy', label: 'Life', value: 76, year: '2023' },
      { key: 'internet', label: 'Internet', value: 72, year: '2023' }
    ];

    const result = compareIndicators(a, b);
    expect(result).toHaveLength(2);
    expect(result[0].closeness).toBeCloseTo(95);
    expect(result[0].withinMargin).toBe(true);
    expect(result[1].withinMargin).toBe(false);
  });

  it('handles missing values in comparisons', () => {
    const a = [{ key: 'co2', label: 'CO2', value: null, year: null }];
    const b = [{ key: 'co2', label: 'CO2', value: 2, year: '2022' }];

    const result = compareIndicators(a, b);
    expect(result[0].closeness).toBeNull();
    expect(result[0].withinMargin).toBe(false);
  });

  it('computes average score from valid indicators only', () => {
    const score = getCommonGroundScore([
      { closeness: 100 },
      { closeness: 80 },
      { closeness: null }
    ]);
    expect(score).toBe(90);
  });

  it('returns zero score when no valid indicators exist', () => {
    const score = getCommonGroundScore([{ closeness: null }, { closeness: null }]);
    expect(score).toBe(0);
  });

  it('handles zero baseline comparisons', () => {
    const result = compareIndicators(
      [{ key: 'x', label: 'Zero A', value: 0, year: '2022' }],
      [{ key: 'x', label: 'Zero B', value: 0, year: '2022' }]
    );
    expect(result[0].closeness).toBe(100);
    expect(result[0].withinMargin).toBe(true);
  });

  it('handles missing matching indicator between countries', () => {
    const result = compareIndicators(
      [{ key: 'lifeExpectancy', label: 'Life', value: 75, year: '2020' }],
      [{ key: 'internet', label: 'Internet', value: 85, year: '2020' }]
    );
    expect(result[0].valueB).toBeNull();
    expect(result[0].closeness).toBeNull();
  });

  it('returns best matching indicators', () => {
    const top = getMostSimilar([
      { key: 'a', closeness: 60 },
      { key: 'b', closeness: 99 },
      { key: 'c', closeness: 85 },
      { key: 'd', closeness: null },
      { key: 'e', closeness: 88 }
    ]);

    expect(top.map((i) => i.key)).toEqual(['b', 'e', 'c']);
  });

  it('formats indicator values and fallbacks', () => {
    expect(formatIndicatorValue(1234.56, 'USD')).toBe('$1,234.6');
    expect(formatIndicatorValue(12.345, '%')).toBe('12.3 %');
    expect(formatIndicatorValue(4.321, '%')).toBe('4.32 %');
    expect(formatIndicatorValue(undefined, '%')).toBe('No recent data');
    expect(formatIndicatorValue(null, '%')).toBe('No recent data');
  });
});

describe('worldbank api integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and filters countries', async () => {
    const mock = vi.spyOn(global, 'fetch').mockResolvedValue(/** @type {any} */ ({
      ok: true,
      json: async () => [
        { page: 1 },
        [
          { id: 'DE', name: 'Germany', region: { value: 'Europe & Central Asia' } },
          { id: 'WLD', name: 'World', region: { value: 'Aggregates' } },
          { id: 'JP', name: 'Japan', region: { value: 'East Asia & Pacific' } }
        ]
      ]
    }));

    const countries = await getCountries();
    expect(countries).toEqual([
      { id: 'DE', name: 'Germany' },
      { id: 'JP', name: 'Japan' }
    ]);
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('returns empty list when api metadata is missing', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(/** @type {any} */ ({
      ok: true,
      json: async () => [null, null]
    }));

    const countries = await getCountries();
    expect(countries).toEqual([]);
  });

  it('fetches all indicators for a country with latest values', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(/** @type {any} */ ({
      ok: true,
      json: async () => [
        { page: 1 },
        [
          { date: '2021', value: null },
          { date: '2020', value: 42.2 }
        ]
      ]
    }));

    const data = await getCountryIndicators('DE');

    expect(data).toHaveLength(INDICATORS.length);
    expect(data[0].value).toBe(42.2);
    expect(data[0].year).toBe('2020');
  });

  it('handles indicator responses with no usable rows', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(/** @type {any} */ ({
      ok: true,
      json: async () => [{ page: 1 }, null]
    }));

    const data = await getCountryIndicators('DE');
    expect(data).toHaveLength(INDICATORS.length);
    expect(data[0].value).toBeNull();
    expect(data[0].year).toBeNull();
  });

  it('fetches historical indicator series and sorts ascending', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(/** @type {any} */ ({
      ok: true,
      json: async () => [
        { page: 1 },
        [
          { date: '2002', value: 30 },
          { date: '2001', value: null },
          { date: '2000', value: 10 }
        ]
      ]
    }));

    const series = await getCountryIndicatorSeries('DE', 'SP.POP.TOTL', 2000);
    expect(series).toEqual([
      { year: 2000, value: 10 },
      { year: 2002, value: 30 }
    ]);
  });

  it('returns empty series when rows are missing', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(/** @type {any} */ ({
      ok: true,
      json: async () => [{ page: 1 }, null]
    }));

    const series = await getCountryIndicatorSeries('DE', 'SP.POP.TOTL', 2000);
    expect(series).toEqual([]);
  });

  it('throws on non-ok responses', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(/** @type {any} */ ({ ok: false, status: 500 }));
    await expect(getCountries()).rejects.toThrow('World Bank API error: 500');
  });
});
