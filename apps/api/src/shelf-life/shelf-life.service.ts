import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Category } from '@freshbox/types';

const CATEGORY_FALLBACK_DAYS: Record<Category, number> = {
  VEGETABLES: 7,
  FRUITS: 7,
  MEAT: 3,
  SEAFOOD: 2,
  DAIRY: 7,
  BEVERAGE: 30,
  CONDIMENT: 180,
  FROZEN: 180,
  OTHER: 7,
};

@Injectable()
export class ShelfLifeService {
  constructor(private readonly prisma: PrismaService) {}

  async findByName(
    name: string,
    category: Category,
  ): Promise<{ defaultDays: number; storageMethod: string }> {
    // 정확한 이름 매칭
    const exact = await this.prisma.foodShelfLife.findFirst({
      where: { name },
    });
    if (exact) {
      return { defaultDays: exact.defaultDays, storageMethod: exact.storageMethod };
    }

    // 부분 매칭 (이름에 포함된 경우)
    const partial = await this.prisma.foodShelfLife.findFirst({
      where: { name: { contains: name } },
    });
    if (partial) {
      return { defaultDays: partial.defaultDays, storageMethod: partial.storageMethod };
    }

    // 역방향 부분 매칭 (DB의 이름이 입력에 포함된 경우)
    const allItems = await this.prisma.foodShelfLife.findMany({
      where: { category, NOT: { name: { startsWith: '__FALLBACK__' } } },
    });
    for (const item of allItems) {
      if (name.includes(item.name)) {
        return { defaultDays: item.defaultDays, storageMethod: item.storageMethod };
      }
    }

    // 카테고리 폴백
    const fallbackDays = CATEGORY_FALLBACK_DAYS[category] ?? 7;
    return { defaultDays: fallbackDays, storageMethod: 'REFRIGERATED' };
  }

  async findAll() {
    return this.prisma.foodShelfLife.findMany({
      where: { NOT: { name: { startsWith: '__FALLBACK__' } } },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async search(query: string) {
    return this.prisma.foodShelfLife.findMany({
      where: {
        name: { contains: query },
        NOT: { name: { startsWith: '__FALLBACK__' } },
      },
      orderBy: { name: 'asc' },
    });
  }
}
