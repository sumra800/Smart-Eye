/**
 * Smart Eye — Signup Screen
 * User registration with real-time validation and TTS feedback.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Colors, Typography, Spacing, BorderRadius } from '../styles/theme';
import { speak, announceError, announceSuccess } from '../utils/speech';
import { announceForAccessibility } from '../utils/accessibility';
import { saveUser } from '../utils/storage';
import AccessibleButton from '../components/AccessibleButton';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Signup'>;
};

const SignupScreen: React.FC<Props> = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [focusedField, setFocusedField] = useState('');

    const emailRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const confirmRef = useRef<TextInput>(null);

    useEffect(() => {
        const t = setTimeout(() => {
            speak('Create your Smart Eye account. Fill in your details to get started.');
        }, 500);
        return () => clearTimeout(t);
    }, []);

    const validate = (): boolean => {
        if (!name.trim()) {
            const m = 'Please enter your full name';
            setError(m); announceError(m); return false;
        }
        if (!email.includes('@')) {
            const m = 'Please enter a valid email address';
            setError(m); announceError(m); return false;
        }
        if (password.length < 6) {
            const m = 'Password must be at least 6 characters';
            setError(m); announceError(m); return false;
        }
        if (password !== confirm) {
            const m = 'Passwords do not match';
            setError(m); announceError(m); return false;
        }
        return true;
    };

    const handleSignup = async () => {
        setError('');
        if (!validate()) return;
        setLoading(true);
        announceForAccessibility('Creating your account, please wait');

        await new Promise(res => setTimeout(res, 1200));

        try {
            const user = { name: name.trim(), email: email.trim() };
            await saveUser(user);
            announceSuccess('Account created successfully. Welcome to Smart Eye!');
            setLoading(false);
            navigation.replace('Home', { user });
        } catch {
            setLoading(false);
            const m = 'Failed to create account. Please try again.';
            setError(m);
            announceError(m);
        }
    };

    const renderField = (
        label: string,
        value: string,
        onChange: (t: string) => void,
        opts: {
            ref?: React.RefObject<TextInput>;
            nextRef?: React.RefObject<TextInput>;
            placeholder: string;
            secure?: boolean;
            keyboardType?: any;
            autoCapitalize?: any;
            hint: string;
            fieldKey: string;
        }
    ) => (
        <View style={styles.fieldGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                ref={opts.ref}
                style={[
                    styles.input,
                    focusedField === opts.fieldKey && styles.inputFocused,
                ]}
                value={value}
                onChangeText={onChange}
                placeholder={opts.placeholder}
                placeholderTextColor={Colors.placeholder}
                secureTextEntry={opts.secure}
                keyboardType={opts.keyboardType}
                autoCapitalize={opts.autoCapitalize || 'none'}
                autoCorrect={false}
                returnKeyType={opts.nextRef ? 'next' : 'done'}
                onSubmitEditing={() => opts.nextRef?.current?.focus()}
                onFocus={() => {
                    setFocusedField(opts.fieldKey);
                    speak(`${label} field. ${opts.hint}`);
                }}
                onBlur={() => setFocusedField('')}
                accessible
                accessibilityLabel={label}
                accessibilityHint={opts.hint}
            />
        </View>
    );

    return (
        <LinearGradient colors={Colors.gradientPrimary} style={styles.gradient}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header} accessible accessibilityRole="header">
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoIcon}>👁️</Text>
                        </View>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join Smart Eye today</Text>
                    </View>

                    {/* Card */}
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

                        {renderField('Full Name', name, setName, {
                            nextRef: emailRef,
                            placeholder: 'Your full name',
                            autoCapitalize: 'words',
                            hint: 'Enter your full name',
                            fieldKey: 'name',
                        })}

                        {renderField('Email Address', email, setEmail, {
                            ref: emailRef,
                            nextRef: passwordRef,
                            placeholder: 'you@example.com',
                            keyboardType: 'email-address',
                            hint: 'Enter your email address',
                            fieldKey: 'email',
                        })}

                        {renderField('Password', password, setPassword, {
                            ref: passwordRef,
                            nextRef: confirmRef,
                            placeholder: '••••••••',
                            secure: true,
                            hint: 'Enter a password with at least 6 characters',
                            fieldKey: 'password',
                        })}

                        {renderField('Confirm Password', confirm, setConfirm, {
                            ref: confirmRef,
                            placeholder: '••••••••',
                            secure: true,
                            hint: 'Re-enter your password to confirm',
                            fieldKey: 'confirm',
                        })}

                        {loading ? (
                            <ActivityIndicator
                                size="large"
                                color={Colors.accent}
                                style={styles.loader}
                                accessible
                                accessibilityLabel="Creating account, please wait"
                            />
                        ) : (
                            <AccessibleButton
                                label="Create Account"
                                onPress={handleSignup}
                                variant="primary"
                                size="lg"
                                hint="Double tap to create your account"
                                style={styles.btn}
                            />
                        )}

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Already have an account?</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <AccessibleButton
                            label="Sign In"
                            onPress={() => navigation.navigate('Login')}
                            variant="ghost"
                            size="lg"
                            hint="Double tap to go to the login screen"
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    scroll: {
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xxxl,
        paddingBottom: Spacing.xxl,
    },
    header: { alignItems: 'center', marginBottom: Spacing.xxl },
    logoCircle: {
        width: 72,
        height: 72,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.accentDim,
        borderWidth: 2,
        borderColor: Colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    logoIcon: { fontSize: 32 },
    title: {
        fontSize: Typography.xxl,
        fontWeight: Typography.extraBold,
        color: Colors.textPrimary,
        letterSpacing: 0.8,
    },
    subtitle: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
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
    fieldGroup: { marginBottom: Spacing.base },
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
    },
    inputFocused: {
        borderColor: Colors.inputFocusBorder,
        backgroundColor: 'rgba(0, 212, 255, 0.06)',
    },
    btn: { width: '100%', marginTop: Spacing.sm, marginBottom: Spacing.xl },
    loader: { marginVertical: Spacing.xl },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.base,
        gap: Spacing.sm,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: Colors.divider },
    dividerText: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        fontWeight: Typography.medium,
    },
});

export default SignupScreen;
