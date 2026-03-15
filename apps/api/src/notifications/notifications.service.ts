import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
  private readonly expo = new Expo();
  private readonly logger = new Logger(NotificationsService.name);

  async sendPushNotifications(
    messages: Array<{ pushToken: string; title: string; body: string }>,
  ) {
    const expoPushMessages: ExpoPushMessage[] = messages
      .filter((m) => Expo.isExpoPushToken(m.pushToken))
      .map((m) => ({
        to: m.pushToken,
        sound: 'default' as const,
        title: m.title,
        body: m.body,
        data: {},
      }));

    if (expoPushMessages.length === 0) {
      this.logger.log('No valid Expo push tokens found');
      return;
    }

    const chunks = this.expo.chunkPushNotifications(expoPushMessages);

    for (const chunk of chunks) {
      try {
        const receipts = await this.expo.sendPushNotificationsAsync(chunk);
        this.logger.log(`Sent ${receipts.length} push notifications`);
      } catch (error) {
        this.logger.error('Failed to send push notifications', error);
      }
    }
  }
}
