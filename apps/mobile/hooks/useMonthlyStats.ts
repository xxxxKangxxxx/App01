import { useQuery } from '@tanstack/react-query';
import { foodItemsStatsApi } from '../services/api';
import type { MonthlyStatsResponse } from '@freshbox/types';

export function useMonthlyStats(year: number, month: number) {
  return useQuery({
    queryKey: ['monthly-stats', year, month],
    queryFn: async () => {
      const res = await foodItemsStatsApi.getMonthlyStats(year, month);
      return res.data as MonthlyStatsResponse;
    },
  });
}
