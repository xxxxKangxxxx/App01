import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FoodItemsService } from '../food-items/food-items.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private readonly foodItemsService: FoodItemsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('0 9 * * *') // 매일 오전 9시
  async handleExpiryNotifications() {
    this.logger.log('Running expiry notification check...');

    // D-3 만료 식재료
    await this.sendExpiryNotifications(3);
    // D-1 만료 식재료
    await this.sendExpiryNotifications(1);
  }

  private async sendExpiryNotifications(daysAhead: number) {
    const items = await this.foodItemsService.findExpiringSoon(daysAhead);

    // 사용자별로 그룹화
    const userItemsMap = new Map<
      string,
      { pushToken: string; itemNames: string[] }
    >();

    for (const item of items) {
      const { user } = item;
      if (!user.pushToken) continue;

      if (!userItemsMap.has(user.id)) {
        userItemsMap.set(user.id, { pushToken: user.pushToken, itemNames: [] });
      }
      userItemsMap.get(user.id)!.itemNames.push(item.name);
    }

    const messages: Array<{ pushToken: string; title: string; body: string }> =
      [];

    for (const [, { pushToken, itemNames }] of userItemsMap) {
      const label = daysAhead === 1 ? '내일' : `${daysAhead}일 후`;
      const itemList =
        itemNames.length > 3
          ? `${itemNames.slice(0, 3).join(', ')} 외 ${itemNames.length - 3}개`
          : itemNames.join(', ');

      messages.push({
        pushToken,
        title: `FreshBox 유통기한 알림`,
        body: `${label} 유통기한이 만료돼요: ${itemList}`,
      });
    }

    if (messages.length > 0) {
      await this.notificationsService.sendPushNotifications(messages);
      this.logger.log(
        `Sent D-${daysAhead} notifications to ${messages.length} users`,
      );
    }
  }
}
