// Android's speech recorder produces PCM16 WAV. Boost quiet voice playback in
// a temporary copy; never alter the learner's saved original or device volume.
export function amplifyVoiceWav(input: Uint8Array): { bytes: Uint8Array; gain: number; silent: boolean } | null {
  const view = new DataView(input.buffer, input.byteOffset, input.byteLength);
  const tag = (at: number) => String.fromCharCode(...input.subarray(at, at + 4));
  if (input.length < 44 || tag(0) !== "RIFF" || tag(8) !== "WAVE") return null;
  let pcm16 = false, dataStart = 0, dataSize = 0;
  for (let at = 12; at + 8 <= input.length;) {
    const size = view.getUint32(at + 4, true), start = at + 8;
    if (start + size > input.length) return null;
    if (tag(at) === "fmt " && size >= 16)
      pcm16 = view.getUint16(start, true) === 1 && view.getUint16(start + 14, true) === 16;
    if (tag(at) === "data") { dataStart = start; dataSize = size; }
    at = start + size + (size % 2);
  }
  if (!pcm16 || !dataSize || dataSize % 2) return null;
  let peak = 0;
  for (let at = dataStart; at < dataStart + dataSize; at += 2)
    peak = Math.max(peak, Math.abs(view.getInt16(at, true)));
  const gain = peak ? Math.max(1, Math.min(16, 0.85 * 32767 / peak)) : 1;
  if (gain === 1) return { bytes: input, gain, silent: peak === 0 };
  const bytes = input.slice(), output = new DataView(bytes.buffer);
  for (let at = dataStart; at < dataStart + dataSize; at += 2)
    output.setInt16(at, Math.round(view.getInt16(at, true) * gain), true);
  return { bytes, gain, silent: false };
}
