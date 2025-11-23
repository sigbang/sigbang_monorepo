'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  const { error, reset } = props;

  useEffect(() => {
    // Log to console for quick diagnostics (and to platform logs)
    // Avoid leaking stack traces in production UI
    // eslint-disable-next-line no-console
    console.error('[app-error]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold text-[#222]">문제가 발생했어요</h1>
        <p className="mt-2 text-[14px] text-[#555]">
          잠시 후 다시 시도해 주세요. 계속되면 피드백 페이지를 통해 알려주세요.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-md bg-sky-600 text-white text-[14px] hover:bg-sky-700"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-md border border-[#ddd] text-[14px] text-[#111] hover:bg-[#fafafa]"
          >
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
  );
}


