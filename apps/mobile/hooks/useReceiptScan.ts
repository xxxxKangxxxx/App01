import { useMutation, useQueryClient } from '@tanstack/react-query';
import { receiptApi, foodItemsBulkApi } from '../services/api';
import type {
  ParseReceiptResponse,
  CreateFoodItemDto,
  BulkCreateFoodItemResponse,
} from '@freshbox/types';

export function useParseReceipt() {
  return useMutation({
    mutationFn: async (ocrText: string) => {
      const res = await receiptApi.parse(ocrText);
      return res.data as ParseReceiptResponse;
    },
  });
}

export function useBulkCreateFoodItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: CreateFoodItemDto[]) => {
      const res = await foodItemsBulkApi.bulkCreate(items);
      return res.data as BulkCreateFoodItemResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-items'] });
    },
  });
}
