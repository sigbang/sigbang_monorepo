export type ResizeOptions = {
  maxWidth?: number;
  maxHeight?: number;
  mimeType?: 'image/jpeg' | 'image/webp';
  qualityStart?: number; // 0..1
  qualityMin?: number; // 0..1
};

const DEFAULTS: Required<ResizeOptions> = {
  maxWidth: 3840,
  maxHeight: 3840,
  mimeType: 'image/jpeg',
  qualityStart: 0.9,
  qualityMin: 0.5,
};

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function getTargetSize(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Failed to create blob from canvas'));
        else resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

export async function resizeImageToMaxBytes(
  file: File,
  maxBytes: number,
  options?: ResizeOptions
): Promise<File | undefined> {
  if (file.size <= maxBytes) return file;

  // Try to decode in browser. Some formats (HEIC/HEIF) may fail.
  let dataUrl: string;
  try {
    dataUrl = await readFileAsDataURL(file);
  } catch {
    return undefined; // Can't read; bail out
  }

  let img: HTMLImageElement;
  try {
    img = await loadImage(dataUrl);
  } catch {
    return undefined; // Can't decode; bail out
  }

  const cfg = { ...DEFAULTS, ...(options ?? {}) };
  const { width, height } = getTargetSize(img.naturalWidth || img.width, img.naturalHeight || img.height, cfg.maxWidth, cfg.maxHeight);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;
  ctx.drawImage(img, 0, 0, width, height);

  // Try qualities descending until under maxBytes or min quality reached
  const qualities: number[] = [];
  for (let q = cfg.qualityStart; q >= cfg.qualityMin; q -= 0.05) qualities.push(Math.round(q * 100) / 100);
  if (qualities[qualities.length - 1] !== cfg.qualityMin) qualities.push(cfg.qualityMin);

  for (const q of qualities) {
    const blob = await canvasToBlob(canvas, cfg.mimeType, q);
    if (blob.size <= maxBytes) {
      return new File([blob], file.name.replace(/\.(heic|heif|png|gif|webp|jpe?g)$/i, '') + (cfg.mimeType === 'image/webp' ? '.webp' : '.jpg'), {
        type: cfg.mimeType,
        lastModified: Date.now(),
      });
    }
  }

  // As a last attempt, scale further down iteratively
  let curWidth = width;
  let curHeight = height;
  for (let i = 0; i < 3; i++) {
    curWidth = Math.max(1, Math.round(curWidth * 0.75));
    curHeight = Math.max(1, Math.round(curHeight * 0.75));
    canvas.width = curWidth;
    canvas.height = curHeight;
    ctx.drawImage(img, 0, 0, curWidth, curHeight);
    const blob = await canvasToBlob(canvas, cfg.mimeType, cfg.qualityMin);
    if (blob.size <= maxBytes) {
      return new File([blob], file.name.replace(/\.(heic|heif|png|gif|webp|jpe?g)$/i, '') + (cfg.mimeType === 'image/webp' ? '.webp' : '.jpg'), {
        type: cfg.mimeType,
        lastModified: Date.now(),
      });
    }
  }

  return undefined; // Couldn't fit under target
}


