import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FoodItemsModule } from './food-items/food-items.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RefrigeratorsModule } from './refrigerators/refrigerators.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    FoodItemsModule,
    NotificationsModule,
    RefrigeratorsModule,
  ],
})
export class AppModule {}
