"use client";

import { signOut, useSession } from "@/lib/auth/session";

export default function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (session) {
    return (
      <button
        onClick={async () => {
          try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
          await signOut();
        }}
      >
        로그아웃
      </button>
    );
  }

  return <button onClick={() => (window.location.href = "/login")}>Google로 로그인</button>;
}


