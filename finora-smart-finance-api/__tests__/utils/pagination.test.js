/**
 * @fileoverview pagination Unit Tests
 * @description Tests für parsePaginationParams
 */

const { parsePaginationParams } = require('../../src/utils/pagination');

describe('parsePaginationParams', () => {
  // ── Standardwerte ───────────────────────────────

  it('gibt Standardwerte ohne Query zurück', () => {
    const result = parsePaginationParams();
    expect(result).toEqual({ page: 1, limit: 50, skip: 0 });
  });

  it('gibt Standardwerte bei leerem Query zurück', () => {
    const result = parsePaginationParams({});
    expect(result).toEqual({ page: 1, limit: 50, skip: 0 });
  });

  // ── Page ────────────────────────────────────────

  it('parst page korrekt', () => {
    const result = parsePaginationParams({ page: '3' });
    expect(result.page).toBe(3);
    expect(result.skip).toBe(100); // (3-1) * 50
  });

  it('setzt minimale page auf 1', () => {
    const result = parsePaginationParams({ page: '0' });
    expect(result.page).toBe(1);
  });

  it('setzt minimale page auf 1 bei negativer Zahl', () => {
    const result = parsePaginationParams({ page: '-5' });
    expect(result.page).toBe(1);
  });

  it('nutzt 1 bei ungültigem page-String', () => {
    const result = parsePaginationParams({ page: 'abc' });
    expect(result.page).toBe(1);
  });

  // ── Limit ───────────────────────────────────────

  it('parst limit korrekt', () => {
    const result = parsePaginationParams({ limit: '25' });
    expect(result.limit).toBe(25);
  });

  it('begrenzt limit auf maxLimit (100)', () => {
    const result = parsePaginationParams({ limit: '500' });
    expect(result.limit).toBe(100);
  });

  it('nutzt defaultLimit bei limit=0 (falsy)', () => {
    const result = parsePaginationParams({ limit: '0' });
    // parseInt('0') ist 0 → falsy → fällt auf defaultLimit (50) zurück
    expect(result.limit).toBe(50);
  });

  it('setzt minimales limit auf 1 bei negativer Zahl', () => {
    const result = parsePaginationParams({ limit: '-10' });
    expect(result.limit).toBe(1);
  });

  it('nutzt defaultLimit bei ungültigem String', () => {
    const result = parsePaginationParams({ limit: 'abc' });
    expect(result.limit).toBe(50);
  });

  // ── Skip-Berechnung ────────────────────────────

  it('berechnet skip korrekt: (page-1) * limit', () => {
    const result = parsePaginationParams({ page: '4', limit: '20' });
    expect(result.skip).toBe(60);
  });

  it('skip ist 0 auf Seite 1', () => {
    const result = parsePaginationParams({ page: '1', limit: '10' });
    expect(result.skip).toBe(0);
  });

  // ── Custom Options ─────────────────────────────

  it('nutzt custom defaultLimit', () => {
    const result = parsePaginationParams({}, { defaultLimit: 20 });
    expect(result.limit).toBe(20);
  });

  it('nutzt custom maxLimit', () => {
    const result = parsePaginationParams({ limit: '200' }, { maxLimit: 200 });
    expect(result.limit).toBe(200);
  });

  it('begrenzt auf custom maxLimit', () => {
    const result = parsePaginationParams({ limit: '100' }, { maxLimit: 30 });
    expect(result.limit).toBe(30);
  });

  it('nutzt defaultLimit wenn maxLimit niedriger', () => {
    const result = parsePaginationParams({}, { defaultLimit: 50, maxLimit: 20 });
    expect(result.limit).toBe(20);
  });

  // ── Edge Cases ─────────────────────────────────

  it('handhabt undefined query Werte', () => {
    const result = parsePaginationParams({ page: undefined, limit: undefined });
    expect(result).toEqual({ page: 1, limit: 50, skip: 0 });
  });

  it('handhabt null query Werte', () => {
    const result = parsePaginationParams({ page: null, limit: null });
    expect(result).toEqual({ page: 1, limit: 50, skip: 0 });
  });

  it('handhabt Dezimalzahlen', () => {
    const result = parsePaginationParams({ page: '2.7', limit: '10.5' });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
  });
});
