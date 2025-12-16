import { api } from './client';

export async function presign(contentType: string, opts?: { kind?: string }) {
  const body: Record<string, unknown> = { contentType };
  if (opts?.kind) body.kind = opts.kind;
  const { data } = await api.post('/media/presign', body);
  const res = data?.data ?? data;
  return res as { bucket?: string; path: string; token?: string; uploadUrl?: string; url?: string };
}

export async function fileToBytes(file: File) {
  const ab = await file.arrayBuffer();
  return new Uint8Array(ab);
}

export async function uploadFile(file: File, opts?: { kind?: string }) {
  if (file.size > 10 * 1024 * 1024) {
    const err = new Error('이미지 파일은 최대 10MB까지 업로드할 수 있어요.');
    (err as any).code = 'IMAGE_TOO_LARGE';
    throw err;
  }
  const contentType = file.type || 'application/octet-stream';
  const meta = await presign(contentType, opts);

  // 백엔드가 발급한 presigned URL(또는 업로드 URL)로 직접 업로드
  const putUrl = meta.uploadUrl ?? meta.url;
  if (!putUrl) throw new Error('Presign response missing uploadUrl');
  await fetch(putUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });
  return meta.path;
}


