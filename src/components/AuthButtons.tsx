"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (session) {
    return <button onClick={() => signOut()}>로그아웃</button>;
  }

  return <button onClick={() => signIn("google")}>Google로 로그인</button>;
}


