/**
 * Optional voice input port for the conversation composer.
 *
 * Recording and speech-to-text are host capabilities (microphone permission,
 * platform recorder, ASR endpoint), so the composer only renders the affordance
 * and delegates. When the host injects no port, the voice control is disabled
 * with an honest label instead of shipping a control that cannot work.
 */
export interface ConversationVoicePort {
  /** False when the host cannot record (no permission, no runtime support). */
  isSupported(): boolean;
  /** Starts recording; resolves once the recorder is live. */
  start(): Promise<void>;
  /** Stops recording and returns recognized text, or `null` when unusable. */
  stop(): Promise<string | null>;
  /** Aborts an in-flight recording without producing text. */
  cancel(): void;
}
