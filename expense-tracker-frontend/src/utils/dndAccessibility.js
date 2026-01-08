/**
 * Accessibility helpers for drag & drop.
 */

export const buildAriaDraggableProps = ({ index, total, label }) => ({
  role: 'option',
  'aria-roledescription': 'draggable item',
  'aria-label': label,
  'aria-posinset': index + 1,
  'aria-setsize': total,
  tabIndex: 0,
});

export const buildAriaDroppableProps = ({ label }) => ({
  role: 'listbox',
  'aria-label': label,
});

export const announceMovement = (from, to) => `Item moved from position ${from + 1} to position ${to + 1}.`;

export const vibrateOnDragStart = () => {
  if (navigator?.vibrate) navigator.vibrate(20);
};

export const longPressActivator = (callback, delay = 500) => {
  let timer;
  const start = () => {
    timer = setTimeout(callback, delay);
  };
  const cancel = () => {
    clearTimeout(timer);
  };
  return { start, cancel };
};
