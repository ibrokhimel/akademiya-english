// Profile customization rules that need no phone: media limits, the recent pictures list, crop geometry, seasonal frames.

// GIF and video: 8 MB and 6 seconds at most (Ruling 7). Never trimmed on the phone.
export const MEDIA_LIMITS = { bytes: 8 * 1024 * 1024, ms: 6000 };
// A clip filmed as 6 s often reports a few extra milliseconds from its container.
const LENGTH_SLACK_MS = 100;
const MEDIA_TYPES = ['image', 'gif', 'video'];

/** 'image' | 'gif' | 'video' from what the image picker returned (type, mimeType, fileName, uri). */
export function pickedMediaType(asset = {}) {
  const a = asset || {};
  const mime = typeof a.mimeType === 'string' ? a.mimeType.toLowerCase() : '';
  if (a.type === 'video' || a.type === 'pairedVideo' || mime.startsWith('video/')) return 'video';
  const name = [a.fileName, a.uri].find((s) => typeof s === 'string' && s) || '';
  if (mime === 'image/gif' || /\.gif$/i.test(name.split('?')[0])) return 'gif';
  return 'image';
}

/** null when the media may be used, else 'tooBig' or 'tooLong'. Pictures are cropped and shrunk, so they are never refused. */
export function mediaProblem({ mediaType, bytes, ms }) {
  if (mediaType !== 'gif' && mediaType !== 'video') return null;
  if (typeof bytes === 'number' && bytes > MEDIA_LIMITS.bytes) return 'tooBig';
  if (typeof ms === 'number' && ms > MEDIA_LIMITS.ms + LENGTH_SLACK_MS) return 'tooLong';
  return null;
}

/** How long one loop of a GIF plays, in ms, from its frame delays; null when the bytes are not a whole GIF. */
export function gifDurationMs(bytes) {
  const b = bytes;
  if (!b || b.length < 13 || String.fromCharCode(b[0], b[1], b[2]) !== 'GIF') return null;
  let i = 13, total = 0;
  if (b[10] & 0x80) i += 3 * (1 << ((b[10] & 0x07) + 1));
  const skipBlocks = () => {
    while (i < b.length && b[i] !== 0) i += b[i] + 1;
    i += 1;
  };
  while (i < b.length) {
    const tag = b[i];
    if (tag === 0x3b) return Math.round(total);
    if (tag === 0x21) {
      if (i + 1 >= b.length) return null;
      if (b[i + 1] === 0xf9) {
        if (i + 5 >= b.length) return null;
        const cs = b[i + 4] | (b[i + 5] << 8);
        total += (cs < 2 ? 10 : cs) * 10;   // browsers play 0 and 1 as 100 ms
      }
      i += 2;
      skipBlocks();
    } else if (tag === 0x2c) {
      if (i + 9 >= b.length) return null;
      const packed = b[i + 9];
      i += 10;
      if (packed & 0x80) i += 3 * (1 << ((packed & 0x07) + 1));
      i += 1;   // LZW minimum code size
      skipBlocks();
    } else return null;
    if (i > b.length) return null;
  }
  return null;   // no trailer: the file was cut
}

/** The last `max` picked media, newest first, no repeats. Returns the new list and the ones that fell off (their files can go). */
export function rememberMedia(list, item, max = 4) {
  const clean = (Array.isArray(list) ? list : []).filter((m) => m && typeof m.uri === 'string' && m.uri !== '' && MEDIA_TYPES.includes(m.mediaType));
  const all = [{ uri: item.uri, mediaType: item.mediaType }, ...clean.filter((m) => m.uri !== item.uri)];
  return { list: all.slice(0, max), dropped: all.slice(max) };
}

// ---- crop: the picture lies under a fixed mask in the middle of the screen; the learner pans and pinches it ----
// geometry: { imageW, imageH, viewW, maskW, maskH } in picture pixels and screen points; scale ≥ 1 is the pinch; x, y the pan in points.

/** Points per picture pixel at pinch 1: the picture fills the screen width and always covers the mask. */
export function cropBase({ imageW, imageH, viewW, maskW, maskH }) {
  return Math.max(viewW / imageW, maskW / imageW, maskH / imageH);
}

/** The pan kept inside the picture: the mask never shows anything but the picture. */
export function clampPan({ scale, x, y, ...g }) {
  const s = cropBase(g) * Math.max(1, scale);
  const maxX = Math.max(0, (g.imageW * s - g.maskW) / 2), maxY = Math.max(0, (g.imageH * s - g.maskH) / 2);
  const clamp = (v, m) => Math.min(m, Math.max(-m, v)) || 0;
  return { x: clamp(x, maxX), y: clamp(y, maxY) };
}

/** The part of the picture under the mask, in whole picture pixels, for expo-image-manipulator's crop. */
export function cropRect({ scale, x, y, ...g }) {
  const s = cropBase(g) * Math.max(1, scale);
  const pan = clampPan({ ...g, scale, x, y });
  const width = Math.min(g.imageW, Math.round(g.maskW / s)), height = Math.min(g.imageH, Math.round(g.maskH / s));
  const left = (g.imageW * s / 2 - pan.x - g.maskW / 2) / s, top = (g.imageH * s / 2 - pan.y - g.maskH / 2) / s;
  const fit = (v, room) => Math.min(room, Math.max(0, Math.round(v)));
  return { originX: fit(left, g.imageW - width), originY: fit(top, g.imageH - height), width, height };
}

// ---- seasonal frames: [from month, from day, to month, to day], both days included; a window may run over New Year ----
const SEASONS = { navruz: [3, 1, 3, 31], independence: [8, 25, 9, 5], newyear: [12, 15, 1, 15] };
/** Ramadan's dates move every year, so its frame is always open; it is simply never the default. */
export const SEASONAL_FRAMES = ['navruz', 'independence', 'newyear', 'ramadan'];

/** True when the frame can be picked on `date`: every frame except a seasonal one outside its window. */
export function seasonOpen(id, date = new Date()) {
  const w = SEASONS[id];
  if (!w) return true;
  const day = (date.getMonth() + 1) * 100 + date.getDate(), from = w[0] * 100 + w[1], to = w[2] * 100 + w[3];
  return from <= to ? day >= from && day <= to : day >= from || day <= to;
}

/** The frame to draw: a seasonal frame picked in its window is not drawn once the window has passed. */
export function frameShown(id, date = new Date()) {
  return seasonOpen(id, date) ? id : 'none';
}

/** Where a video's first-frame picture lives: next to the video, `<name>.thumb.jpg` (small tiles and still phones show it instead of a player). */
export function thumbnailOf(uri) {
  return uri.replace(/\.[a-z0-9]{2,4}$/i, '') + '.thumb.jpg';
}

/**
 * The file name a stored profile media uri points at, so the phone can find it in its own profile/ folder: iOS moves the app's
 * document folder on every install and update, so a stored absolute `file://` path goes stale while the file name stays.
 * Takes a bare name or a uri whose folder is `profile`; anything else (null, another folder, a picker uri) is null.
 */
export function profileFileName(uri) {
  if (typeof uri !== 'string') return null;
  const path = uri.split(/[?#]/)[0];
  const parts = path.split('/');
  const name = parts.pop();
  if (parts.length && parts[parts.length - 1] !== 'profile') return null;
  let decoded;
  try { decoded = decodeURIComponent(name); } catch { return null; }
  return decoded && decoded !== '.' && decoded !== '..' && !/[\\/]/.test(decoded) ? decoded : null;
}
