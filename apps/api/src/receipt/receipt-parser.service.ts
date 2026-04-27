import { Injectable } from '@nestjs/common';
import { Category, ReceiptItem } from '@freshbox/types';
import { ShelfLifeService } from '../shelf-life/shelf-life.service';

interface ParsedLine {
  name: string;
  quantity: number;
  unit: string;
}

@Injectable()
export class ReceiptParserService {
  constructor(private readonly shelfLifeService: ShelfLifeService) {}

  async parse(
    ocrText: string,
  ): Promise<{
    items: ReceiptItem[];
    storeName?: string;
    purchaseDate?: string;
    totalAmount?: number;
  }> {
    const lines = ocrText.split('\n').map((l) => l.trim()).filter(Boolean);

    const storeName = this.extractStoreName(lines);
    const purchaseDate = this.extractDate(lines);
    const totalAmount = this.extractTotalAmount(lines);
    const productLines = this.extractProductLines(lines);

    const items: ReceiptItem[] = [];

    for (const parsed of productLines) {
      const category = this.guessCategory(parsed.name);
      const shelfLife = await this.shelfLifeService.findByName(parsed.name, category);
      const purchasedAt = purchaseDate || new Date().toISOString().split('T')[0];

      const expiresAt = this.calculateExpiryDate(purchasedAt, shelfLife.defaultDays);

      items.push({
        name: parsed.name,
        quantity: parsed.quantity,
        unit: parsed.unit,
        category,
        purchasedAt,
        expiresAt,
        defaultShelfLifeDays: shelfLife.defaultDays,
        confidence: this.assessConfidence(parsed),
      });
    }

    return { items, storeName, purchaseDate, totalAmount };
  }

  private extractStoreName(lines: string[]): string | undefined {
    const storePatterns = [
      /이마트/,
      /홈플러스/,
      /롯데마트/,
      /코스트코/,
      /트레이더스/,
      /하나로마트/,
      /GS25/i,
      /CU/,
      /세븐일레븐/,
      /편의점/,
      /다이소/,
      /올리브영/,
      /쿠팡/,
      /마켓컬리/,
      /SSG/i,
      /농협/,
    ];

    for (const line of lines.slice(0, 5)) {
      for (const pattern of storePatterns) {
        if (pattern.test(line)) {
          return line.replace(/[^\w가-힣\s]/g, '').trim();
        }
      }
    }
    return undefined;
  }

  private extractDate(lines: string[]): string | undefined {
    const datePatterns = [
      /(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/,
      /(\d{2})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/,
    ];

    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          let year = parseInt(match[1]);
          const month = parseInt(match[2]);
          const day = parseInt(match[3]);

          if (year < 100) year += 2000;
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          }
        }
      }
    }
    return undefined;
  }

  private extractTotalAmount(lines: string[]): number | undefined {
    const totalPatterns = [
      /합\s*계\s*[:\s]*([0-9,]+)/,
      /총\s*액\s*[:\s]*([0-9,]+)/,
      /결\s*제\s*금?\s*액?\s*[:\s]*([0-9,]+)/,
      /총\s*결\s*제\s*[:\s]*([0-9,]+)/,
      /카드\s*결제\s*[:\s]*([0-9,]+)/,
      /받을\s*금액\s*[:\s]*([0-9,]+)/,
    ];

    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 10); i--) {
      for (const pattern of totalPatterns) {
        const match = lines[i].match(pattern);
        if (match) {
          return parseInt(match[1].replace(/,/g, ''));
        }
      }
    }
    return undefined;
  }

  private extractProductLines(lines: string[]): ParsedLine[] {
    const results: ParsedLine[] = [];
    const skipPatterns = [
      /합\s*계/, /총\s*액/, /결\s*제/, /부가세/, /과세/, /면세/,
      /카드/, /현금/, /거래/, /매장/, /점포/, /사업자/, /전화/,
      /주소/, /감사/, /영수증/, /포인트/, /적립/, /할인/,
      /반품/, /교환/, /일시/, /거스름/,
      /total/i, /subtotal/i, /amount/i, /change/i, /cash/i, /credit/i,
    ];

    // 상품 영역 감지: "상품명" 또는 "품명" 헤더 이후부터
    let inProductSection = false;
    let headerFound = false;

    for (const line of lines) {
      // 헤더 감지
      if (/상품\s*명|품\s*명|품\s*목/.test(line)) {
        inProductSection = true;
        headerFound = true;
        continue;
      }

      // 합계 등 만나면 상품 영역 종료
      if (inProductSection && /합\s*계|총\s*액|결\s*제/.test(line)) {
        inProductSection = false;
        continue;
      }

      // 건너뛸 라인
      if (skipPatterns.some((p) => p.test(line))) continue;

      // 헤더가 없으면 숫자 포함 라인을 상품으로 간주
      const shouldParse = headerFound ? inProductSection : true;
      if (!shouldParse) continue;

      const parsed = this.parseLine(line);
      if (parsed) {
        results.push(parsed);
      }
    }

    return results;
  }

  private parseLine(line: string): ParsedLine | null {
    // 패턴 1: "상품명 수량 단가 금액" (공백/탭 구분)
    // 예: "서울우유1L  1  2,800  2,800"
    const pattern1 = /^(.+?)\s+(\d+)\s+[\d,]+\s+[\d,]+\s*$/;
    const m1 = line.match(pattern1);
    if (m1) {
      return {
        name: this.cleanProductName(m1[1]),
        quantity: parseInt(m1[2]),
        unit: '개',
      };
    }

    // 패턴 1-1: "상품명 수량 금액"
    // 예: "MILK 1 2800"
    const pattern1b = /^(.+?)\s+(\d{1,2})\s+[\d,]+\s*$/;
    const m1b = line.match(pattern1b);
    if (m1b) {
      return {
        name: this.cleanProductName(m1b[1]),
        quantity: parseInt(m1b[2]),
        unit: '개',
      };
    }

    // 패턴 2: "상품명 금액" (수량 1 가정)
    // 예: "국내산삼겹살  12,900"
    const pattern2 = /^(.+?)\s+([\d,]+)\s*$/;
    const m2 = line.match(pattern2);
    if (m2) {
      const name = m2[1].trim();
      const amount = parseInt(m2[2].replace(/,/g, ''));
      // 금액이 100 미만이면 상품이 아닐 가능성
      if (amount >= 100 && name.length >= 2) {
        return {
          name: this.cleanProductName(name),
          quantity: 1,
          unit: '개',
        };
      }
    }

    // 패턴 3: "수량 x 상품명 금액"
    const pattern3 = /^(\d+)\s*[xX×]\s*(.+?)\s+[\d,]+\s*$/;
    const m3 = line.match(pattern3);
    if (m3) {
      return {
        name: this.cleanProductName(m3[2]),
        quantity: parseInt(m3[1]),
        unit: '개',
      };
    }

    return null;
  }

  private cleanProductName(name: string): string {
    return name
      .replace(/\s+/g, ' ')
      .replace(/[*#@!]/g, '')
      .replace(/\(.*?\)/g, '')       // 괄호 안 내용 제거
      .replace(/\d+[gGmMlLkK]+/g, '') // 용량 정보 제거 (200g, 1L 등)
      .replace(/\d+입/g, '')          // "6입" 등 제거
      .trim();
  }

  private guessCategory(name: string): Category {
    const categoryMap: { pattern: RegExp; category: Category }[] = [
      // 육류
      { pattern: /삼겹|목살|갈비|안심|등심|소고기|돼지|쇠고기|한우|닭|오리|양고기|불고기|다진고기|베이컨|햄|소시지|족발|보쌈/, category: 'MEAT' },
      // 해산물
      { pattern: /연어|고등어|갈치|삼치|참치|새우|오징어|조개|게|전복|멸치|김|미역|광어|우럭|방어|꽁치|문어|낙지|굴/, category: 'SEAFOOD' },
      // 유제품
      { pattern: /우유|치즈|요거트|요구르트|버터|생크림|달걀|계란|두부|순두부|milk|cheese|yogurt|butter/i, category: 'DAIRY' },
      // 과일
      { pattern: /사과|배|바나나|딸기|포도|수박|참외|복숭아|귤|오렌지|레몬|키위|망고|자몽|블루베리|체리|감|메론|아보카도|apple|banana|orange|lemon|kiwi|mango|berry|grape/i, category: 'FRUITS' },
      // 채소
      { pattern: /양파|감자|고구마|당근|시금치|배추|양배추|브로콜리|파프리카|오이|토마토|대파|쪽파|깻잎|상추|콩나물|숙주|무|마늘|생강|고추|피망|버섯|호박|가지|셀러리|부추|미나리/, category: 'VEGETABLES' },
      // 음료
      { pattern: /물|주스|탄산|콜라|사이다|맥주|소주|막걸리|두유|커피|차/, category: 'BEVERAGE' },
      // 양념
      { pattern: /간장|된장|고추장|쌈장|식초|참기름|들기름|식용유|올리브유|케첩|마요|머스터드|굴소스|소금|설탕|후추|고춧가루|카레/, category: 'CONDIMENT' },
      // 냉동
      { pattern: /냉동|아이스크림/, category: 'FROZEN' },
    ];

    for (const { pattern, category } of categoryMap) {
      if (pattern.test(name)) return category;
    }

    return 'OTHER';
  }

  private calculateExpiryDate(purchasedAt: string, defaultDays: number): string {
    const date = new Date(purchasedAt);
    date.setDate(date.getDate() + defaultDays);
    return date.toISOString().split('T')[0];
  }

  private assessConfidence(parsed: ParsedLine): 'high' | 'medium' | 'low' {
    if (parsed.name.length >= 2 && parsed.quantity > 0) return 'high';
    if (parsed.name.length >= 2) return 'medium';
    return 'low';
  }
}
