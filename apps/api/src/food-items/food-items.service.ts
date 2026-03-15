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
}

@Injectable()
export class FoodItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, filters: FoodItemFilters = {}) {
    const where: Record<string, unknown> = { userId };

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
    if (!item) throw new NotFoundException(`FoodItem #${id} not found`);
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
    await this.findOne(id, userId);
    return this.prisma.foodItem.update({
      where: { id },
      data: {
        ...dto,
        purchasedAt: dto.purchasedAt ? new Date(dto.purchasedAt) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.foodItem.delete({ where: { id } });
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
