export function assignVariant(key: string, subject: string, splitB = 50): 'A' | 'B' {
  let h = 0;
  const s = `${key}:${subject}`;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  const pct = (h >>> 0) % 100;
  return pct < splitB ? 'B' : 'A';
}


