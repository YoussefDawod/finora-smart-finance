/**
 * @fileoverview Greeting Utility Tests
 * @description Tests für getTimeOfDay und getTimeIcon
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { getTimeOfDay, getTimeIcon } from '@/utils/getGreeting';

describe('getGreeting', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // ──────────────────────────────────────────────────────────
  // getTimeOfDay
  // ──────────────────────────────────────────────────────────
  describe('getTimeOfDay', () => {
    it.each([
      [6, 'morning'],
      [9, 'morning'],
      [11, 'morning'],
      [12, 'afternoon'],
      [15, 'afternoon'],
      [17, 'afternoon'],
      [18, 'evening'],
      [20, 'evening'],
      [21, 'evening'],
      [22, 'night'],
      [23, 'night'],
      [0, 'night'],
      [3, 'night'],
      [5, 'night'],
    ])('hour %i → "%s"', (hour, expected) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 5, 15, hour, 0, 0));
      expect(getTimeOfDay()).toBe(expected);
    });
  });

  // ──────────────────────────────────────────────────────────
  // getTimeIcon
  // ──────────────────────────────────────────────────────────
  describe('getTimeIcon', () => {
    it('returns a React component for each time of day', () => {
      const timesOfDay = ['morning', 'afternoon', 'evening', 'night'];
      for (const tod of timesOfDay) {
        const Icon = getTimeIcon(tod);
        expect(typeof Icon).toBe('function'); // React component
      }
    });

    it('returns different icons for different times', () => {
      const icons = ['morning', 'afternoon', 'evening', 'night'].map(getTimeIcon);
      const unique = new Set(icons);
      expect(unique.size).toBe(4);
    });

    it('returns fallback icon for unknown value', () => {
      const Icon = getTimeIcon('unknown');
      expect(typeof Icon).toBe('function');
    });
  });
});
