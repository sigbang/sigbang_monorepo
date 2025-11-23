'use client';
import Link from 'next/link';

export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  const { error, reset } = props;
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-semibold text-[#222]">예기치 못한 오류가 발생했어요</h1>
            <p className="mt-2 text-[14px] text-[#555]">페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => reset()}
                className="px-4 py-2 rounded-md bg-sky-600 text-white text-[14px] hover:bg-sky-700"
              >
                새로고침
              </button>
              <Link href="/" className="px-4 py-2 rounded-md border border-[#ddd] text-[14px] text-[#111] hover:bg-[#fafafa]">
                홈으로
              </Link>
            </div>
            {process.env.NODE_ENV !== 'production' && (
              <pre className="mt-6 text-left text-[12px] text-[#a33] bg-[#fff5f5] border border-[#f1dada] rounded-md p-3 overflow-auto">
                {String(error?.message || 'Unknown error')}
                {error?.digest ? `\n(digest: ${error.digest})` : ''}
              </pre>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}


