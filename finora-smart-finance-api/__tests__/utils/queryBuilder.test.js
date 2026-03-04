/**
 * @fileoverview queryBuilder Unit Tests
 * @description Tests für buildUserQuery und buildUserSort
 */

const { buildUserQuery, buildUserSort } = require('../../src/utils/queryBuilder');

// ============================================
// buildUserQuery
// ============================================
describe('buildUserQuery', () => {
  it('gibt leeres Objekt ohne Parameter zurück', () => {
    const query = buildUserQuery();
    expect(query).toEqual({});
  });

  it('gibt leeres Objekt bei leerem String zurück', () => {
    const query = buildUserQuery('');
    expect(query).toEqual({});
  });

  // ── Suche ─────────────────────────────────────

  describe('search', () => {
    it('erstellt $or mit Regex für Name und Email', () => {
      const query = buildUserQuery('alice');
      expect(query.$or).toEqual([
        { name: { $regex: 'alice', $options: 'i' } },
        { email: { $regex: 'alice', $options: 'i' } },
      ]);
    });

    it('escaped Regex-Sonderzeichen', () => {
      const query = buildUserQuery('user.name+test');
      // Punkt und Plus sollten escaped sein
      expect(query.$or[0].name.$regex).toContain('\\.');
      expect(query.$or[0].name.$regex).toContain('\\+');
    });

    it('begrenzt Suchbegriff auf 100 Zeichen', () => {
      const longSearch = 'a'.repeat(200);
      const query = buildUserQuery(longSearch);
      expect(query.$or[0].name.$regex.length).toBeLessThanOrEqual(100);
    });
  });

  // ── isVerified ────────────────────────────────

  describe('isVerified', () => {
    it('setzt isVerified=true für String "true"', () => {
      const query = buildUserQuery('', 'true');
      expect(query.isVerified).toBe(true);
    });

    it('setzt isVerified=false für String "false"', () => {
      const query = buildUserQuery('', 'false');
      expect(query.isVerified).toBe(false);
    });

    it('setzt isVerified=true für Boolean true', () => {
      const query = buildUserQuery('', true);
      expect(query.isVerified).toBe(true);
    });

    it('setzt isVerified=false für anderen String', () => {
      const query = buildUserQuery('', 'xyz');
      expect(query.isVerified).toBe(false);
    });

    it('ignoriert isVerified wenn undefined', () => {
      const query = buildUserQuery('', undefined);
      expect(query).not.toHaveProperty('isVerified');
    });
  });

  // ── role ──────────────────────────────────────

  describe('role', () => {
    it('akzeptiert "user"', () => {
      const query = buildUserQuery('', undefined, 'user');
      expect(query.role).toBe('user');
    });

    it('akzeptiert "admin"', () => {
      const query = buildUserQuery('', undefined, 'admin');
      expect(query.role).toBe('admin');
    });

    it('ignoriert ungültige Rolle', () => {
      const query = buildUserQuery('', undefined, 'superadmin');
      expect(query).not.toHaveProperty('role');
    });

    it('ignoriert leeren String als Rolle', () => {
      const query = buildUserQuery('', undefined, '');
      expect(query).not.toHaveProperty('role');
    });
  });

  // ── isActive ──────────────────────────────────

  describe('isActive', () => {
    it('setzt isActive=true für String "true"', () => {
      const query = buildUserQuery('', undefined, undefined, 'true');
      expect(query.isActive).toBe(true);
    });

    it('setzt isActive=false für String "false"', () => {
      const query = buildUserQuery('', undefined, undefined, 'false');
      expect(query.isActive).toBe(false);
    });

    it('ignoriert isActive wenn undefined', () => {
      const query = buildUserQuery('', undefined, undefined, undefined);
      expect(query).not.toHaveProperty('isActive');
    });
  });

  // ── Kombiniert ────────────────────────────────

  describe('kombinierte Filter', () => {
    it('kombiniert alle Filter korrekt', () => {
      const query = buildUserQuery('test', 'true', 'admin', 'false');
      expect(query.$or).toBeDefined();
      expect(query.isVerified).toBe(true);
      expect(query.role).toBe('admin');
      expect(query.isActive).toBe(false);
    });

    it('kombiniert ohne Suche', () => {
      const query = buildUserQuery('', 'false', 'user', 'true');
      expect(query.$or).toBeUndefined();
      expect(query.isVerified).toBe(false);
      expect(query.role).toBe('user');
      expect(query.isActive).toBe(true);
    });
  });
});

// ============================================
// buildUserSort
// ============================================
describe('buildUserSort', () => {
  it('sortiert nach createdAt desc als Standard', () => {
    const sort = buildUserSort();
    expect(sort).toEqual({ createdAt: -1 });
  });

  describe('erlaubte Felder', () => {
    const erlaubt = ['createdAt', 'name', 'email', 'lastLogin', 'isVerified', 'role', 'isActive'];

    erlaubt.forEach((field) => {
      it(`akzeptiert "${field}"`, () => {
        const sort = buildUserSort(field, 'asc');
        expect(sort).toEqual({ [field]: 1 });
      });
    });
  });

  it('fällt auf createdAt zurück bei ungültigem Feld', () => {
    const sort = buildUserSort('hacker', 'asc');
    expect(sort).toEqual({ createdAt: 1 });
  });

  it('nutzt -1 bei "desc"', () => {
    const sort = buildUserSort('name', 'desc');
    expect(sort).toEqual({ name: -1 });
  });

  it('nutzt -1 bei unbekannter Sortierreihenfolge', () => {
    const sort = buildUserSort('name', 'random');
    expect(sort).toEqual({ name: -1 });
  });

  it('nutzt 1 nur bei "asc"', () => {
    const sort = buildUserSort('email', 'asc');
    expect(sort).toEqual({ email: 1 });
  });
});
