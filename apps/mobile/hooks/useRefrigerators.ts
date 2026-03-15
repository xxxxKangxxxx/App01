import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { refrigeratorsApi } from '../services/api';
import type {
  Refrigerator,
  CreateRefrigeratorDto,
  UpdateRefrigeratorDto,
} from '@freshbox/types';

export function useRefrigerators() {
  return useQuery({
    queryKey: ['refrigerators'],
    queryFn: async () => {
      const res = await refrigeratorsApi.getAll();
      return res.data as Refrigerator[];
    },
  });
}

export function useCreateRefrigerator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRefrigeratorDto) => {
      const res = await refrigeratorsApi.create(data);
      return res.data as Refrigerator;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refrigerators'] });
    },
  });
}

export function useUpdateRefrigerator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRefrigeratorDto }) => {
      const res = await refrigeratorsApi.update(id, data);
      return res.data as Refrigerator;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refrigerators'] });
    },
  });
}

export function useDeleteRefrigerator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await refrigeratorsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refrigerators'] });
      queryClient.invalidateQueries({ queryKey: ['food-items'] });
    },
  });
}
