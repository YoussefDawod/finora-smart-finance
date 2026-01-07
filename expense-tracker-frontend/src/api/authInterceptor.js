import { apiClient } from './client';
import { authService } from './authService';

/**
 * Configure API Client with Auth Interceptor logic
 */
export const setupAuthInterceptor = () => {
  apiClient.setRefreshHandler(async () => {
    try {
      console.log('Refreshing token via interceptor...');
      const newToken = await authService.refreshAccessToken();
      return newToken;
    } catch (error) {
      console.error('Token refresh failed in interceptor', error);
      throw error;
    }
  });
};
