/**
 * @fileoverview Time-of-day greeting utility
 * @description Returns a greeting key and icon component based on the current hour
 */

import { FiSun, FiSunrise, FiSunset, FiMoon } from 'react-icons/fi';

/**
 * Returns a time-of-day key for i18n greeting
 * @returns {'morning' | 'afternoon' | 'evening' | 'night'}
 */
export const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
};

/**
 * Returns a Feather Icon component for the time of day
 * @param {'morning' | 'afternoon' | 'evening' | 'night'} timeOfDay
 * @returns {import('react').ComponentType}
 */
export const getTimeIcon = (timeOfDay) => {
  const icons = {
    morning: FiSunrise,
    afternoon: FiSun,
    evening: FiSunset,
    night: FiMoon,
  };
  return icons[timeOfDay] || FiSun;
};