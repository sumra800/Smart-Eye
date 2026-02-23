/**
 * Smart Eye — Design System Theme
 * Centralized tokens for colors, typography, spacing, and shadows.
 * Palette: Dark navy (#0a1628) base with cyan accent (#00d4ff).
 */

export const Colors = {
    // Backgrounds
    background: '#0a1628',
    backgroundSecondary: '#0f2040',
    backgroundTertiary: '#162d52',
    surface: 'rgba(255, 255, 255, 0.06)',
    surfaceElevated: 'rgba(255, 255, 255, 0.10)',
    surfaceBorder: 'rgba(255, 255, 255, 0.12)',

    // Accent
    accent: '#00d4ff',
    accentDim: 'rgba(0, 212, 255, 0.20)',
    accentBright: '#40e0ff',

    // Text
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.70)',
    textMuted: 'rgba(255, 255, 255, 0.45)',
    textAccent: '#00d4ff',

    // Status
    success: '#00e676',
    successDim: 'rgba(0, 230, 118, 0.20)',
    warning: '#ffab00',
    warningDim: 'rgba(255, 171, 0, 0.20)',
    error: '#ff5252',
    errorDim: 'rgba(255, 82, 82, 0.20)',

    // Detection overlay
    bboxPrimary: '#00d4ff',
    bboxSecondary: '#00e676',
    bboxBackground: 'rgba(0, 212, 255, 0.15)',

    // Input
    inputBackground: 'rgba(255, 255, 255, 0.08)',
    inputBorder: 'rgba(255, 255, 255, 0.18)',
    inputFocusBorder: '#00d4ff',
    placeholder: 'rgba(255, 255, 255, 0.40)',

    // Gradients (as array tuples for LinearGradient)
    gradientPrimary: ['#0a1628', '#162d52'] as [string, string],
    gradientAccent: ['#004a6b', '#00d4ff'] as [string, string],
    gradientCard: ['rgba(0,212,255,0.12)', 'rgba(0,212,255,0.04)'] as [string, string],

    // Misc
    divider: 'rgba(255, 255, 255, 0.10)',
    overlay: 'rgba(0, 0, 0, 0.55)',
    transparent: 'transparent',
};

export const Typography = {
    // Font sizes
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 30,
    display: 38,

    // Font weights (as string literals for React Native)
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,

    // Line heights
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 48,
    section: 64,
};

export const BorderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
    full: 9999,
};

export const Shadows = {
    sm: {
        shadowColor: '#00d4ff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    md: {
        shadowColor: '#00d4ff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 12,
        elevation: 8,
    },
    lg: {
        shadowColor: '#00d4ff',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.30,
        shadowRadius: 20,
        elevation: 12,
    },
};

export default { Colors, Typography, Spacing, BorderRadius, Shadows };
