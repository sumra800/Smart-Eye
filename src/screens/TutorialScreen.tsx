/**
 * Smart Eye — Tutorial Screen
 * 5-slide onboarding walkthrough with:
 *   - Auto-TTS on each slide change
 *   - Swipe navigation (gesture + tap buttons)
 *   - Progress indicator dots
 *   - Skip and Finish actions
 *   - Full TalkBack accessibility
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Dimensions,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Colors, Typography, Spacing, BorderRadius } from '../styles/theme';
import { speak, stopSpeech } from '../utils/speech';
import { announceForAccessibility } from '../utils/accessibility';
import { markOnboarded } from '../utils/storage';
import * as Haptics from 'expo-haptics';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Tutorial'>;
};

const { width: SCREEN_W } = Dimensions.get('window');

interface Slide {
    id: number;
    icon: string;
    title: string;
    text: string;
    ttsText: string;
    tips: string[];
    accentColor: string;
}

const SLIDES: Slide[] = [
    {
        id: 1,
        icon: '👁️',
        title: 'Welcome to Smart Eye',
        text: 'Your AI-powered visual assistant that identifies objects around you — completely offline, no internet needed.',
        ttsText: 'Welcome to Smart Eye. This app uses artificial intelligence to identify objects around you using your camera. Everything runs on your device, with no internet required.',
        tips: ['Works offline', 'Identifies 80+ object types', 'Privacy-first design'],
        accentColor: Colors.accent,
    },
    {
        id: 2,
        icon: '📷',
        title: 'Using the Camera',
        text: 'Open Live Detection from the home screen. Point your camera at any object and Smart Eye will identify it instantly.',
        ttsText: 'To use Smart Eye, tap Start Detection on the home screen. Your camera will open. Point it at any object you want to identify, and the app will tell you what it sees.',
        tips: ['Hold phone steady for best results', 'Good lighting improves accuracy', 'Works with most common objects'],
        accentColor: Colors.success,
    },
    {
        id: 3,
        icon: '🔊',
        title: 'Audio Feedback',
        text: 'Smart Eye speaks detected object names to you in real-time. Adjust speed, pitch, and language in Settings.',
        ttsText: 'Smart Eye will speak the name of every object it detects. You can customize the voice speed, pitch, and language in the Settings screen. The voice will only repeat the same object every few seconds to avoid repetition.',
        tips: ['Adjust voice in Settings', 'Multiple languages supported', 'Repeats filtered to avoid spam'],
        accentColor: Colors.warning,
    },
    {
        id: 4,
        icon: '👆',
        title: 'Gesture Navigation',
        text: 'Smart Eye is designed for touch-free use. Swipe, double-tap, and tap gestures work throughout the app.',
        ttsText: 'Smart Eye supports gesture navigation. Swipe left or right to move between screens. Double tap any button to activate it. In the detection screen, tap anywhere to snap a single detection. All controls work with TalkBack and VoiceOver.',
        tips: ['Double-tap any button to activate', 'Swipe left or right to navigate', 'Compatible with TalkBack and VoiceOver'],
        accentColor: '#b388ff',
    },
    {
        id: 5,
        icon: '⚙️',
        title: 'Customise Your Experience',
        text: 'Go to Settings to change voice speed, language, confidence threshold, and haptic feedback to suit your needs.',
        ttsText: 'Visit the Settings screen to personalise Smart Eye. You can change the speech rate and pitch, choose from multiple languages, set the minimum confidence level for detections, and toggle vibration feedback. Your preferences are saved automatically.',
        tips: ['Speech rate from 0.4 to 1.8 times', '8 language options', 'Confidence threshold adjustable'],
        accentColor: Colors.error,
    },
];

const TutorialScreen: React.FC<Props> = ({ navigation }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const scrollRef = useRef<ScrollView>(null);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const t = setTimeout(() => {
            speak(SLIDES[0].ttsText);
        }, 600);
        return () => {
            stopSpeech();
            clearTimeout(t);
        };
    }, []);

    const goToSlide = (index: number) => {
        if (index < 0 || index >= SLIDES.length) return;

        // Fade out → scroll → fade in
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
        }).start(() => {
            setCurrentSlide(index);
            scrollRef.current?.scrollTo({ x: index * SCREEN_W, animated: false });
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }).start();

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            stopSpeech();
            setTimeout(() => speak(SLIDES[index].ttsText), 300);
            announceForAccessibility(`Slide ${index + 1} of ${SLIDES.length}: ${SLIDES[index].title}`);
        });
    };

    const handleNext = () => {
        if (currentSlide < SLIDES.length - 1) {
            goToSlide(currentSlide + 1);
        } else {
            handleFinish();
        }
    };

    const handleBack = () => {
        if (currentSlide > 0) goToSlide(currentSlide - 1);
    };

    const handleSkip = async () => {
        stopSpeech();
        speak('Tutorial skipped. You can access it again from the home screen any time.');
        await markOnboarded();
        navigation.replace('Home', {});
    };

    const handleFinish = async () => {
        stopSpeech();
        speak('Tutorial complete! You are ready to use Smart Eye. Enjoy!');
        await markOnboarded();
        setTimeout(() => navigation.replace('Home', {}), 1800);
    };

    const slide = SLIDES[currentSlide];
    const isLast = currentSlide === SLIDES.length - 1;

    return (
        <LinearGradient colors={Colors.gradientPrimary} style={styles.gradient}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerSpacer} />
                <Text style={styles.headerStep}>
                    {currentSlide + 1} / {SLIDES.length}
                </Text>
                <Pressable
                    onPress={handleSkip}
                    style={styles.skipBtn}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel="Skip tutorial"
                    accessibilityHint="Double tap to skip the tutorial and go to the home screen"
                >
                    <Text style={styles.skipText}>Skip</Text>
                </Pressable>
            </View>

            {/* Progress dots */}
            <View
                style={styles.dots}
                accessible
                accessibilityLabel={`Step ${currentSlide + 1} of ${SLIDES.length}`}
            >
                {SLIDES.map((_, i) => (
                    <Pressable
                        key={i}
                        onPress={() => goToSlide(i)}
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel={`Go to slide ${i + 1}: ${SLIDES[i].title}`}
                        accessibilityState={{ selected: i === currentSlide }}
                    >
                        <Animated.View
                            style={[
                                styles.dot,
                                i === currentSlide && styles.dotActive,
                                i === currentSlide && { backgroundColor: slide.accentColor },
                            ]}
                        />
                    </Pressable>
                ))}
            </View>

            {/* Slide content */}
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {/* Icon */}
                <View
                    style={[
                        styles.iconCircle,
                        { backgroundColor: `${slide.accentColor}22`, borderColor: slide.accentColor },
                    ]}
                >
                    <Text style={styles.icon}>{slide.icon}</Text>
                </View>

                {/* Title */}
                <Text
                    style={[styles.title, { color: slide.accentColor }]}
                    accessibilityRole="header"
                >
                    {slide.title}
                </Text>

                {/* Body text */}
                <Text style={styles.body}>{slide.text}</Text>

                {/* Tips */}
                <View
                    style={[styles.tipsCard, { borderColor: `${slide.accentColor}44` }]}
                    accessible
                    accessibilityLabel={`Tips: ${slide.tips.join('. ')}`}
                >
                    {slide.tips.map((tip, i) => (
                        <View key={i} style={styles.tipRow}>
                            <Text style={[styles.tipDot, { color: slide.accentColor }]}>•</Text>
                            <Text style={styles.tipText}>{tip}</Text>
                        </View>
                    ))}
                </View>

                {/* TTS replay */}
                <Pressable
                    style={styles.replayBtn}
                    onPress={() => speak(slide.ttsText)}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel="Replay audio description"
                    accessibilityHint="Double tap to hear this slide's description again"
                >
                    <Text style={[styles.replayText, { color: slide.accentColor }]}>
                        🔊  Replay Audio
                    </Text>
                </Pressable>
            </Animated.View>

            {/* Navigation buttons */}
            <View style={styles.navRow}>
                {/* Back */}
                <Pressable
                    style={[styles.navBtn, styles.navBtnBack, currentSlide === 0 && styles.navBtnDisabled]}
                    onPress={handleBack}
                    disabled={currentSlide === 0}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel="Previous slide"
                    accessibilityHint="Double tap to go to the previous slide"
                    accessibilityState={{ disabled: currentSlide === 0 }}
                >
                    <Text style={[styles.navBtnText, currentSlide === 0 && styles.navBtnTextDisabled]}>
                        ← Back
                    </Text>
                </Pressable>

                {/* Next / Finish */}
                <Pressable
                    style={[styles.navBtn, styles.navBtnNext, { backgroundColor: slide.accentColor }]}
                    onPress={handleNext}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel={isLast ? 'Finish tutorial' : 'Next slide'}
                    accessibilityHint={isLast ? 'Double tap to finish the tutorial and start using Smart Eye' : 'Double tap to go to the next slide'}
                >
                    <Text style={styles.navBtnNextText}>
                        {isLast ? 'Get Started ✓' : 'Next →'}
                    </Text>
                </Pressable>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 52,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.base,
    },
    headerSpacer: { width: 48 },
    headerStep: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        fontWeight: Typography.medium,
    },
    skipBtn: { paddingHorizontal: Spacing.sm },
    skipText: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
        fontWeight: Typography.medium,
    },

    // Dots
    dots: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.surfaceBorder,
    },
    dotActive: {
        width: 24,
    },

    // Content
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.base,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: BorderRadius.full,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    icon: { fontSize: 44 },
    title: {
        fontSize: Typography.xxl,
        fontWeight: Typography.extraBold,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    body: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: Typography.base * Typography.relaxed,
        paddingHorizontal: Spacing.sm,
    },

    // Tips card
    tipsCard: {
        width: '100%',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        borderWidth: 1,
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
    },
    tipDot: {
        fontSize: Typography.lg,
        lineHeight: 22,
        fontWeight: Typography.bold,
    },
    tipText: {
        flex: 1,
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        lineHeight: 20,
    },

    // Replay
    replayBtn: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.base,
    },
    replayText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
    },

    // Navigation
    navRow: {
        flexDirection: 'row',
        gap: Spacing.base,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xxxl,
        paddingTop: Spacing.base,
    },
    navBtn: {
        flex: 1,
        paddingVertical: Spacing.base,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navBtnBack: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        flex: 0.6,
    },
    navBtnNext: {
        flex: 1.2,
    },
    navBtnDisabled: { opacity: 0.35 },
    navBtnText: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.textSecondary,
    },
    navBtnTextDisabled: { color: Colors.textMuted },
    navBtnNextText: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.background,
    },
});

export default TutorialScreen;
