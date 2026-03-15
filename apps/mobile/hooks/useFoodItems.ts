import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { foodItemsApi } from '../services/api';
import type {
  FoodItem,
  CreateFoodItemDto,
  UpdateFoodItemDto,
  Category,
} from '@freshbox/types';

interface FoodItemFilters {
  category?: Category;
  location?: string;
  expiringSoon?: boolean;
  isConsumed?: boolean;
}

export function useFoodItems(filters: FoodItemFilters = {}) {
  return useQuery({
    queryKey: ['food-items', filters],
    queryFn: async () => {
      const params: Record<string, string | boolean | undefined> = {};
      if (filters.category) params.category = filters.category;
      if (filters.location) params.location = filters.location;
      if (filters.expiringSoon !== undefined)
        params.expiringSoon = filters.expiringSoon;
      if (filters.isConsumed !== undefined)
        params.isConsumed = filters.isConsumed;

      const res = await foodItemsApi.getAll(params);
      return res.data as FoodItem[];
    },
  });
}

export function useFoodItem(id: string) {
  return useQuery({
    queryKey: ['food-items', id],
    queryFn: async () => {
      const res = await foodItemsApi.getOne(id);
      return res.data as FoodItem;
    },
    enabled: !!id,
  });
}

export function useCreateFoodItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFoodItemDto) => {
      const res = await foodItemsApi.create(data);
      return res.data as FoodItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-items'] });
    },
  });
}

export function useUpdateFoodItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateFoodItemDto }) => {
      const res = await foodItemsApi.update(id, data);
      return res.data as FoodItem;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['food-items'] });
      queryClient.invalidateQueries({ queryKey: ['food-items', id] });
    },
  });
}

export function useDeleteFoodItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await foodItemsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-items'] });
    },
  });
}

export function useExpiringSoonItems() {
  return useFoodItems({ expiringSoon: true });
}
