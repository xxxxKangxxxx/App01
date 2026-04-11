import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFoodItemDto } from './dto/create-food-item.dto';
import { UpdateFoodItemDto } from './dto/update-food-item.dto';
import { Category } from '@freshbox/types';

interface FoodItemFilters {
  category?: Category;
  location?: string;
  expiringSoon?: boolean;
  isConsumed?: boolean;
  search?: string;
  refrigeratorId?: string;
}

@Injectable()
export class FoodItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, filters: FoodItemFilters = {}) {
    const where: Record<string, unknown> = { userId, deletedAt: null };

    if (filters.category) {
      where['category'] = filters.category;
    }

    if (filters.location) {
      where['location'] = filters.location;
    }

    if (filters.isConsumed !== undefined) {
      where['isConsumed'] = filters.isConsumed;
    } else {
      where['isConsumed'] = false;
    }

    if (filters.search) {
      where['name'] = { contains: filters.search, mode: 'insensitive' };
    }

    if (filters.refrigeratorId) {
      where['refrigeratorId'] = filters.refrigeratorId;
    }

    if (filters.expiringSoon) {
      const today = new Date();
      const threeDaysLater = new Date();
      threeDaysLater.setDate(today.getDate() + 3);

      where['expiresAt'] = {
        gte: today,
        lte: threeDaysLater,
      };
    }

    return this.prisma.foodItem.findMany({
      where,
      orderBy: [{ expiresAt: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string, userId: string) {
    const item = await this.prisma.foodItem.findUnique({ where: { id } });
    if (!item || item.deletedAt) throw new NotFoundException(`FoodItem #${id} not found`);
    if (item.userId !== userId) throw new ForbiddenException();
    return item;
  }

  async create(userId: string, dto: CreateFoodItemDto) {
    return this.prisma.foodItem.create({
      data: {
        ...dto,
        userId,
        purchasedAt: dto.purchasedAt ? new Date(dto.purchasedAt) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateFoodItemDto) {
    const existing = await this.findOne(id, userId);
    const data: Record<string, unknown> = {
      ...dto,
      purchasedAt: dto.purchasedAt ? new Date(dto.purchasedAt) : undefined,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    };

    // isConsumed가 true로 변경되면 consumedAt 자동 기록
    if (dto.isConsumed === true && !existing.isConsumed) {
      data.consumedAt = new Date();
    } else if (dto.isConsumed === false) {
      data.consumedAt = null;
    }

    return this.prisma.foodItem.update({ where: { id }, data });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.foodItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async bulkCreate(userId: string, items: CreateFoodItemDto[]) {
    const results = [];
    for (const dto of items) {
      const item = await this.create(userId, dto);
      results.push(item);
    }
    return results;
  }

  async getMonthlyStats(userId: string, year: number, month: number) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // 해당 월에 추가(구매)된 아이템
    const purchased = await this.prisma.foodItem.findMany({
      where: {
        userId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 해당 월에 소비 완료된 아이템
    const consumed = await this.prisma.foodItem.findMany({
      where: {
        userId,
        isConsumed: true,
        consumedAt: { gte: startOfMonth, lte: endOfMonth },
      },
      orderBy: { consumedAt: 'desc' },
    });

    // 해당 월에 폐기(soft delete)된 아이템
    const discarded = await this.prisma.foodItem.findMany({
      where: {
        userId,
        deletedAt: { gte: startOfMonth, lte: endOfMonth },
      },
      orderBy: { deletedAt: 'desc' },
    });

    // 카테고리별 구매 분포
    const categoryStats: Record<string, { purchased: number; consumed: number; discarded: number }> = {};
    for (const item of purchased) {
      if (!categoryStats[item.category]) {
        categoryStats[item.category] = { purchased: 0, consumed: 0, discarded: 0 };
      }
      categoryStats[item.category].purchased++;
    }
    for (const item of consumed) {
      if (!categoryStats[item.category]) {
        categoryStats[item.category] = { purchased: 0, consumed: 0, discarded: 0 };
      }
      categoryStats[item.category].consumed++;
    }
    for (const item of discarded) {
      if (!categoryStats[item.category]) {
        categoryStats[item.category] = { purchased: 0, consumed: 0, discarded: 0 };
      }
      categoryStats[item.category].discarded++;
    }

    // 많이 산 재료 TOP
    const purchasedNameCount: Record<string, { count: number; category: string }> = {};
    for (const item of purchased) {
      if (!purchasedNameCount[item.name]) {
        purchasedNameCount[item.name] = { count: 0, category: item.category };
      }
      purchasedNameCount[item.name].count++;
    }
    const topPurchased = Object.entries(purchasedNameCount)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, { count, category }]) => ({ name, count, category }));

    // 자주 버린 재료 TOP
    const discardedNameCount: Record<string, { count: number; category: string }> = {};
    for (const item of discarded) {
      if (!discardedNameCount[item.name]) {
        discardedNameCount[item.name] = { count: 0, category: item.category };
      }
      discardedNameCount[item.name].count++;
    }
    const topDiscarded = Object.entries(discardedNameCount)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, { count, category }]) => ({ name, count, category }));

    const totalUsed = consumed.length + discarded.length;
    const usageRate = totalUsed > 0 ? Math.round((consumed.length / totalUsed) * 100) : 100;

    return {
      year,
      month,
      summary: {
        purchased: purchased.length,
        consumed: consumed.length,
        discarded: discarded.length,
        usageRate,
      },
      categoryStats,
      topPurchased,
      topDiscarded,
    };
  }

  async findExpiringSoon(daysAhead: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date();
    targetDate.setDate(today.getDate() + daysAhead);
    targetDate.setHours(23, 59, 59, 999);

    return this.prisma.foodItem.findMany({
      where: {
        isConsumed: false,
        deletedAt: null,
        expiresAt: {
          gte: today,
          lte: targetDate,
        },
      },
      include: {
        user: { select: { id: true, pushToken: true, name: true } },
      },
    });
  }
}
