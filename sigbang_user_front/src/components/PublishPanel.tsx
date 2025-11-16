'use client';

type ValidationError = { field: string; message: string };

type PublishPanelProps = {
  title: string;
  thumbnailPath?: string;
  stepsCount: number;
  tagsCount: number;
  errors: ValidationError[];
  onPublish: () => void;
  onSaveDraft?: () => void;
  busy: boolean;
};

export default function PublishPanel({
  title,
  thumbnailPath,
  stepsCount,
  tagsCount,
  errors,
  onPublish,
  onSaveDraft,
  busy,
}: PublishPanelProps) {
  const canPublish = errors.length === 0;

  return (
    <div className="sticky top-6 space-y-4">
      {/* 미리보기 카드 */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 bg-white dark:bg-neutral-900">
        <h3 className="text-sm font-semibold mb-3">미리보기</h3>
        {thumbnailPath ? (
          <img
            src={`/media/${thumbnailPath}`}
            alt="미리보기"
            className="w-full h-32 object-cover rounded-md mb-3"
          />
        ) : (
          <div className="w-full h-32 bg-neutral-100 dark:bg-neutral-800 rounded-md mb-3 flex items-center justify-center text-neutral-400">
            이미지 없음
          </div>
        )}
        <div className="text-sm font-medium truncate">{title || '제목 없음'}</div>
        <div className="text-xs text-neutral-500 mt-1">
          {stepsCount}개 단계 · {tagsCount}개 태그
        </div>
      </div>

      {/* 검증 상태 */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 bg-white dark:bg-neutral-900">
        <h3 className="text-sm font-semibold mb-2">필수 항목</h3>
        {errors.length === 0 ? (
          <div className="text-sm text-green-600 dark:text-green-400">✓ 모든 항목 완료</div>
        ) : (
          <ul className="space-y-1">
            {errors.map((err, i) => (
              <li key={i} className="text-sm text-red-600 dark:text-red-400">
                • {err.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={onPublish}
          disabled={!canPublish || busy}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {busy ? '업로드 중...' : '레시피 업로드'}
        </button>
        {onSaveDraft && (
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={busy}
            className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            임시 저장
          </button>
        )}
        <div className="text-xs text-neutral-500 text-center">
          <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700">
            Ctrl+Enter
          </kbd>{' '}
          발행 ·{' '}
          <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700">
            Ctrl+S
          </kbd>{' '}
          임시저장
        </div>
      </div>
    </div>
  );
}

