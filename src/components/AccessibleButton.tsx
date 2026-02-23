/**
 * Smart Eye — AccessibleButton Component
 * A fully accessible, styled button with:
 *   - accessibilityRole, accessibilityLabel, accessibilityHint
 *   - Haptic feedback via expo-haptics
 *   - Optional TTS announcement on press
 *   - Visual press feedback (scale animation)
 */

import React, { useRef } from 'react';
import {
    Pressable,
    Text,
    StyleSheet,
    Animated,
    ViewStyle,
    TextStyle,
    AccessibilityRole,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, BorderRadius, Spacing } from '../styles/theme';
import { speak } from '../utils/speech';

interface AccessibleButtonProps {
    label: string;
    onPress: () => void;
    hint?: string;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    accessibilityRole?: AccessibilityRole;
    announceOnPress?: string; // optional TTS message on press
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
    haptic?: boolean;
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
    label,
    onPress,
    hint,
    variant = 'primary',
    size = 'md',
    disabled = false,
    accessibilityRole = 'button',
    announceOnPress,
    style,
    textStyle,
    icon,
    haptic = true,
}) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.95,
            useNativeDriver: true,
            speed: 40,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 30,
            bounciness: 6,
        }).start();
    };

    const handlePress = () => {
        if (disabled) return;
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (announceOnPress) speak(announceOnPress);
        onPress();
    };

    return (
        <Animated.View style={[{ transform: [{ scale }] }, style]}>
            <Pressable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
                accessible
                accessibilityRole={accessibilityRole}
                accessibilityLabel={label}
                accessibilityHint={hint}
                accessibilityState={{ disabled }}
                style={({ pressed }) => [
                    styles.base,
                    styles[variant],
                    styles[`size_${size}`],
                    disabled && styles.disabled,
                    pressed && styles.pressed,
                ]}
            >
                {icon && <>{icon}</>}
                <Text
                    style={[
                        styles.text,
                        styles[`text_${variant}`],
                        styles[`textSize_${size}`],
                        disabled && styles.textDisabled,
                        textStyle,
                    ]}
                    numberOfLines={1}
                >
                    {label}
                </Text>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },

    // Variants
    primary: {
        backgroundColor: Colors.accent,
    },
    secondary: {
        backgroundColor: Colors.surfaceElevated,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    ghost: {
        backgroundColor: Colors.transparent,
        borderWidth: 1,
        borderColor: Colors.accent,
    },
    danger: {
        backgroundColor: Colors.errorDim,
        borderWidth: 1,
        borderColor: Colors.error,
    },

    // Sizes
    size_sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base },
    size_md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
    size_lg: { paddingVertical: Spacing.base + 2, paddingHorizontal: Spacing.xxl },

    // Text
    text: {
        fontWeight: Typography.semiBold,
        letterSpacing: 0.4,
    },
    text_primary: { color: Colors.background },
    text_secondary: { color: Colors.textPrimary },
    text_ghost: { color: Colors.accent },
    text_danger: { color: Colors.error },

    textSize_sm: { fontSize: Typography.sm },
    textSize_md: { fontSize: Typography.base },
    textSize_lg: { fontSize: Typography.md },

    // States
    disabled: { opacity: 0.45 },
    textDisabled: { opacity: 0.6 },
    pressed: { opacity: 0.85 },
});

export default AccessibleButton;
