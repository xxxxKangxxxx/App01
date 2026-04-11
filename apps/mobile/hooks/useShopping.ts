import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { shoppingApi } from '../services/api';
import type {
  ShoppingRecommendationResponse,
  ShoppingList,
  ShoppingItem,
  CreateShoppingListDto,
  UpdateShoppingListDto,
  AddShoppingItemDto,
  UpdateShoppingItemDto,
  PurchaseAndAddDto,
} from '@freshbox/types';

// ── Queries ──

export function useShoppingRecommendations() {
  return useQuery({
    queryKey: ['shopping-recommendations'],
    queryFn: async () => {
      const res = await shoppingApi.getRecommendations();
      return res.data as ShoppingRecommendationResponse;
    },
  });
}

export function useShoppingLists(filters?: { isCompleted?: boolean }) {
  return useQuery({
    queryKey: ['shopping-lists', filters],
    queryFn: async () => {
      const params = filters?.isCompleted !== undefined
        ? { isCompleted: String(filters.isCompleted) }
        : undefined;
      const res = await shoppingApi.getLists(params);
      return res.data as ShoppingList[];
    },
  });
}

export function useShoppingList(id: string) {
  return useQuery({
    queryKey: ['shopping-list', id],
    queryFn: async () => {
      const res = await shoppingApi.getList(id);
      return res.data as ShoppingList;
    },
    enabled: !!id,
  });
}

// ── List Mutations ──

export function useCreateShoppingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateShoppingListDto) => {
      const res = await shoppingApi.createList(data);
      return res.data as ShoppingList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
    },
  });
}

export function useCreateListFromRecommendations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await shoppingApi.createListFromRecommendations();
      return res.data as ShoppingList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      queryClient.invalidateQueries({ queryKey: ['shopping-recommendations'] });
    },
  });
}

export function useUpdateShoppingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateShoppingListDto }) => {
      const res = await shoppingApi.updateList(id, data);
      return res.data as ShoppingList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
    },
  });
}

export function useDeleteShoppingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await shoppingApi.deleteList(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
    },
  });
}

// ── Item Mutations ──

export function useAddShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, data }: { listId: string; data: AddShoppingItemDto }) => {
      const res = await shoppingApi.addItem(listId, data);
      return res.data as ShoppingItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
    },
  });
}

export function useUpdateShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      itemId,
      data,
    }: {
      listId: string;
      itemId: string;
      data: UpdateShoppingItemDto;
    }) => {
      const res = await shoppingApi.updateItem(listId, itemId, data);
      return res.data as ShoppingItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
    },
  });
}

export function useDeleteShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, itemId }: { listId: string; itemId: string }) => {
      await shoppingApi.deleteItem(listId, itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
    },
  });
}

export function usePurchaseShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      itemId,
      data,
    }: {
      listId: string;
      itemId: string;
      data?: PurchaseAndAddDto;
    }) => {
      const res = await shoppingApi.purchaseItem(listId, itemId, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
      queryClient.invalidateQueries({ queryKey: ['food-items'] });
      queryClient.invalidateQueries({ queryKey: ['shopping-recommendations'] });
    },
  });
}
