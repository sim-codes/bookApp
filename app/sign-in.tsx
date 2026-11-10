import { Toast } from '@/components/reader/Toast';
import { BorderRadius, Colors, Spacing, TextStyles, Typography } from '@/constants';
import { useToast } from '@/hooks';
import { errorMessage } from '@/services/api';
import { useAuthStore } from '@/stores';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CODE_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen() {
    const router = useRouter();
    const { requestCode, verifyCode } = useAuthStore();
    const { toast, show } = useToast();

    const [step, setStep] = useState<'email' | 'code'>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);

    const sendCode = async () => {
        if (!EMAIL_PATTERN.test(email.trim())) {
            show('Enter a valid email address', 'error');
            return;
        }
        setBusy(true);
        try {
            await requestCode(email);
            setCode('');
            setStep('code');
            show(`We sent a code to ${email.trim()}`, 'success');
        } catch (error) {
            show(errorMessage(error), 'error');
        } finally {
            setBusy(false);
        }
    };

    const signIn = async () => {
        if (code.trim().length !== CODE_LENGTH) {
            show(`Enter the ${CODE_LENGTH}-digit code from your email`, 'error');
            return;
        }
        setBusy(true);
        try {
            await verifyCode(email, code);
            show("You're signed in. Your library is syncing.", 'success');
            setTimeout(() => router.back(), 1200);
        } catch (error) {
            show(errorMessage(error), 'error');
            setBusy(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Back">
                    <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sign in</Text>
                <View style={styles.headerSpacer} />
            </View>

            <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                {step === 'email' ? (
                    <>
                        <Text style={styles.title}>Back up your library</Text>
                        <Text style={styles.body}>
                            Enter your email and we&apos;ll send you a code. No password needed.
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@example.com"
                            placeholderTextColor={Colors.darkGray}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            textContentType="emailAddress"
                            returnKeyType="send"
                            onSubmitEditing={sendCode}
                            editable={!busy}
                            accessibilityLabel="Email address"
                        />
                        <PrimaryButton label="Send code" busy={busy} onPress={sendCode} />
                    </>
                ) : (
                    <>
                        <Text style={styles.title}>Check your email</Text>
                        <Text style={styles.body}>Enter the {CODE_LENGTH}-digit code we sent to {email.trim()}.</Text>
                        <TextInput
                            style={[styles.input, styles.codeInput]}
                            value={code}
                            onChangeText={text => setCode(text.replace(/\D/g, ''))}
                            placeholder="000000"
                            placeholderTextColor={Colors.mediumGray}
                            keyboardType="number-pad"
                            maxLength={CODE_LENGTH}
                            autoComplete="one-time-code"
                            textContentType="oneTimeCode"
                            returnKeyType="done"
                            onSubmitEditing={signIn}
                            editable={!busy}
                            autoFocus
                            accessibilityLabel="Sign-in code"
                        />
                        <PrimaryButton label="Sign in" busy={busy} onPress={signIn} />
                        <View style={styles.links}>
                            <TouchableOpacity onPress={sendCode} disabled={busy}>
                                <Text style={styles.link}>Send a new code</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setStep('email')} disabled={busy}>
                                <Text style={styles.link}>Use a different email</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </KeyboardAvoidingView>

            <Toast visible={toast.visible} message={toast.message} type={toast.type} />
        </SafeAreaView>
    );
}

function PrimaryButton({ label, busy, onPress }: { label: string; busy: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity
            style={[styles.button, busy && styles.buttonDisabled]}
            onPress={onPress}
            disabled={busy}
            accessibilityRole="button"
        >
            {busy ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.buttonText}>{label}</Text>}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGray,
    },
    headerTitle: {
        ...TextStyles.h3,
        color: Colors.textDark,
    },
    headerSpacer: {
        width: 24,
    },
    content: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    title: {
        ...TextStyles.h3,
        color: Colors.textDark,
    },
    body: {
        ...TextStyles.body,
        color: Colors.textLight,
    },
    input: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.mediumGray,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        fontSize: 16,
        color: Colors.textDark,
    },
    codeInput: {
        fontSize: 24,
        letterSpacing: 8,
        textAlign: 'center',
    },
    button: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.full,
        paddingVertical: Spacing.lg,
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        ...TextStyles.h4,
        color: Colors.white,
    },
    links: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Spacing.sm,
    },
    link: {
        ...TextStyles.body,
        color: Colors.primary,
        fontFamily: Typography.fontFamily.semibold,
    },
});
