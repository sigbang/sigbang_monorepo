"use client";

export default function Footer() {
  return (
    <footer className="border-t mt-8">
      <div className="mx-auto max-w-[1200px] px-6 py-8 text-sm text-gray-600">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div className="font-semibold text-gray-900">아미니티 (Aminity)</div>
            <div>사업자 등록번호 : 389-08-22998 | 대표 : 이효섭</div>
            <div className="text-gray-500">저작권 © 2025 식방</div>
          </div>

          <div className="flex flex-col gap-2">
            <a className="hover:underline" href="/legal/privacy">개인정보처리방침</a>
            <a className="hover:underline" href="/legal/terms">서비스 이용약관</a>
            <a className="hover:underline" href="/account/delete">계정 및 데이터 삭제</a>
          </div>

          <div className="space-y-2">
            <div className="flex gap-4">
              <a
                className="hover:underline"
                href="/feedback"
                aria-label="의견 및 버그 보내기"
              >
                의견 및 버그 보내기
              </a>
              <a
                className="hover:underline"
                href="https://www.instagram.com/sig.bang"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                Instagram
              </a>
              <a
                className="hover:underline"
                href="https://www.threads.net/@sig.bang"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Threads"
              >
                Threads
              </a>
            </div>
            <a className="hover:underline" href="mailto:contact.aminity@gmail.com">
              contact.aminity@gmail.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}


