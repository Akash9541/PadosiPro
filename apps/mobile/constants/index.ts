export const colors = {
  primary: '#7C3AED',
  primaryDark: '#6D28D9',
  primaryLight: '#EDE9FE',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  white: '#FFFFFF',
};

export const API_URL = process.env.EXPO_PUBLIC_API_URL || (__DEV__
  ? 'http://10.0.2.2:5000/api'
  : 'http://localhost:5000/api');
