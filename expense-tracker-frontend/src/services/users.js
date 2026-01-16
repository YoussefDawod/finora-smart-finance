import apiClient from './api';

export const userService = {
  /**
   * Get user profile
   */
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response;
  },

  /**
   * Update user profile
   * @param {Object} userData 
   */
  updateProfile: async (userData) => {
    const response = await apiClient.put('/users/profile', userData);
    return response;
  },

  /**
   * Change password
   * @param {string} currentPassword 
   * @param {string} newPassword 
   */
  changePassword: async (currentPassword, newPassword) => {
    const response = await apiClient.post('/users/change-password', {
      currentPassword,
      newPassword,
    });
    return response;
  },

  /**
   * Delete account
   * @param {string} password - Confirm with password
   */
  deleteAccount: async (password) => {
    const response = await apiClient.delete('/users/account', {
      data: { password },
    });
    return response;
  },

  /**
   * Upload profile picture
   * @param {File} file 
   */
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await apiClient.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  /**
   * Get user preferences
   */
  getPreferences: async () => {
    const response = await apiClient.get('/users/preferences');
    return response;
  },

  /**
   * Update user preferences
   * @param {Object} preferences 
   */
  updatePreferences: async (preferences) => {
    const response = await apiClient.put('/users/preferences', preferences);
    return response;
  },
};
