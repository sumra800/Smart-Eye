/**
 * Smart Eye — Detection History Screen
 * Persistent log of past object detections.
 * Features:
 *   - FlatList of detection records ordered by timestamp
 *   - Swipe-to-delete per item (using long-press for accessibility)
 *   - "Clear All" with TTS confirmation
 *   - TTS on mount announcing count
 *   - Empty state with icon and guidance
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Colors, Typography, Spacing, BorderRadius } from '../styles/theme';
import { speak, announceSuccess } from '../utils/speech';
import { announceForAccessibility, formatDetectionTime } from '../utils/accessibility';
import {
    loadHistory,
    clearHistory,
    deleteHistoryItem,
    DetectionRecord,
} from '../utils/storage';
import * as Haptics from 'expo-haptics';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'History'>;
};

const LABEL_COLORS: Record<string, string> = {
    person: '#00d4ff',
    car: '#ffab00',
    chair: '#7c4dff',
    bottle: '#00e676',
    cell_phone: '#ff5252',
    book: '#ff9100',
    laptop: '#40c4ff',
    cup: '#ea80fc',
    keyboard: '#b2ff59',
    default: '#ffffff',
};

const getLabelColor = (label: string) =>
    LABEL_COLORS[label.toLowerCase().replace(' ', '_')] ?? LABEL_COLORS.default;

const getConfidenceLevel = (score: number): { label: string; color: string } => {
    if (score >= 0.85) return { label: 'Very High', color: Colors.success };
    if (score >= 0.70) return { label: 'High', color: '#69f0ae' };
    if (score >= 0.55) return { label: 'Medium', color: Colors.warning };
    return { label: 'Low', color: Colors.error };
};

const HistoryItem: React.FC<{
    item: DetectionRecord;
    onDelete: (id: string, label: string) => void;
}> = ({ item, onDelete }) => {
    const sc = item.score ?? item.confidence;
    const conf = getConfidenceLevel(sc);
    const color = getLabelColor(item.label);

    return (
        <View
            style={styles.item}
            accessible
            accessibilityLabel={`${item.label}, detected at ${formatDetectionTime(item.timestamp)}, confidence ${Math.round(sc * 100)} percent, ${conf.label}`}
            accessibilityHint="Long press to delete this record"
        >
            {/* Left accent */}
            <View style={[styles.itemAccent, { backgroundColor: color }]} />

            {/* Icon */}
            <View style={[styles.itemIcon, { backgroundColor: `${color}22`, borderColor: color }]}>
                <Text style={styles.itemEmoji}>
                    {getObjectEmoji(item.label)}
                </Text>
            </View>

            {/* Text */}
            <View style={styles.itemBody}>
                <Text style={[styles.itemLabel, { color }]} numberOfLines={1}>
                    {item.label}
                </Text>
                <Text style={styles.itemTime} numberOfLines={1}>
                    {formatDetectionTime(item.timestamp)}
                </Text>
                <View style={styles.confRow}>
                    <View style={[styles.confBadge, { backgroundColor: `${conf.color}22`, borderColor: conf.color }]}>
                        <Text style={[styles.confText, { color: conf.color }]}>
                            {conf.label}
                        </Text>
                    </View>
                    <Text style={styles.confPct}>{Math.round(sc * 100)}%</Text>
                </View>
            </View>

            {/* Delete */}
            <Pressable
                style={styles.deleteBtn}
                onPress={() => onDelete(item.id, item.label)}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Delete ${item.label} detection record`}
                accessibilityHint="Double tap to delete this detection entry"
            >
                <Text style={styles.deleteIcon}>🗑</Text>
            </Pressable>
        </View>
    );
};

const getObjectEmoji = (label: string): string => {
    const map: Record<string, string> = {
        person: '🧑', car: '🚗', dog: '🐶', cat: '🐱', bottle: '🍶',
        chair: '🪑', laptop: '💻', phone: '📱', book: '📚', cup: '☕',
        keyboard: '⌨️', mouse: '🖱', bicycle: '🚲', bus: '🚌', tv: '📺',
    };
    const key = Object.keys(map).find(k => label.toLowerCase().includes(k));
    return key ? map[key] : '📦';
};

const DetectionHistoryScreen: React.FC<Props> = ({ navigation }) => {
    const [history, setHistory] = useState<DetectionRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        const data = await loadHistory();
        setHistory(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (!loading) {
            const t = setTimeout(() => {
                if (history.length === 0) {
                    speak('Detection history is empty. Start detecting objects to build your history.');
                } else {
                    speak(`Detection history. ${history.length} records found. Most recent: ${history[0]?.label}.`);
                }
            }, 500);
            return () => clearTimeout(t);
        }
    }, [loading, history.length]);

    const handleDelete = (id: string, label: string) => {
        Alert.alert(
            'Delete Record',
            `Remove ${label} from your history?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => speak('Cancelled'),
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        await deleteHistoryItem(id);
                        setHistory(prev => prev.filter(r => r.id !== id));
                        speak(`${label} record deleted`);
                        announceForAccessibility(`${label} removed from history`);
                    },
                },
            ]
        );
    };

    const handleClearAll = () => {
        if (history.length === 0) {
            speak('History is already empty');
            return;
        }
        Alert.alert(
            'Clear All History',
            `Delete all ${history.length} detection records? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel', onPress: () => speak('Cancelled') },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        await clearHistory();
                        setHistory([]);
                        announceSuccess('All detection history cleared');
                    },
                },
            ]
        );
    };

    const renderEmpty = () => (
        <View
            style={styles.empty}
            accessible
            accessibilityLabel="No detection history yet"
        >
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No History Yet</Text>
            <Text style={styles.emptyText}>
                Detected objects will appear here. Start detection to begin building your history.
            </Text>
            <Pressable
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('LiveDetection', { mode: 'continuous' })}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Start object detection"
                accessibilityHint="Double tap to open the camera for live detection"
            >
                <Text style={styles.emptyBtnText}>Start Detection</Text>
            </Pressable>
        </View>
    );

    const uniqueObjects = [...new Set(history.map(r => r.label))].length;
    const avgConfidence = history.length > 0
        ? history.reduce((s, r) => s + (r.score ?? r.confidence), 0) / history.length
        : 0;

    return (
        <LinearGradient colors={Colors.gradientPrimary} style={styles.gradient}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    onPress={() => { speak('Going back'); navigation.goBack(); }}
                    style={styles.backBtn}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Text style={styles.backText}>←</Text>
                </Pressable>
                <Text style={styles.headerTitle} accessibilityRole="header">Detection History</Text>
                <Pressable
                    onPress={handleClearAll}
                    style={styles.clearBtn}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel="Clear all history"
                    accessibilityHint="Double tap to delete all detection records"
                >
                    <Text style={styles.clearText}>Clear</Text>
                </Pressable>
            </View>

            {/* Stats bar */}
            {history.length > 0 && (
                <View
                    style={styles.stats}
                    accessible
                    accessibilityLabel={`${history.length} total detections, ${uniqueObjects} unique objects, average confidence ${Math.round(avgConfidence * 100)} percent`}
                >
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{history.length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{uniqueObjects}</Text>
                        <Text style={styles.statLabel}>Unique</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{Math.round(avgConfidence * 100)}%</Text>
                        <Text style={styles.statLabel}>Avg Conf.</Text>
                    </View>
                </View>
            )}

            {/* List */}
            <FlatList
                data={history}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <HistoryItem item={item} onDelete={handleDelete} />
                )}
                contentContainerStyle={styles.list}
                ListEmptyComponent={renderEmpty}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                accessibilityLabel="Detection history list"
            />
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
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    backText: { fontSize: Typography.xl, color: Colors.accent },
    headerTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
    clearBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 4 },
    clearText: { fontSize: Typography.sm, color: Colors.error, fontWeight: Typography.medium },

    // Stats
    stats: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
        paddingVertical: Spacing.base,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.accent },
    statLabel: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
    statDivider: { width: 1, backgroundColor: Colors.divider },

    // List
    list: { padding: Spacing.base, flexGrow: 1 },

    // Item
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        overflow: 'hidden',
        paddingVertical: Spacing.base,
        paddingRight: Spacing.base,
        gap: Spacing.sm,
    },
    itemAccent: {
        width: 4,
        alignSelf: 'stretch',
    },
    itemIcon: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.full,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.sm,
    },
    itemEmoji: { fontSize: 22 },
    itemBody: { flex: 1, gap: 3 },
    itemLabel: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        textTransform: 'capitalize',
    },
    itemTime: { fontSize: Typography.xs, color: Colors.textMuted },
    confRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    confBadge: {
        borderWidth: 1,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
    },
    confText: { fontSize: Typography.xs, fontWeight: Typography.semiBold },
    confPct: { fontSize: Typography.xs, color: Colors.textSecondary },
    deleteBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteIcon: { fontSize: 18 },

    // Empty
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xxl,
        gap: Spacing.base,
        marginTop: Spacing.section,
    },
    emptyIcon: { fontSize: 64 },
    emptyTitle: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
    },
    emptyText: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    emptyBtn: {
        marginTop: Spacing.base,
        backgroundColor: Colors.accent,
        paddingVertical: Spacing.base,
        paddingHorizontal: Spacing.xxl,
        borderRadius: BorderRadius.lg,
    },
    emptyBtnText: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.background,
    },
});

export default DetectionHistoryScreen;
