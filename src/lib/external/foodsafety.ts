import type { RecipeDetail } from '@/lib/api/recipes';

// 재료별 g → 스푼/컵 변환 규칙
type UnitRule = {
  gPerTbsp?: number;   // 큰술 1의 g
  gPerCup?: number;    // 컵 1의 g (가루/설탕 등만)
  tinyAsPinch?: boolean; // 아주 적을 때 '한 꼬집'
  aliases: string[];
};

const UNIT_RULES: UnitRule[] = [
  { aliases: ['밀가루', '중력분', '박력분'], gPerTbsp: 8,  gPerCup: 120 },
  { aliases: ['찹쌀가루', '쌀가루'],          gPerTbsp: 10, gPerCup: 160 },
  { aliases: ['간장', '진간장', '저염간장'],   gPerTbsp: 17.5 },
  { aliases: ['식초'],                        gPerTbsp: 15 },
  { aliases: ['설탕', '백설탕'],              gPerTbsp: 12.5, gPerCup: 200 },
  { aliases: ['소금'],                        gPerTbsp: 18, tinyAsPinch: true },  
  { aliases: ['식용유', '해바라기유', '카놀라유', '올리브유'], gPerTbsp: 14 },
];

// 재료별 직관적 표현 룰
type IntuitiveRule = {
  aliases: string[];
  getDisplay: (grams: number) => string;
};

const INTUITIVE_RULES: IntuitiveRule[] = [
  // 채소류
  { aliases: ['양배추'], getDisplay: (g) => g >= 200 ? '1/2개' : g >= 100 ? '1/4개' : '1/8개' },
  { aliases: ['배추', '무'], getDisplay: (g) => g >= 300 ? '1/2개' : g >= 150 ? '1/4개' : '1/8개' },
  { aliases: ['두부'], getDisplay: (g) => g >= 300 ? '1개' : g >= 150 ? '1/2개' : '1/4개' },
  { aliases: ['당근', '감자'], getDisplay: (g) => g >= 100 ? '1개' : g >= 50 ? '1/2개' : '1/4개' },
  { aliases: ['오이', '애호박'], getDisplay: (g) => g >= 100 ? '1개' : g >= 50 ? '1/2개' : '1/4개' },
  { aliases: ['가지'], getDisplay: (g) => g >= 200 ? '1개' : g >= 100 ? '1/2개' : '1/2개' },
  { aliases: ['토마토'], getDisplay: (g) => g >= 150 ? '1개' : g >= 75 ? '1/2개' : '1/4개' },
  { aliases: ['양파'], getDisplay: (g) => g >= 150 ? '1개' : g >= 75 ? '1/2개' : '1/4개' },
  { aliases: ['마늘'], getDisplay: (g) => g >= 30 ? '5개' : g >= 15 ? '3개' : '1개' },
  { aliases: ['파', '대파'], getDisplay: (g) => g >= 30 ? '1대' : g >= 15 ? '1/2대' : '1/4대' },
  { aliases: ['미나리'], getDisplay: (g) => g >= 30 ? '1줌' : g >= 15 ? '1/2줌' : '1/4줌' },
  { aliases: ['시금치', '부추'], getDisplay: (g) => g >= 50 ? '1줌' : g >= 25 ? '1/2줌' : '1/4줌' },
  
  // 버섯류
  { aliases: ['표고버섯', '느타리버섯', '팽이버섯', '새송이버섯', '버섯'], getDisplay: (g) => g >= 100 ? '10송이' : g >= 50 ? '5송이' : '한 줌' },
  
  // 고기류
  { aliases: ['소고기', '돼지고기', '닭고기'], getDisplay: (g) => g >= 200 ? '1인분' : g >= 100 ? '1/2인분' : '1/4인분' },
  { aliases: ['슬라이스 햄', '베이컨'], getDisplay: (g) => g >= 50 ? '2장' : g >= 25 ? '1장' : '1/2장' },  
  
  // 해산물
  { aliases: ['새우'], getDisplay: (g) => g >= 100 ? '10마리' : g >= 50 ? '5마리' : '3마리' },
  { aliases: ['오징어'], getDisplay: (g) => g >= 200 ? '1마리' : g >= 100 ? '1/2마리' : '1/4마리' },
  { aliases: ['멸치'], getDisplay: (g) => g >= 20 ? '1줌' : g >= 10 ? '1/2줌' : '1/4줌' },
  { aliases: ['다시마'], getDisplay: (g) => g >= 10 ? '6장' : g >= 5 ? '4장' : '2장' },
  
  // 기타
  { aliases: ['참기름', '들기름'], getDisplay: (g) => g >= 10 ? '1 큰술' : g >= 5 ? '1/2 큰술' : '1/4 큰술' },
  { aliases: ['깨'], getDisplay: (g) => g >= 10 ? '1 큰술' : g >= 5 ? '1/2 큰술' : '1/4 큰술' },
  
  // 소스류
  { aliases: ['간장', '진간장', '저염간장'], getDisplay: (g) => g >= 70 ? '4 큰술' : g >= 35 ? '2 큰술' : g >= 17 ? '1 큰술' : g >= 9 ? '1/2 큰술' : '1/4 큰술' },
  { aliases: ['식초'], getDisplay: (g) => g >= 60 ? '4 큰술' : g >= 30 ? '2 큰술' : g >= 15 ? '1 큰술' : g >= 7 ? '1/2 큰술' : '1/4 큰술' },
  { aliases: ['맛술', '요리술', '청주', '배즙'], getDisplay: (g) => g >= 60 ? '4 큰술' : g >= 30 ? '2 큰술' : g >= 15 ? '1 큰술' : g >= 7 ? '1/2 큰술' : '1/4 큰술' },
  { aliases: ['고춧가루','후춧가루','들깻가루'], getDisplay: (g) => g >= 40 ? '4 큰술' : g >= 20 ? '2 큰술' : g >= 10 ? '1 큰술' : g >= 5 ? '1/2 큰술' : '1/4 큰술' },
  { aliases: ['고추장'], getDisplay: (g) => g >= 60 ? '4 큰술' : g >= 30 ? '2 큰술' : g >= 15 ? '1 큰술' : g >= 7 ? '1/2 큰술' : '1/4 큰술' },
  { aliases: ['된장', '일본된장'], getDisplay: (g) => g >= 60 ? '4 큰술' : g >= 30 ? '2 큰술' : g >= 15 ? '1 큰술' : g >= 7 ? '1/2 큰술' : '1/4 큰술' },
  { aliases: ['케첩'], getDisplay: (g) => g >= 60 ? '4 큰술' : g >= 30 ? '2 큰술' : g >= 15 ? '1 큰술' : g >= 7 ? '1/2 큰술' : '1/4 큰술' },
  { aliases: ['마요네즈'], getDisplay: (g) => g >= 60 ? '4 큰술' : g >= 30 ? '2 큰술' : g >= 15 ? '1 큰술' : g >= 7 ? '1/2 큰술' : '1/4 큰술' },
  { aliases: ['겨자'], getDisplay: (g) => g >= 40 ? '4 큰술' : g >= 20 ? '2 큰술' : g >= 10 ? '1 큰술' : g >= 5 ? '1/2 큰술' : '1/4 큰술' },
  
  // 새로운 재료들
  { aliases: ['삼치'], getDisplay: (g) => g >= 400 ? '2 마리' : '1 마리' },
  { aliases: ['치커리'], getDisplay: (g) => g >= 50 ? '1줌' : g >= 25 ? '1/2줌' : '1/4줌' },
  { aliases: ['전분가루', '전분'], getDisplay: (g) => g >= 15 ? '1 큰술' : g >= 7 ? '1/2 큰술' : '1/4 큰술' },
  { aliases: ['땅콩가루', '땅콩'], getDisplay: (g) => g >= 15 ? '1 큰술' : g >= 7 ? '1/2 큰술' : '1/4 큰술' },
  { aliases: ['유자청'], getDisplay: (g) => g >= 15 ? '1 큰술' : g >= 7 ? '1/2 큰술' : '1/4 큰술' },
  { aliases: ['다진마늘'], getDisplay: (g) => g >= 15 ? '1 큰술' : g >= 7 ? '1/2 큰술' : '1/4 큰술' },
  { aliases: ['청고추', '홍고추', '고추'], getDisplay: (g) => g >= 20 ? '1개' : g >= 10 ? '1/2개' : '1/4개' },
];

function normalizeUnit(u?: string): 'g' | 'ml' {
  const unit = (u || 'g').toLowerCase();
  if (unit === '그램' || unit === 'g') return 'g';
  if (unit === 'ml') return 'ml';
  return 'g';
}

function matchesAliasWholeWord(text: string, alias: string): boolean {
  // 경계: 한글/영문/숫자가 아닌 문자 또는 문장 경계
  const pattern = new RegExp(`(^|[^가-힣A-Za-z0-9])${alias}([^가-힣A-Za-z0-9]|$)`);
  return pattern.test(text);
}

function findUnitRule(name: string): UnitRule | undefined {
  const key = name.trim();
  return UNIT_RULES.find(r => r.aliases.some(a => matchesAliasWholeWord(key, a)));
}

function findIntuitiveRule(name: string): IntuitiveRule | undefined {
  const key = name.trim();
  return INTUITIVE_RULES.find(r => r.aliases.some(a => matchesAliasWholeWord(key, a)));
}



function roundToStep(value: number, step: number, mode: 'nearest' | 'floor' = 'nearest'): number {
  const scaled = value / step;
  const rounded = mode === 'nearest' ? Math.round(scaled) : Math.floor(scaled);
  return rounded * step;
}

function formatFraction(value: number): string {
  // value는 0, 0.25, 0.5, 0.75 중 하나라고 가정
  const map: Record<number, string> = { 0.25: '1/4', 0.5: '1/2', 0.75: '3/4' };
  return map[Number(value.toFixed(2))] || '';
}

function formatQuantity(value: number, unitLabel: string, step: 0.25 | 0.5): string {
  const v = Number(value.toFixed(4));
  const integerPart = Math.floor(v);
  const fracPartRaw = v - integerPart;
  const fracStep = step === 0.5 ? roundToStep(fracPartRaw, 0.5, 'nearest') : roundToStep(fracPartRaw, 0.25, 'nearest');
  const parts: string[] = [];
  if (integerPart > 0) parts.push(String(integerPart));
  if (fracStep > 0) parts.push(formatFraction(fracStep));
  const qty = parts.length ? parts.join(' ') : '0';
  return `${qty} ${unitLabel}`;
}

function decomposeGramsToDisplay(grams: number, rule: UnitRule): string {
  const gPerTbsp = rule.gPerTbsp as number;
  const gPerTsp = gPerTbsp / 3;
  const hasCup = !!rule.gPerCup;
  let cups = 0;
  let tbsp = 0;
  let tsp = 0;

  let remaining = grams;

  if (hasCup && rule.gPerCup) {
    const rawCups = remaining / rule.gPerCup;
    // 컵: 1/4 컵 단위, 과소분해 방지 위해 내림(사용성)
    cups = roundToStep(rawCups, 0.25, 'floor');
    remaining -= cups * rule.gPerCup;
  }

  // 큰술: 1/2 큰술 단위, 내림
  const rawTbsp = remaining / gPerTbsp;
  tbsp = roundToStep(rawTbsp, 0.5, 'floor');
  remaining -= tbsp * gPerTbsp;

  // 작은술: 1/4 작은술 단위, 최종은 반올림
  const rawTsp = remaining / gPerTsp;
  tsp = roundToStep(rawTsp, 0.25, 'nearest');

  // 0 방지: 모두 0이면 최소 1/2 작은술
  if (cups === 0 && tbsp === 0 && tsp === 0 && grams > 0) {
    tsp = 0.5; // 1/2 작은술
  }

  const components: string[] = [];
  if (cups > 0) components.push(formatQuantity(cups, '컵', 0.25));
  if (tbsp > 0) components.push(formatQuantity(tbsp, '큰술', 0.5));
  if (tsp > 0) components.push(formatQuantity(tsp, '작은술', 0.25));

  // 최대 2개까지만 표시
  const limited = components.slice(0, 2);
  return limited.join(' + ');
}

function decomposeMlToDisplay(ml: number): string {
  const mlPerCup = 240;
  const mlPerTbsp = 15;
  const mlPerTsp = 5;

  const cups = roundToStep(ml / mlPerCup, 0.25, 'floor');
  let remaining = ml - cups * mlPerCup;

  const tbsp = roundToStep(remaining / mlPerTbsp, 0.5, 'floor');
  remaining -= tbsp * mlPerTbsp;

  let tsp = roundToStep(remaining / mlPerTsp, 0.25, 'nearest');

  if (cups === 0 && tbsp === 0 && tsp === 0 && ml > 0) {
    tsp = 0.5; // 1/2 작은술
  }

  const components: string[] = [];
  if (cups > 0) components.push(formatQuantity(cups, '컵', 0.25));
  if (tbsp > 0) components.push(formatQuantity(tbsp, '큰술', 0.5));
  if (tsp > 0) components.push(formatQuantity(tsp, '작은술', 0.25));

  return components.slice(0, 2).join(' + ');
}


function convertIngredientLine(line: string): string {
  // 패턴: 약/범위(~) 지원
  const patterns = [
    /^\s*(.+?)\s*\(\s*(약\s*)?([0-9]+(?:\.[0-9]+)?)(?:\s*~\s*([0-9]+(?:\.[0-9]+)?))?\s*(g|그램|ml|mL)\s*\)\s*$/i,
    /^\s*(.+?)\s+(약\s*)?([0-9]+(?:\.[0-9]+)?)(?:\s*~\s*([0-9]+(?:\.[0-9]+)?))?\s*(g|그램|ml|mL)\s*$/i,
    /^\s*(.+?)\s*\(\s*(약\s*)?([0-9]+(?:\.[0-9]+)?)(?:\s*~\s*([0-9]+(?:\.[0-9]+)?))?\s*\)\s*$/i, // 단위 생략시 g로 가정
  ];

  let m: RegExpMatchArray | null = null;
  for (const pattern of patterns) {
    m = line.match(pattern);
    if (m) break;
  }
  if (!m) return line;

  const name = m[1].trim();
  const about = !!m[2];
  const a = parseFloat(m[3]);
  const b = m[4] ? parseFloat(m[4]) : undefined;
  const unitRaw = m[5] || 'g';
  const unit = normalizeUnit(unitRaw);

  const avg = b ? (a + (b as number)) / 2 : a;

  // 직관 표현 우선
  const intuitiveRule = unit === 'g' ? findIntuitiveRule(name) : undefined;
  if (intuitiveRule) {
    const display = intuitiveRule.getDisplay(avg);
    return `${name} ${display}`;
  }

  // 단위 룰 조회
  const rule = findUnitRule(name);

  if (unit === 'g') {
    if (!rule || !rule.gPerTbsp) {
      // 룰이 없으면 g 그대로 유지
      return `${name} ${about ? '약 ' : ''}${b ? `${Math.min(a, b)}~${Math.max(a, b)}` : a}g`;
    }

    // 꼬집 처리 임계치 1.5g
    if (rule.tinyAsPinch && avg <= 1.5) {
      return `${name} 한 꼬집`;
    }

    const display = decomposeGramsToDisplay(avg, rule);
    return `${name} ${display}`;
  }

  if (unit === 'ml') {
    const display = decomposeMlToDisplay(avg);
    return `${name} ${display}`;
  }

  return line;
}

function parseIngredientsWithCategories(rawIngredients: string): string {
  const lines = rawIngredients.split('\n');
  const result: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    if (trimmedLine.includes(':')) {
      // 카테고리 라인 처리
      const [category, ingredients] = trimmedLine.split(':');
      const cleanCategory = category.replace(/^[•\-\s]+/, '').trim();
      
      if (ingredients) {
        result.push(`${cleanCategory}:`);
        const ingredientList = ingredients.split(',')
          .map(ingredient => convertIngredientLine(ingredient.trim()))
          .filter(ingredient => ingredient.length > 0);
        result.push(...ingredientList);
      }
    } else {
      // 일반 재료 라인
      const converted = convertIngredientLine(trimmedLine);
      result.push(converted);
    }
  }
  
  return result.join('\n');
}

type CookRcpRow = {
  RCP_SEQ?: string;
  RCP_NM?: string;
  RCP_WAY2?: string;
  RCP_PAT2?: string;
  HASH_TAG?: string;
  ATT_FILE_NO_MAIN?: string;
  ATT_FILE_NO_MK?: string;
  RCP_PARTS_DTLS?: string;
  RCP_NA_TIP?: string;
  [k: string]: unknown; // MANUALxx, MANUAL_IMGxx 등
};

export function toRecipeDetail(row: CookRcpRow): RecipeDetail {
  const seq = String(row.RCP_SEQ ?? '').trim();
  const title = String(row.RCP_NM ?? '').trim();

  const tip = String(row.RCP_NA_TIP ?? '').trim();
  const sourceLine = '출처: 식품안전나라 공공데이터 (http://www.foodsafetykorea.go.kr)';
  const description = [tip, sourceLine].filter((s) => s && s.length > 0).join('\n');

  const steps = Array.from({ length: 20 }).flatMap((_, i) => {
    const n = String(i + 1).padStart(2, '0');
    const text = String(row[`MANUAL${n}`] ?? '').replace(/\s+/g, ' ').trim();
    const img = String(row[`MANUAL_IMG${n}`] ?? '').trim();
    return text ? [{ order: i + 1, description: text, imagePath: img || undefined }] : [];
  });

  const safeSteps = steps.length ? steps : [{ order: 1, description: '상세 조리법은 원문을 참고하세요.' }];

  // Ingredients: 카테고리별로 처리
  const rawIngredients = String(row.RCP_PARTS_DTLS ?? '');
  const ingredientsFormatted = parseIngredientsWithCategories(rawIngredients);

  return {
    id: seq || `import:${Date.now()}`,
    title,
    description: description || undefined,
    ingredients: ingredientsFormatted || undefined,
    cookingTime: 30,
    servings: null,
    difficulty: null,
    thumbnailImage: null,
    thumbnailUrl: (row.ATT_FILE_NO_MAIN || row.ATT_FILE_NO_MK || undefined) as string | undefined,
    thumbnailPath: null,
    linkTitle: undefined,
    linkUrl: undefined,
    steps: safeSteps,
    author: null,
    likesCount: null,
    isBookmarked: null,
    isSaved: null,
    isLiked: null,
    viewCount: null,
    commentsCount: null,
    savesCount: null,
  } as RecipeDetail;
}


