/**
 * Smart Eye — Login Screen
 * Entry point for authenticated users. Features:
 *   - Glassmorphism card design on dark navy background
 *   - Full TalkBack / VoiceOver accessibility
 *   - TTS welcome announcement on mount
 *   - expo-speech error/success feedback
 *   - Navigates to Signup, ForgotPassword, and Home
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Colors, Typography, Spacing, BorderRadius } from '../styles/theme';
import { speak, announceError, announceSuccess } from '../utils/speech';
import { announceForAccessibility } from '../utils/accessibility';
import { loadUser, saveUser } from '../utils/storage';
import AccessibleButton from '../components/AccessibleButton';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passFocused, setPassFocused] = useState(false);
    const [error, setError] = useState('');

    const passwordRef = useRef<TextInput>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            speak('Welcome to Smart Eye. Please log in to continue.');
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    const validateInputs = (): boolean => {
        if (!email.trim()) {
            const msg = 'Please enter your email address';
            setError(msg);
            announceError(msg);
            return false;
        }
        if (!email.includes('@')) {
            const msg = 'Please enter a valid email address';
            setError(msg);
            announceError(msg);
            return false;
        }
        if (password.length < 6) {
            const msg = 'Password must be at least 6 characters';
            setError(msg);
            announceError(msg);
            return false;
        }
        return true;
    };

    const handleLogin = async () => {
        setError('');
        if (!validateInputs()) return;
        setLoading(true);
        announceForAccessibility('Logging in, please wait');

        // Simulate authentication (replace with real auth in production)
        await new Promise(res => setTimeout(res, 1200));

        try {
            // Load stored user or create guest session
            const stored = await loadUser();
            const user = stored || { name: 'User', email: email.trim() };
            await saveUser(user);

            announceSuccess('Login successful. Welcome back!');
            setLoading(false);
            navigation.replace('Home', { user });
        } catch (e) {
            setLoading(false);
            const msg = 'Login failed. Please try again.';
            setError(msg);
            announceError(msg);
        }
    };

    return (
        <LinearGradient
            colors={Colors.gradientPrimary}
            style={styles.gradient}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Header ── */}
                    <View
                        style={styles.header}
                        accessible
                        accessibilityRole="header"
                    >
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoIcon}>👁️</Text>
                        </View>
                        <Text style={styles.title}>Smart Eye</Text>
                        <Text style={styles.subtitle}>
                            AI Visual Assistance for Everyone
                        </Text>
                    </View>

                    {/* ── Card ── */}
                    <View style={styles.card}>
                        <Text
                            style={styles.cardTitle}
                            accessibilityRole="header"
                        >
                            Sign In
                        </Text>

                        {/* Error banner */}
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

                        {/* Email */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={[styles.input, emailFocused && styles.inputFocused]}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="you@example.com"
                                placeholderTextColor={Colors.placeholder}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="next"
                                onSubmitEditing={() => passwordRef.current?.focus()}
                                onFocus={() => {
                                    setEmailFocused(true);
                                    speak('Email address field. Enter your email address.');
                                }}
                                onBlur={() => setEmailFocused(false)}
                                accessible
                                accessibilityLabel="Email address"
                                accessibilityHint="Enter the email address you registered with"
                            />
                        </View>

                        {/* Password */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                ref={passwordRef}
                                style={[styles.input, passFocused && styles.inputFocused]}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="••••••••"
                                placeholderTextColor={Colors.placeholder}
                                secureTextEntry
                                returnKeyType="done"
                                onSubmitEditing={handleLogin}
                                onFocus={() => {
                                    setPassFocused(true);
                                    speak('Password field. Enter your password.');
                                }}
                                onBlur={() => setPassFocused(false)}
                                accessible
                                accessibilityLabel="Password"
                                accessibilityHint="Enter your account password"
                            />
                        </View>

                        {/* Forgot Password */}
                        <Pressable
                            onPress={() => navigation.navigate('ForgotPassword')}
                            style={styles.forgotLink}
                            accessible
                            accessibilityRole="link"
                            accessibilityLabel="Forgot password"
                            accessibilityHint="Navigate to password reset screen"
                        >
                            <Text style={styles.forgotText}>Forgot Password?</Text>
                        </Pressable>

                        {/* Login Button */}
                        {loading ? (
                            <ActivityIndicator
                                size="large"
                                color={Colors.accent}
                                style={styles.loader}
                                accessible
                                accessibilityLabel="Logging in, please wait"
                            />
                        ) : (
                            <AccessibleButton
                                label="Sign In"
                                onPress={handleLogin}
                                variant="primary"
                                size="lg"
                                hint="Double tap to sign in"
                                announceOnPress="Signing in"
                                style={styles.loginBtn}
                            />
                        )}

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>New to Smart Eye?</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Signup Link */}
                        <AccessibleButton
                            label="Create Account"
                            onPress={() => navigation.navigate('Signup')}
                            variant="ghost"
                            size="lg"
                            hint="Double tap to create a new account"
                        />
                    </View>

                    {/* Footer */}
                    <Text style={styles.footer}>
                        Smart Eye • AI Visual Assistance
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    keyboardView: { flex: 1 },
    scroll: {
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.section,
        paddingBottom: Spacing.xxl,
    },

    // Header
    header: { alignItems: 'center', marginBottom: Spacing.xxxl },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.accentDim,
        borderWidth: 2,
        borderColor: Colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.base,
    },
    logoIcon: { fontSize: 36 },
    title: {
        fontSize: Typography.xxl,
        fontWeight: Typography.extraBold,
        color: Colors.textPrimary,
        letterSpacing: 1.2,
    },
    subtitle: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
        textAlign: 'center',
    },

    // Card
    card: {
        width: '100%',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xxl,
        padding: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        marginBottom: Spacing.xl,
    },
    cardTitle: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xl,
        textAlign: 'center',
    },

    // Error
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

    // Fields
    fieldGroup: { marginBottom: Spacing.base },
    label: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        fontWeight: Typography.medium,
        letterSpacing: 0.3,
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
    },
    inputFocused: {
        borderColor: Colors.inputFocusBorder,
        backgroundColor: 'rgba(0, 212, 255, 0.06)',
    },

    // Forgot
    forgotLink: {
        alignSelf: 'flex-end',
        marginBottom: Spacing.xl,
        marginTop: -Spacing.sm,
    },
    forgotText: {
        fontSize: Typography.sm,
        color: Colors.accent,
        fontWeight: Typography.medium,
    },

    loginBtn: { width: '100%', marginBottom: Spacing.xl },
    loader: { marginVertical: Spacing.xl },

    // Divider
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xl,
        gap: Spacing.sm,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.divider,
    },
    dividerText: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        fontWeight: Typography.medium,
    },

    footer: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        textAlign: 'center',
    },
});

export default LoginScreen;
