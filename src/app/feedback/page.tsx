"use client";

import { useState } from "react";
import Topbar from '@/components/Topbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';

type FeedbackCategory = "bug" | "idea" | "other";

export default function FeedbackPage() {
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<null | "ok" | "fail">(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setSubmitted("fail");
      return;
    }
    setSubmitting(true);
    setSubmitted(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject,
          description,
          name: name || undefined,
          email: email || undefined,
          path: typeof window !== "undefined" ? window.location.pathname : undefined,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        }),
      });
      if (res.ok) {
        setSubmitted("ok");
        setSubject("");
        setDescription("");
        setName("");
        setEmail("");
      } else {
        // Fallback to mailto
        openMailto();
        setSubmitted("ok");
      }
    } catch {
      // Fallback to mailto
      openMailto();
      setSubmitted("ok");
    } finally {
      setSubmitting(false);
    }
  };

  const openMailto = () => {
    const mail = "contact.aminity@gmail.com";
    const title = encodeURIComponent(`[식방] ${categoryLabel(category)}: ${subject}`);
    const body = encodeURIComponent(
      `${description}\n\n--\n이름: ${name || "(미기재)"}\n이메일: ${email || "(미기재)"}\n카테고리: ${categoryLabel(category)}\n경로: ${typeof window !== "undefined" ? window.location.href : ""}\nUser-Agent: ${typeof navigator !== "undefined" ? navigator.userAgent : ""}`
    );
    window.location.href = `mailto:${mail}?subject=${title}&body=${body}`;
  };

  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="mx-auto max-w-[800px] px-6 py-8">
        <h1 className="text-2xl font-semibold">의견 및 버그 보내기</h1>
        <p className="mt-2 text-gray-600 text-sm">서비스 개선을 위해 소중한 의견을 남겨 주세요.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">카테고리</label>
            <select
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
              value={category}
              onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
              aria-label="카테고리 선택"
            >
              <option value="bug">버그 제보</option>
              <option value="idea">기능 제안</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">제목</label>
            <input
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="간단한 제목을 입력해 주세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">내용</label>
            <textarea
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 h-40"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="문제 상황, 기대 동작, 재현 방법 등을 자세히 적어 주세요"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">이름 (선택)</label>
              <input
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">이메일 (선택)</label>
              <input
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {submitting ? "전송 중..." : "제출"}
            </button>
            <button
              type="button"
              onClick={openMailto}
              className="text-sm text-gray-600 hover:underline"
            >
              메일로 보내기
            </button>
            {submitted === "ok" && (
              <span className="text-sm text-green-600">감사합니다! 소중한 의견 잘 받았습니다.</span>
            )}
            {submitted === "fail" && (
              <span className="text-sm text-red-600">제목과 내용을 입력해 주세요.</span>
            )}
          </div>
        </form>
      </div>
      <Footer />
      <MobileNav />
    </div>
  );
}

function categoryLabel(c: FeedbackCategory) {
  switch (c) {
    case "bug":
      return "버그 제보";
    case "idea":
      return "기능 제안";
    default:
      return "기타";
  }
}


