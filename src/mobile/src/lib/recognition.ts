// Live hypotheses are display-only. An interrupted/failed session cannot award
// a correct answer, even if its last provisional transcript matched the prompt.
export type RecognitionState = {
  transcript: string;
  alts: string[];
  final: boolean;
};
export const emptyRecognition = (): RecognitionState => ({ transcript: "", alts: [], final: false });
export function recognitionResult(
  state: RecognitionState,
  event: { isFinal: boolean; results: { transcript: string }[] },
): RecognitionState {
  if (state.final && !event.isFinal) return state;
  return {
    transcript: event.results[0]?.transcript || "",
    alts: event.isFinal ? event.results.map(result => result.transcript) : [],
    final: event.isFinal,
  };
}
export function finishedRecognition(state: RecognitionState, error?: string) {
  return {
    alts: !error && state.final ? state.alts : [],
    error: error || (state.final ? undefined : "no-final-result"),
  };
}
