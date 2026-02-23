/**
 * Smart Eye — Storage Utility
 * Typed AsyncStorage wrapper for settings and detection history.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Keys ────────────────────────────────────────────────────────────────────

const KEYS = {
    SETTINGS: '@smart_eye_settings',
    HISTORY: '@smart_eye_history',
    ONBOARDED: '@smart_eye_onboarded',
    USER: '@smart_eye_user',
} as const;

// ── Types ────────────────────────────────────────────────────────────────────

export interface UserSettings {
    ttsRate: number;       // 0.1 – 2.0
    ttsPitch: number;      // 0.5 – 2.0
    ttsLanguage: string;   // e.g. "en-US"
    confidence: number;    // 0.3 – 0.9 detection threshold
    hapticEnabled: boolean;
    continuousMode: boolean;
    detectionInterval: number; // ms between TTS announcements
}

export interface DetectionRecord {
    id: string;
    label: string;
    confidence: number;
    score?: number;     // auto-filled from confidence if omitted
    class?: string;     // optional — matches COCO-SSD output
    timestamp: number;
}

export interface StoredUser {
    name: string;
    email: string;
}

// ── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: UserSettings = {
    ttsRate: 0.9,
    ttsPitch: 1.0,
    ttsLanguage: 'en-US',
    confidence: 0.55,
    hapticEnabled: true,
    continuousMode: true,
    detectionInterval: 2500,
};

// ── Settings ─────────────────────────────────────────────────────────────────

export const saveSettings = async (settings: UserSettings): Promise<void> => {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
};

export const loadSettings = async (): Promise<UserSettings> => {
    try {
        const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
        if (!raw) return DEFAULT_SETTINGS;
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_SETTINGS;
    }
};

// ── History ───────────────────────────────────────────────────────────────────

export const saveDetection = async (record: DetectionRecord): Promise<void> => {
    try {
        // Ensure score is always populated (alias for confidence)
        const normalized = { ...record, score: record.score ?? record.confidence };
        const existing = await loadHistory();
        const updated = [normalized, ...existing].slice(0, 200); // cap at 200 records
        await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
    } catch {
        // noop — detection is primary; history failure is non-fatal
    }
};

export const loadHistory = async (): Promise<DetectionRecord[]> => {
    try {
        const raw = await AsyncStorage.getItem(KEYS.HISTORY);
        if (!raw) return [];
        return JSON.parse(raw) as DetectionRecord[];
    } catch {
        return [];
    }
};

export const clearHistory = async (): Promise<void> => {
    await AsyncStorage.removeItem(KEYS.HISTORY);
};

export const deleteHistoryItem = async (id: string): Promise<void> => {
    const existing = await loadHistory();
    const updated = existing.filter(r => r.id !== id);
    await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
};

// ── User ──────────────────────────────────────────────────────────────────────

export const saveUser = async (user: StoredUser): Promise<void> => {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
};

export const loadUser = async (): Promise<StoredUser | null> => {
    try {
        const raw = await AsyncStorage.getItem(KEYS.USER);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const clearUser = async (): Promise<void> => {
    await AsyncStorage.multiRemove([KEYS.USER, KEYS.SETTINGS]);
};

// ── Onboarding ────────────────────────────────────────────────────────────────

export const markOnboarded = async (): Promise<void> => {
    await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
};

export const hasOnboarded = async (): Promise<boolean> => {
    const val = await AsyncStorage.getItem(KEYS.ONBOARDED);
    return val === 'true';
};
