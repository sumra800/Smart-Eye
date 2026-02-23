/**
 * Smart Eye — Forgot Password Screen
 * Email-based password reset with TTS confirmation and accessible design.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Colors, Typography, Spacing, BorderRadius } from '../styles/theme';
import { speak, announceError, announceSuccess } from '../utils/speech';
import { announceForAccessibility } from '../utils/accessibility';
import AccessibleButton from '../components/AccessibleButton';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;
};

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [focused, setFocused] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => {
            speak('Forgot Password screen. Enter your email address to receive a reset link.');
        }, 400);
        return () => clearTimeout(t);
    }, []);

    const handleSend = async () => {
        setError('');
        if (!email.trim() || !email.includes('@')) {
            const m = 'Please enter a valid email address';
            setError(m);
            announceError(m);
            return;
        }

        setLoading(true);
        announceForAccessibility('Sending reset link, please wait');
        await new Promise(res => setTimeout(res, 1500));
        setLoading(false);
        setSent(true);
        announceSuccess(`A password reset link has been sent to ${email}. Please check your inbox.`);
    };

    return (
        <LinearGradient colors={Colors.gradientPrimary} style={styles.gradient}>
            <View style={styles.container}>
                {/* Back button */}
                <Pressable
                    style={styles.backBtn}
                    onPress={() => {
                        speak('Going back to login');
                        navigation.goBack();
                    }}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    accessibilityHint="Double tap to return to the login screen"
                >
                    <Text style={styles.backText}>← Back to Login</Text>
                </Pressable>

                {/* Icon */}
                <View style={styles.iconCircle}>
                    <Text style={styles.icon}>🔑</Text>
                </View>

                {/* Title */}
                <Text style={styles.title} accessibilityRole="header">
                    Reset Password
                </Text>
                <Text style={styles.subtitle}>
                    {!sent
                        ? "Enter your email and we'll send a reset link"
                        : 'Check your email for the reset link'}
                </Text>

                {/* Success state */}
                {sent ? (
                    <View
                        style={styles.successCard}
                        accessible
                        accessibilityRole="alert"
                        accessibilityLabel={`Reset link sent to ${email}`}
                    >
                        <Text style={styles.successIcon}>✅</Text>
                        <Text style={styles.successTitle}>Email Sent!</Text>
                        <Text style={styles.successText}>
                            A reset link has been sent to{'\n'}
                            <Text style={styles.emailHighlight}>{email}</Text>
                        </Text>
                        <AccessibleButton
                            label="Back to Login"
                            onPress={() => navigation.navigate('Login')}
                            variant="primary"
                            size="md"
                            hint="Double tap to return to login"
                            style={{ marginTop: Spacing.xl }}
                            announceOnPress="Returning to login screen"
                        />
                    </View>
                ) : (
                    /* Form */
                    <View style={styles.card}>
                        {!!error && (
                            <View
                                style={styles.errorBanner}
                                accessible
                                accessibilityRole="alert"
                                accessibilityLabel={`Error: ${error}`}
                            >
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={[styles.input, focused && styles.inputFocused]}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@example.com"
                            placeholderTextColor={Colors.placeholder}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="done"
                            onSubmitEditing={handleSend}
                            onFocus={() => {
                                setFocused(true);
                                speak('Email address field. Enter the email associated with your account.');
                            }}
                            onBlur={() => setFocused(false)}
                            accessible
                            accessibilityLabel="Email address"
                            accessibilityHint="Enter the email address associated with your Smart Eye account"
                        />

                        {loading ? (
                            <ActivityIndicator
                                size="large"
                                color={Colors.accent}
                                style={styles.loader}
                                accessible
                                accessibilityLabel="Sending reset link, please wait"
                            />
                        ) : (
                            <AccessibleButton
                                label="Send Reset Link"
                                onPress={handleSend}
                                variant="primary"
                                size="lg"
                                hint="Double tap to send a password reset link to your email"
                                style={styles.btn}
                                announceOnPress="Sending password reset link"
                            />
                        )}
                    </View>
                )}
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    container: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xxxl,
        paddingBottom: Spacing.xxl,
    },
    backBtn: {
        alignSelf: 'flex-start',
        marginBottom: Spacing.xl,
    },
    backText: {
        fontSize: Typography.sm,
        color: Colors.accent,
        fontWeight: Typography.medium,
    },
    iconCircle: {
        width: 88,
        height: 88,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.accentDim,
        borderWidth: 2,
        borderColor: Colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    icon: { fontSize: 40 },
    title: {
        fontSize: Typography.xxl,
        fontWeight: Typography.extraBold,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xxl,
        paddingHorizontal: Spacing.base,
        lineHeight: Typography.base * Typography.relaxed,
    },

    // Card / Form
    card: {
        width: '100%',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xxl,
        padding: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    errorBanner: {
        backgroundColor: Colors.errorDim,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.error,
        marginBottom: Spacing.base,
    },
    errorText: {
        color: Colors.error,
        fontSize: Typography.sm,
        textAlign: 'center',
        fontWeight: Typography.medium,
    },
    label: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        fontWeight: Typography.medium,
    },
    input: {
        backgroundColor: Colors.inputBackground,
        borderWidth: 1,
        borderColor: Colors.inputBorder,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
        fontSize: Typography.base,
        color: Colors.textPrimary,
        marginBottom: Spacing.xl,
    },
    inputFocused: {
        borderColor: Colors.inputFocusBorder,
        backgroundColor: 'rgba(0, 212, 255, 0.06)',
    },
    btn: { width: '100%' },
    loader: { marginVertical: Spacing.xl },

    // Success
    successCard: {
        width: '100%',
        backgroundColor: Colors.successDim,
        borderRadius: BorderRadius.xxl,
        padding: Spacing.xxl,
        borderWidth: 1,
        borderColor: Colors.success,
        alignItems: 'center',
    },
    successIcon: { fontSize: 48, marginBottom: Spacing.base },
    successTitle: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        color: Colors.success,
        marginBottom: Spacing.sm,
    },
    successText: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    emailHighlight: {
        color: Colors.textPrimary,
        fontWeight: Typography.semiBold,
    },
});

export default ForgotPasswordScreen;
