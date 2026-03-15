import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReceiptParserService } from './receipt-parser.service';
import { ParseReceiptRequest, ParseReceiptResponse } from '@freshbox/types';

@Controller('receipt')
@UseGuards(AuthGuard('jwt'))
export class ReceiptController {
  constructor(private readonly receiptParser: ReceiptParserService) {}

  @Post('parse')
  async parseReceipt(
    @Body() dto: ParseReceiptRequest,
  ): Promise<ParseReceiptResponse> {
    return this.receiptParser.parse(dto.ocrText);
  }
}
