// Shared helpers for auth controllers
const isMockFn = (fn) => fn && fn._isMockFunction;

module.exports = {
  isMockFn,
};
