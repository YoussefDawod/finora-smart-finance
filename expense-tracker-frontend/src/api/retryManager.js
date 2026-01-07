class RetryManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.initialDelay = options.initialDelay || 1000; // 1s
    this.maxDelay = options.maxDelay || 30000; // 30s
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error, statusCode) {
    // Network errors are retryable
    if (error?.name === 'NetworkError') return true;

    // Timeout errors are retryable
    if (error?.name === 'TimeoutError') return true;

    // Check status codes
    return this.retryableStatusCodes.includes(statusCode);
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateDelay(attempt) {
    const delay = Math.min(
      this.initialDelay * Math.pow(this.backoffMultiplier, attempt),
      this.maxDelay
    );

    // Add jitter (±10%)
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    return Math.round(delay + jitter);
  }

  /**
   * Execute with retry
   */
  async executeWithRetry(fn) {
    let lastError;
    let lastStatusCode;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        lastStatusCode = error.statusCode;

        // Check if retryable
        if (!this.isRetryable(error, lastStatusCode)) {
          throw error;
        }

        // Don't retry if last attempt
        if (attempt === this.maxRetries - 1) {
          break;
        }

        // Calculate delay and wait
        const delay = this.calculateDelay(attempt);
        console.warn(
          `[RetryManager] Attempt ${attempt + 1}/${this.maxRetries} failed. ` +
          `Retrying in ${delay}ms...`,
          error.message
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

export const retryManager = new RetryManager({
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
});
