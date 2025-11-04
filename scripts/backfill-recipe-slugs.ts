import { PrismaClient } from '../generated/prisma';
import { generateRecipeSlug } from '../src/common/utils/slug.util';

const prisma = new PrismaClient();

async function main() {
	const recipes = await prisma.recipe.findMany({
		select: { id: true, title: true, slug: true },
		orderBy: { createdAt: 'asc' },
	});

	const seen = new Set<string>();
	for (const r of recipes) {
		if (r.slug) {
			seen.add(r.slug);
			continue;
		}
		const base = generateRecipeSlug(r.title);
		let candidate = base;
		let i = 2;
		// ensure uniqueness across DB and this run
		// eslint-disable-next-line no-constant-condition
		while (true) {
			if (!seen.has(candidate)) {
				const exists = await prisma.recipe.findUnique({ where: { slug: candidate } });
				if (!exists) break;
			}
			candidate = `${base}-${i++}`;
		}
		await prisma.recipe.update({ where: { id: r.id }, data: { slug: candidate } });
		seen.add(candidate);
		console.log(`Backfilled slug for ${r.id} -> ${candidate}`);
	}
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});


