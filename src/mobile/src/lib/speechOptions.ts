// Request live text independently of final grading. The library otherwise asks
// Android 14+ for per-word final timing/confidence that this app does not use.
export function speechOptions(platform: string, api: number, prompt = "") {
  const short = prompt.trim().split(/\s+/).filter(Boolean).length <= 2 && !!prompt.trim();
  return {
    interimResults: true,
    continuous: false,
    maxAlternatives: 3,
    ...(platform === "android" ? {
      androidIntentOptions: {
        EXTRA_LANGUAGE_MODEL: short ? "web_search" as const : "free_form" as const,
        ...(api >= 34 ? {
          EXTRA_REQUEST_WORD_CONFIDENCE: false,
          EXTRA_REQUEST_WORD_TIMING: false,
        } : {}),
      },
    } : {}),
  };
}
