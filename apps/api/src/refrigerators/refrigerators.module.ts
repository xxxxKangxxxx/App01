import { Module } from '@nestjs/common';
import { RefrigeratorsController } from './refrigerators.controller';
import { RefrigeratorsService } from './refrigerators.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RefrigeratorsController],
  providers: [RefrigeratorsService],
})
export class RefrigeratorsModule {}
