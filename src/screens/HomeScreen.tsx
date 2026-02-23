/**
 * Smart Eye — Home Screen
 * Dashboard with large accessible action cards.
 * TTS welcome on mount, TalkBack-ready card grid.
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Animated,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/theme';
import { speak } from '../utils/speech';
import { announceForAccessibility } from '../utils/accessibility';
import * as Haptics from 'expo-haptics';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
    route: RouteProp<RootStackParamList, 'Home'>;
};

interface ActionCard {
    id: string;
    icon: string;
    title: string;
    description: string;
    screen: keyof RootStackParamList;
    params?: any;
    color: string;
    dimColor: string;
    hint: string;
    announcement: string;
}

const ACTION_CARDS: ActionCard[] = [
    {
        id: 'detect',
        icon: '🎯',
        title: 'Start Detection',
        description: 'Live AI object recognition',
        screen: 'LiveDetection',
        params: { mode: 'continuous' },
        color: Colors.accent,
        dimColor: Colors.accentDim,
        hint: 'Double tap to start live object detection with your camera',
        announcement: 'Opening live detection. Point your camera at objects to identify them.',
    },
    {
        id: 'history',
        icon: '📋',
        title: 'History',
        description: 'View past detections',
        screen: 'History',
        color: Colors.success,
        dimColor: Colors.successDim,
        hint: 'Double tap to view your detection history',
        announcement: 'Opening detection history.',
    },
    {
        id: 'tutorial',
        icon: '📖',
        title: 'Tutorial',
        description: 'Learn how to use Smart Eye',
        screen: 'Tutorial',
        color: Colors.warning,
        dimColor: Colors.warningDim,
        hint: 'Double tap to open the tutorial',
        announcement: 'Opening tutorial. Learn how to use Smart Eye.',
    },
    {
        id: 'settings',
        icon: '⚙️',
        title: 'Settings',
        description: 'Customize your experience',
        screen: 'Settings',
        color: '#b388ff',
        dimColor: 'rgba(179,136,255,0.20)',
        hint: 'Double tap to open settings',
        announcement: 'Opening settings.',
    },
];

const CardItem: React.FC<{
    card: ActionCard;
    onPress: () => void;
}> = ({ card, onPress }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const onPressIn = () =>
        Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
    const onPressOut = () =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();

    return (
        <Animated.View style={[styles.cardWrapper, { transform: [{ scale }] }]}>
            <Pressable
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={styles.card}
                accessible
                accessibilityRole="button"
                accessibilityLabel={card.title}
                accessibilityHint={card.hint}
            >
                {/* Colored accent bar */}
                <View style={[styles.cardAccent, { backgroundColor: card.color }]} />

                {/* Icon circle */}
                <View style={[styles.iconCircle, { backgroundColor: card.dimColor, borderColor: card.color }]}>
                    <Text style={styles.cardIcon}>{card.icon}</Text>
                </View>

                {/* Text */}
                <Text style={[styles.cardTitle, { color: card.color }]}>{card.title}</Text>
                <Text style={styles.cardDesc}>{card.description}</Text>

                {/* Arrow */}
                <Text style={[styles.cardArrow, { color: card.color }]}>›</Text>
            </Pressable>
        </Animated.View>
    );
};

const HomeScreen: React.FC<Props> = ({ navigation, route }) => {
    const user = route.params?.user;
    const firstName = user?.name?.split(' ')[0] || 'there';

    useEffect(() => {
        const t = setTimeout(() => {
            speak(
                `Welcome back, ${firstName}! Smart Eye is ready. ` +
                'You have four options: Start Detection, History, Tutorial, and Settings. ' +
                'Double tap any card to open it.'
            );
        }, 600);
        return () => clearTimeout(t);
    }, []);

    const handleCardPress = (card: ActionCard) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        announceForAccessibility(card.announcement);
        speak(card.announcement);
        navigation.navigate(card.screen as any, card.params);
    };

    return (
        <LinearGradient colors={Colors.gradientPrimary} style={styles.gradient}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Header ── */}
                <View
                    style={styles.header}
                    accessible
                    accessibilityRole="header"
                >
                    {/* Logo row */}
                    <View style={styles.logoRow}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoEmoji}>👁️</Text>
                        </View>
                        <View>
                            <Text style={styles.appName}>Smart Eye</Text>
                            <Text style={styles.appTagline}>AI Visual Assistance</Text>
                        </View>
                    </View>

                    {/* Greeting */}
                    <View style={styles.greetingBox}>
                        <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
                        <Text style={styles.greetingSubtitle}>
                            Ready to identify the world around you?
                        </Text>
                    </View>
                </View>

                {/* ── Status Chip ── */}
                <View
                    style={styles.statusChip}
                    accessible
                    accessibilityLabel="Smart Eye AI model is ready and offline capable"
                >
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>AI Model Ready · Offline</Text>
                </View>

                {/* ── Action Cards ── */}
                <Text
                    style={styles.sectionTitle}
                    accessibilityRole="header"
                >
                    What would you like to do?
                </Text>

                <View style={styles.grid}>
                    {ACTION_CARDS.map(card => (
                        <CardItem
                            key={card.id}
                            card={card}
                            onPress={() => handleCardPress(card)}
                        />
                    ))}
                </View>

                {/* ── Quick Start Banner ── */}
                <Pressable
                    style={styles.quickStart}
                    onPress={() => {
                        speak('Opening live detection in quick mode');
                        navigation.navigate('LiveDetection', { mode: 'instant' });
                    }}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel="Quick Start Detection"
                    accessibilityHint="Double tap for the fastest route to live object detection"
                >
                    <LinearGradient
                        colors={['rgba(0,212,255,0.22)', 'rgba(0,212,255,0.06)']}
                        style={styles.quickStartGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.quickStartIcon}>⚡</Text>
                        <View style={styles.quickStartText}>
                            <Text style={styles.quickStartTitle}>Quick Start</Text>
                            <Text style={styles.quickStartSub}>Instant object detection</Text>
                        </View>
                        <Text style={styles.quickArrow}>›</Text>
                    </LinearGradient>
                </Pressable>

                {/* Footer */}
                <Text style={styles.footer}>Smart Eye · WCAG 2.1 Compliant</Text>
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xxxl,
        paddingBottom: Spacing.xxl,
    },

    // Header
    header: { marginBottom: Spacing.xl },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    logoCircle: {
        width: 52,
        height: 52,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.accentDim,
        borderWidth: 1.5,
        borderColor: Colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoEmoji: { fontSize: 24 },
    appName: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.textPrimary,
        letterSpacing: 0.8,
    },
    appTagline: {
        fontSize: Typography.xs,
        color: Colors.textAccent,
        fontWeight: Typography.medium,
    },

    greetingBox: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    greeting: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    greetingSubtitle: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },

    // Status
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.successDim,
        borderRadius: BorderRadius.full,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.base,
        alignSelf: 'flex-start',
        marginBottom: Spacing.xl,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.success,
    },
    statusText: {
        fontSize: Typography.xs,
        color: Colors.success,
        fontWeight: Typography.semiBold,
    },

    // Cards
    sectionTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.textSecondary,
        marginBottom: Spacing.base,
        letterSpacing: 0.3,
    },
    grid: {
        gap: Spacing.base,
        marginBottom: Spacing.xl,
    },
    cardWrapper: { width: '100%' },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.base,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    cardAccent: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        borderTopLeftRadius: BorderRadius.xl,
        borderBottomLeftRadius: BorderRadius.xl,
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: BorderRadius.full,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.sm,
    },
    cardIcon: { fontSize: 24 },
    cardTitle: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        flex: 1,
    },
    cardDesc: {
        position: 'absolute',
        bottom: Spacing.md,
        left: 88,
        fontSize: Typography.xs,
        color: Colors.textMuted,
    },
    cardArrow: {
        fontSize: 28,
        fontWeight: Typography.light,
        marginLeft: 'auto',
    },

    // Quick start
    quickStart: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.accent,
        marginBottom: Spacing.xxl,
        ...Shadows.md,
    },
    quickStartGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.xl,
        gap: Spacing.base,
    },
    quickStartIcon: { fontSize: 28 },
    quickStartText: { flex: 1 },
    quickStartTitle: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.accent,
    },
    quickStartSub: {
        fontSize: Typography.xs,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    quickArrow: {
        fontSize: 28,
        color: Colors.accent,
        fontWeight: Typography.light,
    },

    footer: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        textAlign: 'center',
    },
});

export default HomeScreen;
