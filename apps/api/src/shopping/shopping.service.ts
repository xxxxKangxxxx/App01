import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShoppingRecommendationService } from './shopping-recommendation.service';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { UpdateShoppingListDto } from './dto/update-shopping-list.dto';
import { AddShoppingItemDto } from './dto/add-shopping-item.dto';
import { UpdateShoppingItemDto } from './dto/update-shopping-item.dto';
import { PurchaseAndAddDto } from './dto/purchase-and-add.dto';

@Injectable()
export class ShoppingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recommendationService: ShoppingRecommendationService,
  ) {}

  // ── ShoppingList CRUD ──

  findAllLists(userId: string, isCompleted?: boolean) {
    const where: Record<string, unknown> = { userId };
    if (isCompleted !== undefined) {
      where['isCompleted'] = isCompleted;
    }
    return this.prisma.shoppingList.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneList(userId: string, id: string) {
    const list = await this.prisma.shoppingList.findUnique({
      where: { id },
      include: { items: { orderBy: [{ isPurchased: 'asc' }, { createdAt: 'asc' }] } },
    });
    if (!list) throw new NotFoundException('장보기 목록을 찾을 수 없습니다.');
    if (list.userId !== userId) throw new ForbiddenException();
    return list;
  }

  createList(userId: string, dto: CreateShoppingListDto) {
    return this.prisma.shoppingList.create({
      data: {
        ...dto,
        suggestedDate: dto.suggestedDate
          ? new Date(dto.suggestedDate)
          : undefined,
        userId,
      },
      include: { items: true },
    });
  }

  async updateList(userId: string, id: string, dto: UpdateShoppingListDto) {
    const list = await this.prisma.shoppingList.findUnique({ where: { id } });
    if (!list) throw new NotFoundException('장보기 목록을 찾을 수 없습니다.');
    if (list.userId !== userId) throw new ForbiddenException();

    return this.prisma.shoppingList.update({
      where: { id },
      data: {
        ...dto,
        suggestedDate: dto.suggestedDate
          ? new Date(dto.suggestedDate)
          : undefined,
      },
      include: { items: true },
    });
  }

  async removeList(userId: string, id: string) {
    const list = await this.prisma.shoppingList.findUnique({ where: { id } });
    if (!list) throw new NotFoundException('장보기 목록을 찾을 수 없습니다.');
    if (list.userId !== userId) throw new ForbiddenException();

    return this.prisma.shoppingList.delete({ where: { id } });
  }

  // ── 추천으로 리스트 자동 생성 ──

  async createListFromRecommendations(userId: string) {
    const { recommendations, suggestedDate } =
      await this.recommendationService.getRecommendations(userId);

    const list = await this.prisma.shoppingList.create({
      data: {
        name: `장보기 ${new Date().toLocaleDateString('ko-KR')}`,
        suggestedDate: suggestedDate ? new Date(suggestedDate) : null,
        userId,
        items: {
          create: recommendations.map((rec) => ({
            name: rec.name,
            category: rec.category ?? undefined,
            quantity: rec.quantity,
            unit: rec.unit,
            isRecommended: true,
            reason: rec.reason,
          })),
        },
      },
      include: { items: true },
    });

    return list;
  }

  // ── ShoppingItem CRUD ──

  async addItem(userId: string, listId: string, dto: AddShoppingItemDto) {
    await this.findOneList(userId, listId);

    return this.prisma.shoppingItem.create({
      data: {
        ...dto,
        shoppingListId: listId,
      },
    });
  }

  async updateItem(
    userId: string,
    listId: string,
    itemId: string,
    dto: UpdateShoppingItemDto,
  ) {
    await this.findOneList(userId, listId);

    const item = await this.prisma.shoppingItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException('아이템을 찾을 수 없습니다.');
    if (item.shoppingListId !== listId) throw new ForbiddenException();

    return this.prisma.shoppingItem.update({
      where: { id: itemId },
      data: dto,
    });
  }

  async removeItem(userId: string, listId: string, itemId: string) {
    await this.findOneList(userId, listId);

    const item = await this.prisma.shoppingItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException('아이템을 찾을 수 없습니다.');
    if (item.shoppingListId !== listId) throw new ForbiddenException();

    return this.prisma.shoppingItem.delete({ where: { id: itemId } });
  }

  // ── 구매 완료 + 냉장고 추가 ──

  async purchaseAndAdd(
    userId: string,
    listId: string,
    itemId: string,
    dto: PurchaseAndAddDto,
  ) {
    await this.findOneList(userId, listId);

    const item = await this.prisma.shoppingItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException('아이템을 찾을 수 없습니다.');
    if (item.shoppingListId !== listId) throw new ForbiddenException();

    // 1. 쇼핑 아이템 구매 완료 처리
    await this.prisma.shoppingItem.update({
      where: { id: itemId },
      data: { isPurchased: true },
    });

    // 2. 냉장고에 식재료 추가
    const foodItem = await this.prisma.foodItem.create({
      data: {
        name: item.name,
        category: item.category ?? 'OTHER',
        quantity: item.quantity,
        unit: item.unit,
        purchasedAt: new Date(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        refrigeratorId: dto.refrigeratorId ?? undefined,
        zone: dto.zone ?? undefined,
        shelf: dto.shelf ?? undefined,
        userId,
      },
    });

    return { shoppingItem: { ...item, isPurchased: true }, foodItem };
  }
}
