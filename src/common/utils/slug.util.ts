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


