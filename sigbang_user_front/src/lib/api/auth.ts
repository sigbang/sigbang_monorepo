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


export async function emailSignup(input: { email: string; password: string; nickname: string }) {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json && json.message) || `Signup failed (${res.status})`);
  }
  return json;
}

export async function emailSignin(input: { email: string; password: string }) {
  const res = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json && json.message) || `Signin failed (${res.status})`);
  }
  return json;
}

export async function resendVerification(email: string) {
  const res = await fetch('/api/auth/email/resend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json && json.message) || `Resend failed (${res.status})`);
  }
  return json;
}

export async function verifyEmail(token: string) {
  const res = await fetch('/api/auth/email/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json && json.message) || `Verify failed (${res.status})`);
  }
  return json;
}

export async function forgotPassword(email: string) {
  const res = await fetch('/api/auth/password/forgot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json && json.message) || `Request failed (${res.status})`);
  }
  return json;
}

export async function resetPassword(input: { token: string; newPassword: string }) {
  const res = await fetch('/api/auth/password/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json && json.message) || `Reset failed (${res.status})`);
  }
  return json;
}

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  const res = await fetch('/api/auth/password/change', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json && json.message) || `Change failed (${res.status})`);
  }
  return json;
}
