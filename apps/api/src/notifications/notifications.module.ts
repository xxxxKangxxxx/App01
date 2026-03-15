import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsScheduler } from './notifications.scheduler';
import { FoodItemsModule } from '../food-items/food-items.module';

@Module({
  imports: [FoodItemsModule],
  providers: [NotificationsService, NotificationsScheduler],
})
export class NotificationsModule {}
