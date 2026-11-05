import { ConfirmationDialog } from '@/components';
import { Toast } from '@/components/reader/Toast';
import { BorderRadius, Colors, PRIVACY_POLICY_URL, Spacing, TextStyles } from '@/constants';
import { clearAllData } from '@/services';
import { useBooksStore, useReadingStore } from '@/stores';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ComponentProps, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SettingsRowProps {
    icon: ComponentProps<typeof MaterialIcons>['name'];
    label: string;
    value?: string;
    destructive?: boolean;
    onPress?: () => void;
}

function SettingsRow({ icon, label, value, destructive, onPress }: SettingsRowProps) {
    const color = destructive ? Colors.error : Colors.textDark;
    return (
        <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
            <MaterialIcons name={icon} size={22} color={destructive ? Colors.error : Colors.primary} />
            <Text style={[styles.rowLabel, { color }]}>{label}</Text>
            {value ? <Text style={styles.rowValue}>{value}</Text> : null}
            {onPress && !destructive ? <MaterialIcons name="chevron-right" size={22} color={Colors.darkGray} /> : null}
        </TouchableOpacity>
    );
}

export default function SettingsScreen() {
    const router = useRouter();
    const loadBooks = useBooksStore(state => state.loadBooks);
    const loadStats = useReadingStore(state => state.loadStats);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'error' | 'success' | 'info' });

    const appName = Constants.expoConfig?.name ?? 'Spinematch';
    const version = Constants.expoConfig?.version ?? '';

    const showToast = (message: string, type: 'error' | 'success' | 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    const handleDeleteAll = async () => {
        setShowDeleteDialog(false);
        try {
            await clearAllData();
            await Promise.all([loadBooks(), loadStats()]);
            showToast('All books and reading data deleted', 'success');
        } catch {
            showToast('Failed to delete data. Please try again.', 'error');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Your data</Text>
                <View style={styles.card}>
                    <Text style={styles.note}>
                        Your books, covers and reading history are stored only on this device. Uninstalling{' '}
                        {appName} removes them.
                    </Text>
                    <SettingsRow
                        icon="delete-forever"
                        label="Delete all books & data"
                        destructive
                        onPress={() => setShowDeleteDialog(true)}
                    />
                </View>

                <Text style={styles.sectionTitle}>About</Text>
                <View style={styles.card}>
                    <SettingsRow icon="info-outline" label="Version" value={version} />
                    <View style={styles.divider} />
                    <SettingsRow
                        icon="privacy-tip"
                        label="Privacy Policy"
                        onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
                    />
                </View>
            </ScrollView>

            <Toast visible={toast.visible} message={toast.message} type={toast.type} />

            <ConfirmationDialog
                visible={showDeleteDialog}
                title="Delete everything?"
                message="All your books, covers, reading progress and streaks will be permanently removed from this device."
                onCancel={() => setShowDeleteDialog(false)}
                onConfirm={handleDeleteAll}
                confirmText="Delete"
                destructive
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.lightGray,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.mediumGray,
    },
    headerTitle: {
        ...TextStyles.h3,
        color: Colors.textDark,
    },
    content: {
        padding: Spacing.lg,
    },
    sectionTitle: {
        ...TextStyles.bodySmall,
        color: Colors.textLight,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.lg,
    },
    note: {
        ...TextStyles.bodySmall,
        color: Colors.textLight,
        paddingTop: Spacing.md,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.lg,
    },
    rowLabel: {
        ...TextStyles.body,
        flex: 1,
    },
    rowValue: {
        ...TextStyles.body,
        color: Colors.textLight,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.lightGray,
    },
});
