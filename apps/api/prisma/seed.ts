import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const shelfLifeData = [
  // ── 채소 (VEGETABLES) ──
  { name: '양파', category: 'VEGETABLES', defaultDays: 30, storageMethod: 'ROOM_TEMP' },
  { name: '감자', category: 'VEGETABLES', defaultDays: 30, storageMethod: 'ROOM_TEMP' },
  { name: '고구마', category: 'VEGETABLES', defaultDays: 30, storageMethod: 'ROOM_TEMP' },
  { name: '당근', category: 'VEGETABLES', defaultDays: 14, storageMethod: 'REFRIGERATED' },
  { name: '시금치', category: 'VEGETABLES', defaultDays: 5, storageMethod: 'REFRIGERATED' },
  { name: '배추', category: 'VEGETABLES', defaultDays: 14, storageMethod: 'REFRIGERATED' },
  { name: '양배추', category: 'VEGETABLES', defaultDays: 14, storageMethod: 'REFRIGERATED' },
  { name: '브로콜리', category: 'VEGETABLES', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '파프리카', category: 'VEGETABLES', defaultDays: 10, storageMethod: 'REFRIGERATED' },
  { name: '오이', category: 'VEGETABLES', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '토마토', category: 'VEGETABLES', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '대파', category: 'VEGETABLES', defaultDays: 10, storageMethod: 'REFRIGERATED' },
  { name: '쪽파', category: 'VEGETABLES', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '깻잎', category: 'VEGETABLES', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '상추', category: 'VEGETABLES', defaultDays: 5, storageMethod: 'REFRIGERATED' },
  { name: '콩나물', category: 'VEGETABLES', defaultDays: 3, storageMethod: 'REFRIGERATED' },
  { name: '숙주나물', category: 'VEGETABLES', defaultDays: 3, storageMethod: 'REFRIGERATED' },
  { name: '무', category: 'VEGETABLES', defaultDays: 14, storageMethod: 'REFRIGERATED' },
  { name: '마늘', category: 'VEGETABLES', defaultDays: 30, storageMethod: 'ROOM_TEMP' },
  { name: '생강', category: 'VEGETABLES', defaultDays: 21, storageMethod: 'REFRIGERATED' },
  { name: '고추', category: 'VEGETABLES', defaultDays: 10, storageMethod: 'REFRIGERATED' },
  { name: '청양고추', category: 'VEGETABLES', defaultDays: 10, storageMethod: 'REFRIGERATED' },
  { name: '피망', category: 'VEGETABLES', defaultDays: 10, storageMethod: 'REFRIGERATED' },
  { name: '버섯', category: 'VEGETABLES', defaultDays: 5, storageMethod: 'REFRIGERATED' },
  { name: '팽이버섯', category: 'VEGETABLES', defaultDays: 5, storageMethod: 'REFRIGERATED' },
  { name: '새송이버섯', category: 'VEGETABLES', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '표고버섯', category: 'VEGETABLES', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '애호박', category: 'VEGETABLES', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '호박', category: 'VEGETABLES', defaultDays: 14, storageMethod: 'REFRIGERATED' },
  { name: '가지', category: 'VEGETABLES', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '셀러리', category: 'VEGETABLES', defaultDays: 10, storageMethod: 'REFRIGERATED' },
  { name: '아스파라거스', category: 'VEGETABLES', defaultDays: 5, storageMethod: 'REFRIGERATED' },
  { name: '부추', category: 'VEGETABLES', defaultDays: 5, storageMethod: 'REFRIGERATED' },
  { name: '미나리', category: 'VEGETABLES', defaultDays: 5, storageMethod: 'REFRIGERATED' },

  // ── 과일 (FRUITS) ──
  { name: '사과', category: 'FRUITS', defaultDays: 14, storageMethod: 'REFRIGERATED' },
  { name: '배', category: 'FRUITS', defaultDays: 14, storageMethod: 'REFRIGERATED' },
  { name: '바나나', category: 'FRUITS', defaultDays: 5, storageMethod: 'ROOM_TEMP' },
  { name: '딸기', category: 'FRUITS', defaultDays: 5, storageMethod: 'REFRIGERATED' },
  { name: '포도', category: 'FRUITS', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '수박', category: 'FRUITS', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '참외', category: 'FRUITS', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '복숭아', category: 'FRUITS', defaultDays: 5, storageMethod: 'REFRIGERATED' },
  { name: '귤', category: 'FRUITS', defaultDays: 14, storageMethod: 'REFRIGERATED' },
  { name: '오렌지', category: 'FRUITS', defaultDays: 14, storageMethod: 'REFRIGERATED' },
  { name: '레몬', category: 'FRUITS', defaultDays: 21, storageMethod: 'REFRIGERATED' },
  { name: '키위', category: 'FRUITS', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '망고', category: 'FRUITS', defaultDays: 5, storageMethod: 'REFRIGERATED' },
  { name: '자몽', category: 'FRUITS', defaultDays: 14, storageMethod: 'REFRIGERATED' },
  { name: '블루베리', category: 'FRUITS', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '체리', category: 'FRUITS', defaultDays: 5, storageMethod: 'REFRIGERATED' },
  { name: '감', category: 'FRUITS', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '메론', category: 'FRUITS', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '아보카도', category: 'FRUITS', defaultDays: 5, storageMethod: 'REFRIGERATED' },

  // ── 육류 (MEAT) ──
  { name: '삼겹살', category: 'MEAT', defaultDays: 3, storageMethod: 'REFRIGERATED' },
  { name: '목살', category: 'MEAT', defaultDays: 3, storageMethod: 'REFRIGERATED' },
  { name: '돼지갈비', category: 'MEAT', defaultDays: 3, storageMethod: 'REFRIGERATED' },
  { name: '돼지안심', category: 'MEAT', defaultDays: 3, storageMethod: 'REFRIGERATED' },
  { name: '소고기', category: 'MEAT', defaultDays: 3, storageMethod: 'REFRIGERATED' },
  { name: '소갈비', category: 'MEAT', defaultDays: 3, storageMethod: 'REFRIGERATED' },
  { name: '불고기', category: 'MEAT', defaultDays: 3, storageMethod: 'REFRIGERATED' },
  { name: '닭가슴살', category: 'MEAT', defaultDays: 2, storageMethod: 'REFRIGERATED' },
  { name: '닭다리', category: 'MEAT', defaultDays: 2, storageMethod: 'REFRIGERATED' },
  { name: '닭날개', category: 'MEAT', defaultDays: 2, storageMethod: 'REFRIGERATED' },
  { name: '통닭', category: 'MEAT', defaultDays: 2, storageMethod: 'REFRIGERATED' },
  { name: '오리고기', category: 'MEAT', defaultDays: 2, storageMethod: 'REFRIGERATED' },
  { name: '양고기', category: 'MEAT', defaultDays: 3, storageMethod: 'REFRIGERATED' },
  { name: '다진고기', category: 'MEAT', defaultDays: 2, storageMethod: 'REFRIGERATED' },
  { name: '베이컨', category: 'MEAT', defaultDays: 14, storageMethod: 'REFRIGERATED' },
  { name: '햄', category: 'MEAT', defaultDays: 14, storageMethod: 'REFRIGERATED' },
  { name: '소시지', category: 'MEAT', defaultDays: 14, storageMethod: 'REFRIGERATED' },

  // ── 해산물 (SEAFOOD) ──
  { name: '연어', category: 'SEAFOOD', defaultDays: 2, storageMethod: 'REFRIGERATED' },
  { name: '고등어', category: 'SEAFOOD', defaultDays: 2, storageMethod: 'REFRIGERATED' },
  { name: '갈치', category: 'SEAFOOD', defaultDays: 2, storageMethod: 'REFRIGERATED' },
  { name: '삼치', category: 'SEAFOOD', defaultDays: 2, storageMethod: 'REFRIGERATED' },
  { name: '참치', category: 'SEAFOOD', defaultDays: 2, storageMethod: 'REFRIGERATED' },
  { name: '새우', category: 'SEAFOOD', defaultDays: 2, storageMethod: 'REFRIGERATED' },
  { name: '오징어', category: 'SEAFOOD', defaultDays: 2, storageMethod: 'REFRIGERATED' },
  { name: '조개', category: 'SEAFOOD', defaultDays: 2, storageMethod: 'REFRIGERATED' },
  { name: '꽃게', category: 'SEAFOOD', defaultDays: 2, storageMethod: 'REFRIGERATED' },
  { name: '전복', category: 'SEAFOOD', defaultDays: 3, storageMethod: 'REFRIGERATED' },
  { name: '멸치', category: 'SEAFOOD', defaultDays: 180, storageMethod: 'ROOM_TEMP' },
  { name: '김', category: 'SEAFOOD', defaultDays: 180, storageMethod: 'ROOM_TEMP' },
  { name: '미역', category: 'SEAFOOD', defaultDays: 180, storageMethod: 'ROOM_TEMP' },

  // ── 유제품 (DAIRY) ──
  { name: '우유', category: 'DAIRY', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '치즈', category: 'DAIRY', defaultDays: 21, storageMethod: 'REFRIGERATED' },
  { name: '슬라이스치즈', category: 'DAIRY', defaultDays: 30, storageMethod: 'REFRIGERATED' },
  { name: '모짜렐라치즈', category: 'DAIRY', defaultDays: 14, storageMethod: 'REFRIGERATED' },
  { name: '요거트', category: 'DAIRY', defaultDays: 14, storageMethod: 'REFRIGERATED' },
  { name: '그릭요거트', category: 'DAIRY', defaultDays: 14, storageMethod: 'REFRIGERATED' },
  { name: '버터', category: 'DAIRY', defaultDays: 60, storageMethod: 'REFRIGERATED' },
  { name: '생크림', category: 'DAIRY', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '달걀', category: 'DAIRY', defaultDays: 21, storageMethod: 'REFRIGERATED' },
  { name: '계란', category: 'DAIRY', defaultDays: 21, storageMethod: 'REFRIGERATED' },
  { name: '두부', category: 'DAIRY', defaultDays: 5, storageMethod: 'REFRIGERATED' },
  { name: '순두부', category: 'DAIRY', defaultDays: 3, storageMethod: 'REFRIGERATED' },

  // ── 음료 (BEVERAGE) ──
  { name: '물', category: 'BEVERAGE', defaultDays: 365, storageMethod: 'ROOM_TEMP' },
  { name: '주스', category: 'BEVERAGE', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '탄산수', category: 'BEVERAGE', defaultDays: 180, storageMethod: 'ROOM_TEMP' },
  { name: '콜라', category: 'BEVERAGE', defaultDays: 180, storageMethod: 'ROOM_TEMP' },
  { name: '사이다', category: 'BEVERAGE', defaultDays: 180, storageMethod: 'ROOM_TEMP' },
  { name: '맥주', category: 'BEVERAGE', defaultDays: 180, storageMethod: 'REFRIGERATED' },
  { name: '소주', category: 'BEVERAGE', defaultDays: 365, storageMethod: 'ROOM_TEMP' },
  { name: '막걸리', category: 'BEVERAGE', defaultDays: 14, storageMethod: 'REFRIGERATED' },
  { name: '두유', category: 'BEVERAGE', defaultDays: 10, storageMethod: 'REFRIGERATED' },

  // ── 양념/소스 (CONDIMENT) ──
  { name: '간장', category: 'CONDIMENT', defaultDays: 365, storageMethod: 'ROOM_TEMP' },
  { name: '된장', category: 'CONDIMENT', defaultDays: 180, storageMethod: 'REFRIGERATED' },
  { name: '고추장', category: 'CONDIMENT', defaultDays: 180, storageMethod: 'REFRIGERATED' },
  { name: '쌈장', category: 'CONDIMENT', defaultDays: 90, storageMethod: 'REFRIGERATED' },
  { name: '식초', category: 'CONDIMENT', defaultDays: 365, storageMethod: 'ROOM_TEMP' },
  { name: '참기름', category: 'CONDIMENT', defaultDays: 180, storageMethod: 'ROOM_TEMP' },
  { name: '들기름', category: 'CONDIMENT', defaultDays: 90, storageMethod: 'REFRIGERATED' },
  { name: '식용유', category: 'CONDIMENT', defaultDays: 365, storageMethod: 'ROOM_TEMP' },
  { name: '올리브유', category: 'CONDIMENT', defaultDays: 365, storageMethod: 'ROOM_TEMP' },
  { name: '케첩', category: 'CONDIMENT', defaultDays: 180, storageMethod: 'REFRIGERATED' },
  { name: '마요네즈', category: 'CONDIMENT', defaultDays: 90, storageMethod: 'REFRIGERATED' },
  { name: '머스터드', category: 'CONDIMENT', defaultDays: 180, storageMethod: 'REFRIGERATED' },
  { name: '굴소스', category: 'CONDIMENT', defaultDays: 180, storageMethod: 'REFRIGERATED' },
  { name: '소금', category: 'CONDIMENT', defaultDays: 365, storageMethod: 'ROOM_TEMP' },
  { name: '설탕', category: 'CONDIMENT', defaultDays: 365, storageMethod: 'ROOM_TEMP' },
  { name: '후추', category: 'CONDIMENT', defaultDays: 365, storageMethod: 'ROOM_TEMP' },
  { name: '고춧가루', category: 'CONDIMENT', defaultDays: 180, storageMethod: 'ROOM_TEMP' },
  { name: '카레가루', category: 'CONDIMENT', defaultDays: 180, storageMethod: 'ROOM_TEMP' },

  // ── 냉동식품 (FROZEN) ──
  { name: '냉동만두', category: 'FROZEN', defaultDays: 180, storageMethod: 'FROZEN' },
  { name: '냉동밥', category: 'FROZEN', defaultDays: 90, storageMethod: 'FROZEN' },
  { name: '냉동피자', category: 'FROZEN', defaultDays: 180, storageMethod: 'FROZEN' },
  { name: '냉동새우', category: 'FROZEN', defaultDays: 180, storageMethod: 'FROZEN' },
  { name: '냉동야채', category: 'FROZEN', defaultDays: 180, storageMethod: 'FROZEN' },
  { name: '아이스크림', category: 'FROZEN', defaultDays: 180, storageMethod: 'FROZEN' },
  { name: '냉동치킨', category: 'FROZEN', defaultDays: 180, storageMethod: 'FROZEN' },
  { name: '냉동떡갈비', category: 'FROZEN', defaultDays: 90, storageMethod: 'FROZEN' },

  // ── 기타 (OTHER) ──
  { name: '밥', category: 'OTHER', defaultDays: 1, storageMethod: 'REFRIGERATED' },
  { name: '라면', category: 'OTHER', defaultDays: 180, storageMethod: 'ROOM_TEMP' },
  { name: '국수', category: 'OTHER', defaultDays: 365, storageMethod: 'ROOM_TEMP' },
  { name: '파스타', category: 'OTHER', defaultDays: 365, storageMethod: 'ROOM_TEMP' },
  { name: '빵', category: 'OTHER', defaultDays: 5, storageMethod: 'ROOM_TEMP' },
  { name: '식빵', category: 'OTHER', defaultDays: 5, storageMethod: 'ROOM_TEMP' },
  { name: '떡', category: 'OTHER', defaultDays: 3, storageMethod: 'REFRIGERATED' },
  { name: '어묵', category: 'OTHER', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '김치', category: 'OTHER', defaultDays: 30, storageMethod: 'REFRIGERATED' },
  { name: '깍두기', category: 'OTHER', defaultDays: 30, storageMethod: 'REFRIGERATED' },
  { name: '쌀', category: 'OTHER', defaultDays: 180, storageMethod: 'ROOM_TEMP' },
  { name: '현미', category: 'OTHER', defaultDays: 90, storageMethod: 'ROOM_TEMP' },
  { name: '잡곡', category: 'OTHER', defaultDays: 180, storageMethod: 'ROOM_TEMP' },
] as const;

// 카테고리별 기본 폴백 값 (매칭 실패 시)
const categoryFallback = [
  { name: '__FALLBACK__채소', category: 'VEGETABLES', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '__FALLBACK__과일', category: 'FRUITS', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '__FALLBACK__육류', category: 'MEAT', defaultDays: 3, storageMethod: 'REFRIGERATED' },
  { name: '__FALLBACK__해산물', category: 'SEAFOOD', defaultDays: 2, storageMethod: 'REFRIGERATED' },
  { name: '__FALLBACK__유제품', category: 'DAIRY', defaultDays: 7, storageMethod: 'REFRIGERATED' },
  { name: '__FALLBACK__음료', category: 'BEVERAGE', defaultDays: 30, storageMethod: 'ROOM_TEMP' },
  { name: '__FALLBACK__양념소스', category: 'CONDIMENT', defaultDays: 180, storageMethod: 'ROOM_TEMP' },
  { name: '__FALLBACK__냉동식품', category: 'FROZEN', defaultDays: 180, storageMethod: 'FROZEN' },
  { name: '__FALLBACK__기타', category: 'OTHER', defaultDays: 7, storageMethod: 'REFRIGERATED' },
] as const;

async function main() {
  console.log('Seeding FoodShelfLife data...');

  const allData = [...shelfLifeData, ...categoryFallback];

  for (const item of allData) {
    await prisma.foodShelfLife.upsert({
      where: {
        name_storageMethod: {
          name: item.name,
          storageMethod: item.storageMethod,
        },
      },
      update: {
        category: item.category,
        defaultDays: item.defaultDays,
      },
      create: {
        name: item.name,
        category: item.category,
        defaultDays: item.defaultDays,
        storageMethod: item.storageMethod,
      },
    });
  }

  console.log(`Seeded ${allData.length} shelf life entries.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
