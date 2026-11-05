import { Colors, PRIVACY_POLICY_URL, Spacing, TextStyles } from '@/constants';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

export default function PrivacyPolicyScreen() {
    const router = useRouter();
    const [failed, setFailed] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const retry = () => {
        setFailed(false);
        setReloadKey(key => key + 1);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
                <View style={{ width: 24 }} />
            </View>

            {failed ? (
                <View style={styles.message}>
                    <MaterialIcons name="wifi-off" size={48} color={Colors.mediumGray} />
                    <Text style={styles.messageText}>
                        Couldn&apos;t load the privacy policy. Check your connection and try again.
                    </Text>
                    <TouchableOpacity onPress={retry}>
                        <Text style={styles.link}>Try again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <WebView
                    key={reloadKey}
                    source={{ uri: PRIVACY_POLICY_URL }}
                    startInLoadingState
                    renderLoading={() => (
                        <View style={styles.loading}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    )}
                    onError={() => setFailed(true)}
                    onHttpError={() => setFailed(true)}
                    style={styles.webView}
                />
            )}
        </SafeAreaView>
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
    webView: {
        flex: 1,
    },
    loading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.white,
    },
    message: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.xl,
    },
    messageText: {
        ...TextStyles.body,
        color: Colors.textLight,
        textAlign: 'center',
    },
    link: {
        ...TextStyles.body,
        color: Colors.primary,
        fontWeight: '600',
    },
});
