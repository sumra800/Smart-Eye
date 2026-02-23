/**
 * Smart Eye — Settings Screen
 * User preferences: TTS rate/pitch/language, confidence threshold,
 * haptic toggle, detection interval. All persisted via AsyncStorage.
 * Full TalkBack/VoiceOver accessibility with slider hints.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Switch,
    Pressable,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Colors, Typography, Spacing, BorderRadius } from '../styles/theme';
import { speak, configureSpeech } from '../utils/speech';
import { announceForAccessibility } from '../utils/accessibility';
import {
    loadSettings,
    saveSettings,
    UserSettings,
    DEFAULT_SETTINGS,
} from '../utils/storage';
import * as Haptics from 'expo-haptics';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

const LANGUAGES = [
    { code: 'en-US', label: 'English (US)' },
    { code: 'en-GB', label: 'English (UK)' },
    { code: 'ur-PK', label: 'Urdu' },
    { code: 'ar-SA', label: 'Arabic' },
    { code: 'fr-FR', label: 'French' },
    { code: 'es-ES', label: 'Spanish' },
    { code: 'de-DE', label: 'German' },
    { code: 'zh-CN', label: 'Chinese' },
];

const SettingSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View style={sectionStyles.container}>
        <Text style={sectionStyles.title} accessibilityRole="header">{title}</Text>
        <View style={sectionStyles.card}>{children}</View>
    </View>
);

const sectionStyles = StyleSheet.create({
    container: { marginBottom: Spacing.xl },
    title: {
        fontSize: Typography.sm,
        fontWeight: Typography.semiBold,
        color: Colors.textAccent,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        overflow: 'hidden',
    },
});

const SettingRow: React.FC<{ label: string; children: React.ReactNode; description?: string }> = ({
    label,
    description,
    children,
}) => (
    <View style={rowStyles.row}>
        <View style={rowStyles.textGroup}>
            <Text style={rowStyles.label}>{label}</Text>
            {description && <Text style={rowStyles.description}>{description}</Text>}
        </View>
        {children}
    </View>
);

const rowStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.base,
        paddingHorizontal: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    textGroup: { flex: 1, marginRight: Spacing.base },
    label: {
        fontSize: Typography.base,
        color: Colors.textPrimary,
        fontWeight: Typography.medium,
    },
    description: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        marginTop: 2,
    },
});

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        loadSettings().then(s => setSettings(s));
        const t = setTimeout(() => {
            speak('Settings screen. Adjust your Smart Eye experience here.');
        }, 400);
        return () => clearTimeout(t);
    }, []);

    const update = useCallback(
        (key: keyof UserSettings, value: any) => {
            setSettings(prev => ({ ...prev, [key]: value }));
            setSaved(false);
        },
        []
    );

    const handleSave = async () => {
        await saveSettings(settings);
        configureSpeech({
            rate: settings.ttsRate,
            pitch: settings.ttsPitch,
            language: settings.ttsLanguage,
        });
        setSaved(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        speak('Settings saved successfully.');
        announceForAccessibility('Settings saved');
    };

    const handleReset = async () => {
        setSettings(DEFAULT_SETTINGS);
        await saveSettings(DEFAULT_SETTINGS);
        configureSpeech({
            rate: DEFAULT_SETTINGS.ttsRate,
            pitch: DEFAULT_SETTINGS.ttsPitch,
            language: DEFAULT_SETTINGS.ttsLanguage,
        });
        speak('Settings reset to defaults.');
        setSaved(false);
    };

    const testTTS = () => {
        speak('This is how Smart Eye will sound with your current settings.', {
            rate: settings.ttsRate,
            pitch: settings.ttsPitch,
            language: settings.ttsLanguage,
        });
    };

    return (
        <LinearGradient colors={Colors.gradientPrimary} style={styles.gradient}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => {
                        speak('Going back');
                        navigation.goBack();
                    }}
                    style={styles.backBtn}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Text style={styles.backText}>←</Text>
                </Pressable>
                <Text style={styles.headerTitle} accessibilityRole="header">Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Voice & TTS ── */}
                <SettingSection title="Voice & Speech">
                    {/* Rate */}
                    <View style={styles.sliderRow}>
                        <View style={rowStyles.textGroup}>
                            <Text style={rowStyles.label}>Speech Rate</Text>
                            <Text style={rowStyles.description}>
                                {settings.ttsRate.toFixed(1)}×  (slower ↔ faster)
                            </Text>
                        </View>
                        <Slider
                            style={styles.slider}
                            minimumValue={0.4}
                            maximumValue={1.8}
                            step={0.1}
                            value={settings.ttsRate}
                            onValueChange={v => update('ttsRate', parseFloat(v.toFixed(1)))}
                            minimumTrackTintColor={Colors.accent}
                            maximumTrackTintColor={Colors.surfaceBorder}
                            thumbTintColor={Colors.accent}
                            accessible
                            accessibilityLabel="Speech rate slider"
                            accessibilityHint="Swipe up or down to adjust speech rate"
                            accessibilityValue={{
                                min: 0.4,
                                max: 1.8,
                                now: settings.ttsRate,
                                text: `${settings.ttsRate.toFixed(1)} times speed`,
                            }}
                        />
                    </View>

                    {/* Pitch */}
                    <View style={styles.sliderRow}>
                        <View style={rowStyles.textGroup}>
                            <Text style={rowStyles.label}>Speech Pitch</Text>
                            <Text style={rowStyles.description}>
                                {settings.ttsPitch.toFixed(1)}  (lower ↔ higher)
                            </Text>
                        </View>
                        <Slider
                            style={styles.slider}
                            minimumValue={0.5}
                            maximumValue={2.0}
                            step={0.1}
                            value={settings.ttsPitch}
                            onValueChange={v => update('ttsPitch', parseFloat(v.toFixed(1)))}
                            minimumTrackTintColor={Colors.accent}
                            maximumTrackTintColor={Colors.surfaceBorder}
                            thumbTintColor={Colors.accent}
                            accessible
                            accessibilityLabel="Speech pitch slider"
                            accessibilityHint="Swipe up or down to adjust speech pitch"
                            accessibilityValue={{
                                min: 0.5,
                                max: 2.0,
                                now: settings.ttsPitch,
                                text: `Pitch ${settings.ttsPitch.toFixed(1)}`,
                            }}
                        />
                    </View>

                    {/* Test TTS */}
                    <Pressable
                        style={styles.testBtn}
                        onPress={testTTS}
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel="Test speech"
                        accessibilityHint="Double tap to hear a preview with current settings"
                    >
                        <Text style={styles.testBtnText}>🔊  Test Voice</Text>
                    </Pressable>
                </SettingSection>

                {/* ── Language ── */}
                <SettingSection title="Language">
                    {LANGUAGES.map(lang => (
                        <Pressable
                            key={lang.code}
                            style={[
                                styles.langRow,
                                settings.ttsLanguage === lang.code && styles.langRowSelected,
                            ]}
                            onPress={() => {
                                update('ttsLanguage', lang.code);
                                speak(`Language changed to ${lang.label}`, { language: lang.code });
                            }}
                            accessible
                            accessibilityRole="radio"
                            accessibilityLabel={lang.label}
                            accessibilityState={{ checked: settings.ttsLanguage === lang.code }}
                        >
                            <Text style={[
                                styles.langText,
                                settings.ttsLanguage === lang.code && styles.langTextSelected,
                            ]}>
                                {lang.label}
                            </Text>
                            {settings.ttsLanguage === lang.code && (
                                <Text style={styles.langCheck}>✓</Text>
                            )}
                        </Pressable>
                    ))}
                </SettingSection>

                {/* ── Detection ── */}
                <SettingSection title="Detection">
                    {/* Confidence */}
                    <View style={styles.sliderRow}>
                        <View style={rowStyles.textGroup}>
                            <Text style={rowStyles.label}>Confidence Threshold</Text>
                            <Text style={rowStyles.description}>
                                {Math.round(settings.confidence * 100)}%  — minimum to report
                            </Text>
                        </View>
                        <Slider
                            style={styles.slider}
                            minimumValue={0.30}
                            maximumValue={0.90}
                            step={0.05}
                            value={settings.confidence}
                            onValueChange={v => update('confidence', parseFloat(v.toFixed(2)))}
                            minimumTrackTintColor={Colors.accent}
                            maximumTrackTintColor={Colors.surfaceBorder}
                            thumbTintColor={Colors.accent}
                            accessible
                            accessibilityLabel="Confidence threshold slider"
                            accessibilityHint="Swipe up or down to change the minimum confidence for object detection"
                            accessibilityValue={{
                                min: 30,
                                max: 90,
                                now: Math.round(settings.confidence * 100),
                                text: `${Math.round(settings.confidence * 100)} percent`,
                            }}
                        />
                    </View>

                    {/* Announcement Interval */}
                    <View style={styles.sliderRow}>
                        <View style={rowStyles.textGroup}>
                            <Text style={rowStyles.label}>Announcement Interval</Text>
                            <Text style={rowStyles.description}>
                                {(settings.detectionInterval / 1000).toFixed(1)}s between announcements
                            </Text>
                        </View>
                        <Slider
                            style={styles.slider}
                            minimumValue={1000}
                            maximumValue={8000}
                            step={500}
                            value={settings.detectionInterval}
                            onValueChange={v => update('detectionInterval', Math.round(v))}
                            minimumTrackTintColor={Colors.accent}
                            maximumTrackTintColor={Colors.surfaceBorder}
                            thumbTintColor={Colors.accent}
                            accessible
                            accessibilityLabel="Announcement interval slider"
                            accessibilityHint="Swipe up or down to set how often the same object is announced"
                            accessibilityValue={{
                                min: 1,
                                max: 8,
                                now: settings.detectionInterval / 1000,
                                text: `${(settings.detectionInterval / 1000).toFixed(1)} seconds`,
                            }}
                        />
                    </View>

                    {/* Continuous Mode */}
                    <SettingRow label="Continuous Mode" description="Auto-detect while camera is open">
                        <Switch
                            value={settings.continuousMode}
                            onValueChange={v => {
                                update('continuousMode', v);
                                speak(v ? 'Continuous mode enabled' : 'Continuous mode disabled');
                            }}
                            trackColor={{ false: Colors.surfaceBorder, true: Colors.accentDim }}
                            thumbColor={settings.continuousMode ? Colors.accent : Colors.textMuted}
                            accessible
                            accessibilityLabel="Continuous detection mode toggle"
                            accessibilityHint="Double tap to enable or disable automatic continuous detection"
                            accessibilityRole="switch"
                            accessibilityState={{ checked: settings.continuousMode }}
                        />
                    </SettingRow>
                </SettingSection>

                {/* ── Feedback ── */}
                <SettingSection title="Feedback">
                    <SettingRow label="Haptic Feedback" description="Vibrate when objects are detected">
                        <Switch
                            value={settings.hapticEnabled}
                            onValueChange={v => {
                                update('hapticEnabled', v);
                                if (v) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                speak(v ? 'Haptic feedback enabled' : 'Haptic feedback disabled');
                            }}
                            trackColor={{ false: Colors.surfaceBorder, true: Colors.accentDim }}
                            thumbColor={settings.hapticEnabled ? Colors.accent : Colors.textMuted}
                            accessible
                            accessibilityLabel="Haptic feedback toggle"
                            accessibilityHint="Double tap to enable or disable vibration feedback"
                            accessibilityRole="switch"
                            accessibilityState={{ checked: settings.hapticEnabled }}
                        />
                    </SettingRow>
                </SettingSection>

                {/* ── Actions ── */}
                <View style={styles.actions}>
                    <Pressable
                        style={styles.saveBtn}
                        onPress={handleSave}
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel="Save settings"
                        accessibilityHint="Double tap to save all your settings"
                    >
                        <LinearGradient
                            colors={['#00aacc', Colors.accent]}
                            style={styles.saveBtnGrad}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.saveBtnText}>
                                {saved ? '✓ Saved!' : 'Save Settings'}
                            </Text>
                        </LinearGradient>
                    </Pressable>

                    <Pressable
                        style={styles.resetBtn}
                        onPress={handleReset}
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel="Reset to defaults"
                        accessibilityHint="Double tap to reset all settings to their default values"
                    >
                        <Text style={styles.resetBtnText}>Reset to Defaults</Text>
                    </Pressable>
                </View>

                <Text style={styles.version}>Smart Eye v1.0.0 · WCAG 2.1 Compliant</Text>
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 52,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backText: {
        fontSize: Typography.xl,
        color: Colors.accent,
        fontWeight: Typography.light,
    },
    headerTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
    },
    scroll: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.section,
    },

    // Sliders
    sliderRow: {
        paddingVertical: Spacing.base,
        paddingHorizontal: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
        gap: Spacing.sm,
    },
    slider: { width: '100%', height: 40, marginTop: -4 },

    // Language
    langRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.base,
        paddingHorizontal: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    langRowSelected: { backgroundColor: Colors.accentDim },
    langText: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
    },
    langTextSelected: {
        color: Colors.accent,
        fontWeight: Typography.semiBold,
    },
    langCheck: {
        fontSize: Typography.base,
        color: Colors.accent,
        fontWeight: Typography.bold,
    },

    // Test button
    testBtn: {
        padding: Spacing.base,
        alignItems: 'center',
    },
    testBtnText: {
        fontSize: Typography.base,
        color: Colors.accent,
        fontWeight: Typography.semiBold,
    },

    // Actions
    actions: { gap: Spacing.base, marginBottom: Spacing.xl },
    saveBtn: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    saveBtnGrad: {
        paddingVertical: Spacing.base + 2,
        alignItems: 'center',
    },
    saveBtnText: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.background,
    },
    resetBtn: {
        paddingVertical: Spacing.md,
        alignItems: 'center',
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.error,
        backgroundColor: Colors.errorDim,
    },
    resetBtnText: {
        fontSize: Typography.base,
        fontWeight: Typography.medium,
        color: Colors.error,
    },

    version: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        textAlign: 'center',
    },
});

export default SettingsScreen;
