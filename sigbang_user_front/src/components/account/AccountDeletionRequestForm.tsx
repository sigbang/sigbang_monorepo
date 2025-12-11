'use client';

import React from 'react';
import { getOrCreateDeviceId, getDeviceName } from '@/lib/auth/device';

const MIN_MESSAGE = 10;
const MAX_MESSAGE = 1000;

export default function AccountDeletionRequestForm() {
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [appVersion, setAppVersion] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [deviceId, setDeviceId] = React.useState('');
  const [deviceName, setDeviceName] = React.useState('');

  React.useEffect(() => {
    setAppVersion(process.env.NEXT_PUBLIC_APP_VERSION || '');
    try {
      setDeviceId(getOrCreateDeviceId());
      setDeviceName(getDeviceName() || 'web');
    } catch {
      setDeviceName('web');
    }
  }, []);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validate() {
    const e: Record<string, string> = {};
    const emailTrim = email.trim();
    const msgTrim = message.trim();

    if (!emailTrim) {
      e.email = '이메일을 입력해 주세요.';
    } else if (emailTrim.length > 254) {
      e.email = '이메일은 최대 254자까지 가능합니다.';
    } else if (!emailRegex.test(emailTrim)) {
      e.email = '이메일 형식이 올바르지 않습니다.';
    }

    if (msgTrim.length < MIN_MESSAGE || msgTrim.length > MAX_MESSAGE) {
      e.message = `요청 내용은 ${MIN_MESSAGE}–${MAX_MESSAGE}자여야 합니다.`;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSuccess(null);

    if (!validate()) return;

    const form = new FormData();
    form.set('type', 'other');
    form.set('subject', '계정/데이터 삭제 요청 - 식방(Android 앱)');
    form.set('message', message.trim());
    form.set('email', email.trim());
    if (appVersion) form.set('appVersion', appVersion);

    setSubmitting(true);
    setErrors((prev) => ({ ...prev, submit: '' }));

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'x-device-id': deviceId || '',
          'x-device-name': deviceName || 'account-deletion-page',
        },
        body: form,
      });

      if (res.status === 200 || res.status === 201) {
        setSuccess('계정 삭제 요청이 접수되었습니다. 영업일 기준 7일 이내에 이메일로 결과를 안내해 드립니다.');
        setMessage('');
      } else if (res.status === 400) {
        let submitMsg = '입력값을 다시 확인해 주세요.';
        try {
          const data: unknown = await res.json();
          const maybeMessage = (data as { message?: unknown })?.message;
          if (typeof maybeMessage === 'string') {
            submitMsg = maybeMessage;
          }
        } catch {
          // ignore parse errors
        }
        setErrors((prev) => ({ ...prev, submit: submitMsg }));
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
        submit: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      }));
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = submitting;

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700">* 이메일</label>
        <input
          type="email"
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="계정을 만들 때 사용한 이메일을 입력해 주세요."
          autoComplete="email"
          inputMode="email"
        />
        {errors.email && <small className="text-red-600">{errors.email}</small>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">* 삭제를 원하는 계정 정보 및 요청 내용</label>
        <textarea
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 h-40"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`예시)\n- 닉네임: 식방유저\n- 앱에서 사용하는 이메일: user@example.com\n- 기타 식별 정보: 자주 사용하는 레시피, 가입일 등\n- 요청 내용: 계정 및 관련 데이터를 모두 삭제해 주세요.`}
        />
        {errors.message && <small className="text-red-600">{errors.message}</small>}
      </div>

      <input type="hidden" name="appVersion" value={appVersion} />

      {errors.submit && (
        <div className="text-red-600 text-sm">
          {errors.submit}
        </div>
      )}
      {success && (
        <div className="text-green-600 text-sm" role="status" aria-live="polite">
          {success}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex items-center rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60"
        >
          {submitting ? '요청 전송 중…' : '계정 삭제 요청 보내기'}
        </button>
        <small className="text-gray-600">
          잘못 작성하신 경우, support@sigbang.com 으로 직접 이메일을 보내셔도 됩니다.
        </small>
      </div>
    </form>
  );
}


