/** Public builds accept hosted HTTPS services only. Local servers belong to internal builds. */
export function serviceURL(value: string | undefined, internal = false): string {
  if (!value?.trim()) return "";
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();
    const local = host === "localhost" || host === "::1" || host === "[::1]" ||
      host.endsWith(".local") || /^127\.|^10\.|^192\.168\.|^169\.254\.|^172\.(1[6-9]|2\d|3[01])\./.test(host);
    if (url.username || url.password || url.search || url.hash ||
        (!internal && (url.protocol !== "https:" || local)) ||
        (internal && !["https:", "http:"].includes(url.protocol))) return "";
    return url.href.replace(/\/$/, "");
  } catch { return ""; }
}

export function releaseSettings<T extends { server: string; speechServer: string; openAll: boolean; dayShift?: number; needAccount: boolean }>(
  settings: T, backend: string, speech: string, internal: boolean,
): T {
  return {
    ...settings,
    server: internal ? settings.server || backend : backend,
    speechServer: internal ? settings.speechServer || speech : speech,
    openAll: internal && settings.openAll,
    dayShift: internal ? settings.dayShift : 0,
    needAccount: !!backend && settings.needAccount,
  };
}
