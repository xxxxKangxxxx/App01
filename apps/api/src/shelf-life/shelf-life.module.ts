import { Module } from '@nestjs/common';
import { ShelfLifeController } from './shelf-life.controller';
import { ShelfLifeService } from './shelf-life.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ShelfLifeController],
  providers: [ShelfLifeService],
  exports: [ShelfLifeService],
})
export class ShelfLifeModule {}
