# Speech recognition and retention research

Assessed on 22 October 2026 for the standalone Android app. The immediate priority is trustworthy speaking feedback and a better first lesson. Launch preparation is outside this work.

The first lesson has a reasonable teaching sequence, but its previous speaking results could not establish that the learner said the answer. Recognition, answer checking, and pronunciation assessment need separate responsibilities.

## First lesson assessment

| Part | Judgment | Action |
| --- | --- | --- |
| Introduce Hello, Hi, Good morning | Three useful greetings are manageable for a beginner. Listening before revealing English supports the existing method. | Keep the phrases and recorded examples. |
| Listen to Aziz and Malika | Gives the greetings a social setting. The broad multiple-choice question checks the situation, not detailed comprehension. | Keep as an early confidence exercise; do not interpret it as proof of speaking ability. |
| Repeat Hello and Hi | Useful rehearsal, but a transcription match alone does not measure pronunciation quality. | Check the finished transcript and give honest retry feedback. |
| Build Good morning | Checks word order with little difficulty. Optional reading afterward should remain optional. | A mismatching speaking attempt now stays in practice until a match or explicit skip. The skip retains credit for the correctly built tiles. |
| Say Good morning in a morning encounter | A suitable first attempt at recall, although the Uzbek translation makes it heavily supported. | Replace the automatically revealed first word with a hint the learner requests. |

Three consecutive introductions and repeated one-word answers make this a gentle introduction, rather than evidence of spontaneous conversation. Judge its effectiveness by whether a learner can recall an appropriate greeting later without the model or hint. A listening/tiles-only completion must not be described as verified pronunciation mastery.

## Why unrelated speech could appear accepted

The application had several independent faults:

1. Android read-aloud called `respond(readAloud || result.right, ...)`. Any nonempty recognized speech completed that optional step.
2. The matcher looked for the target words anywhere in the transcript. For Hello, a transcript containing unrelated words plus hello could pass.
3. Any recognition alternative could pass, even when the engine's first choice was a different word.
4. Android retained interim hypotheses as gradable answers. A partial guess could survive an error or a session ending without a final result. The browser also fell back to its last partial result.
5. The feedback card displayed the expected words under a heading meaning You said. An orange expected word did not show what the recognizer actually heard.

The corrections require the complete utterance to match an accepted answer, use the engine's first final hypothesis, discard failed/incomplete recognition sessions, and label recognized text separately from the example. Wrong answers still receive the existing gentle correction and review; they do not receive success credit. Orange examples indicate another attempt is needed, not a measured pronunciation score.

Existing contraction, number and explicit homophone normalization remains. The curriculum's loose name/local-word policy remains limited to those word positions, with a maximum of three recognizer tokens per loose word. It still tolerates an omitted name; this is a teaching exception, not proof the name was pronounced. Reconsider that policy separately when assessing introductions.

Verification: all 34 automated tests, TypeScript checks and lint passed. Browser integration checks rejected yellow for Hello, kept a mismatching optional read-aloud open, preserved its skip control, and completed practice after a matching retry. The Android test APK built and updated the connected Redmi in place; saved progress remained visible. These checks cover application behavior, not the recognizer's accuracy on human speech.

## What Duolingo publicly establishes

Duolingo describes turning spoken answers into editable text and giving feedback, but that explanation does not establish its current learning app's complete model architecture, provider routing, or acceptance thresholds. We should not claim to reproduce a proprietary engine from public descriptions. [Duolingo dictation explanation](https://blog.duolingo.com/sneaky-pronunciation-practice/)

Duolingo English Test researchers describe a pronunciation model trained on human-rated intelligibility, covering individual sounds and broader speech features. They explain why speech recognition confidence alone is an inadequate pronunciation measure. This is evidence from the separate English Test product, not confirmation that ordinary lesson exercises use the same model. Our implication: check whether the intended answer was said before offering any finer pronunciation feedback. [Duolingo English Test research](https://blog.englishtest.duolingo.com/new-research-in-language-learning-a-pronunciation-scoring-model-built-around-intelligibility-not-imitation/)

## Why keyboard dictation feels fast

Streaming recognition processes incoming audio and emits provisional text before an utterance finishes. Audio evidence and previous predicted symbols help estimate the next symbols. Google's 2019 Gboard implementation described character-by-character output from an on-device RNN transducer. That illustrates the mechanism; it does not identify every current Gboard model. A word appearing early is a prediction from audio already received, not knowledge of what the speaker will say next. [Google streaming recognizer explanation](https://research.google/blog/an-all-neural-on-device-speech-recognizer/)

The current Gboard advanced voice typing support page describes on-device processing and eligibility restrictions, including Pixel 6 or newer devices. That feature is not a drop-in recognition engine promised on a Redmi. [Gboard advanced voice typing](https://support.google.com/assistant/answer/11197787?hl=en)

Our app uses Android's system recognition service through `expo-speech-recognition`. Android allows a service to emit zero, one, or many partial-result events; requesting live text does not guarantee keyboard-like updates. The app already requests interim results. They should update neutral live text only, while the final result controls answer checking. [Android recognition events](https://developer.android.com/reference/android/speech/RecognitionListener), [library documentation](https://github.com/jamsch/expo-speech-recognition)

## Recognition options to evaluate

| Approach | What it could improve | What still needs evidence |
| --- | --- | --- |
| Installed Android engine | Small app footprint, native microphone support, live hypotheses where supported | Accuracy on short English words spoken with Uzbek accents; service/device differences; network dependence |
| Bundled local recognizer | A consistent engine with possible offline operation | Model size, memory, speed and battery use on the Redmi; false acceptance and false rejection rates |
| Hosted transcription | Consistent engine independent of the phone's installed service | Network delay, operating costs and whether short accented words are recognized better |
| Dedicated pronunciation assessment | Acoustic feedback against a reference, beyond text matching | Human agreement, accent fairness, miscues, latency and operating costs |

Microsoft's scripted pronunciation assessment is one documented example of the last category: reference-text assessment can identify omissions and insertions and return finer-grained scores. It is a candidate to benchmark, not a chosen dependency. [Pronunciation assessment documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment)

Before choosing an engine, compare identical recordings with consent: correct greetings, understandable accented variants, unrelated words, near-sounding wrong words, missing/extra words, silence, background speech and interruptions. Include one-word and longer answers, quiet/noisy rooms, and multiple speakers. Keep answer hints out of the recognizer during the baseline so the target does not bias nonsense toward a correct answer.

Have human reviewers label whether the intended phrase is intelligible. Measure false acceptance and false rejection separately, along with time to first live text, time to final text, failures and device resource use. Keep a separate speaker set for evaluation. Do not pick a confidence cutoff or call a score pronunciation accuracy without calibration against those judgments. Automated transcript tests validate our rules; they cannot establish microphone recognition quality.

## Retention evidence and direction

The supplied `Video by ayoships.md` is useful as a list of hypotheses. Its claims about a universal daily churn score, Wi-Fi network histories, time at home and silent-mode monitoring are not established by the primary material cited here. Do not turn them into application requirements.

Duolingo's published growth model groups learners by activity and tracks movement between states, including next-day return. That supports measuring returning learners, inactivity and reactivation; it does not establish the video's exact individual prediction system. [Duolingo growth model](https://blog.duolingo.com/growth-model-duolingo/)

Duolingo's notification research describes handwritten templates, eligibility conditions and variation to prevent repetition. The transferable principle is that a reminder should match the learner's actual situation and avoid repeating the same message indefinitely. The paper does not establish Wi-Fi-based timing. [Duolingo notification research](https://research.duolingo.com/papers/yancey.kdd20.pdf)

For this app, start with locally available learning events and explicit reminder preferences:

- An unfinished lesson should offer a truthful return to the saved position.
- Repeated difficulty should offer an easier replay or targeted review, rather than more notification pressure.
- A completed daily goal should suppress that day's reminder.
- A missed period should lead to a gentle return invitation, without claiming friends or rankings that do not exist.
- Rotate eligible copy, respect the chosen time and opt-out, and limit frequency. One optional daily practice reminder is a starting policy, not a rule that every notification type fires every day.

Measure lesson completion, return on later days, delayed recall, recognition failures, reminder opens and opt-outs. More opens without more successful learning is insufficient. These retention changes remain proposals; the current corrections address speaking and hint behavior. No cloud telemetry, churn prediction or network/location monitoring was added.
