/**
 * @fileoverview Tests für adminNavigation Config
 * @description Validiert Struktur und Konsistenz der Admin-Navigation.
 */

import { describe, it, expect } from 'vitest';
import { ADMIN_NAV_ITEMS, ADMIN_BACK_LINK } from '../adminNavigation';

describe('adminNavigation', () => {
  describe('ADMIN_NAV_ITEMS', () => {
    it('enthält genau 8 Nav-Items', () => {
      expect(ADMIN_NAV_ITEMS).toHaveLength(8);
    });

    it('hat korrekte Pfade', () => {
      const paths = ADMIN_NAV_ITEMS.map(item => item.path);
      expect(paths).toEqual([
        '/admin',
        '/admin/users',
        '/admin/transactions',
        '/admin/subscribers',
        '/admin/campaigns',
        '/admin/feedbacks',
        '/admin/audit-log',
        '/admin/lifecycle',
      ]);
    });

    it('hat korrekte i18n labelKeys', () => {
      const keys = ADMIN_NAV_ITEMS.map(item => item.labelKey);
      expect(keys).toEqual([
        'admin.nav.dashboard',
        'admin.nav.users',
        'admin.nav.transactions',
        'admin.nav.subscribers',
        'admin.nav.campaigns',
        'admin.nav.feedbacks',
        'admin.nav.auditLog',
        'admin.nav.lifecycle',
      ]);
    });

    it('hat Icons für alle Items', () => {
      ADMIN_NAV_ITEMS.forEach(item => {
        expect(typeof item.icon).toBe('function');
      });
    });

    it('hat end:true nur auf Dashboard', () => {
      expect(ADMIN_NAV_ITEMS[0].end).toBe(true);
      ADMIN_NAV_ITEMS.slice(1).forEach(item => {
        expect(item.end).toBeUndefined();
      });
    });

    it('alle Pfade beginnen mit /admin', () => {
      ADMIN_NAV_ITEMS.forEach(item => {
        expect(item.path.startsWith('/admin')).toBe(true);
      });
    });
  });

  describe('ADMIN_BACK_LINK', () => {
    it('hat korrekten Pfad', () => {
      expect(ADMIN_BACK_LINK.path).toBe('/dashboard');
    });

    it('hat korrekten labelKey', () => {
      expect(ADMIN_BACK_LINK.labelKey).toBe('admin.nav.backToApp');
    });

    it('hat Icon', () => {
      expect(typeof ADMIN_BACK_LINK.icon).toBe('function');
    });
  });
});
