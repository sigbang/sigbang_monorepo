"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

export default function Topbar() {
  const { data: session, status } = useSession();
  const isAuthed = status === 'authenticated';

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (event.target instanceof Node && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const userImageUrl = (session?.user as { image?: string } | undefined)?.image || '';
  const userEmail = (session?.user as { email?: string } | undefined)?.email || '';
  const userName = (session?.user as { name?: string } | undefined)?.name || '';

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-[#eee]">
      <div className="mx-auto max-w-[1040px] px-4 py-3 flex items-center justify-between">
        <div className="text-[14px] text-[#888]">식방에 오신 것을 환영합니다!</div>
        <div className="relative" ref={menuRef}>
          {isAuthed ? (
            <button
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-full overflow-hidden border border-[#ddd] focus:outline-none focus:ring-2 focus:ring-sky-400"
              title={userEmail || '프로필'}
            >
              {userImageUrl ? (
                // Use img to avoid next/image remote domain config
                <img src={userImageUrl} alt="프로필" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#ddd]" />
              )}
            </button>
          ) : (
            <Link href="/login" className="text-[14px] text-[#111] hover:underline">
              로그인
            </Link>
          )}

          {isAuthed && isMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-[240px] rounded-2xl bg-white shadow-lg border border-[#eee] p-4"
            >
              <div className="text-[14px] font-semibold text-[#222] truncate">{userName || userEmail || '사용자'}</div>
              {userEmail && (
                <div className="mt-1 text-[12px] text-[#666] truncate">{userEmail}</div>
              )}
              <div className="my-3 h-px bg-[#ddd]" />
              <Link href="/profile" className="block text-[14px] text-[#111] hover:text-sky-600" role="menuitem">
                프로필
              </Link>
              <div className="my-3 h-px bg-[#eee]" />
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center justify-between text-[14px] text-[#111] hover:text-sky-600"
                role="menuitem"
              >
                <span>로그아웃</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 5L20 12L13 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 12H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


