/**
 * Helper utility functions
 */

/**
 * Generate unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Deep clone an object
 * @param {Object} obj 
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Group array by key
 * @param {Array} array 
 * @param {string} key 
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

export const getInitials = (name = '') => {
  if (!name.trim()) return '';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
};

export const debounce = (fn, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = (fn, limit = 300) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
};

export const copyToClipboard = async (text) => {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Clipboard copy failed:', error);
    return false;
  }
};

export const getRandomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 50%)`;
};
/**
 * Get random color
 */
export const getRandomColor = () => {
  const colors = [
    '#6366f1', '#ec4899', '#10b981', '#f59e0b', 
    '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Format query params
 * @param {Object} params 
 */
export const formatQueryParams = (params) => {
  return Object.keys(params)
    .filter((key) => params[key] !== null && params[key] !== undefined)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
};
