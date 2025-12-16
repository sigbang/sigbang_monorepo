import { slugify as baseSlugify } from 'transliteration';

const customMap: Record<string, string> = {
	'김치': 'kimchi',
	'불고기': 'bulgogi',
	'된장찌개': 'doenjang-stew',
};

export function normalizeTitleForSlug(title: string): string {
	let t = title;
	for (const [k, v] of Object.entries(customMap)) {
		// replace all occurrences
		t = t.replace(new RegExp(k, 'g'), v);
	}
	return t;
}

export function slugifyTitle(title: string): string {
	const normalized = normalizeTitleForSlug(title || '');
	return baseSlugify(normalized.toLowerCase(), { separator: '-', trim: true });
}

export function generateRecipeSlug(title: string, region?: string): string {
	const base = slugifyTitle(title);
	return region ? `${slugifyTitle(region)}/${base}` : base;
}


// Semantic slug generation via OpenAI with transliteration fallback
function sanitizeSlug(input: string): string {
	const s = (input || '')
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9 -]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');
	return s.replace(/^-+|-+$/g, '');
}

function tokenCountOk(slug: string): boolean {
	const n = slug.split('-').filter(Boolean).length;
	return n >= 3 && n <= 6;
}

let _openaiClient: any | null = null;
function getOpenAI() {
	if (_openaiClient) return _openaiClient;
	const apiKey = process.env.OPENAI_API_KEY as string | undefined;
	if (!apiKey) return null;
	// @ts-ignore
	const OpenAI = require('openai');
	_openaiClient = new OpenAI({ apiKey });
	return _openaiClient;
}

export async function semanticSlugifyTitle(title: string): Promise<string> {
	const t = String(title || '').trim();
	if (!t) return 'untitled-dish';

	try {
		const client = getOpenAI();
		if (client) {
			const model = (process.env.OPENAI_SLUG_MODEL as string) || (process.env.OPENAI_RECIPE_MODEL as string) || 'gpt-5-nano';
			const systemPrompt = `아래 텍스트는 요리 이름이다. 이 이름을 기반으로 의미 중심의 영어 슬러그(slug)를 생성한다.\n\n조건:\n- 음식 핵심 재료 또는 조리방식 포함\n- 한국어 로마자 표기는 쓰지 말고 의미 기반 영어로 변환\n- 3~6단어 사이\n- 단어는 소문자, -로 연결\n- "recipe" 같은 불필요한 단어 추가 금지\n- 가능하면 국가·스타일 정체성 반영 (korean, japanese, fusion 등)\n\n출력 형식:\nslug: {slug}`;
			const userPrompt = `입력: ${t}\n출력 예:\n가지나물 냉국 → slug: eggplant-herb-cold-soup\n한식 불고기 덮밥 → slug: korean-bulgogi-rice-bowl\n만두 라면 → slug: dumpling-ramen\n대파 파스타 → slug: scallion-pasta-korean-style\n고추장 연어 덮밥 → slug: gochujang-salmon-rice-bowl`;

			const resp = await client.chat.completions.create({
				model,
				temperature: 0.2,
				max_tokens: 30,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt },
				],
			});

			const content = resp.choices?.[0]?.message?.content || '';
			const m = content.match(/slug:\s*([a-z0-9-]+)/i);
			if (m?.[1]) {
				const slug = sanitizeSlug(m[1]);
				if (tokenCountOk(slug)) return slug;
			}
		}
	} catch {}

	return slugifyTitle(t);
}

export async function generateSemanticRecipeSlug(title: string, region?: string): Promise<string> {
	const base = await semanticSlugifyTitle(title);
	return region ? `${slugifyTitle(region)}/${base}` : base;
}


