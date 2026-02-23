/**
 * Smart Eye — Accessibility Utility
 * Helpers for TalkBack (Android) and VoiceOver (iOS) integration.
 * Wraps React Native's AccessibilityInfo API with convenient helpers.
 */

import { AccessibilityInfo, Platform } from 'react-native';

/** Returns true if a screen reader (TalkBack / VoiceOver) is active */
export const isScreenReaderActive = async (): Promise<boolean> => {
    try {
        return await AccessibilityInfo.isScreenReaderEnabled();
    } catch {
        return false;
    }
};

/**
 * Post an accessibility announcement.
 * On Android this triggers TalkBack; on iOS it triggers VoiceOver.
 * Prefer this over direct Speech.speak() for UI state changes.
 */
export const announceForAccessibility = (message: string) => {
    if (!message?.trim()) return;
    AccessibilityInfo.announceForAccessibility(message);
};

/**
 * Set accessibility focus on a component ref.
 * Pass the result of `React.createRef()` attached to the target view.
 */
export const setAccessibilityFocus = (ref: React.RefObject<any>) => {
    if (!ref?.current) return;
    const tag = ref.current;
    if (Platform.OS === 'android') {
        // Small delay ensures the view is mounted/visible before focusing
        setTimeout(() => {
            try {
                AccessibilityInfo.sendAccessibilityEvent(tag, 'focus');
            } catch {
                // noop — not all elements support focus events
            }
        }, 200);
    } else {
        // iOS: use findNodeHandle
        try {
            const { findNodeHandle } = require('react-native');
            const nodeId = findNodeHandle(tag);
            if (nodeId) AccessibilityInfo.setAccessibilityFocus(nodeId);
        } catch {
            // noop
        }
    }
};

/**
 * Build a consistent accessibility label for detected objects.
 * Example: "Person detected, 92 percent confidence"
 */
export const buildDetectionLabel = (objectName: string, confidence: number): string =>
    `${objectName} detected, ${Math.round(confidence * 100)} percent confidence`;

/**
 * Format a timestamp for accessibility reading.
 * Example: "Detected at 3:45 PM on Monday"
 */
export const formatDetectionTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        weekday: 'long',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

/**
 * Returns appropriate accessibility hint text for common actions.
 */
export const Hints = {
    doubleTap: 'Double tap to activate',
    swipeLeft: 'Swipe left to go back',
    swipeRight: 'Swipe right to go forward',
    slider: 'Swipe up or down to adjust',
    toggle: 'Double tap to toggle',
    camera: 'Camera preview. Object detection is running.',
    listItem: 'Double tap to view details. Swipe left to delete.',
};
