'use client';

import { useEffect } from 'react';

export function TokenRefresher() {
  useEffect(() => {
    // 14 minutes in milliseconds
    const refreshInterval = 14 * 60 * 1000;

    const refresh = async () => {
      try {
        await fetch('/api/auth/refresh', {
          method: 'POST',
        });
      } catch (error) {
        console.error('Failed to refresh token:', error);
      }
    };

    // Run the refresh logic on an interval
    const intervalId = setInterval(refresh, refreshInterval);

    return () => clearInterval(intervalId);
  }, []);

  return null;
}
