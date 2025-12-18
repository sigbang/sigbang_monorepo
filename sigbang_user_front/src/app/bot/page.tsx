import Topbar from '@/components/Topbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';

export const dynamic = 'force-static';

export const metadata = {
  title: 'SigbangLinkPreview 봇 정보',
  description: 'SigbangLinkPreview 크롤러의 동작 방식과 연락처 안내',
  alternates: { canonical: '/bot' },
  openGraph: {
    type: 'website',
    url: '/bot',
    title: 'SigbangLinkPreview 봇 정보',
    description: 'SigbangLinkPreview 크롤러의 동작 방식과 연락처 안내',
    images: [{ url: '/og.png' }],
  },
};

export default function BotInfoPage() {
  return (
    <div className="min-h-screen">
      <Topbar />
      <main
        id="main"
        className="mx-auto max-w-[800px] px-6 py-10"
        role="main"
      >
        <h1 className="text-2xl font-semibold">SigbangLinkPreview 봇 정보</h1>
        <p className="mt-3 text-sm text-neutral-600">
          이 페이지는 식방 서비스에서 사용하는 링크 미리보기 봇(SigbangLinkPreview)에 대한 정보를 제공합니다.
        </p>

        <section className="mt-8 space-y-3 text-sm text-neutral-700">
          <h2 className="text-lg font-semibold">1. 봇 개요</h2>
          <p>
            SigbangLinkPreview는 사용자가 식방 서비스 내에서 입력한 외부 링크에 대해,
            제목·설명·대표 이미지를 가져와 미리보기를 제공하기 위한 HTTP 클라이언트입니다.
          </p>
          <p>
            이 봇은 자체적으로 웹을 크롤링하지 않으며, <strong>사용자가 명시적으로 입력한 URL</strong>에
            대해서만 동작합니다.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm text-neutral-700">
          <h2 className="text-lg font-semibold">2. 동작 방식</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>사용자가 레시피 작성 화면에서 외부 링크를 입력하면, 해당 URL로 1회의 HTTP GET 요청을 보냅니다.</li>
            <li>
              응답 본문에서 &lt;title&gt; 태그와 Open Graph 메타 태그(og:title, og:description, og:image 등)를 읽어옵니다.
            </li>
            <li>JavaScript 실행, 추가 네비게이션, 폼 전송 등은 수행하지 않습니다.</li>
            <li>응답 HTML 일부를 내부 캐시에 일정 시간(예: 6시간) 동안만 보관하고, 그 이후에는 재요청합니다.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3 text-sm text-neutral-700">
          <h2 className="text-lg font-semibold">3. 요청 헤더</h2>
          <p>봇은 다음과 같은 User-Agent 및 헤더를 사용합니다.</p>
          <pre className="mt-2 overflow-x-auto rounded-md bg-neutral-100 px-3 py-2 text-xs text-neutral-800">{`User-Agent: SigbangLinkPreview/1.0 (+https://sigbang.com/bot)
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7`}</pre>
          <p>Referer 헤더는 기본적으로 전송하지 않습니다.</p>
        </section>

        <section className="mt-8 space-y-3 text-sm text-neutral-700">
          <h2 className="text-lg font-semibold">4. 트래픽 특성</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>식방 서비스 내에서 사용자가 링크를 입력하거나 수정할 때에만 요청이 발생합니다.</li>
            <li>특정 URL에 대한 요청 빈도는 사용자의 입력/수정 횟수 및 캐시 만료 주기에 따라 제한됩니다.</li>
            <li>광고 클릭 유도나 자동 실행 광고를 목적으로 하지 않으며, 순수한 미리보기 정보 수집 목적입니다.</li>
          </ul>
        </section>

        <section className="mt-8 mb-12 space-y-3 text-sm text-neutral-700">
          <h2 className="text-lg font-semibold">5. 차단 또는 문의 방법</h2>
          <p>
            SigbangLinkPreview 봇의 접근을 제한하고자 하는 경우, User-Agent 헤더
            <code className="mx-1 rounded bg-neutral-100 px-1 py-0.5 text-xs">SigbangLinkPreview</code>
            를 기준으로 필터링하실 수 있습니다.
          </p>
          <p>
            그 외 문의 사항이나 조정이 필요한 경우, 아래 이메일로 연락해 주세요.
          </p>
          <p>
            문의 이메일:{' '}
            <a
              href="mailto:support@sigbang.com"
              className="text-sky-600 hover:underline"
            >
              support@sigbang.com
            </a>
          </p>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
