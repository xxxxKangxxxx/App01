import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'child_process';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

@Injectable()
export class ReceiptOcrService {
  private readonly logger = new Logger(ReceiptOcrService.name);
  private availableLanguages?: Set<string>;

  constructor(private readonly configService: ConfigService) {}

  async recognize(buffer: Buffer, filename: string, mimeType?: string): Promise<string> {
    if (!buffer.length) {
      throw new BadRequestException('이미지 파일이 비어 있습니다.');
    }

    if (mimeType && !mimeType.startsWith('image/')) {
      throw new BadRequestException('이미지 파일만 업로드할 수 있습니다.');
    }

    const workDir = await mkdtemp(join(tmpdir(), 'freshbox-ocr-'));
    const inputPath = join(workDir, this.safeFilename(filename));

    try {
      await writeFile(inputPath, buffer);
      const lang = await this.resolveLanguage();
      const { stdout } = await execFileAsync(
        'tesseract',
        [inputPath, 'stdout', '-l', lang, '--psm', '6'],
        { maxBuffer: 5 * 1024 * 1024, timeout: 30000 },
      );

      const text = stdout.trim();
      if (!text) {
        throw new UnprocessableEntityException('이미지에서 텍스트를 인식하지 못했습니다.');
      }

      return text;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ServiceUnavailableException ||
        error instanceof UnprocessableEntityException
      ) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('ENOENT')) {
        throw new ServiceUnavailableException('서버에 tesseract OCR이 설치되어 있지 않습니다.');
      }

      this.logger.error('Tesseract OCR failed', error);
      throw new UnprocessableEntityException('영수증 OCR 처리 중 오류가 발생했습니다.');
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  private async resolveLanguage(): Promise<string> {
    const configured = this.configService.get<string>('OCR_LANGS')?.trim();
    if (configured) return configured;

    const languages = await this.getAvailableLanguages();
    if (languages.has('kor') && languages.has('eng')) return 'kor+eng';
    if (languages.has('kor')) return 'kor';
    if (languages.has('eng')) return 'eng';

    throw new ServiceUnavailableException('사용 가능한 tesseract OCR 언어 데이터가 없습니다.');
  }

  private async getAvailableLanguages(): Promise<Set<string>> {
    if (this.availableLanguages) return this.availableLanguages;

    try {
      const { stdout } = await execFileAsync('tesseract', ['--list-langs'], {
        maxBuffer: 1024 * 1024,
        timeout: 5000,
      });

      const langs = stdout
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('List of available languages'));

      this.availableLanguages = new Set(langs);
      return this.availableLanguages;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('ENOENT')) {
        throw new ServiceUnavailableException('서버에 tesseract OCR이 설치되어 있지 않습니다.');
      }
      throw error;
    }
  }

  private safeFilename(filename: string): string {
    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return sanitized || 'receipt.jpg';
  }
}
