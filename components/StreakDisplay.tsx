import { Colors, Spacing, TextStyles } from '@/constants';
import { StreakDisplayProps } from '@/types';
import { formatDateReadable, getTodayDate } from '@/utils';
import { StyleSheet, Text, View } from 'react-native';

export function StreakDisplay({
    streak,
    lastReadDate,
}: StreakDisplayProps) {
    const todayDate = getTodayDate();
    const todayFormatted = formatDateReadable(todayDate);

    // Parse the formatted date: "Thursday 19th, March 2026"
    const parts = todayFormatted.split(' ');
    const dayOfWeek = parts[0]; // "Thursday"
    const dateRest = parts.slice(1).join(' '); // "19th, March 2026"

    return (
        <View style={styles.container}>
            <Text style={styles.flame}>🔥</Text>
            <View style={styles.content}>
                <Text style={styles.number}>{streak}</Text>
                <Text style={styles.label}>Day Streak</Text>
            </View>
            <View style={styles.dateColumn}>
                <Text style={styles.dateDay}>{dayOfWeek}</Text>
                <Text style={styles.dateText}>{dateRest}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.lg,
    },
    flame: {
        fontSize: 40,
    },
    content: {
        flex: 1,
        alignItems: 'flex-start',
    },
    number: {
        ...TextStyles.h2,
        color: Colors.primary,
        fontWeight: '700',
    },
    label: {
        ...TextStyles.bodySmall,
        color: Colors.textLight,
        marginTop: Spacing.xs,
    },
    dateColumn: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    dateDay: {
        ...TextStyles.h4,
        color: Colors.primary,
        fontWeight: '700',
    },
    dateText: {
        ...TextStyles.caption,
        color: Colors.darkGray,
        marginTop: Spacing.xs,
    },
});
