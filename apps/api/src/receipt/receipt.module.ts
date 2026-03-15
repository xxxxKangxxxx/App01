import { Module } from '@nestjs/common';
import { ReceiptController } from './receipt.controller';
import { ReceiptParserService } from './receipt-parser.service';
import { ShelfLifeModule } from '../shelf-life/shelf-life.module';

@Module({
  imports: [ShelfLifeModule],
  controllers: [ReceiptController],
  providers: [ReceiptParserService],
})
export class ReceiptModule {}
