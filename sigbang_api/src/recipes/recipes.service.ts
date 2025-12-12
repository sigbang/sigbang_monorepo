import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../database/supabase.service';
import {
  CreateRecipeDto,
  UpdateRecipeDto,
  RecipeQueryDto,
  RecipeResponseDto,
  DraftRecipeResponseDto,
  RecipeStatus,
  RecipeSearchQueryDto,
  CropRectDto,
} from './dto/recipes.dto';
import { ConfigService } from '@nestjs/config';
import { generateSemanticRecipeSlug } from '../common/utils/slug.util';
// sharp 로더: CJS/ESM 모두 호환되도록 런타임에서 안전하게 로드
let _sharp: any | null = null;
async function getSharp(): Promise<any> {
  if (_sharp) return _sharp;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    // @ts-ignore
    _sharp = require('sharp');
    try { _sharp.concurrency?.(2); } catch {}
    return _sharp;
  } catch (e: any) {
    if (e && (e.code === 'ERR_REQUIRE_ESM' || String(e).includes('ERR_REQUIRE_ESM'))) {
      const mod: any = await import('sharp');
      _sharp = mod?.default ?? mod;
      try { _sharp.concurrency?.(2); } catch {}
      return _sharp;
    }
    throw e;
  }
}

@Injectable()
export class RecipesService {
  constructor(
    private prismaService: PrismaService,
    private supabaseService: SupabaseService,
    private configService: ConfigService,
  ) {}

  private readonly logger = new Logger(RecipesService.name);

  private async ensureUniqueRecipeSlug(slug: string): Promise<string> {
    let candidate = slug;
    let i = 2;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const exists = await this.prismaService.recipe.findUnique({ where: { slug: candidate } });
      if (!exists) return candidate;
      candidate = `${slug}-${i++}`;
    }
  }

  // OpenAI 클라이언트 Lazy 생성
  private _openai: any | null = null;
  private get openai() {
    if (!this._openai) {
      // 동적 import로 번들 호환
      // @ts-ignore
      const OpenAI = require('openai');
      this._openai = new OpenAI({ apiKey: this.configService.get<string>('OPENAI_API_KEY') });
    }
    return this._openai;
  }

  // 인기 레시피 (최근 조회수/참여 기반)
  async getPopularRecipes(query: RecipeQueryDto, userId?: string) {
    const { cursor, limit = 10 } = (query as any) || {};

    // 커서: id 기반 키셋
    let decodedCursor: { id: string } | null = null;
    if (cursor) {
      try {
        decodedCursor = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
      } catch {
        decodedCursor = null;
      }
    }

    // Prisma: 공개 + 비숨김만
    const whereBase: any = {
      status: RecipeStatus.PUBLISHED,
      isHidden: false,
      authorId: { not: null },
      author: { status: 'ACTIVE' as any },
    };

    // 후보 풀: 최근 7일 기준 로드 후 부족하면 30일로 확장
    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const candidateTake = Math.max(limit * 10, 200);

    const loadCandidates = async (since: Date | null) => this.prismaService.recipe.findMany({
      where: { ...whereBase, ...(since ? { createdAt: { gte: since } } : {}) },
      take: candidateTake,
      ...(decodedCursor && { cursor: { id: decodedCursor.id }, skip: 1 }),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        author: { select: { id: true, nickname: true, profileImage: true } },
        tags: { include: { tag: true } },
        steps: { orderBy: { order: 'asc' }, take: 1 },
        _count: { select: { likes: true, comments: true, saves: true } },
        ...(userId && {
          likes: { where: { userId }, select: { id: true } },
          saves: { where: { userId }, select: { id: true } },
        }),
      },
    });

    let candidates = await loadCandidates(sevenDaysAgo);
    if (candidates.length < Math.min(candidateTake / 2, limit * 5)) {
      const more = await loadCandidates(thirtyDaysAgo);
      const seen = new Set(candidates.map(r => r.id));
      for (const m of more) {
        if (!seen.has(m.id)) {
          candidates.push(m);
        }
      }
    }

    // 트렌드 점수: 시간감쇠(환경변수, 기본 24h), 조회/참여 혼합
    const tauHours = Number(this.configService.get('POPULAR_TAU_HOURS')) || 24;
    const wView = 0.6, wLike = 1.0, wComment = 2.0, wSave = 1.5;
    function trendScore(r: any): number {
      const ageH = (now - new Date(r.createdAt).getTime()) / (1000 * 60 * 60);
      const decay = Math.exp(-ageH / tauHours);
      const views = Math.log(1 + (r.viewCount || 0));
      const eng = Math.log(1 + wLike * (r._count?.likes || 0) + wComment * (r._count?.comments || 0) + wSave * (r._count?.saves || 0));
      return decay * (wView * views + eng);
    }

    // 6시간 단위 시드 셔플: 점수 버킷 내 순서 다양화 (KST 기준)
    const nowDate = new Date();
    const hourKst = (nowDate.getUTCHours() + 9) % 24;
    const slot = Math.floor(hourKst / 6); // 0..3
    const daySeed = userId
      ? `u:${userId}:${slot}`
      : `d:${nowDate.toISOString().slice(0, 10)}:${slot}`;
    function hashStr(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h >>> 0; }

    const scored = candidates.map(r => ({ r, s: trendScore(r) }));
    scored.sort((a, b) => {
      const ba = Math.round(a.s * 10);
      const bb = Math.round(b.s * 10);
      if (bb !== ba) return bb - ba;
      const ha = hashStr(a.r.id + daySeed);
      const hb = hashStr(b.r.id + daySeed);
      return ha - hb;
    });

    // 신규/저노출 보장: 매 10개당 1개 시도(24h내, 조회<5)
    const isVeryNew = (r: any) => (now - new Date(r.createdAt).getTime()) < 24 * 3600 * 1000 && (r.viewCount || 0) < 5;
    const main = scored.map(x => x.r);
    const veryNew = main.filter(r => isVeryNew(r));

    const result: any[] = [];
    let i = 0, j = 0;
    while (result.length < limit && (i < main.length || j < veryNew.length)) {
      if (result.length > 0 && result.length % 10 === 9 && j < veryNew.length) {
        if (!result.find(x => x.id === veryNew[j].id)) result.push(veryNew[j]);
        j++;
      } else if (i < main.length) {
        if (!result.find(x => x.id === main[i].id)) result.push(main[i]);
        i++;
      } else {
        j++;
      }
    }

    const pageItems = result.slice(0, limit);
    const last = pageItems[pageItems.length - 1];
    const nextCursor = last ? Buffer.from(JSON.stringify({ id: last.id })).toString('base64') : null;

    const recipes = pageItems.map((recipe: any) => ({
      ...recipe,
      tags: recipe.tags.map((t: any) => ({ name: t.tag.name, emoji: t.tag.emoji })),
      steps: recipe.steps.map((s: any) => ({ order: s.order, description: s.description, imageUrl: s.imageUrl })),
      likesCount: recipe._count.likes,
      commentsCount: recipe._count.comments,
      isLiked: userId ? recipe.likes?.length > 0 : false,
      isSaved: userId ? recipe.saves?.length > 0 : false,
    }));

    return {
      recipes,
      pageInfo: {
        limit,
        nextCursor,
        hasMore: result.length > limit,
      },
    };
  }

  // AI: 이미지 기반 레시피 생성 (제목이 없으면 생성 포함)
  async generateFromImage(userId: string, params: { imagePath: string; title?: string }) {
    const { imagePath, title } = params;
    const bucketName = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'recipes';

    if (!imagePath || typeof imagePath !== 'string') {
      throw new BadRequestException('유효한 imagePath가 필요합니다.');
    }

    // 사인드 URL 생성 (프라이빗 버킷 대응)
    const signedUrl = await this.supabaseService.createSignedUrl(bucketName, imagePath, 60 * 5);

    // OpenAI prompt 구성
    const systemPrompt = `You are a friendly and modern cooking buddy. Look at the food image and create a simple recipe in JSON format. The tone should be light, casual, and approachable (not too professional). Do not limit yourself to Korean food. The recipe can be Korean, global, or fusion depending on the image and context. For the title: avoid plain ingredient listings. Instead, make it feel informative and lively, like something you'd see in a modern recipe blog or cooking app.`;

    const userPrompt = `다음 이미지를 분석해서 레시피를 만들어줘. 조건:
1) 제목:
   - 단순히 재료만 나열하지 말고 ("올리브 문어 요리" X)
   - 생활감 있고 감각적인 제목으로 ("문어로 즐기는 스페인 뽈뽀" O)
   - 음식의 국가/스타일/분위기/활용 맥락을 자연스럽게 반영
2) 설명: 2~3문장, 글로벌/퓨전 포함 가능, 캐주얼 톤 (블로그 글 같은 느낌)
3) 재료: 줄바꿈으로 구분된 목록 (간단 명확, 계량 포함)
4) 조리시간: 10분, 30분, 60분 중 하나
5) 조리순서: 4~6개, 각 단계는 짧고 친근한 설명으로

결과는 반드시 다음 JSON 포맷으로만 응답:
{
  "title": string,
  "description": string,
  "ingredients": string, // 줄바꿈 구분
  "cookingTime": number,
  "steps": [{ "order": number, "description": string }]
}`;

    // OpenAI Responses API (vision) 호출
    try {
      const model = this.configService.get<string>('OPENAI_RECIPE_MODEL') || 'gpt-4o-mini';
      const response = await this.openai.chat.completions.create({
        model,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: signedUrl } },
            ],
          } as any,
        ],
        response_format: { type: 'json_object' } as any,
      });

      const content = response.choices?.[0]?.message?.content || '{}';
      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch {
        // JSON이 아니면 텍스트 내에서 시도
        const match = content.match(/\{[\s\S]*\}$/);
        parsed = match ? JSON.parse(match[0]) : {};
      }

      // 결과 정규화
      const finalTitle: string = title || String(parsed.title || '').slice(0, 100) || 'AI 레시피';
      const description: string = String(parsed.description || '').slice(0, 1000);
      const ingredients: string = String(parsed.ingredients || '').slice(0, 2000);
      const cookingTime: number = Math.max(1, Math.min(600, parseInt(String(parsed.cookingTime || '20'), 10) || 20));
      const stepsRaw: Array<any> = Array.isArray(parsed.steps) ? parsed.steps : [];
      const steps = stepsRaw
        .slice(0, 3)
        .map((s, idx) => ({ order: Number(s.order) || idx + 1, description: String(s.description || '').slice(0, 500) }))
        .filter(s => s.description);
      while (steps.length < 2) {
        steps.push({ order: steps.length + 1, description: '재료를 손질하고 기본 양념을 준비합니다.' });
      }

      return {
        title: finalTitle,
        description,
        ingredients,
        cookingTime,
        steps,
      };
    } catch (error) {
      this.logger.error(`AI 레시피 생성 실패: ${String((error as any)?.message || error)}`);
      throw new BadRequestException('AI 레시피 생성에 실패했습니다.');
    }
  }

  // AI: 비정형 재료 텍스트 정규화
  async normalizeIngredients(raw: string, locale: 'ko' | 'en' = 'ko') {
    if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
      throw new BadRequestException('raw 텍스트가 필요합니다.');
    }

    const systemPromptKo =
  '너는 공공데이터 기반의 비정형 요리 재료 정보를 사람 친화적인 레시피 형식으로 정리하는 전문 도우미야. '
+ '입력 텍스트는 레시피의 재료 목록이며, 종종 단위나 표현이 일관되지 않아. '
+ '너의 목표는 사람이 읽기 편하고, 실제 요리에 바로 활용 가능한 형태로 재작성하는 것이야. '

+ '규칙은 다음과 같아. '
+ '1. 제목이 있다면(예: 필수 재료, 밑간, 양념 등)은 유지하고, 각 항목은 "- 재료명 : 양 또는 개수" 형태로 줄바꿈해. '
+ '2. 단위는 가능한 g 단위를 유지하되, 일반적으로 개수나 비율로 표현하는 것이 자연스러울 경우 변환해. '
+ '예를 들어 "양파 30g → 1/4개", "숙주 50g → 한 줌", "소금 1g → 약간"처럼 바꿔줘. '
+ '3. 재료명 뒤의 수치는 단위와 함께 표기하되, 자연스러운 조리 감각 표현(약간, 한 줌, 적당량 등)을 적절히 사용해. '
+ '4. 숫자 단위는 소수점 없이 간단히, 단위(g, 개, 장, 알 등)는 일관되게 붙여줘. '
+ '5. 괄호, 불필요한 설명, 원산지, 브랜드명 등은 모두 제거해. '
+ '6. 사람이 보기 좋은 깔끔한 스타일로 작성하며, 출력은 반드시 텍스트 형태로만 해. '
+ '7. 재료명 앞뒤 공백, 중복 항목, 불필요한 기호는 모두 정리해. '
+ '8. 필요 시 "양념", "소스", "고명" 등 카테고리를 인식해 자동 분류를 유지해줘. '
+ '9. 표기는 Markdown 문법을 적용해 제목은 **굵게** 표시하고, 항목은 "-"으로 구분해. '

+ '결과 예시:\n'
+ '**필수 재료**\n'
+ '- 대하 : 3마리\n'
+ '- 쌀 : 90g\n'
+ '- 양파 : 1/4개\n'
+ '- 숙주 : 한 줌\n'
+ '- 소금 : 약간\n\n'
+ '**양념**\n'
+ '- 진간장 : 1큰술\n'
+ '- 다진 마늘 : 1작은술\n'

+ '출력은 사람이 즉시 이해할 수 있는 완성된 레시피 재료 정리본이어야 해.';


    const systemPromptEn =
      'You format messy ingredient text into clean, human-friendly cooking notes. '
      + 'Prefer grams when natural; convert to counts/ratio when it reads better. '
      + "Keep section headings (e.g., Essentials, Seasoning) and list each as '- name : amount'. "
      + 'Exclude extra commentary; write concise, readable recipe style.';

    const system = locale === 'en' ? systemPromptEn : systemPromptKo;
    const user = locale === 'en'
      ? `Please convert the following ingredient text into a clean list. Keep headings and use '- name : amount' per line.\n\n${raw}`
      : `다음 재료 정보를 보기 좋은 텍스트로 변환해줘.\n\n${raw}`;

    try {
      const model =
        this.configService.get<string>('OPENAI_RECIPE_MODEL')
        || 'gpt-4o-mini';

      const resp = await this.openai.chat.completions.create({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });

      const text: string = resp.choices?.[0]?.message?.content?.trim() || '';
      if (!text) {
        throw new BadRequestException('정규화 결과가 비어 있습니다.');
      }
      const usage: any = (resp as any).usage || {};
      return {
        text,
        meta: {
          model,
          tokens: usage
            ? { prompt: usage.prompt_tokens ?? 0, completion: usage.completion_tokens ?? 0, total: usage.total_tokens ?? 0 }
            : undefined,
        },
      };
    } catch (error) {
      this.logger.error(`재료 정규화 실패: ${String((error as any)?.message || error)}`);
      throw new BadRequestException('재료 정규화에 실패했습니다.');
    }
  }

  // 개인화 추천 (간단 휴리스틱): 팔로우, 태그 유사, 참여 점수
  async getRecommendedRecipes(query: RecipeQueryDto, userId?: string) {
    const { cursor, limit = 10 } = (query as any) || {};
    this.logger.log(
      `getRecommendedRecipes start u=${userId ?? 'anon'} limit=${limit} cursor=${cursor ? 'y' : 'n'}`,
    );

    let decodedCursor: { id: string } | null = null;
    if (cursor) {
      try {
        decodedCursor = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
      } catch {
        decodedCursor = null;
      }
    }

    const whereBase: any = {
      status: RecipeStatus.PUBLISHED,
      isHidden: false,
      authorId: { not: null },
      author: { status: 'ACTIVE' as any },
    };

    // 0) 활성 모델 기반 사전계산 추천이 있으면 우선 사용 (로그인 사용자 대상)
    if (userId) {
      try {
        const activeModel = await (this.prismaService as any).recoModelRegistry.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        });
        if (activeModel) {
          this.logger.log(`getRecommendedRecipes found active reco model id=${activeModel.id}`);
          const rec = await (this.prismaService as any).userRecommendations.findUnique({
            where: { userId_modelId: { userId, modelId: activeModel.id } },
          });
          if (rec?.items && Array.isArray(rec.items) && rec.items.length) {
            // items: [{recipeId, score}]
            const ids: string[] = rec.items.map((x: any) => x.recipeId).filter(Boolean);
            if (ids.length) {
              const rows = await this.prismaService.recipe.findMany({
                where: { ...whereBase, id: { in: ids } },
                include: {
                  author: { select: { id: true, nickname: true, profileImage: true } },
                  tags: { include: { tag: true } },
                  steps: { orderBy: { order: 'asc' }, take: 1 },
                  _count: { select: { likes: true, comments: true, saves: true } },
                  likes: { where: { userId }, select: { id: true } },
                  saves: { where: { userId }, select: { id: true } },
                },
              });
              // rec.items 순서 유지
              const order = new Map(ids.map((id, i) => [id, i]));
              const ordered = rows.sort((a: any, b: any) => (order.get(a.id) ?? 1e9) - (order.get(b.id) ?? 1e9));
              const pageItems = ordered.slice(0, limit);
              const last = pageItems[pageItems.length - 1];
              const nextCursorPc = last ? Buffer.from(JSON.stringify({ id: last.id })).toString('base64') : null;
              const recipesPc = pageItems.map((recipe: any) => ({
                ...recipe,
                tags: recipe.tags.map((t: any) => ({ name: t.tag.name, emoji: t.tag.emoji })),
                steps: recipe.steps.map((s: any) => ({ order: s.order, description: s.description, imageUrl: s.imageUrl })),
                likesCount: recipe._count.likes,
                commentsCount: recipe._count.comments,
                isLiked: recipe.likes?.length > 0,
                isSaved: recipe.saves?.length > 0,
              }));

              // 선계산 추천으로부터 유효한 결과가 있을 때만 바로 반환하고,
              // 그렇지 않으면 아래 휴리스틱/폴백 로직으로 진행
              if (recipesPc.length > 0) {
                this.logger.log(
                  `getRecommendedRecipes using precomputed reco count=${recipesPc.length} hasMore=${ordered.length > limit}`,
                );
                return {
                  recipes: recipesPc,
                  pageInfo: { limit, nextCursor: nextCursorPc, hasMore: ordered.length > limit },
                };
              }
              this.logger.log('getRecommendedRecipes precomputed reco empty after filtering, falling back to heuristic');
            }
          }
        }
      } catch (e) {
        this.logger.warn(`precomputed reco fallback to heuristic: ${String(e)}`);
      }
    }

    // 팔로우 저자, 내가 좋아요/저장한 태그 추출
    let followingAuthorIds: string[] = [];
    let preferredTagNames: string[] = [];
    if (userId) {
      try {
        const [follows, likedTags, savedTags] = await Promise.all([
          (this.prismaService as any).follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
          this.prismaService.tag.findMany({
            where: {
              recipes: { some: { recipe: { likes: { some: { userId } } } } },
            },
            select: { name: true },
          }),
          this.prismaService.tag.findMany({
            where: {
              recipes: { some: { recipe: { saves: { some: { userId } } } } },
            },
            select: { name: true },
          }),
        ]);
        followingAuthorIds = follows.map((f: any) => f.followingId);
        preferredTagNames = Array.from(new Set([...likedTags.map(t => t.name), ...savedTags.map(t => t.name)])).slice(0, 20);
      } catch {}
    }

    // 후보 풀 로드: 최신 상위 N
    const tCandidates = Date.now();
    const candidates = await this.prismaService.recipe.findMany({
      where: whereBase,
      take: Math.max(100, limit * 10),
      ...(decodedCursor && { cursor: { id: decodedCursor.id }, skip: 1 }),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        author: { select: { id: true, nickname: true, profileImage: true } },
        tags: { include: { tag: true } },
        steps: { orderBy: { order: 'asc' }, take: 1 },
        _count: { select: { likes: true, comments: true, saves: true } },
        ...(userId && {
          likes: { where: { userId }, select: { id: true } },
          saves: { where: { userId }, select: { id: true } },
        }),
      },
    });
    this.logger.debug(
      `getRecommendedRecipes candidates loaded=${candidates.length} in ${Date.now() - tCandidates}ms`,
    );

    const tagSet = new Set(preferredTagNames);
    const wFollow = 1.0;
    const wTag = 0.8;
    const wEng = 0.5;
    const wRecency = 0.2;
    const wSeason = 0.2;
    const now = Date.now();

    // 간단 계절성 부스트 (임시 키워드 매핑)
    function seasonalBoost(r: any): number {
      try {
        const m = new Date().getMonth() + 1;
        const tags = (r.tags || []).map((rt: any) => (rt.tag?.name || '').toLowerCase());
        const has = (k: string) => tags?.some((t: string) => t.includes(k));
        if ([12, 1, 2].includes(m)) return has('국') || has('찌개') || has('김장') ? 1 : 0;
        if ([6, 7, 8].includes(m)) return has('냉') || has('샐러드') || has('빙수') ? 1 : 0;
      } catch {}
      return 0;
    }

    const sparseUser = !userId || (followingAuthorIds.length === 0 && preferredTagNames.length === 0);

    // 베이스 스코어 계산
    const scored = candidates.map(r => {
      const isFollow = userId ? followingAuthorIds.includes(r.authorId) : false;
      const tagOverlap = r.tags?.reduce((acc: number, rt: any) => acc + (tagSet.has(rt.tag.name) ? 1 : 0), 0) || 0;
      const eng = Math.log(1 + (r._count?.likes || 0) + 2 * (r._count?.comments || 0) + 1.5 * (r._count?.saves || 0));
      const ageHours = (now - new Date(r.createdAt).getTime()) / (1000 * 60 * 60);
      const recency = Math.exp(-ageHours / 72);
      const season = seasonalBoost(r);
      const baseScore = wFollow * (isFollow ? 1 : 0) + wTag * tagOverlap + wEng * eng + wRecency * recency + wSeason * season;
      return { r, baseScore, eng, ageHours };
    });

    // 콜드스타트 혼합: 60% 트렌드(eng+recency), 40% 탐색(신규/저노출 주입)
    let ranked: any[] = [];
    if (sparseUser) {
      const trend = scored
        .map(x => ({ r: x.r, s: 0.6 * (x.eng + Math.exp(-x.ageHours / 48)) + 0.4 * x.baseScore }))
        .sort((a, b) => b.s - a.s)
        .map(x => x.r);

      const explore = candidates
        .filter(r => (now - new Date(r.createdAt).getTime()) < 24 * 3600 * 1000 && ((r.viewCount || 0) < 5))
        .slice(0, Math.max(10, limit));

      const merged: any[] = [];
      let i = 0, j = 0;
      while (merged.length < Math.max(limit + 1, 20) && (i < trend.length || j < explore.length)) {
        if (merged.length % 5 === 4 && j < explore.length) {
          if (!merged.find(x => x.id === explore[j].id)) merged.push(explore[j]);
          j++;
        } else if (i < trend.length) {
          if (!merged.find(x => x.id === trend[i].id)) merged.push(trend[i]);
          i++;
        } else {
          j++;
        }
      }
      ranked = merged;
    } else {
      ranked = scored.sort((a, b) => b.baseScore - a.baseScore).map(x => x.r);
    }

    // 유니크 + 페이지 크기 맞춤
    const unique: any[] = [];
    const seen = new Set<string>();
    for (const r of ranked) {
      if (!seen.has(r.id)) {
        unique.push(r);
        seen.add(r.id);
      }
      if (unique.length >= limit + 1) break;
    }

    const hasMore = unique.length > limit;
    const pageItems = hasMore ? unique.slice(0, limit) : unique;
    const lastItem = pageItems[pageItems.length - 1];
    const nextCursor = lastItem ? Buffer.from(JSON.stringify({ id: lastItem.id })).toString('base64') : null;

    const recipes = pageItems.map((recipe: any) => ({
      ...recipe,
      tags: recipe.tags.map((t: any) => ({ name: t.tag.name, emoji: t.tag.emoji })),
      steps: recipe.steps.map((s: any) => ({ order: s.order, description: s.description, imageUrl: s.imageUrl })),
      likesCount: recipe._count.likes,
      commentsCount: recipe._count.comments,
      isLiked: userId ? recipe.likes?.length > 0 : false,
      isSaved: userId ? recipe.saves?.length > 0 : false,
    }));

    // 후보가 전혀 없을 때는 완전히 빈 추천 피드 대신 인기 피드로 폴백
    if (recipes.length === 0) {
      this.logger.warn('getRecommendedRecipes produced 0 recipes, falling back to getPopularRecipes');
      return this.getPopularRecipes(query, userId);
    }

    // 추천 결과가 limit보다 적을 경우, 인기 피드로 부족분을 보강
    if (recipes.length < limit) {
      try {
        const popular = await this.getPopularRecipes({ ...query, cursor: undefined, limit: limit * 2 } as any, userId);
        const seenIds = new Set(recipes.map(r => r.id));
        for (const p of popular.recipes) {
          if (recipes.length >= limit) break;
          if (!seenIds.has(p.id)) {
            recipes.push(p as any);
            seenIds.add(p.id);
          }
        }
        // 보강 후 nextCursor/hasMore 재계산
        const last = recipes[recipes.length - 1];
        const mergedNextCursor = last ? Buffer.from(JSON.stringify({ id: last.id })).toString('base64') : null;
        const mergedHasMore = recipes.length >= limit && !!mergedNextCursor;
        this.logger.log(
          `getRecommendedRecipes boosted with popular: finalCount=${recipes.length} limit=${limit} hasMore=${mergedHasMore}`,
        );
        return {
          recipes,
          pageInfo: {
            limit,
            nextCursor: mergedNextCursor,
            hasMore: mergedHasMore,
          },
        };
      } catch (e) {
        // 인기 피드 보강이 실패해도 기존 추천 결과는 그대로 반환
        this.logger.warn(`getRecommendedRecipes popular boost failed: ${String(e)}`);
      }
    }

    return {
      recipes,
      pageInfo: {
        limit,
        nextCursor,
        hasMore,
      },
    };
  }

  // 7. 검색 (TRGM + 트렌드 혼합 점수, 키셋 페이지네이션)
  async search(params: RecipeSearchQueryDto, userId?: string): Promise<{ items: any[]; nextCursor?: string }> {
    const t0 = Date.now();
    const { q, limit = 20, cursor } = params;

    // 캐시 키
    const cursorKey = cursor ? cursor : '_none';
    const cacheKey = `search:${q && q.trim() ? q.trim() : '_none'}:${cursorKey}`;

    // 간단한 프로세스 캐시 (60~120s)
    const g: any = global as any;
    if (!g.__searchCache) {
      g.__searchCache = new Map<string, { expire: number; value: any }>();
    }
    const cached = g.__searchCache.get(cacheKey);
    if (cached && cached.expire > Date.now()) {
      return cached.value;
    }

    const safeLimit = Math.max(1, Math.min(50, limit));

    // 커서: {score,id}
    let afterScore: number | null = null;
    let afterId: string | null = null;
    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8')) as { score: number; id: string };
        afterScore = decoded.score;
        afterId = decoded.id;
      } catch (e) {
        this.logger.warn(`search cursor decode failed: ${String(e)}`);
      }
    }

    // q 없음 → 트렌드 피드 (trendScore desc, id desc)
    if (!q || !q.trim()) {
      const rows = await (this.prismaService as any).$queryRaw<any[]>`
        SELECT r.*,
               COALESCE(rc."trendScore", 0) AS trend_score
        FROM recipes r
        LEFT JOIN recipe_counters rc ON rc."recipeId" = r.id
        WHERE r."status" = 'PUBLISHED' AND r."isHidden" = false
          AND r."authorId" IS NOT NULL
          AND EXISTS (SELECT 1 FROM users u WHERE u.id = r."authorId" AND u.status = 'ACTIVE')
          AND (${afterScore as any}::numeric IS NULL OR (COALESCE(rc."trendScore",0), r.id) < (${afterScore as any}::numeric, ${afterId as any}::text))
        ORDER BY COALESCE(rc."trendScore", 0) DESC, r.id DESC
        LIMIT ${safeLimit + 1}
      `;

      const page = rows.slice(0, safeLimit);
      const next = rows.length > safeLimit ? rows[safeLimit] : null;
      const nextCursor = next
        ? Buffer.from(JSON.stringify({ score: Number(next.trend_score) || 0, id: next.id })).toString('base64')
        : null;

      // 상세 정보 로드 (피드 카드 형태)
      const ids = page.map(r => r.id);
      const details = ids.length
        ? await this.prismaService.recipe.findMany({
            where: { id: { in: ids } },
            include: {
              author: { select: { id: true, nickname: true, profileImage: true } },
              tags: { include: { tag: true } },
              steps: { orderBy: { order: 'asc' }, take: 1 },
              _count: { select: { likes: true, comments: true } },
              ...(userId && {
                likes: { where: { userId }, select: { id: true } },
                saves: { where: { userId }, select: { id: true } },
              }),
            },
          })
        : [];
      const byId = new Map(details.map(d => [d.id, d]));
      const items = ids.map(id => {
        const recipe: any = byId.get(id);
        if (!recipe) return null;
        return {
          ...recipe,
          tags: recipe.tags.map((t: any) => ({ name: t.tag.name, emoji: t.tag.emoji })),
          steps: recipe.steps.map((s: any) => ({ order: s.order, description: s.description, imageUrl: s.imageUrl })),
          likesCount: recipe._count.likes,
          commentsCount: recipe._count.comments,
          isLiked: userId ? recipe.likes?.length > 0 : false,
          isSaved: userId ? recipe.saves?.length > 0 : false,
        };
      }).filter(Boolean) as any[];

      const result = { items, nextCursor };
      g.__searchCache.set(cacheKey, { expire: Date.now() + 90_000, value: result });
      this.logger.log(`search(q:none) u=${userId ?? 'anon'} took=${Date.now() - t0}ms len=${page.length}`);
      return result;
    }

    // q 있음 → 혼합 점수 정렬
    const qTrim = q.trim();

    const buildResult = async (rows: any[], scoreField: 'total_score' | 'trend_score') => {
      const page = rows.slice(0, safeLimit);
      const next = rows.length > safeLimit ? rows[safeLimit] : null;
      const nextCursor = next
        ? Buffer.from(JSON.stringify({ score: Number((next as any)[scoreField]) || 0, id: (next as any).id })).toString('base64')
        : null;

      // 상세 정보 로드 (피드 카드 형태)
      const ids = page.map(r => r.id);
      const details = ids.length
        ? await this.prismaService.recipe.findMany({
            where: { id: { in: ids } },
            include: {
              author: { select: { id: true, nickname: true, profileImage: true } },
              tags: { include: { tag: true } },
              steps: { orderBy: { order: 'asc' }, take: 1 },
              _count: { select: { likes: true, comments: true } },
              ...(userId && {
                likes: { where: { userId }, select: { id: true } },
                saves: { where: { userId }, select: { id: true } },
              }),
            },
          })
        : [];
      const byId = new Map(details.map(d => [d.id, d]));
      const items = ids
        .map(id => {
          const recipe: any = byId.get(id);
          if (!recipe) return null;
          return {
            ...recipe,
            tags: recipe.tags.map((t: any) => ({ name: t.tag.name, emoji: t.tag.emoji })),
            steps: recipe.steps.map((s: any) => ({ order: s.order, description: s.description, imageUrl: s.imageUrl })),
            likesCount: recipe._count.likes,
            commentsCount: recipe._count.comments,
            isLiked: userId ? recipe.likes?.length > 0 : false,
            isSaved: userId ? recipe.saves?.length > 0 : false,
          };
        })
        .filter(Boolean) as any[];

      const result = { items, nextCursor };
      const ttl = 60_000 + Math.floor(Math.random() * 60_000);
      g.__searchCache.set(cacheKey, { expire: Date.now() + ttl, value: result });
      return { result, pageLength: page.length };
    };

    try {
      const rows = await (this.prismaService as any).$queryRaw<any[]>`
        WITH scored AS (
          SELECT r.*,
                 GREATEST(similarity(r.title, ${qTrim as any}), similarity(r.ingredients, ${qTrim as any})) AS text_score,
                 CASE
                   WHEN ${qTrim as any} = ANY(COALESCE(r."altTitles", ARRAY[]::text[])) THEN 0.15
                   WHEN EXISTS (
                     SELECT 1 FROM unnest(COALESCE(r."altTitles", ARRAY[]::text[])) t WHERE t ILIKE '%' || ${qTrim as any} || '%'
                   ) THEN 0.08
                   ELSE 0
                 END AS alias_bonus,
                 COALESCE(rc."trendScore", 0) AS trend_score
          FROM recipes r
          LEFT JOIN recipe_counters rc ON rc."recipeId" = r.id
          WHERE r."status" = 'PUBLISHED' AND r."isHidden" = false
            AND r."authorId" IS NOT NULL
            AND EXISTS (SELECT 1 FROM users u WHERE u.id = r."authorId" AND u.status = 'ACTIVE')
            AND (
              r.title ILIKE '%' || ${qTrim as any} || '%'
              OR r.ingredients ILIKE '%' || ${qTrim as any} || '%'
              OR r.title % ${qTrim as any}
              OR r.ingredients % ${qTrim as any}
            )
        )
        SELECT *, (0.7 * text_score + 0.1 * alias_bonus + 0.3 * trend_score) AS total_score
        FROM scored
        WHERE (${afterScore as any}::numeric IS NULL OR (0.7 * text_score + 0.1 * alias_bonus + 0.3 * trend_score, id) < (${afterScore as any}::numeric, ${afterId as any}::text))
        ORDER BY total_score DESC, id DESC
        LIMIT ${safeLimit + 1}
      `;

      const { result, pageLength } = await buildResult(rows, 'total_score');
      this.logger.log(`search(q) u=${userId ?? 'anon'} took=${Date.now() - t0}ms len=${pageLength}`);
      return result;
    } catch (e: any) {
      const code = (e && (e.code || e.meta?.code)) || e?.name || 'UNKNOWN';
      this.logger.error(
        `search(q) failed q="${qTrim}" u=${userId ?? 'anon'} code=${code} msg=${e?.message}`,
        e?.stack,
      );

      // pg_trgm / similarity 관련 함수가 없는 경우 → LIKE 기반 fallback
      if (code === '42883') {
        this.logger.warn('pg_trgm similarity function missing, falling back to LIKE-based search');

        const rows = await (this.prismaService as any).$queryRaw<any[]>`
          SELECT r.*,
                 COALESCE(rc."trendScore", 0) AS trend_score
          FROM recipes r
          LEFT JOIN recipe_counters rc ON rc."recipeId" = r.id
          WHERE r."status" = 'PUBLISHED' AND r."isHidden" = false
            AND r."authorId" IS NOT NULL
            AND EXISTS (SELECT 1 FROM users u WHERE u.id = r."authorId" AND u.status = 'ACTIVE')
            AND (
              r.title ILIKE '%' || ${qTrim as any} || '%'
              OR r.ingredients ILIKE '%' || ${qTrim as any} || '%'
            )
          ORDER BY COALESCE(rc."trendScore", 0) DESC, r.id DESC
          LIMIT ${safeLimit + 1}
        `;

        const { result, pageLength } = await buildResult(rows, 'trend_score');
        this.logger.log(
          `search(q:fallback-like) u=${userId ?? 'anon'} took=${Date.now() - t0}ms len=${pageLength}`,
        );
        return result;
      }

      // 다른 에러는 상위 핸들러로 전파
      throw e;
    }
  }

  // 레시피 생성 (즉시 공개)
  async create(userId: string, createRecipeDto: CreateRecipeDto) {
    const { tags, steps, thumbnailPath, thumbnailCrop, ...recipeData } = createRecipeDto as any;

    // Supabase 버킷명
    const bucketName = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'recipes';    

    // 이미지 경로 정리: temp 경로를 다운로드 후 전처리하여 정식 경로로 저장
    const now = Date.now();
    let finalThumbnailUrl: string | undefined = undefined;

    // temp/{userId}/... 에서 오는 경우 이동
    const isTempPath = (p?: string) => !!p && p.startsWith(`temp/${userId}/`);
    const toPublicUrl = (path: string) => this.supabaseService.getPublicUrl(bucketName, path);

    try {
      // 1) 썸네일 처리: temp 이미지를 다운로드 → sharp(WebP) → 영구 경로 업로드(+cache) → temp 삭제
      if (isTempPath(thumbnailPath)) {
        const tempKey = thumbnailPath!;
        const original = await this.supabaseService.downloadFile(bucketName, tempKey);
        const sharp = await getSharp();
        const baseImg = sharp(original).rotate();
        const meta = await baseImg.metadata();
        const iw = meta.width || 0;
        const ih = meta.height || 0;
        let pipeline = baseImg;
        const crop = (createRecipeDto as any).thumbnailCrop as CropRectDto | undefined;
        if (crop && iw > 0 && ih > 0) {
          const left = Math.max(0, Math.min(iw - 1, Math.round((crop.x / 100) * iw)));
          const top = Math.max(0, Math.min(ih - 1, Math.round((crop.y / 100) * ih)));
          const width = Math.max(1, Math.min(iw - left, Math.round((crop.width / 100) * iw)));
          const height = Math.max(1, Math.min(ih - top, Math.round((crop.height / 100) * ih)));
          pipeline = pipeline.extract({ left, top, width, height });
        }
        const processed = await pipeline
          .resize({ width: 1280, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
        const rawName = tempKey.split('/').pop() || `${now}.jpg`;
        const base = rawName.replace(/\.[^.]+$/, '');
        const finalThumbKey = `recipes/${userId}/thumbnails/${now}_${base}.webp`;
        const cacheSeconds = 60 * 60 * 24 * 365;
        await this.supabaseService.uploadFile(bucketName, finalThumbKey, processed, 'image/webp', cacheSeconds);
        try { await this.supabaseService.deleteFile(bucketName, [tempKey]); } catch {}
        finalThumbnailUrl = toPublicUrl(finalThumbKey);
      } else if (thumbnailPath) {
        finalThumbnailUrl = thumbnailPath.startsWith('http')
          ? thumbnailPath
          : toPublicUrl(thumbnailPath);
      }

      // 2) 슬러그 생성 및 DB에 레시피 생성 (PUBLISHED)
      const rawSlug = await generateSemanticRecipeSlug(recipeData.title);
      const uniqueSlug = await this.ensureUniqueRecipeSlug(rawSlug);
      const recipe = await this.prismaService.recipe.create({
        data: {
          ...recipeData,
          slug: uniqueSlug,
          description: (recipeData.description ?? '').toString(),
          ingredients: (recipeData.ingredients ?? '').toString(),
          authorId: userId,
          status: RecipeStatus.PUBLISHED,
          ...(finalThumbnailUrl && { thumbnailImage: finalThumbnailUrl }),
        },
      });

      // 3) 태그 생성/연결
      if (tags && tags.length > 0) {
        await this.handleTags(recipe.id, tags);
      }

      // 4) 단계 생성 (스텝 이미지 이동 포함)
      if (steps && steps.length > 0) {
        const normalizedSteps = [] as Array<{ order: number; description: string; imageUrl?: string }>; 
        for (const step of steps as Array<{ order: number; description: string; imagePath?: string }>) {
          let imageUrl: string | undefined = undefined;
          if (isTempPath(step.imagePath)) {
            const tempKey = step.imagePath!;
            const original = await this.supabaseService.downloadFile(bucketName, tempKey);
            const sharp = await getSharp();
            const processed = await sharp(original)
              .rotate()
              .resize({ width: 1600, withoutEnlargement: true })
              .webp({ quality: 82 })
              .toBuffer();
            const rawName = tempKey.split('/').pop() || `${now}.jpg`;
            const base = rawName.replace(/\.[^.]+$/, '');
            const finalStepKey = `recipes/${userId}/steps/${now}_${base}.webp`;
            const cacheSeconds = 60 * 60 * 24 * 365;
            await this.supabaseService.uploadFile(bucketName, finalStepKey, processed, 'image/webp', cacheSeconds);
            try { await this.supabaseService.deleteFile(bucketName, [tempKey]); } catch {}
            imageUrl = toPublicUrl(finalStepKey);
          } else if (step.imagePath) {
            // imagePath가 이미 최종 key이거나 URL인 경우 처리
            imageUrl = step.imagePath.startsWith('http')
              ? step.imagePath
              : toPublicUrl(step.imagePath);
          }
          normalizedSteps.push({ order: step.order, description: (step as any).description ?? '', imageUrl });
        }
        await this.handleSteps(recipe.id, normalizedSteps);
      }

      return { id: recipe.id, ...(finalThumbnailUrl ? { thumbnailImage: finalThumbnailUrl } : {}) };
    } catch (error) {
      this.logger.error(`레시피 생성 실패: ${String((error as any)?.message || error)}`, (error as any)?.stack);
      throw new BadRequestException(`레시피 생성에 실패했습니다: ${String((error as any)?.message || error)}`);
    }
  }

  // 레시피 수정 (공개/임시 공통)
  async updateRecipe(id: string, userId: string, updateRecipeDto: UpdateRecipeDto) {
    const recipe = await this.prismaService.recipe.findUnique({ where: { id } });

    if (!recipe) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    if (recipe.authorId !== userId) {
      throw new ForbiddenException('레시피를 수정할 권한이 없습니다.');
    }

    const { tags, steps, thumbnailPath, thumbnailCrop, ...recipeData } = updateRecipeDto as any;

    // Supabase 버킷명
    const bucketName = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'recipes';
    const now = Date.now();
    const isTempPath = (p?: string) => !!p && p.startsWith(`temp/${userId}/`);
    const toPublicUrl = (path: string) => this.supabaseService.getPublicUrl(bucketName, path);

    // 썸네일 처리 결과
    let newThumbnailUrl: string | undefined = undefined;

    try {
      // 썸네일 업데이트가 요청된 경우만 처리
      if (thumbnailPath !== undefined) {
        if (isTempPath(thumbnailPath)) {
          // temp → 처리 → 영구 경로 업로드
          const original = await this.supabaseService.downloadFile(bucketName, thumbnailPath);
          const sharp = await getSharp();
          const baseImg = sharp(original).rotate();
          const meta = await baseImg.metadata();
          const iw = meta.width || 0;
          const ih = meta.height || 0;
          let pipeline = baseImg;
          const crop = (updateRecipeDto as any).thumbnailCrop as CropRectDto | undefined;
          if (crop && iw > 0 && ih > 0) {
            const left = Math.max(0, Math.min(iw - 1, Math.round((crop.x / 100) * iw)));
            const top = Math.max(0, Math.min(ih - 1, Math.round((crop.y / 100) * ih)));
            const width = Math.max(1, Math.min(iw - left, Math.round((crop.width / 100) * iw)));
            const height = Math.max(1, Math.min(ih - top, Math.round((crop.height / 100) * ih)));
            pipeline = pipeline.extract({ left, top, width, height });
          }
          const processed = await pipeline
            .resize({ width: 1280, withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer();
          const rawName = thumbnailPath.split('/').pop() || `${now}.jpg`;
          const base = rawName.replace(/\.[^.]+$/, '');
          const finalThumbKey = `recipes/${userId}/thumbnails/${now}_${base}.webp`;
          const cacheSeconds = 60 * 60 * 24 * 365;
          await this.supabaseService.uploadFile(bucketName, finalThumbKey, processed, 'image/webp', cacheSeconds);
          try { await this.supabaseService.deleteFile(bucketName, [thumbnailPath]); } catch {}
          newThumbnailUrl = toPublicUrl(finalThumbKey);

          // 기존 썸네일 정리
          if (recipe.thumbnailImage) {
            const existingPath = this.extractStoragePathFromPublicUrl(recipe.thumbnailImage, bucketName);
            if (existingPath) {
              try { await this.supabaseService.deleteFile(bucketName, [existingPath]); } catch {}
            }
          }
        } else if (thumbnailPath) {
          // 이미 최종 경로 또는 외부 URL
          newThumbnailUrl = thumbnailPath.startsWith('http') ? thumbnailPath : toPublicUrl(thumbnailPath);
        } else {
          // null/빈 문자열 등으로 전달 시에는 변경하지 않음 (명시적 제거 요구사항이 없다면 유지)
        }
      }

      // 본문 필드 업데이트 + 슬러그 갱신(제목 변경 시)
      const slugPatch: { slug?: string } = {};
      if (recipeData.title && recipeData.title !== recipe.title) {
        const newRaw = await generateSemanticRecipeSlug(recipeData.title);
        slugPatch.slug = await this.ensureUniqueRecipeSlug(newRaw);
      }

      const updated = await this.prismaService.recipe.update({
        where: { id },
        data: {
          ...recipeData,
          ...slugPatch,
          ...(newThumbnailUrl !== undefined && { thumbnailImage: newThumbnailUrl }),
        },
      });

      if (slugPatch.slug && recipe.slug && recipe.slug !== slugPatch.slug) {
        try {
          await this.prismaService.recipeSlugHistory.create({ data: { recipeId: id, slug: recipe.slug } });
        } catch {}
      }

      // 태그 업데이트 (명시 제공 시에만 갱신)
      if (tags !== undefined) {
        await this.prismaService.recipeTag.deleteMany({ where: { recipeId: id } });
        if (Array.isArray(tags) && tags.length > 0) {
          await this.handleTags(id, tags);
        }
      }

      // 단계 업데이트 (명시 제공 시에만 갱신)
      if (steps !== undefined) {
        await this.prismaService.recipeStep.deleteMany({ where: { recipeId: id } });
        if (Array.isArray(steps) && steps.length > 0) {
          const normalizedSteps = [] as Array<{ order: number; description: string; imageUrl?: string }>;
          for (const step of steps as Array<{ order: number; description: string; imagePath?: string }>) {
            let imageUrl: string | undefined = undefined;
            if (isTempPath(step.imagePath)) {
              const tempKey = step.imagePath!;
              const original = await this.supabaseService.downloadFile(bucketName, tempKey);
              const sharp = await getSharp();
              const processed = await sharp(original)
                .rotate()
                .resize({ width: 1600, withoutEnlargement: true })
                .webp({ quality: 82 })
                .toBuffer();
              const rawName = tempKey.split('/').pop() || `${now}.jpg`;
              const base = rawName.replace(/\.[^.]+$/, '');
              const finalStepKey = `recipes/${userId}/steps/${now}_${base}.webp`;
              const cacheSeconds = 60 * 60 * 24 * 365;
              await this.supabaseService.uploadFile(bucketName, finalStepKey, processed, 'image/webp', cacheSeconds);
              try { await this.supabaseService.deleteFile(bucketName, [tempKey]); } catch {}
              imageUrl = toPublicUrl(finalStepKey);
            } else if ((step as any).imagePath) {
              const path: string = (step as any).imagePath;
              imageUrl = path.startsWith('http') ? path : toPublicUrl(path);
            }
            normalizedSteps.push({ order: step.order, description: step.description, imageUrl });
          }
          await this.handleSteps(id, normalizedSteps);
        }
      }

      return {
        success: true,
        message: '레시피가 수정되었습니다.',
        data: {
          id: updated.id,
          title: updated.title,
          status: updated.status,
          updatedAt: updated.updatedAt,
          thumbnailImage: newThumbnailUrl ?? updated.thumbnailImage,
        },
      };
    } catch (error) {
      this.logger.error(`레시피 수정 실패: ${String((error as any)?.message || error)}`, (error as any)?.stack);
      throw new BadRequestException('레시피 수정에 실패했습니다.');
    }
  }

  // 1. 레시피 임시 저장 생성
  async createDraft(userId: string, createRecipeDto: CreateRecipeDto) {
    const { tags, steps, thumbnailPath, thumbnailCrop, ...recipeData } = createRecipeDto as any;

    try {
      // 사용자의 기존 임시 저장 전체 삭제 후 새로 생성
      await this.prismaService.recipe.deleteMany({
        where: {
          authorId: userId,
          status: RecipeStatus.DRAFT,
        },
      });

      // 썸네일 처리 (temp 경로 이동 또는 경로 정규화)
      const bucketName = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'recipes';
      const isTempPath = (p?: string) => !!p && p.startsWith(`temp/${userId}/`);
      const toPublicUrl = (path: string) => this.supabaseService.getPublicUrl(bucketName, path);
      const now = Date.now();

      let finalThumbnailUrl: string | undefined = undefined;
      if (isTempPath(thumbnailPath)) {
        const tempKey = thumbnailPath as string;
        const original = await this.supabaseService.downloadFile(bucketName, tempKey);
        const sharp = await getSharp();
        const baseImg = sharp(original).rotate();
        const meta = await baseImg.metadata();
        const iw = meta.width || 0;
        const ih = meta.height || 0;
        let pipeline = baseImg;
        const crop = (createRecipeDto as any).thumbnailCrop as CropRectDto | undefined;
        if (crop && iw > 0 && ih > 0) {
          const left = Math.max(0, Math.min(iw - 1, Math.round((crop.x / 100) * iw)));
          const top = Math.max(0, Math.min(ih - 1, Math.round((crop.y / 100) * ih)));
          const width = Math.max(1, Math.min(iw - left, Math.round((crop.width / 100) * iw)));
          const height = Math.max(1, Math.min(ih - top, Math.round((crop.height / 100) * ih)));
          pipeline = pipeline.extract({ left, top, width, height });
        }
        const processed = await pipeline
          .resize({ width: 1280, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
        const rawName = tempKey.split('/').pop() || `${now}.jpg`;
        const base = rawName.replace(/\.[^.]+$/, '');
        const finalThumbKey = `recipes/${userId}/thumbnails/${now}_${base}.webp`;
        const cacheSeconds = 60 * 60 * 24 * 365;
        await this.supabaseService.uploadFile(bucketName, finalThumbKey, processed, 'image/webp', cacheSeconds);
        try { await this.supabaseService.deleteFile(bucketName, [tempKey]); } catch {}
        finalThumbnailUrl = toPublicUrl(finalThumbKey);
      } else if (thumbnailPath) {
        finalThumbnailUrl = (thumbnailPath as string).startsWith('http')
          ? (thumbnailPath as string)
          : toPublicUrl(thumbnailPath as string);
      }

      const rawSlug = await generateSemanticRecipeSlug(recipeData.title);
      const uniqueSlug = await this.ensureUniqueRecipeSlug(rawSlug);
      const recipe = await this.prismaService.recipe.create({
        data: {
          ...recipeData,
          slug: uniqueSlug,
          description: (recipeData.description ?? '').toString(),
          ingredients: (recipeData.ingredients ?? '').toString(),
          authorId: userId,
          status: RecipeStatus.DRAFT,
          ...(finalThumbnailUrl && { thumbnailImage: finalThumbnailUrl }),
        },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
            },
          },
        },
      });

      // 태그 처리
      if (tags && tags.length > 0) {
        await this.handleTags(recipe.id, tags);
      }

      // 단계 처리 (설명 기본값 허용, 이미지 경로는 유지/정규화)
      if (steps && steps.length > 0) {
        const normalizedSteps = (steps as Array<{ order: number; description?: string; imagePath?: string }>).map(s => {
          let imageUrl: string | undefined = undefined;
          if (s.imagePath) {
            imageUrl = s.imagePath.startsWith('http') ? s.imagePath : toPublicUrl(s.imagePath);
          }
          return { order: s.order, description: s.description ?? '', imageUrl };
        });
        await this.handleSteps(recipe.id, normalizedSteps);
      }

      return {
        success: true,
        message: '기존 임시 저장을 모두 제거하고 새 임시 저장이 생성되었습니다.',
        data: {
          id: recipe.id,
          title: recipe.title,
          status: recipe.status,
          createdAt: recipe.createdAt,
          ...(finalThumbnailUrl ? { thumbnailImage: finalThumbnailUrl } : {}),
        },
      };
    } catch (error) {
      throw new BadRequestException('레시피 임시 저장에 실패했습니다.');
    }
  }

  // 2. 레시피 임시 저장 수정
  async updateDraft(id: string, userId: string, updateRecipeDto: UpdateRecipeDto) {
    const recipe = await this.prismaService.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    if (recipe.authorId !== userId) {
      throw new ForbiddenException('레시피를 수정할 권한이 없습니다.');
    }

    if (recipe.status !== RecipeStatus.DRAFT) {
      throw new BadRequestException('임시 저장된 레시피만 수정할 수 있습니다.');
    }

    const { tags, steps, thumbnailPath, thumbnailCrop, ...recipeData } = updateRecipeDto as any;

    try {
      // 썸네일 업데이트 처리 (temp 이동 또는 경로 정규화)
      const bucketName = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'recipes';
      const isTempPath = (p?: string) => !!p && p.startsWith(`temp/${userId}/`);
      const toPublicUrl = (path: string) => this.supabaseService.getPublicUrl(bucketName, path);
      const now = Date.now();

      let newThumbnailUrl: string | undefined = undefined;
      if (thumbnailPath !== undefined) {
        if (isTempPath(thumbnailPath)) {
          const original = await this.supabaseService.downloadFile(bucketName, thumbnailPath);
          const sharp = await getSharp();
          const baseImg = sharp(original).rotate();
          const meta = await baseImg.metadata();
          const iw = meta.width || 0;
          const ih = meta.height || 0;
          let pipeline = baseImg;
          const crop = (updateRecipeDto as any).thumbnailCrop as CropRectDto | undefined;
          if (crop && iw > 0 && ih > 0) {
            const left = Math.max(0, Math.min(iw - 1, Math.round((crop.x / 100) * iw)));
            const top = Math.max(0, Math.min(ih - 1, Math.round((crop.y / 100) * ih)));
            const width = Math.max(1, Math.min(iw - left, Math.round((crop.width / 100) * iw)));
            const height = Math.max(1, Math.min(ih - top, Math.round((crop.height / 100) * ih)));
            pipeline = pipeline.extract({ left, top, width, height });
          }
          const processed = await pipeline
            .resize({ width: 1280, withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer();
          const rawName = (thumbnailPath as string).split('/').pop() || `${now}.jpg`;
          const base = rawName.replace(/\.[^.]+$/, '');
          const finalThumbKey = `recipes/${userId}/thumbnails/${now}_${base}.webp`;
          const cacheSeconds = 60 * 60 * 24 * 365;
          await this.supabaseService.uploadFile(bucketName, finalThumbKey, processed, 'image/webp', cacheSeconds);
          try { await this.supabaseService.deleteFile(bucketName, [thumbnailPath]); } catch {}
          newThumbnailUrl = toPublicUrl(finalThumbKey);
        } else if (thumbnailPath) {
          newThumbnailUrl = (thumbnailPath as string).startsWith('http') ? thumbnailPath : toPublicUrl(thumbnailPath as string);
        }
      }

      const updatedRecipe = await this.prismaService.recipe.update({
        where: { id },
        data: {
          ...recipeData,
          ...(newThumbnailUrl !== undefined && { thumbnailImage: newThumbnailUrl }),
        },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
            },
          },
        },
      });

      // 기존 태그 삭제 후 새로 추가
      if (tags !== undefined) {
        await this.prismaService.recipeTag.deleteMany({
          where: { recipeId: id },
        });
        if (tags.length > 0) {
          await this.handleTags(id, tags);
        }
      }

      // 기존 단계 삭제 후 새로 추가
      if (steps !== undefined) {
        await this.prismaService.recipeStep.deleteMany({
          where: { recipeId: id },
        });
        if (steps.length > 0) {
          const normalizedSteps = (steps as Array<{ order: number; description?: string; imagePath?: string }>).
            map(s => ({ order: s.order, description: s.description ?? '', imageUrl: (s as any).imageUrl }));
          await this.handleSteps(id, normalizedSteps);
        }
      }

      return {
        success: true,
        message: '레시피가 수정되었습니다.',
        data: {
          id: updatedRecipe.id,
          title: updatedRecipe.title,
          status: updatedRecipe.status,
          updatedAt: updatedRecipe.updatedAt,
          thumbnailImage: newThumbnailUrl ?? updatedRecipe.thumbnailImage,
        },
      };
    } catch (error) {
      throw new BadRequestException('레시피 수정에 실패했습니다.');
    }
  }

  // 3. 레시피 공개
  async publish(id: string, userId: string) {
    const recipe = await this.prismaService.recipe.findUnique({
      where: { id },
      include: {
        steps: true,
      },
    });

    if (!recipe) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    if (recipe.authorId !== userId) {
      throw new ForbiddenException('레시피를 공개할 권한이 없습니다.');
    }

    if (recipe.status === RecipeStatus.PUBLISHED) {
      throw new BadRequestException('이미 공개된 레시피입니다.');
    }

    // 최소 요구사항 검증
    if (!recipe.steps || recipe.steps.length === 0) {
      throw new BadRequestException('최소 1개 이상의 조리 단계가 필요합니다.');
    }

    try {
      const publishedRecipe = await this.prismaService.recipe.update({
        where: { id },
        data: {
          status: RecipeStatus.PUBLISHED,
        },
      });

      return {
        success: true,
        message: '레시피가 공개되었습니다.',
        data: {
          id: publishedRecipe.id,
          title: publishedRecipe.title,
          status: publishedRecipe.status,
          updatedAt: publishedRecipe.updatedAt,
        },
      };
    } catch (error) {
      throw new BadRequestException('레시피 공개에 실패했습니다.');
    }
  }

  // 4. 내 임시 저장 목록 조회
  async getDraft(userId: string) {
    try {
      const draft = await this.prismaService.recipe.findFirst({
        where: {
          authorId: userId,
          status: RecipeStatus.DRAFT,
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return draft ?? null;
    } catch (error) {
      throw new BadRequestException('임시 저장 조회에 실패했습니다.');
    }
  }

  // 내 임시 저장 수정 (사용자 기준)
  async updateMyDraft(userId: string, updateRecipeDto: UpdateRecipeDto) {
    // 사용자의 단일 임시 저장을 조회
    const draft = await this.prismaService.recipe.findFirst({
      where: { authorId: userId, status: RecipeStatus.DRAFT },
    });

    if (!draft) {
      throw new NotFoundException('임시 저장된 레시피가 없습니다.');
    }

    return this.updateDraft(draft.id, userId, updateRecipeDto);
  }

  // 5. 레시피 상세 조회
  async getRecipe(id: string, userId?: string) {
    const recipe = await this.prismaService.recipe.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        steps: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        ...(userId && {
          likes: {
            where: { userId },
            select: { id: true },
          },
          saves: {
            where: { userId },
            select: { id: true },
          },
        }),
      },
    });

    if (!recipe) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    // 상세 조회 정책: authorId == null 이거나 author.status == DELETED → 404
    if (!recipe.authorId) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }
    try {
      const author = await this.prismaService.user.findUnique({ where: { id: recipe.authorId }, select: { id: true, /* @ts-ignore */ status: true as any } as any });
      if (!author || (author as any).status === 'DELETED') {
        throw new NotFoundException('레시피를 찾을 수 없습니다.');
      }
    } catch {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    // 숨김 처리된 레시피는 누구에게도 노출되지 않음
    if (recipe.isHidden) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    // 공개되지 않은 레시피는 작성자만 조회 가능
    if (recipe.status !== RecipeStatus.PUBLISHED && recipe.authorId !== userId) {
      throw new ForbiddenException('레시피를 조회할 권한이 없습니다.');
    }

    // 조회수 증가 (본인 글이 아닌 공개된 레시피인 경우)
    if (recipe.status === RecipeStatus.PUBLISHED && recipe.authorId !== userId) {
      await this.prismaService.recipe.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    const formattedRecipe = {
      ...recipe,
      thumbnailImage: recipe.thumbnailImage,
      tags: recipe.tags.map(t => ({
        name: t.tag.name,
        emoji: t.tag.emoji,
      })),
      steps: recipe.steps.map(step => ({
        order: step.order,
        description: step.description,
        imageUrl: step.imageUrl,
      })),
      likesCount: recipe._count.likes,
      commentsCount: recipe._count.comments,
      isLiked: userId ? recipe.likes?.length > 0 : false,
      isSaved: userId ? recipe.saves?.length > 0 : false,
    };

    return formattedRecipe;
  }

  // 5-1. 레시피 상세 조회 (slug)
  async getRecipeBySlug(slugPath: string, userId?: string) {
    const recipe = await this.prismaService.recipe.findUnique({
      where: { slug: slugPath },
      include: {
        author: { select: { id: true, nickname: true, profileImage: true } },
        tags: { include: { tag: true } },
        steps: { orderBy: { order: 'asc' } },
        _count: { select: { likes: true, comments: true } },
        ...(userId && {
          likes: { where: { userId }, select: { id: true } },
          saves: { where: { userId }, select: { id: true } },
        }),
      },
    });

    if (!recipe) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    if (!recipe.authorId) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }
    try {
      const author = await this.prismaService.user.findUnique({ where: { id: recipe.authorId }, select: { id: true, /* @ts-ignore */ status: true as any } as any });
      if (!author || (author as any).status === 'DELETED') {
        throw new NotFoundException('레시피를 찾을 수 없습니다.');
      }
    } catch {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    if (recipe.isHidden) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    if (recipe.status !== RecipeStatus.PUBLISHED && recipe.authorId !== userId) {
      throw new ForbiddenException('레시피를 조회할 권한이 없습니다.');
    }

    if (recipe.status === RecipeStatus.PUBLISHED && recipe.authorId !== userId) {
      await this.prismaService.recipe.update({ where: { id: recipe.id }, data: { viewCount: { increment: 1 } } });
    }

    const formattedRecipe = {
      ...recipe,
      thumbnailImage: recipe.thumbnailImage,
      tags: recipe.tags.map(t => ({ name: t.tag.name, emoji: t.tag.emoji })),
      steps: recipe.steps.map(step => ({ order: step.order, description: step.description, imageUrl: step.imageUrl })),
      likesCount: recipe._count.likes,
      commentsCount: recipe._count.comments,
      isLiked: userId ? recipe.likes?.length > 0 : false,
      isSaved: userId ? recipe.saves?.length > 0 : false,
    };

    return formattedRecipe;
  }

  // 6. 피드 조회 (커서 기반 블렌디드 피드)
  async getFeed(recipeQueryDto: RecipeQueryDto, userId?: string) {
    const tStart = Date.now();
    const {
      cursor,
      limit = 10,
      sortBy = 'latest',
      difficulty,
      search,
      tag,
      maxCookingTime,
      followingBoost,
      since,
    } = recipeQueryDto as any;

    this.logger.log(
      `getFeed params u=${userId ?? 'anon'} limit=${limit} cursor=${cursor ? 'y' : 'n'} sortBy=${sortBy} diff=${difficulty ?? '-'} tag=${tag ?? '-'} maxCook=${maxCookingTime ?? '-'} search=${search ? 'y' : 'n'} fBoost=${!!followingBoost} since=${since ?? '-'}`,
    );

    // 필터 공통 where
    const baseWhere: any = {
      status: RecipeStatus.PUBLISHED,
      isHidden: false,
      authorId: { not: null },
      author: { status: 'ACTIVE' as any },
      ...(difficulty && { difficulty }),
      ...(maxCookingTime && { cookingTime: { lte: maxCookingTime } }),
      ...(tag && {
        tags: {
          some: { tag: { name: { contains: tag, mode: 'insensitive' } } },
        },
      }),
    };
    if (search) {
      baseWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ingredients: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 후보 상위 K 로드 (키셋: createdAt desc + id)
    const candidateTake = Math.max(limit * 5, 100); // 상위 후보 풀

    // 커서 디코딩: createdAt, id
    let decodedCursor: { createdAt: string; id: string } | null = null;
    if (cursor) {
      try {
        decodedCursor = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
        this.logger.debug(`cursor decoded id=${decodedCursor.id}`);
      } catch (e) {
        this.logger.warn(`cursor decode failed: ${String(e)}`);
      }
    }

    // 정렬: 최신 우선. 인기/조회 정렬은 MVP에선 점수식으로 흡수
    const orderBy: any = [{ createdAt: 'desc' }, { id: 'desc' }];

    // 내가 팔로잉하는 작성자 집합
    let followingAuthorIds: string[] = [];
    if (userId) {
      const tFollow = Date.now();
      try {
        const followRows = await (this.prismaService as any).follow.findMany({
          where: { followerId: userId },
          select: { followingId: true },
        });
        followingAuthorIds = followRows.map(r => r.followingId);
        this.logger.debug(`following count=${followingAuthorIds.length} in ${Date.now() - tFollow}ms`);
      } catch (e) {
        this.logger.warn(`follow query failed (using empty): ${String(e)}`);
      }
    }

    // 상위 후보 K 로드 (키셋 커서 고려)
    const tCandidates = Date.now();
    const candidates = await this.prismaService.recipe.findMany({
      where: baseWhere,
      take: candidateTake,
      ...(decodedCursor && {
        cursor: { id: decodedCursor.id },
        skip: 1,
      }),
      orderBy,
      include: {
        author: { select: { id: true, nickname: true, profileImage: true } },
        tags: { include: { tag: true } },
        steps: { orderBy: { order: 'asc' }, take: 1 },
        _count: { select: { likes: true, comments: true, saves: true } },
        ...(userId && {
          likes: { where: { userId }, select: { id: true } },
          saves: { where: { userId }, select: { id: true } },
        }),
      },
    });
    this.logger.debug(`candidates loaded=${candidates.length} in ${Date.now() - tCandidates}ms`);

    // 점수 계산 파라미터 (MVP, 환경변수로 조정 가능)
    const tauHours = Number(this.configService.get('FEED_TAU_HOURS')) || 36;
    const wNew = 1.0;
    const wEng = 0.6;
    const wRecencyBurst = 0.3;
    let wFollow = 0.9;
    if (!followingAuthorIds || followingAuthorIds.length < 3) {
      wFollow = 0.3;
    }
    if (followingBoost) {
      wFollow = Math.max(wFollow, 0.9);
    }
    const alpha = 1;
    const beta = 2;
    const gamma = 1.5;

    const now = new Date().getTime();

    const categoryCooldown: Record<string, number> = {};

    function computeScore(r: any): number {
      const ageHours = (now - new Date(r.createdAt).getTime()) / (1000 * 60 * 60);
      const decay = Math.exp(-ageHours / tauHours);
      const likes = r._count?.likes || 0;
      const comments = r._count?.comments || 0;
      const saves = r._count?.saves || 0;
      const engagement = Math.log(1 + alpha * likes + beta * comments + gamma * saves);
      const isFollowing = userId ? followingAuthorIds.includes(r.authorId) : false;
      const isVeryNew = ageHours * 60 < 30; // 30분 이내
      // 단순 카테고리 페널티: 동일 태그 반복을 경감 (MVP: 상수 0)
      const diversityPenalty = 0;
      return wNew * decay + wEng * engagement + wFollow * (isFollowing ? 1 : 0) + wRecencyBurst * (isVeryNew ? 1 : 0) + diversityPenalty;
    }

    // 후보 정렬
    const tRank = Date.now();
    const ranked = candidates
      .map(r => ({ r, score: computeScore(r) }))
      .sort((a, b) => b.score - a.score)
      .map(x => x.r);
    this.logger.debug(`ranked=${ranked.length} in ${Date.now() - tRank}ms`);

    // 인터리빙 + 제약조건 적용
    const followingPool = ranked.filter(r => userId && followingAuthorIds.includes(r.authorId));
    const globalPool = ranked.filter(r => !userId || !followingAuthorIds.includes(r.authorId));
    this.logger.debug(`pool sizes following=${followingPool.length} global=${globalPool.length}`);
    const targetFollowingRatio = 0.6;
    const targetGlobalRatio = 0.4;

    // 글로벌 풀 경미 셔플 (KST 기준 6시간 슬롯 시드)
    const nowDate2 = new Date();
    const hourKst2 = (nowDate2.getUTCHours() + 9) % 24;
    const slot2 = Math.floor(hourKst2 / 6);
    const daySeed = userId
      ? `u:${userId}:${slot2}`
      : `d:${nowDate2.toISOString().slice(0, 10)}:${slot2}`;
    function hashStr(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h >>> 0; }
    globalPool.sort((a, b) => hashStr(a.id + daySeed) - hashStr(b.id + daySeed));

    // 보조 풀: 트렌드/신규
    const trendPool = ranked.slice(0, Math.min(50, ranked.length));
    const newcomerPool = ranked.filter(r => (now - new Date(r.createdAt).getTime()) < 24 * 3600 * 1000 && (r.viewCount || 0) < 5);

    const result: any[] = [];
    const recentAuthorWindow: string[] = [];
    const recentCategoryWindow: string[] = [];
    const pushWithConstraints = (candidate: any): boolean => {
      // 저자 쿨다운: 최근 5개 내 동일 저자 1회 이하
      if (recentAuthorWindow.slice(-5).filter(a => a === candidate.authorId).length >= 1) {
        return false;
      }
      // 카테고리 다양성: 같은 카테고리 3연속 금지 (단순: 첫 태그 기준)
      const cat = candidate.tags?.[0]?.tag?.name || '';
      const last3 = recentCategoryWindow.slice(-3);
      if (cat && last3.length >= 3 && last3.every(c => c === cat)) {
        return false;
      }
      result.push(candidate);
      recentAuthorWindow.push(candidate.authorId);
      recentCategoryWindow.push(cat);
      return true;
    };

    let fIdx = 0;
    let gIdx = 0;
    let injectedEvery5 = 0;
    while (result.length < limit && (fIdx < followingPool.length || gIdx < globalPool.length)) {
      const fNeed = (result.length + 1) * targetFollowingRatio - result.filter(r => userId && followingAuthorIds.includes(r.authorId)).length;
      let picked = false;

      // 팔로우가 적을 때 5개마다 탐색/트렌드 슬롯 주입
      if (!userId || followingAuthorIds.length < 3) {
        if (result.length > 0 && result.length % 5 === 0 && injectedEvery5 < 2) {
          const pickFrom = (arr: any[]) => arr.find(x => !result.find(r => r.id === x.id));
          const cand = pickFrom(newcomerPool) || pickFrom(trendPool);
          if (cand) {
            if (pushWithConstraints(cand)) {
              picked = true;
              injectedEvery5++;
            }
          }
        }
      }

      if (fNeed > 0 && fIdx < followingPool.length) {
        if (pushWithConstraints(followingPool[fIdx])) {
          picked = true;
        }
        fIdx += 1;
      }
      if (!picked && gIdx < globalPool.length) {
        if (pushWithConstraints(globalPool[gIdx])) {
          picked = true;
        }
        gIdx += 1;
      }
      if (!picked && fIdx < followingPool.length) {
        // 마지막 시도
        if (pushWithConstraints(followingPool[fIdx])) {
          picked = true;
        }
        fIdx += 1;
      }
      if (!picked) break;
    }

    // 제약으로 인해 충분히 채워지지 않은 경우, 완화된 규칙으로 보강
    if (result.length < limit) {
      const tFallback = Date.now();
      for (const r of ranked) {
        if (result.length >= limit) break;
        if (!result.find(x => x.id === r.id)) {
          result.push(r);
        }
      }
      this.logger.debug(`fallback filled to=${result.length} in ${Date.now() - tFallback}ms`);
    }

    // 신규 보호: 10개당 최소 1개 (가능 시)
    if (result.length > 0) {
      const veryNewExists = ranked.some(r => (now - new Date(r.createdAt).getTime()) / (1000 * 60) < 30);
      if (veryNewExists) {
        const chunk = 10;
        for (let i = 0; i < result.length; i += chunk) {
          const slice = result.slice(i, i + chunk);
          const hasVeryNew = slice.some(r => (now - new Date(r.createdAt).getTime()) / (1000 * 60) < 30);
          if (!hasVeryNew) {
            const candidate = ranked.find(r => (now - new Date(r.createdAt).getTime()) / (1000 * 60) < 30 && !slice.find(s => s.id === r.id));
            if (candidate) {
              slice.pop();
              slice.push(candidate);
              // 재배치
              result.splice(i, slice.length, ...slice);
            }
          }
        }
      }
    }

    // 다음 커서
    const last = result[result.length - 1];
    const nextCursor = last
      ? Buffer.from(JSON.stringify({ id: last.id, createdAt: last.createdAt })).toString('base64')
      : null;
    this.logger.debug(`result len=${result.length} nextCursor=${nextCursor ? 'y' : 'n'}`);

    const formattedRecipes = result.map(recipe => ({
      ...recipe,
      thumbnailImage: recipe.thumbnailImage,
      tags: recipe.tags.map(t => ({ name: t.tag.name, emoji: t.tag.emoji })),
      steps: recipe.steps.map(step => ({ order: step.order, description: step.description, imageUrl: step.imageUrl })),
      likesCount: recipe._count.likes,
      commentsCount: recipe._count.comments,
      isLiked: userId ? recipe.likes?.length > 0 : false,
      isSaved: userId ? recipe.saves?.length > 0 : false,
    }));

    // 새 글 카운트 (스켈레톤/배지용): since 이후 생성된 공개 글 수
    let newCount: number | undefined = undefined;
    if (since) {
      try {
        const sinceDate = new Date(since);
        if (!isNaN(sinceDate.getTime())) {
          newCount = await this.prismaService.recipe.count({
            where: {
              ...baseWhere,
              createdAt: { gt: sinceDate },
            },
          });
        }
      } catch (e) {
        this.logger.warn(`newCount calc failed: ${String(e)}`);
      }
    }

    const totalMs = Date.now() - tStart;
    this.logger.log(`getFeed done in ${totalMs}ms (recipes=${result.length}, newCount=${newCount ?? '-'})`);

    return {
      recipes: formattedRecipes,
      pageInfo: {
        limit,
        nextCursor,
        hasMore: (decodedCursor ? candidates.length >= candidateTake : formattedRecipes.length === limit) && !!nextCursor,
        ...(newCount !== undefined ? { newCount } : {}),
      },
    };
  }

  // 태그 처리 헬퍼 메소드
  private async handleTags(recipeId: string, tags: any[]) {
    for (const tagData of tags) {
      // 태그가 존재하지 않으면 생성
      let tag = await this.prismaService.tag.findUnique({
        where: { name: tagData.name },
      });

      if (!tag) {
        tag = await this.prismaService.tag.create({
          data: {
            name: tagData.name,
            emoji: tagData.emoji,
          },
        });
      } else if (tagData.emoji && tag.emoji !== tagData.emoji) {
        // 기존 태그에 이모지 업데이트
        tag = await this.prismaService.tag.update({
          where: { id: tag.id },
          data: { emoji: tagData.emoji },
        });
      }

      // 레시피-태그 연결
      await this.prismaService.recipeTag.create({
        data: {
          recipeId,
          tagId: tag.id,
        },
      });
    }
  }

  // 단계 처리 헬퍼 메소드
  private async handleSteps(recipeId: string, steps: any[]) {
    for (const stepData of steps) {
      await this.prismaService.recipeStep.create({
        data: {
          recipeId,
          order: stepData.order,
          description: stepData.description,
          imageUrl: stepData.imageUrl,
        },
      });
    }
  }

  // 기존 메소드들 (이미지 업로드, 삭제 등)
  async uploadImages(files: Express.Multer.File[], userId: string) {
    try {
      const bucketName = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'recipes';
      const sharp = await getSharp();
      const MAX_SIZE = 10 * 1024 * 1024;
      const now = Date.now();
      const cacheSeconds = 60 * 60 * 24 * 365; // 1년

      const processOne = async (file: Express.Multer.File, index: number) => {
        if (file.size > MAX_SIZE) {
          throw new BadRequestException('각 파일은 10MB를 초과할 수 없습니다.');
        }
        // 이미지 타입 검증
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
        if (!allowedTypes.includes(file.mimetype.toLowerCase())) {
          throw new BadRequestException(`지원하지 않는 이미지 형식입니다: ${file.mimetype}. JPG, PNG, WebP, HEIC만 업로드 가능합니다.`);
        }

        // Sharp로 이미지 처리: 회전, 리사이즈, WebP 변환
        const processed = await sharp(file.buffer)
          .rotate()
          .resize({ width: 1600, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();

        // 파일명에서 확장자 제거 후 .webp 추가
        const originalName = file.originalname.replace(/\.[^.]+$/, '');
        const path = `recipes/${userId}/steps/${now}_${index}_${originalName}.webp`;
        
        const data = await this.supabaseService.uploadFile(bucketName, path, processed, 'image/webp', cacheSeconds);
        const publicUrl = this.supabaseService.getPublicUrl(bucketName, data.path);
        return publicUrl;
      };

      // 동시 처리 개수 제한
      const CONCURRENCY = 2;
      const imageUrls: string[] = [];
      for (let i = 0; i < files.length; i += CONCURRENCY) {
        const chunk = files.slice(i, i + CONCURRENCY);
        const results = await Promise.all(chunk.map((f, offset) => processOne(f, i + offset)));
        imageUrls.push(...results);
      }
      return { imageUrls };
    } catch (error) {
      this.logger.error(`이미지 업로드 실패: ${String((error as any)?.message || error)}`);
      throw new BadRequestException((error as any)?.message || '이미지 업로드에 실패했습니다.');
    }
  }

  // 대표 이미지 업로드
  async uploadThumbnail(id: string, userId: string, file: Express.Multer.File, crop?: CropRectDto) {
    const recipe = await this.prismaService.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    if (recipe.authorId !== userId) {
      throw new ForbiddenException('레시피를 수정할 권한이 없습니다.');
    }

    try {
      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        throw new BadRequestException('파일 크기는 10MB를 초과할 수 없습니다.');
      }
      // 이미지 타입 검증
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      if (!allowedTypes.includes(file.mimetype.toLowerCase())) {
        throw new BadRequestException(`지원하지 않는 이미지 형식입니다: ${file.mimetype}. JPG, PNG, WebP, HEIC만 업로드 가능합니다.`);
      }

      const bucketName = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'recipes';
      const sharp = await getSharp();
      const now = Date.now();
      const cacheSeconds = 60 * 60 * 24 * 365; // 1년

      // Sharp로 이미지 처리: 회전, (옵션)크롭, 리사이즈, WebP 변환
      const baseImg = sharp(file.buffer).rotate();
      let pipeline = baseImg;
      if (crop) {
        const meta = await baseImg.metadata();
        const iw = meta.width || 0;
        const ih = meta.height || 0;
        if (iw > 0 && ih > 0) {
          const left = Math.max(0, Math.min(iw - 1, Math.round((crop.x / 100) * iw)));
          const top = Math.max(0, Math.min(ih - 1, Math.round((crop.y / 100) * ih)));
          const width = Math.max(1, Math.min(iw - left, Math.round((crop.width / 100) * iw)));
          const height = Math.max(1, Math.min(ih - top, Math.round((crop.height / 100) * ih)));
          pipeline = pipeline.extract({ left, top, width, height });
        }
      }
      const processed = await pipeline
        .resize({ width: 1280, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      // 파일명에서 확장자 제거 후 .webp 추가
      const originalName = file.originalname.replace(/\.[^.]+$/, '');
      const path = `recipes/${userId}/thumbnails/${now}_${originalName}.webp`;
      
      const data = await this.supabaseService.uploadFile(bucketName, path, processed, 'image/webp', cacheSeconds);
      const publicUrl = this.supabaseService.getPublicUrl(bucketName, data.path);

      // 기존 대표 이미지가 있으면 삭제 (URL에서 스토리지 경로 추출)
      if (recipe.thumbnailImage) {
        const existingPath = this.extractStoragePathFromPublicUrl(recipe.thumbnailImage, bucketName);
        if (existingPath) {
          await this.supabaseService.deleteFile(bucketName, [existingPath]);
        }
      }

      // DB 업데이트
      await this.prismaService.recipe.update({
        where: { id },
        data: { thumbnailImage: publicUrl },
      });

      return {
        success: true,
        message: '대표 이미지가 업로드되었습니다.',
        thumbnailUrl: publicUrl,
      };
    } catch (error) {
      this.logger.error(`대표 이미지 업로드 실패: ${String((error as any)?.message || error)}`);
      throw new BadRequestException((error as any)?.message || '대표 이미지 업로드에 실패했습니다.');
    }
  }

  // 단일 스텝 이미지 업로드 (Flutter 편의용)
  async uploadStepImage(file: Express.Multer.File, userId: string) {
    try {
      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        throw new BadRequestException('파일 크기는 10MB를 초과할 수 없습니다.');
      }
      // 이미지 타입 검증
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      if (!allowedTypes.includes(file.mimetype.toLowerCase())) {
        throw new BadRequestException(`지원하지 않는 이미지 형식입니다: ${file.mimetype}. JPG, PNG, WebP, HEIC만 업로드 가능합니다.`);
      }

      const bucketName = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'recipes';
      const sharp = await getSharp();
      const now = Date.now();
      const cacheSeconds = 60 * 60 * 24 * 365; // 1년

      // Sharp로 이미지 처리: 회전, 리사이즈, WebP 변환
      const processed = await sharp(file.buffer)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      // 파일명에서 확장자 제거 후 .webp 추가
      const originalName = file.originalname.replace(/\.[^.]+$/, '');
      const path = `recipes/${userId}/steps/${now}_${originalName}.webp`;
      
      const data = await this.supabaseService.uploadFile(bucketName, path, processed, 'image/webp', cacheSeconds);
      const publicUrl = this.supabaseService.getPublicUrl(bucketName, data.path);
      return { imageUrl: publicUrl };
    } catch (error) {
      this.logger.error(`스텝 이미지 업로드 실패: ${String((error as any)?.message || error)}`);
      throw new BadRequestException((error as any)?.message || '스텝 이미지 업로드에 실패했습니다.');
    }
  }

  private extractStoragePathFromPublicUrl(publicUrl: string, bucketName: string): string | null {
    try {
      // 예: https://<proj>.supabase.co/storage/v1/object/public/<bucket>/<path>
      const marker = `/object/public/${bucketName}/`;
      const idx = publicUrl.indexOf(marker);
      if (idx === -1) return null;
      return publicUrl.substring(idx + marker.length);
    } catch {
      return null;
    }
  }

  private toProxyUrl(storedUrl?: string): string | undefined {
    if (!storedUrl) return undefined;
    const bucketName = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'recipes';
    const path = this.extractStoragePathFromPublicUrl(storedUrl, bucketName) || storedUrl;
    const base = this.configService.get<string>('PUBLIC_API_BASE_URL') || '';
    const proxyPath = `/media/image?path=${encodeURIComponent(path)}`;
    return base ? `${base}${proxyPath}` : proxyPath;
  }

  async remove(id: string, userId: string) {
    const recipe = await this.prismaService.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }

    if (recipe.authorId !== userId) {
      throw new ForbiddenException('레시피를 삭제할 권한이 없습니다.');
    }

    try {
      await this.prismaService.recipe.update({
        where: { id },
        data: { isHidden: true }, // Soft delete
      });

      return {
        success: true,
        message: '레시피가 삭제되었습니다.',
      };
    } catch (error) {
      throw new BadRequestException('레시피 삭제에 실패했습니다.');
    }
  }

  async getRecipeSlug(id: string, userId?: string): Promise<{ slug: string }>
  {
    // 최소 필드만 조회하여 가볍게 처리
    const recipe = await this.prismaService.recipe.findUnique({
      where: { id },
      select: { id: true, slug: true, status: true, isHidden: true, authorId: true },
    });

    if (!recipe) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }
    if (!recipe.authorId) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }
    // 비공개 접근 차단
    if (recipe.status !== RecipeStatus.PUBLISHED && recipe.authorId !== userId) {
      throw new ForbiddenException('레시피를 조회할 권한이 없습니다.');
    }
    if (recipe.isHidden) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }
    if (!recipe.slug) {
      throw new NotFoundException('레시피 슬러그가 없습니다.');
    }
    return { slug: recipe.slug };
  }

  async buildRecipesSitemapXml(baseUrl: string): Promise<string> {
    // 공개된 레시피만 포함
    const rows = await this.prismaService.recipe.findMany({
      where: { status: RecipeStatus.PUBLISHED, isHidden: false, authorId: { not: null } },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 50000, // sitemap 한도
    });
    const urls = rows
      .filter(r => !!r.slug)
      .map(r => ({ loc: `${baseUrl.replace(/\/$/, '')}/recipes/${r.slug}`, lastmod: r.updatedAt.toISOString() }));

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map(u => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`),
      '</urlset>',
    ].join('\n');
    return xml;
  }
}