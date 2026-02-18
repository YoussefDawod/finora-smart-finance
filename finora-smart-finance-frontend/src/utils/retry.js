/**
 * Retry utility for async operations
 * @param {Function} task - async function to execute
 * @param {Object} options
 * @param {number} [options.retries=2] - number of retries after first attempt
 * @param {number} [options.delay=400] - initial delay in ms
 * @param {number} [options.factor=2] - backoff factor
 * @param {Function} [options.shouldRetry] - predicate for retry
 * @param {Function} [options.onRetry] - callback before retry
 * @returns {Promise<any>}
 */
export async function retryAsync(
  task,
  { retries = 2, delay = 400, factor = 2, shouldRetry, onRetry } = {}
) {
  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt >= retries;
      const canRetry = typeof shouldRetry === 'function' ? shouldRetry(error) : true;

      if (isLastAttempt || !canRetry) {
        throw error;
      }

      const wait = Math.round(delay * Math.pow(factor, attempt));
      if (typeof onRetry === 'function') {
        onRetry({ attempt: attempt + 1, delay: wait, error });
      }

      await new Promise((resolve) => setTimeout(resolve, wait));
      attempt += 1;
    }
  }

  throw lastError;
}

export default retryAsync;
