export type VoiceProviderName = "web-speech-api";

/** Browser speech recognition is the credentialless default adapter; audio never enters SENSAI's upload storage. */
export const defaultVoiceProvider: VoiceProviderName = "web-speech-api";

export interface BrowserSpeechRecognitionAdapter {
  start(): void;
  stop(): void;
  onresult: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
}
