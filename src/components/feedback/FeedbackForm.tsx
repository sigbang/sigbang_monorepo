'use client';

import React from 'react';
import { getOrCreateDeviceId, getDeviceName } from '@/lib/auth/device';
import { useRouter } from 'next/navigation';

type FeedbackType = 'bug' | 'idea' | 'other' | 'business';

const MAX_SUBJECT = 120;
const MIN_SUBJECT = 2;
const MAX_MESSAGE = 5000;
const MIN_MESSAGE = 5;
const MAX_FILES = 3;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_TOTAL_BYTES = 9 * 1024 * 1024; // ~9MB


function clampStr(s: string, max: number) {
  return s.length > max ? s.slice(0, max) : s;
}

function getAppVersion(): string {
  return process.env.NEXT_PUBLIC_APP_VERSION || '';
}

export default function FeedbackForm() {
  const router = useRouter();
  const [type, setType] = React.useState<FeedbackType>('idea');
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [appVersion, setAppVersion] = React.useState('');
  const [files, setFiles] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const [deviceId, setDeviceId] = React.useState('');
  const [deviceName, setDeviceName] = React.useState('');

  React.useEffect(() => {
    setAppVersion(getAppVersion());
    try {
      setDeviceId(getOrCreateDeviceId());
      setDeviceName(getDeviceName() || 'web');
    } catch {
      setDeviceName('web');
    }
  }, []);

  React.useEffect(() => {
    const urls = files.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : ''));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => {
        if (u) URL.revokeObjectURL(u);
      });
    };
  }, [files]);

  function formatBytes(n: number) {
    if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(n / 1024)} KB`;
  }

  function addFiles(newFiles: File[]) {
    if (!newFiles.length) return;
    // Filter out too-large files
    const valid = newFiles.filter((f) => f.size <= MAX_FILE_BYTES);
    const rejected = newFiles.filter((f) => f.size > MAX_FILE_BYTES);
    let next = [...files, ...valid];
    if (next.length > MAX_FILES) {
      next = next.slice(0, MAX_FILES);
      setErrors((prev) => ({ ...prev, attachments: `첨부는 최대 ${MAX_FILES}개까지 가능합니다.` }));
    }
    const total = next.reduce((a, f) => a + f.size, 0);
    if (total > MAX_TOTAL_BYTES) {
      setErrors((prev) => ({ ...prev, attachments: '첨부 파일 총합은 9MB 이하여야 합니다.' }));
      return; // do not add if total would exceed
    }
    if (rejected.length) {
      setErrors((prev) => ({ ...prev, attachments: `각 파일은 최대 5MB까지 가능합니다. (${rejected[0].name})` }));
    } else {
      // clear attachment error if previously set and constraints are met
      setErrors((prev) => {
        const next = { ...prev };
        delete (next as Record<string, string>).attachments;
        return next;
      });
    }
    setFiles(next);
  }

  function removeFile(idx: number) {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    // Clear attachment error on change
    setErrors((prev) => {
      const copy = { ...prev };
      delete (copy as Record<string, string>).attachments;
      return copy;
    });
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const fl = Array.from(e.dataTransfer.files || []);
    addFiles(fl);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};

    const s = subject.trim();
    const m = message.trim();

    if (s.length < MIN_SUBJECT || s.length > MAX_SUBJECT) {
      e.subject = `제목은 ${MIN_SUBJECT}–${MAX_SUBJECT}자여야 합니다.`;
    }
    if (m.length < MIN_MESSAGE || m.length > MAX_MESSAGE) {
      e.message = `메시지는 ${MIN_MESSAGE}–${MAX_MESSAGE}자여야 합니다.`;
    }

    const emailTrim = email.trim();
    if (emailTrim) {
      if (emailTrim.length > 254) {
        e.email = '이메일은 최대 254자까지 가능합니다.';
      } else {
        // Simple RFC5322-lite email regex
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(emailTrim)) {
          e.email = '이메일 형식이 올바르지 않습니다.';
        }
      }
    }

    if (files.length > MAX_FILES) {
      e.attachments = `첨부는 최대 ${MAX_FILES}개까지 가능합니다.`;
    }
    let total = 0;
    for (const f of files) {
      if (f.size > MAX_FILE_BYTES) {
        e.attachments = `각 파일은 최대 5MB까지 가능합니다. (${f.name})`;
        break;
      }
      total += f.size;
    }
    if (!e.attachments && total > MAX_TOTAL_BYTES) {
      e.attachments = '첨부 파일 총합은 9MB 이하여야 합니다.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!validate()) return;

    const form = new FormData();
    form.set('type', type);
    form.set('subject', subject.trim());
    form.set('message', message.trim());
    if (email.trim()) form.set('email', email.trim());
    if (appVersion) form.set('appVersion', appVersion);
    for (const f of files) {
      form.append('attachments', f, f.name);
    }

    setSubmitting(true);
    setErrors((prev) => ({ ...prev, submit: '' }));

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'x-device-id': deviceId || '',
          'x-device-name': deviceName || '',
        },
        body: form,
      });

      if (res.status === 200 || res.status === 201) {
        router.push('/feedback/success');
      } else if (res.status === 400) {
        // Try to extract field-level validation errors from backend
        const fieldErrs: Record<string, string> = {};
        let submitMsg = '입력값 검증에 실패했습니다. 내용을 확인해 주세요.';
        try {
          const data: unknown = await res.json();
          const maybeMessage = (data as { message?: unknown })?.message;
          const messages: string[] = Array.isArray(maybeMessage)
            ? (maybeMessage as unknown[]).filter((m): m is string => typeof m === 'string')
            : typeof maybeMessage === 'string'
              ? [maybeMessage]
              : [];
          const errorsObj = (data as { errors?: Record<string, string[] | string> })?.errors;
          if (errorsObj && typeof errorsObj === 'object') {
            for (const [k, v] of Object.entries(errorsObj)) {
              const msg = Array.isArray(v) ? (v[0] as string) : (v as string);
              if (k === 'email') fieldErrs.email = msg;
              else if (k === 'subject') fieldErrs.subject = msg;
              else if (k === 'message') fieldErrs.message = msg;
              else fieldErrs.submit = msg;
            }
          } else if (messages.length > 0) {
            // Heuristics: map known fields from text messages
            const emailMsg = messages.find((m) => /email/i.test(m));
            const subjectMsg = messages.find((m) => /subject|제목/i.test(m));
            const bodyMsg = messages.find((m) => /message|내용/i.test(m));
            if (emailMsg) fieldErrs.email = emailMsg;
            if (subjectMsg) fieldErrs.subject = subjectMsg;
            if (bodyMsg) fieldErrs.message = bodyMsg;
            submitMsg = messages.join('\n');
          }
        } catch {
          // ignore parse errors
        }
        setErrors((prev) => ({
          ...prev,
          ...fieldErrs,
          submit: fieldErrs.submit || submitMsg,
        }));
      } else if (res.status === 429) {
        setErrors((prev) => ({
          ...prev,
          submit: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
        }));
      } else if (res.status >= 500) {
        setErrors((prev) => ({
          ...prev,
          submit: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          submit: '요청 처리 중 문제가 발생했습니다.',
        }));
      }
    } catch {
      setErrors((prev) => ({
        ...prev,
        submit: '네트워크 오류가 발생했습니다.',
      }));
    } finally {
      setSubmitting(false);
    }
  }

  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fl = Array.from(e.target.files || []);
    addFiles(fl);
    // reset value to allow re-selecting same files
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const disabled = submitting;
  const totalSize = files.reduce((a, f) => a + f.size, 0);

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700">제목</label>
        <input
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          type="text"
          value={subject}
          onChange={(e) => setSubject(clampStr(e.target.value, MAX_SUBJECT))}
          placeholder="최대 120자"
        />
        {errors.subject && <small className="text-red-600">{errors.subject}</small>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">유형</label>
          <select
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            value={type}
            onChange={(e) => setType(e.target.value as FeedbackType)}
          >
            <option value="idea">의견</option>          
            <option value="bug">문제</option>          
            <option value="business">비즈니스 문의</option>
            <option value="other">기타</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">이메일 (선택)</label>
          <input
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            inputMode="email"
            autoComplete="email"
          />
          {errors.email && <small className="text-red-600">{errors.email}</small>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">내용</label>
        <textarea
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 h-40"
          value={message}
          onChange={(e) => setMessage(clampStr(e.target.value, MAX_MESSAGE))}
          placeholder="문제 상황이나 아이디어를 자세히 적어 주세요."
        />
        {errors.message && <small className="text-red-600">{errors.message}</small>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">첨부 (최대 3개, 각 5MB, 총 9MB)</label>
        <div
          className={`mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${dragOver ? 'border-sky-500 bg-sky-50' : 'border-gray-300 hover:border-gray-400'}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
          }}
          aria-label="파일을 선택하거나 드래그 앤 드롭으로 추가"
        >
          <p className="text-gray-700">파일을 끌어다 놓거나</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 inline-flex items-center rounded bg-gray-800 px-3 py-1.5 text-white hover:bg-gray-700"
          >
            파일 선택
          </button>
          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            multiple
            onChange={onFilesChange}
            accept="image/*,text/plain,text/markdown,application/pdf,application/json,application/xml,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          />
          <small className="mt-2 text-gray-500">이미지/텍스트 위주를 권장합니다.</small>
        </div>

        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-sm text-gray-600">
              {files.length}개 선택됨, 총 {formatBytes(totalSize)}
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {files.map((f, idx) => (
                <li key={f.name + idx} className="flex items-center justify-between rounded border border-gray-200 p-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {previews[idx] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previews[idx]}
                        alt={f.name}
                        className="h-12 w-12 rounded object-cover bg-gray-100"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center text-gray-500 text-xs">
                        FILE
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm text-gray-900" title={f.name}>{f.name}</div>
                      <div className="text-xs text-gray-500">{formatBytes(f.size)}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    aria-label={`${f.name} 삭제`}
                    className="ml-3 text-xs text-gray-600 hover:text-red-600"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {errors.attachments && <small className="mt-2 block text-red-600">{errors.attachments}</small>}
      </div>

      <input type="hidden" name="appVersion" value={appVersion} />

      {errors.submit && <div className="text-red-600">{errors.submit}</div>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex items-center rounded bg-amber-400 px-4 py-2 text-black border border-black hover:bg-amber-500 disabled:opacity-60"
        >
          {submitting ? '전송 중…' : '피드백 보내기'}
        </button>
        <small className="text-gray-600">
          이미지/텍스트 위주의 첨부를 권장합니다. 대용량 파일은 링크로 공유해 주세요.
        </small>
      </div>
    </form>
  );
}


