/**
 * Smart Eye — Speech Utility
 * Centralised wrapper around expo-speech for consistent TTS across screens.
 * Supports debouncing to prevent TTS spam during continuous detection.
 */

import * as Speech from 'expo-speech';

export interface SpeechOptions {
    language?: string;
    pitch?: number;
    rate?: number;
    onStart?: () => void;
    onDone?: () => void;
    onError?: (error: string) => void;
}

// Default config — can be overridden by user settings
let globalConfig: SpeechOptions = {
    language: 'en-US',
    pitch: 1.0,
    rate: 0.9,
};

/** Update the global TTS config (called from SettingsScreen) */
export const configureSpeech = (config: Partial<SpeechOptions>) => {
    globalConfig = { ...globalConfig, ...config };
};

/** Get current global config (for reading in SettingsScreen) */
export const getSpeechConfig = (): SpeechOptions => ({ ...globalConfig });

/** Speak text using global config. Stops any current speech first. */
export const speak = (text: string, overrides?: Partial<SpeechOptions>) => {
    if (!text?.trim()) return;
    Speech.stop();
    Speech.speak(text, { ...globalConfig, ...overrides });
};

/** Speak text without interrupting current speech */
export const speakQueued = (text: string, overrides?: Partial<SpeechOptions>) => {
    if (!text?.trim()) return;
    Speech.speak(text, { ...globalConfig, ...overrides });
};

/** Stop all current speech immediately */
export const stopSpeech = () => {
    Speech.stop();
};

/** Announce a short status message (lower priority, quieter) */
export const announce = (message: string) => {
    speak(message, { rate: 0.95, pitch: 1.0 });
};

/** Announce an error in a distinct, slightly urgent tone */
export const announceError = (message: string) => {
    speak(message, { pitch: 0.85, rate: 0.85 });
};

/** Announce a success confirmation */
export const announceSuccess = (message: string) => {
    speak(message, { pitch: 1.1, rate: 0.95 });
};

// ── Debounce helper for detection loop ──────────────────────────────────────

let lastSpokenAt = 0;
let lastSpokenText = '';

/**
 * Debounced speak for live detection — prevents repeating the same label
 * too frequently. Default interval: 2500ms.
 */
export const speakDetection = (
    label: string,
    confidence: number,
    intervalMs = 2500
) => {
    const now = Date.now();
    const fullMessage = `${label} detected, ${Math.round(confidence * 100)} percent confidence`;

    if (label === lastSpokenText && now - lastSpokenAt < intervalMs) return;

    lastSpokenAt = now;
    lastSpokenText = label;
    speak(fullMessage);
};

/** Reset debounce state (call when leaving detection screen) */
export const resetDetectionDebounce = () => {
    lastSpokenAt = 0;
    lastSpokenText = '';
};
