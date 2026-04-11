import { Module } from '@nestjs/common';
import { ShoppingController } from './shopping.controller';
import { ShoppingService } from './shopping.service';
import { ShoppingRecommendationService } from './shopping-recommendation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ShoppingController],
  providers: [ShoppingService, ShoppingRecommendationService],
})
export class ShoppingModule {}
