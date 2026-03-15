import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../services/api';

export function useAuth() {
  const { accessToken, refreshToken, user, isLoading, setUser, loadTokens, setTokens, logout } =
    useAuthStore();

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  useEffect(() => {
    if (accessToken && !user) {
      authApi
        .getMe()
        .then((res) => setUser(res.data as { id: string; email?: string; name?: string }))
        .catch(() => {});
    }
  }, [accessToken, user, setUser]);

  const handleOAuthCallback = async (
    accessToken: string,
    refreshToken: string,
  ) => {
    await setTokens(accessToken, refreshToken);
  };

  return {
    isAuthenticated: !!accessToken,
    isLoading,
    user,
    logout,
    handleOAuthCallback,
    refreshToken,
  };
}
