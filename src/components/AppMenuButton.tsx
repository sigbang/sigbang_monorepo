"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function HamburgerIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function AppMenuButton({
  className,
  menuPosition = "left",
  label = "메뉴",
  variant = "default",
}: {
  className?: string;
  menuPosition?: "left" | "right";
  label?: string;
  variant?: "default" | "nav" | "icon" | "mobile";
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (e.target instanceof Node && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const baseButtonClass = (() => {
    if (className) return className;
    if (variant === "nav") return "flex items-center gap-2 rounded text-[#6b7280] hover:text-black text-[18px]";
    if (variant === "icon") return "w-9 h-9 flex items-center justify-center rounded border border-[#eee]";
    if (variant === "mobile") return "flex flex-col items-center justify-center py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-[12px]";
    return "w-full flex items-center justify-center rounded border border-[#eee] px-3 py-2 text-[14px] hover:bg-neutral-50";
  })();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className={baseButtonClass}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={variant === "icon" ? (label || "메뉴") : undefined}
      >
        {variant === "nav" && (
          <>
            <HamburgerIcon size={22} />
            <span>{label}</span>
          </>
        )}
        {variant === "icon" && <HamburgerIcon size={18} />}
        {variant === "mobile" && (
          <>
            <HamburgerIcon size={20} />
            <span>{label}</span>
          </>
        )}
        {variant === "default" && <span>{label}</span>}
      </button>
      {open && (
        <div
          role="menu"
          className={
            "absolute z-50 mt-2 w-[220px] rounded-2xl bg-white shadow-lg border border-[#eee] p-3 " +
            (menuPosition === "right" ? "right-0" : "left-0") +
            " bottom-12 sm:bottom-auto"
          }
        >
          <Link
            href="/about"
            className="block rounded px-3 py-2 text-[14px] text-[#111] hover:bg-neutral-50"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            서비스 소개(랜딩페이지)
          </Link>
          <Link
            href="/feedback"
            className="mt-1 block rounded px-3 py-2 text-[14px] text-[#111] hover:bg-neutral-50"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            의견 및 버그 보내기
          </Link>
          <Link
            href="/download"
            className="mt-1 block rounded px-3 py-2 text-[14px] text-[#111] hover:bg-neutral-50"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            다운로드 페이지
          </Link>
        </div>
      )}
    </div>
  );
}


