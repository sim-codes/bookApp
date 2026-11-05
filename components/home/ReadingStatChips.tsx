import { BorderRadius, Colors, Spacing, TextStyles, Typography } from '@/constants';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface ReadingStatChipsProps {
    streak: number;
    totalHours: number;
}

const formatReadingTime = (hours: number): string =>
    hours >= 1 ? `${hours} h read` : `${Math.round(hours * 60)} min read`;

/** Compact reading streak and total reading time shown above the home deck. */
export function ReadingStatChips({ streak, totalHours }: ReadingStatChipsProps) {
    return (
        <View style={styles.row}>
            <View style={styles.chip}>
                <MaterialIcons name="local-fire-department" size={16} color={Colors.primary} />
                <Text style={[styles.text, styles.streakText]}>
                    {streak > 0 ? `${streak}-day streak` : 'Start a streak today'}
                </Text>
            </View>
            {totalHours > 0 && (
                <View style={styles.chip}>
                    <MaterialIcons name="schedule" size={16} color="#00695C" />
                    <Text style={[styles.text, styles.timeText]}>{formatReadingTime(totalHours)}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs + 2,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.white,
    },
    text: {
        ...TextStyles.caption,
        fontFamily: Typography.fontFamily.semibold,
    },
    streakText: {
        color: '#9A3412',
    },
    timeText: {
        color: '#00695C',
    },
});
