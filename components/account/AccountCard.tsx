import { BorderRadius, Colors, Spacing, TextStyles, Typography } from '@/constants';
import { useSyncStatus } from '@/hooks';
import { SyncStatus } from '@/services/sync';
import { ApiUser } from '@/services/api';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AccountCardProps {
    user: ApiUser | null;
    onSignIn: () => void;
    onSyncNow: () => void;
    onSignOut: () => void;
}

function describe(status: SyncStatus): string {
    switch (status.state) {
        case 'syncing':
            return 'Syncing your library…';
        case 'offline':
            return "You're offline. Changes will sync when you're back online.";
        case 'error':
            return "Couldn't sync. Tap Sync now to try again.";
        default:
            return status.lastSyncedAt
                ? `Last synced at ${new Date(status.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Your books will sync shortly.';
    }
}

/** Sign-in prompt when signed out; account email, sync status and actions when signed in. */
export function AccountCard({ user, onSignIn, onSyncNow, onSignOut }: AccountCardProps) {
    const status = useSyncStatus();

    if (!user) {
        return (
            <View style={styles.card}>
                <Text style={styles.title}>Back up your books</Text>
                <Text style={styles.body}>
                    Sign in to keep your library and reading progress on all your devices.
                </Text>
                <TouchableOpacity style={styles.primaryButton} onPress={onSignIn} accessibilityRole="button">
                    <Text style={styles.primaryButtonText}>Sign in</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const syncing = status.state === 'syncing';
    return (
        <View style={styles.card}>
            <View style={styles.row}>
                <MaterialIcons name="account-circle" size={28} color={Colors.primary} />
                <Text style={styles.title} numberOfLines={1}>{user.email}</Text>
            </View>
            <View style={styles.row}>
                {syncing ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                    <MaterialIcons
                        name={status.state === 'idle' ? 'cloud-done' : 'cloud-off'}
                        size={18}
                        color={status.state === 'error' ? Colors.error : Colors.textLight}
                    />
                )}
                <Text style={styles.body}>{describe(status)}</Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity onPress={onSyncNow} disabled={syncing} accessibilityRole="button">
                    <Text style={[styles.link, syncing && styles.disabled]}>Sync now</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onSignOut} accessibilityRole="button">
                    <Text style={styles.link}>Sign out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
        gap: Spacing.md,
        backgroundColor: Colors.lightGray,
        borderRadius: BorderRadius.md,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    title: {
        ...TextStyles.h4,
        flexShrink: 1,
        color: Colors.textDark,
    },
    body: {
        ...TextStyles.bodySmall,
        flexShrink: 1,
        color: Colors.textLight,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    link: {
        ...TextStyles.body,
        color: Colors.primary,
        fontFamily: Typography.fontFamily.semibold,
    },
    disabled: {
        opacity: 0.5,
    },
    primaryButton: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
    },
    primaryButtonText: {
        ...TextStyles.body,
        color: Colors.white,
        fontFamily: Typography.fontFamily.semibold,
    },
});
