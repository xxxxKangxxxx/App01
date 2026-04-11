import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RecommendedItem,
  ShoppingRecommendationResponse,
  RecommendedItemReasonType,
  Category,
} from '@freshbox/types';

interface StapleItem {
  name: string;
  category: Category | null;
  unit: string;
  purchaseCount: number;
  avgIntervalDays: number | null;
  lastPurchaseDate: Date;
  predictedNextDate: Date | null;
}

@Injectable()
export class ShoppingRecommendationService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecommendations(
    userId: string,
  ): Promise<ShoppingRecommendationResponse> {
    // Step 1: 소비된 아이템 전부 조회
    const consumedItems = await this.prisma.foodItem.findMany({
      where: { userId, isConsumed: true },
      orderBy: { createdAt: 'asc' },
    });

    // Step 2: 이름 기준 그룹핑 → 단골 식재료 감지
    const staples = this.identifyStaples(consumedItems);

    // Step 3: 현재 활성 아이템 조회 (소비 안 된 것)
    const activeItems = await this.prisma.foodItem.findMany({
      where: { userId, isConsumed: false },
    });
    const activeNames = new Set(
      activeItems.map((item) => this.normalizeName(item.name)),
    );

    // Step 4: 추천 생성
    const recommendations: RecommendedItem[] = [];
    const addedNames = new Set<string>();

    // (a) 단골인데 현재 냉장고에 없는 것
    for (const staple of staples) {
      const normalized = this.normalizeName(staple.name);
      if (!activeNames.has(normalized) && !addedNames.has(normalized)) {
        const intervalText = staple.avgIntervalDays
          ? `평균 ${Math.round(staple.avgIntervalDays)}일마다 구매`
          : `${staple.purchaseCount}회 구매`;

        recommendations.push({
          name: staple.name,
          category: staple.category,
          quantity: 1,
          unit: staple.unit,
          reason: `단골 식재료 — ${intervalText}`,
          reasonType: 'staple_missing',
          purchaseCount: staple.purchaseCount,
          avgIntervalDays: staple.avgIntervalDays
            ? Math.round(staple.avgIntervalDays)
            : null,
          predictedNextDate: staple.predictedNextDate
            ? staple.predictedNextDate.toISOString()
            : null,
        });
        addedNames.add(normalized);
      }
    }

    // (b) 유통기한 D-3 임박 + 단골 → 재구매 권장
    const today = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);

    const stapleNames = new Map(
      staples.map((s) => [this.normalizeName(s.name), s]),
    );

    for (const item of activeItems) {
      const normalized = this.normalizeName(item.name);
      if (
        item.expiresAt &&
        item.expiresAt <= threeDaysLater &&
        item.expiresAt >= today &&
        stapleNames.has(normalized) &&
        !addedNames.has(normalized)
      ) {
        const daysLeft = Math.ceil(
          (item.expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        const staple = stapleNames.get(normalized)!;

        recommendations.push({
          name: item.name,
          category: item.category as Category,
          quantity: 1,
          unit: item.unit,
          reason: `D-${daysLeft} 임박 — 재구매 권장`,
          reasonType: 'expiring_repurchase',
          purchaseCount: staple.purchaseCount,
          avgIntervalDays: staple.avgIntervalDays
            ? Math.round(staple.avgIntervalDays)
            : null,
          predictedNextDate: staple.predictedNextDate
            ? staple.predictedNextDate.toISOString()
            : null,
        });
        addedNames.add(normalized);
      }
    }

    // (c) 최근 7일 내 소비 + 단골 + 현재 없음
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const recentConsumed = consumedItems.filter(
      (item) => item.updatedAt >= sevenDaysAgo,
    );

    for (const item of recentConsumed) {
      const normalized = this.normalizeName(item.name);
      if (
        stapleNames.has(normalized) &&
        !activeNames.has(normalized) &&
        !addedNames.has(normalized)
      ) {
        const staple = stapleNames.get(normalized)!;

        recommendations.push({
          name: item.name,
          category: item.category as Category,
          quantity: 1,
          unit: item.unit,
          reason: '최근 소비 — 재구매 권장',
          reasonType: 'recent_consumed',
          purchaseCount: staple.purchaseCount,
          avgIntervalDays: staple.avgIntervalDays
            ? Math.round(staple.avgIntervalDays)
            : null,
          predictedNextDate: staple.predictedNextDate
            ? staple.predictedNextDate.toISOString()
            : null,
        });
        addedNames.add(normalized);
      }
    }

    // Step 5: 장보기 날짜 제안
    let suggestedDate: string | null = null;
    let suggestedDateReason: string | null = null;

    const itemsWithPrediction = recommendations.filter(
      (r) => r.predictedNextDate,
    );
    if (itemsWithPrediction.length > 0) {
      itemsWithPrediction.sort(
        (a, b) =>
          new Date(a.predictedNextDate!).getTime() -
          new Date(b.predictedNextDate!).getTime(),
      );
      const earliest = itemsWithPrediction[0];
      const earliestDate = new Date(earliest.predictedNextDate!);
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      const finalDate = earliestDate > tomorrow ? earliestDate : tomorrow;
      suggestedDate = finalDate.toISOString();
      suggestedDateReason = `${earliest.name}의 예상 구매일 기준`;
    }

    // 추천 정렬: staple_missing → expiring_repurchase → recent_consumed
    const typeOrder: Record<RecommendedItemReasonType, number> = {
      staple_missing: 0,
      expiring_repurchase: 1,
      recent_consumed: 2,
    };
    recommendations.sort(
      (a, b) => typeOrder[a.reasonType] - typeOrder[b.reasonType],
    );

    return {
      recommendations,
      suggestedDate,
      suggestedDateReason,
      stapleCount: staples.length,
    };
  }

  private identifyStaples(
    consumedItems: Array<{
      name: string;
      category: string;
      unit: string;
      purchasedAt: Date | null;
      createdAt: Date;
    }>,
  ): StapleItem[] {
    // 이름 기준 그룹핑
    const groups = new Map<
      string,
      Array<{
        name: string;
        category: string;
        unit: string;
        date: Date;
      }>
    >();

    for (const item of consumedItems) {
      const normalized = this.normalizeName(item.name);
      if (!groups.has(normalized)) {
        groups.set(normalized, []);
      }
      groups.get(normalized)!.push({
        name: item.name,
        category: item.category,
        unit: item.unit,
        date: item.purchasedAt ?? item.createdAt,
      });
    }

    // 2회+ 구매 → 단골
    const staples: StapleItem[] = [];
    for (const [, items] of groups) {
      if (items.length < 2) continue;

      items.sort((a, b) => a.date.getTime() - b.date.getTime());

      // 평균 구매 간격 계산
      let avgIntervalDays: number | null = null;
      let predictedNextDate: Date | null = null;

      if (items.length >= 2) {
        const intervals: number[] = [];
        for (let i = 1; i < items.length; i++) {
          const diff =
            (items[i].date.getTime() - items[i - 1].date.getTime()) /
            (1000 * 60 * 60 * 24);
          intervals.push(diff);
        }
        avgIntervalDays =
          intervals.reduce((a, b) => a + b, 0) / intervals.length;

        const lastDate = items[items.length - 1].date;
        predictedNextDate = new Date(
          lastDate.getTime() + avgIntervalDays * 24 * 60 * 60 * 1000,
        );
      }

      const latest = items[items.length - 1];
      staples.push({
        name: latest.name,
        category: latest.category as Category | null,
        unit: latest.unit,
        purchaseCount: items.length,
        avgIntervalDays,
        lastPurchaseDate: latest.date,
        predictedNextDate,
      });
    }

    return staples;
  }

  private normalizeName(name: string): string {
    return name.trim().toLowerCase();
  }
}
