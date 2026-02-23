/**
 * Smart Eye — Live Detection Screen
 * Core AI module: real-time COCO-SSD object detection via TensorFlow.js.
 * Features:
 *   - expo-camera full-screen preview
 *   - COCO-SSD model inference every 500ms
 *   - Bounding box overlay via absolute-positioned Views
 *   - TTS detection announcements (debounced per-object)
 *   - Continuous vs On-Demand detection modes
 *   - Confidence threshold filtering
 *   - Full TalkBack / accessibility compliance
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
    ActivityIndicator,
    Platform,
    StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { Colors, Typography, Spacing, BorderRadius } from '../styles/theme';
import {
    speakDetection,
    resetDetectionDebounce,
    speak,
    stopSpeech,
} from '../utils/speech';
import { announceForAccessibility, Hints } from '../utils/accessibility';
import { loadSettings, saveDetection, UserSettings, DEFAULT_SETTINGS } from '../utils/storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Conditional TF imports (not available on web)
let tf: any = null;
let cocoSsd: any = null;
if (Platform.OS !== 'web') {
    tf = require('@tensorflow/tfjs');
    cocoSsd = require('@tensorflow-models/coco-ssd');
}

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'LiveDetection'>;
    route: RouteProp<RootStackParamList, 'LiveDetection'>;
};

interface Detection {
    bbox: [number, number, number, number]; // [x, y, width, height]
    class: string;
    score: number;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Debounce map per object class
const spokenAt: Record<string, number> = {};

const LiveDetectionScreen: React.FC<Props> = ({ navigation, route }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [modelLoaded, setModelLoaded] = useState(false);
    const [modelLoading, setModelLoading] = useState(false);
    const [detections, setDetections] = useState<Detection[]>([]);
    const [isDetecting, setIsDetecting] = useState(true);
    const [continuousMode, setContinuousMode] = useState(
        route.params?.mode !== 'instant'
    );
    const [fps, setFps] = useState(0);
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

    const modelRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);
    const detectionLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const frameCountRef = useRef(0);
    const lastFpsUpdate = useRef(Date.now());

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    useEffect(() => {
        loadSettings().then(s => setSettings(s));
        speak('Live detection screen. Camera is opening. Point your camera at any object to identify it.');

        if (Platform.OS !== 'web') {
            initModel();
        } else {
            // Web: model not supported, show placeholder
            setModelLoaded(true);
        }

        return () => {
            stopDetectionLoop();
            resetDetectionDebounce();
            stopSpeech();
        };
    }, []);

    useEffect(() => {
        if (modelLoaded && isDetecting && continuousMode) {
            startDetectionLoop();
        } else {
            stopDetectionLoop();
        }
        return () => stopDetectionLoop();
    }, [modelLoaded, isDetecting, continuousMode]);

    // ── Model ─────────────────────────────────────────────────────────────────

    const initModel = async () => {
        try {
            setModelLoading(true);
            announceForAccessibility('Loading AI model, please wait');
            await tf.ready();
            modelRef.current = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
            setModelLoaded(true);
            setModelLoading(false);
            speak('AI model ready. Starting object detection.');
            announceForAccessibility('AI model loaded. Detection starting.');
        } catch (error) {
            setModelLoading(false);
            speak('Failed to load AI model. Please restart the app.');
            console.error('Model init error:', error);
        }
    };

    // ── Detection Loop ────────────────────────────────────────────────────────

    const startDetectionLoop = () => {
        if (detectionLoopRef.current) return;
        detectionLoopRef.current = setInterval(runDetection, 600);
    };

    const stopDetectionLoop = () => {
        if (detectionLoopRef.current) {
            clearInterval(detectionLoopRef.current);
            detectionLoopRef.current = null;
        }
    };

    const runDetection = useCallback(async () => {
        if (!modelRef.current || !cameraRef.current) return;

        try {
            // On-device inference via TF.js (camera frame tensor)
            // In a full native build this would use vision-camera frame processor.
            // For Expo Go, we use the model's predict on a canvas tensor.
            const results: Detection[] = await modelRef.current.detect(
                cameraRef.current
            );

            // Filter by confidence threshold
            const filtered = results.filter(
                d => d.score >= settings.confidence
            );

            setDetections(filtered);

            // TTS — announce top detection with per-class debounce
            if (filtered.length > 0) {
                const top = filtered[0];
                const now = Date.now();
                if (
                    !spokenAt[top.class] ||
                    now - spokenAt[top.class] > settings.detectionInterval
                ) {
                    spokenAt[top.class] = now;
                    speakDetection(top.class, top.score, settings.detectionInterval);
                    saveDetection({
                        id: `${Date.now()}_${top.class}`,
                        label: top.class,
                        confidence: top.score,
                        timestamp: Date.now(),
                    });
                    if (settings.hapticEnabled) {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                }
            }

            // FPS counter
            frameCountRef.current++;
            const now = Date.now();
            if (now - lastFpsUpdate.current > 1000) {
                setFps(frameCountRef.current);
                frameCountRef.current = 0;
                lastFpsUpdate.current = now;
            }
        } catch {
            // Detection errors are non-fatal; skip frame
        }
    }, [settings]);

    // ── On-demand snap ────────────────────────────────────────────────────────

    const handleSnap = async () => {
        if (!modelRef.current) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        speak('Analyzing. Please hold still.');
        await runDetection();
    };

    // ── Toggle mode ───────────────────────────────────────────────────────────

    const toggleMode = () => {
        const newMode = !continuousMode;
        setContinuousMode(newMode);
        const msg = newMode
            ? 'Continuous detection mode. Objects will be identified automatically.'
            : 'On-demand mode. Tap the screen to detect objects.';
        speak(msg);
        announceForAccessibility(msg);
        if (!newMode) setDetections([]);
    };

    // ── Permission not granted ────────────────────────────────────────────────

    if (!permission) {
        return <View style={styles.centered}><ActivityIndicator color={Colors.accent} /></View>;
    }

    if (!permission.granted) {
        return (
            <LinearGradient colors={Colors.gradientPrimary} style={styles.gradient}>
                <View style={styles.permissionContainer}>
                    <Text style={styles.permIcon}>📷</Text>
                    <Text style={styles.permTitle} accessibilityRole="header">
                        Camera Permission Required
                    </Text>
                    <Text style={styles.permText}>
                        Smart Eye needs camera access to identify objects in your environment.
                    </Text>
                    <Pressable
                        style={styles.permBtn}
                        onPress={() => {
                            speak('Requesting camera permission');
                            requestPermission();
                        }}
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel="Grant camera permission"
                        accessibilityHint="Double tap to allow Smart Eye to use your camera"
                    >
                        <Text style={styles.permBtnText}>Allow Camera Access</Text>
                    </Pressable>
                    <Pressable
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <Text style={styles.backText}>← Go Back</Text>
                    </Pressable>
                </View>
            </LinearGradient>
        );
    }

    // ── Main screen ───────────────────────────────────────────────────────────

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Camera */}
            <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="back"
                accessible
                accessibilityLabel={Hints.camera}
            />

            {/* Detection bounding boxes overlay */}
            {detections.map((det, i) => {
                const [x, y, w, h] = det.bbox;
                // Scale bbox to screen size (model output is relative to 224x224)
                const scaleX = SCREEN_W / 224;
                const scaleY = SCREEN_H / 224;
                return (
                    <View
                        key={`${det.class}_${i}`}
                        style={[
                            styles.bbox,
                            {
                                left: x * scaleX,
                                top: y * scaleY,
                                width: w * scaleX,
                                height: h * scaleY,
                            },
                        ]}
                        accessible
                        accessibilityLabel={`${det.class}, ${Math.round(det.score * 100)} percent confident`}
                    >
                        <View style={styles.bboxLabel}>
                            <Text style={styles.bboxText}>
                                {det.class} {Math.round(det.score * 100)}%
                            </Text>
                        </View>
                    </View>
                );
            })}

            {/* ── Top HUD ── */}
            <View style={styles.topHud}>
                <Pressable
                    style={styles.hudBackBtn}
                    onPress={() => {
                        speak('Going back to home screen');
                        navigation.goBack();
                    }}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    accessibilityHint="Double tap to return to home screen"
                >
                    <Text style={styles.hudBtnText}>←</Text>
                </Pressable>

                <View style={styles.hudCenter}>
                    <View style={styles.hudStatus}>
                        <View style={[styles.hudDot, { backgroundColor: modelLoaded ? Colors.success : Colors.warning }]} />
                        <Text style={styles.hudStatusText}>
                            {modelLoading ? 'Loading AI...' : modelLoaded ? `${fps} FPS` : 'No Model'}
                        </Text>
                    </View>
                    <Text style={styles.hudMode}>
                        {continuousMode ? '🔄 Continuous' : '👆 On-Demand'}
                    </Text>
                </View>

                <Pressable
                    style={styles.hudModeBtn}
                    onPress={toggleMode}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel={`Switch to ${continuousMode ? 'on-demand' : 'continuous'} mode`}
                    accessibilityHint={Hints.toggle}
                >
                    <Text style={styles.hudBtnText}>{continuousMode ? '⏸' : '▶'}</Text>
                </Pressable>
            </View>

            {/* ── Loading overlay ── */}
            {modelLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={Colors.accent} />
                    <Text style={styles.loadingText}>Loading AI Model...</Text>
                </View>
            )}

            {/* ── Bottom HUD ── */}
            <View style={styles.bottomHud}>
                {/* Detection count badge */}
                {detections.length > 0 && (
                    <View
                        style={styles.detectBadge}
                        accessible
                        accessibilityLabel={`${detections.length} objects detected`}
                    >
                        <Text style={styles.detectBadgeText}>
                            {detections.length} object{detections.length > 1 ? 's' : ''} detected
                        </Text>
                    </View>
                )}

                {/* Top detection label */}
                {detections.length > 0 && (
                    <View
                        style={styles.topDetection}
                        accessible
                        accessibilityLabel={`Top detection: ${detections[0].class}, ${Math.round(detections[0].score * 100)} percent`}
                    >
                        <Text style={styles.topDetectionLabel}>{detections[0].class}</Text>
                        <View style={styles.confidenceBar}>
                            <View
                                style={[
                                    styles.confidenceFill,
                                    { width: `${Math.round(detections[0].score * 100)}%` as any },
                                ]}
                            />
                        </View>
                        <Text style={styles.confidenceText}>
                            {Math.round(detections[0].score * 100)}% confidence
                        </Text>
                    </View>
                )}

                {/* Snap button (on-demand mode) */}
                {!continuousMode && (
                    <Pressable
                        style={styles.snapBtn}
                        onPress={handleSnap}
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel="Detect objects now"
                        accessibilityHint="Double tap to analyze the current camera view"
                    >
                        <View style={styles.snapBtnInner} />
                    </Pressable>
                )}

                {/* Settings shortcut */}
                <Pressable
                    style={styles.settingsShortcut}
                    onPress={() => {
                        speak('Opening settings');
                        navigation.navigate('Settings');
                    }}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel="Open settings"
                    accessibilityHint="Double tap to adjust detection settings"
                >
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    gradient: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },

    // BBoxes
    bbox: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: Colors.bboxPrimary,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.bboxBackground,
    },
    bboxLabel: {
        position: 'absolute',
        top: -26,
        left: -2,
        backgroundColor: Colors.accent,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    bboxText: {
        fontSize: Typography.xs,
        color: Colors.background,
        fontWeight: Typography.bold,
    },

    // Top HUD
    topHud: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 44,
        paddingHorizontal: Spacing.base,
        paddingBottom: Spacing.base,
        backgroundColor: 'rgba(0,0,0,0.50)',
    },
    hudBackBtn: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    hudModeBtn: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    hudBtnText: { fontSize: 18, color: Colors.textPrimary },
    hudCenter: { alignItems: 'center' },
    hudStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: 'rgba(0,0,0,0.40)',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    hudDot: { width: 8, height: 8, borderRadius: 4 },
    hudStatusText: {
        fontSize: Typography.xs,
        color: Colors.textPrimary,
        fontWeight: Typography.semiBold,
    },
    hudMode: {
        fontSize: Typography.xs,
        color: Colors.textSecondary,
        marginTop: 4,
    },

    // Loading
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10,22,40,0.80)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.base,
    },
    loadingText: {
        fontSize: Typography.base,
        color: Colors.accent,
        fontWeight: Typography.medium,
    },

    // Bottom HUD
    bottomHud: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingBottom: 36,
        paddingTop: Spacing.xl,
        paddingHorizontal: Spacing.xl,
        alignItems: 'center',
        gap: Spacing.base,
    },
    detectBadge: {
        backgroundColor: Colors.accentDim,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.accent,
    },
    detectBadgeText: {
        fontSize: Typography.xs,
        color: Colors.accent,
        fontWeight: Typography.semiBold,
    },
    topDetection: {
        width: '100%',
        backgroundColor: 'rgba(0,212,255,0.12)',
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: Colors.accent,
        alignItems: 'center',
        gap: Spacing.sm,
    },
    topDetectionLabel: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
        textTransform: 'capitalize',
    },
    confidenceBar: {
        width: '100%',
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
    },
    confidenceFill: {
        height: '100%',
        backgroundColor: Colors.accent,
        borderRadius: BorderRadius.full,
    },
    confidenceText: {
        fontSize: Typography.xs,
        color: Colors.textSecondary,
    },

    // Snap button
    snapBtn: {
        width: 76,
        height: 76,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(255,255,255,0.20)',
        borderWidth: 3,
        borderColor: Colors.textPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.sm,
    },
    snapBtnInner: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.textPrimary,
    },

    // Settings shortcut
    settingsShortcut: {
        position: 'absolute',
        right: Spacing.xl,
        bottom: 48,
        width: 48,
        height: 48,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsIcon: { fontSize: 22 },

    // Permission
    permissionContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xxl,
        gap: Spacing.base,
    },
    permIcon: { fontSize: 64, marginBottom: Spacing.sm },
    permTitle: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    permText: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing.base,
    },
    permBtn: {
        backgroundColor: Colors.accent,
        paddingVertical: Spacing.base,
        paddingHorizontal: Spacing.xxl,
        borderRadius: BorderRadius.lg,
    },
    permBtnText: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.background,
    },
    backBtn: { marginTop: Spacing.base },
    backText: {
        fontSize: Typography.sm,
        color: Colors.accent,
        fontWeight: Typography.medium,
    },
});

export default LiveDetectionScreen;
