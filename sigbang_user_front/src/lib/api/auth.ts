export async function googleLogin(idToken: string) {
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => 'Login failed');
    throw new Error(msg || `Login failed (${res.status})`);
  }
  return res.json();
}


