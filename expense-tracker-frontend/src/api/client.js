/**
 * APIClient - Vereinfachter HTTP Client
 * Handles alle API-Kommunikation mit Fehlerbehandlung
 */

import { APIError, NetworkError, TimeoutError } from '../utils/errors';
import { cacheManager } from './cacheManager';
import { requestDeduplicator } from './requestDeduplicator';
import { retryManager } from './retryManager';

class APIClient {
  constructor(baseURL, timeout = 30000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };

    // Runtime state
    this.authToken = null;
    this.refreshHandler = null;

    // Shared utilities
    this.cache = cacheManager;
    this.requestDeduplicator = requestDeduplicator;
    this.retryManager = retryManager;
  }

  /**
   * Attach/clear bearer token used for authenticated requests
   */
  setAuthToken(token) {
    this.authToken = token;

    if (token) {
      this.defaultHeaders.Authorization = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders.Authorization;
    }
  }

  /**
   * Register async refresh handler (called on 401)
   */
  setRefreshHandler(handler) {
    this.refreshHandler = handler;
  }

  /**
   * Build Full URL with Query Parameters
   */
  buildURL(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, value);
      }
    });
    return url.toString();
  }

  /**
   * Fetch with Timeout
   */
  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new TimeoutError('Request timeout', this.timeout);
      }
      throw error;
    }
  }

  /**
   * Handle Response & Parse JSON
   */
  async handleResponse(response) {
    let data;
    try {
      data = await response.json();
    } catch {
      if (!response.ok) {
        throw new APIError(`HTTP ${response.status}`, response.status, response.url);
      }
      data = { success: true };
    }

    if (!response.ok) {
      throw new APIError(
        data.error || `HTTP ${response.status}`,
        response.status,
        response.url,
        data
      );
    }

    return data;
  }

  /**
   * Execute HTTP request with optional caching, retry & refresh support
   */
  async request(method, endpoint, {
    params = {},
    body = undefined,
    headers = {},
    cache = false,
    forceRefresh = false,
    retry = true,
  } = {}) {
    const url = this.buildURL(endpoint, params);
    const cacheKey = this.cache.generateKey(endpoint, params);

    if (cache && !forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const dedupKey = `${method}:${cacheKey}:${body ? JSON.stringify(body) : ''}`;

    const executeFetch = async () => {
      const response = await this.fetchWithTimeout(url, {
        method,
        headers: {
          ...this.defaultHeaders,
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      // Auto-refresh on unauthorized
      if (response.status === 401 && this.refreshHandler) {
        const newToken = await this.refreshHandler();
        if (newToken) {
          this.setAuthToken(newToken);

          return this.fetchWithTimeout(url, {
            method,
            headers: {
              ...this.defaultHeaders,
              ...headers,
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
          });
        }
      }

      return response;
    };

    // Deduplicate identical requests to avoid duplicate calls
    const performRequest = () =>
      this.requestDeduplicator.execute(dedupKey, async () => {
        const response = retry
          ? await this.retryManager.executeWithRetry(executeFetch)
          : await executeFetch();
        const data = await this.handleResponse(response);

        if (cache) {
          this.cache.set(cacheKey, data);
        }

        return data;
      });

    return performRequest();
  }

  /**
   * GET Request
   */
  async get(endpoint, params = {}, options = {}) {
    try {
      return await this.request('GET', endpoint, {
        params,
        ...options,
      });
    } catch (error) {
      if (error instanceof APIError || error instanceof TimeoutError) {
        throw error;
      }
      throw new NetworkError('Network request failed');
    }
  }

  /**
   * POST Request
   */
  async post(endpoint, body = {}, options = {}) {
    try {
      return await this.request('POST', endpoint, {
        body,
        ...options,
      });
    } catch (error) {
      if (error instanceof APIError || error instanceof TimeoutError) {
        throw error;
      }
      throw new NetworkError('Network request failed');
    }
  }

  /**
   * PUT Request
   */
  async put(endpoint, body = {}, options = {}) {
    try {
      return await this.request('PUT', endpoint, {
        body,
        ...options,
      });
    } catch (error) {
      if (error instanceof APIError || error instanceof TimeoutError) {
        throw error;
      }
      throw new NetworkError('Network request failed');
    }
  }

  /**
   * DELETE Request
   */
  async delete(endpoint, body = undefined, options = {}) {
    try {
      return await this.request('DELETE', endpoint, {
        body,
        ...options,
      });
    } catch (error) {
      if (error instanceof APIError || error instanceof TimeoutError) {
        throw error;
      }
      throw new NetworkError('Network request failed');
    }
  }
}

// API URL aus Environment oder Fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Export singleton instance
export const apiClient = new APIClient(API_URL);

export default APIClient;
