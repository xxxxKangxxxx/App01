import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Category } from '@freshbox/types';
import { ReceiptParserService } from '../src/receipt/receipt-parser.service';
import type { ShelfLifeService } from '../src/shelf-life/shelf-life.service';

function createParser(): ReceiptParserService {
  const shelfLifeService = {
    async findByName(_name: string, category: Category) {
      return {
        id: 'test-shelf-life',
        name: _name,
        category,
        defaultDays: 7,
        storageMethod: 'REFRIGERATED',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      };
    },
  } satisfies Pick<ShelfLifeService, 'findByName'>;

  return new ReceiptParserService(shelfLifeService as ShelfLifeService);
}

describe('ReceiptParserService', () => {
  it('parses item quantity and excludes English total lines', async () => {
    const parser = createParser();

    const result = await parser.parse([
      'MILK 1 2800',
      'APPLE 2 6000',
      'TOTAL 8800',
    ].join('\n'));

    assert.equal(result.items.length, 2);
    assert.deepEqual(
      result.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        category: item.category,
      })),
      [
        { name: 'MILK', quantity: 1, category: 'DAIRY' },
        { name: 'APPLE', quantity: 2, category: 'FRUITS' },
      ],
    );
  });

  it('parses Korean receipt rows with quantity, unit price, and amount', async () => {
    const parser = createParser();

    const result = await parser.parse([
      '상품명 수량 단가 금액',
      '서울우유1L 1 2,800 2,800',
      '사과 2 3,000 6,000',
      '합계 8,800',
    ].join('\n'));

    assert.equal(result.items.length, 2);
    assert.equal(result.items[0].name, '서울우유');
    assert.equal(result.items[0].quantity, 1);
    assert.equal(result.items[0].category, 'DAIRY');
    assert.equal(result.items[1].name, '사과');
    assert.equal(result.items[1].quantity, 2);
    assert.equal(result.items[1].category, 'FRUITS');
  });

  it('parses quantity-first rows', async () => {
    const parser = createParser();

    const result = await parser.parse('2 x 사과 6000');

    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].name, '사과');
    assert.equal(result.items[0].quantity, 2);
    assert.equal(result.items[0].category, 'FRUITS');
  });

  it('skips payment, discount, and store metadata lines', async () => {
    const parser = createParser();

    const result = await parser.parse([
      '이마트 성수점',
      '거래 일시 2026-04-28',
      '할인 1,000',
      '카드 결제 7,800',
      'MILK 1 2800',
      'credit 7800',
    ].join('\n'));

    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].name, 'MILK');
    assert.equal(result.items[0].category, 'DAIRY');
    assert.equal(result.storeName, '이마트 성수점');
    assert.equal(result.purchaseDate, '2026-04-28');
  });

  it('handles common Korean mart rows with markers and per-item discount lines', async () => {
    const parser = createParser();

    const result = await parser.parse([
      '홈플러스 합정점',
      '품명 수량 단가 금액',
      '*국내산삼겹살 1 12,900 12,900',
      '행사할인 -1,000',
      '@양파 2 1,500 3,000',
      '면세물품가액 3,000',
      '과세물품가액 11,900',
      '총 결제금액 14,900',
    ].join('\n'));

    assert.equal(result.items.length, 2);
    assert.deepEqual(
      result.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        category: item.category,
      })),
      [
        { name: '국내산삼겹살', quantity: 1, category: 'MEAT' },
        { name: '양파', quantity: 2, category: 'VEGETABLES' },
      ],
    );
    assert.equal(result.storeName, '홈플러스 합정점');
    assert.equal(result.totalAmount, 14900);
  });

  it('ignores barcode-like product code rows and parses following product rows', async () => {
    const parser = createParser();

    const result = await parser.parse([
      '8801234567890',
      '바나나 1 3980',
      '00012345',
      '생수 6 3,000',
      '받을금액 6,980',
    ].join('\n'));

    assert.deepEqual(
      result.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        category: item.category,
      })),
      [
        { name: '바나나', quantity: 1, category: 'FRUITS' },
        { name: '생수', quantity: 6, category: 'BEVERAGE' },
      ],
    );
  });

  it('parses sanitized OCR text from a real Korean mart receipt without barcode noise', async () => {
    const parser = createParser();
    const fixture = readFileSync(
      join(process.cwd(), 'test/fixtures/receipt-yangyang-mart-ocr.txt'),
      'utf8',
    );

    const result = await parser.parse(fixture);

    assert.equal(result.purchaseDate, '2026-03-28');
    assert.equal(result.items.length, 3);
    assert.ok(
      result.items.some(
        (item) =>
          item.name.includes('잠이슬') &&
          item.quantity === 1 &&
          item.category === 'BEVERAGE',
      ),
    );
    assert.ok(
      result.items.some(
        (item) =>
          item.name.includes('하이트') &&
          item.quantity === 1 &&
          item.category === 'BEVERAGE',
      ),
    );
    assert.ok(
      result.items.some(
        (item) =>
          item.name.includes('도다리') &&
          item.quantity === 1 &&
          item.category === 'SEAFOOD',
      ),
    );
    assert.ok(result.items.every((item) => !/^\d/.test(item.name)));
  });
});
