import { BadRequestException, Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FastifyRequest } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { ReceiptParserService } from './receipt-parser.service';
import { ReceiptOcrService } from './receipt-ocr.service';
import { ParseReceiptRequest, ParseReceiptResponse } from '@freshbox/types';

@Controller('receipt')
@UseGuards(AuthGuard('jwt'))
export class ReceiptController {
  constructor(
    private readonly receiptParser: ReceiptParserService,
    private readonly receiptOcr: ReceiptOcrService,
  ) {}

  @Post('ocr')
  async recognizeReceipt(@Req() req: FastifyRequest): Promise<{ text: string }> {
    let file: MultipartFile | undefined;
    try {
      file = await (req as FastifyRequest & { file: () => Promise<MultipartFile | undefined> }).file();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('not multipart')) {
        throw new BadRequestException('multipart/form-data로 image 파일을 업로드해주세요.');
      }
      throw error;
    }

    if (!file) {
      throw new BadRequestException('image 파일을 업로드해주세요.');
    }

    const buffer = await file.toBuffer();
    const text = await this.receiptOcr.recognize(buffer, file.filename, file.mimetype);
    return { text };
  }

  @Post('parse')
  async parseReceipt(
    @Body() dto: ParseReceiptRequest,
  ): Promise<ParseReceiptResponse> {
    return this.receiptParser.parse(dto.ocrText);
  }
}
