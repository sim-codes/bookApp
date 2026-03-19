import { BorderRadius, Colors, Shadows, Spacing, TextStyles } from '@/constants';
import { BookCardProps } from '@/types';
import { toTitleCase } from '@/utils';
import { useRef } from 'react';
import { Animated, Image, PanResponder, StyleSheet, Text, View } from 'react-native';

export function BookCard({
    title,
    author,
    coverUri,
    progress = 0,
    rotation = 0,
    onSwipeRight,
    onSwipeLeft,
    onSwipeUp,
    style,
}: BookCardProps) {
    const pan = useRef(new Animated.ValueXY()).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: Animated.event(
                [
                    null,
                    {
                        dx: pan.x,
                        dy: pan.y,
                    },
                ],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (_, gestureState) => {
                const { dx, dy } = gestureState;

                // Threshold for swipe
                const threshold = 80;

                if (dy < -threshold) {
                    // Swipe up
                    onSwipeUp?.();
                } else if (dx > threshold) {
                    // Swipe right
                    onSwipeRight?.();
                } else if (dx < -threshold) {
                    // Swipe left
                    onSwipeLeft?.();
                }

                // Reset position
                Animated.spring(pan, {
                    toValue: { x: 0, y: 0 },
                    useNativeDriver: false,
                }).start();
            },
        })
    ).current;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                        { rotate: `${rotation}deg` },
                    ],
                },
                style,
            ]}
            {...panResponder.panHandlers}
        >
            {/* Cover Image */}
            <View style={styles.coverContainer}>
                {coverUri ? (
                    <Image
                        source={{ uri: coverUri }}
                        style={styles.cover}
                        resizeMode="cover"
                    />
                ) : (
                    <Image
                        source={require('@/assets/images/default-cover.jpg')}
                        style={styles.cover}
                        resizeMode="cover"
                    />
                )}

                {/* Progress Badge */}
                {progress > 0 && (
                    <View style={styles.progressBadge}>
                        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                    </View>
                )}
            </View>

            {/* Book Info */}
            <View style={styles.infoContainer}>
                <Text style={styles.title} numberOfLines={2}>
                    {toTitleCase(title)}
                </Text>
                <Text style={styles.author} numberOfLines={1}>
                    {toTitleCase(author)}
                </Text>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                    <View
                        style={[
                            styles.progressBar,
                            { width: `${Math.max(progress, 5)}%` },
                        ]}
                    />
                </View>
            </View>

            {/* Swipe Hint */}
            <Text style={styles.hint}>← Swipe right to read →</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        aspectRatio: 0.65,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        ...Shadows.large,
    },
    coverContainer: {
        flex: 1,
        position: 'relative',
    },
    cover: {
        width: '100%',
        height: '100%',
    },
    progressBadge: {
        position: 'absolute',
        top: Spacing.lg,
        right: Spacing.lg,
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
    },
    progressText: {
        ...TextStyles.bodySmall,
        color: Colors.white,
        fontWeight: '600',
    },
    infoContainer: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
        gap: Spacing.md,
    },
    title: {
        ...TextStyles.h4,
        color: Colors.textDark,
    },
    author: {
        ...TextStyles.bodySmall,
        color: Colors.textLight,
    },
    progressBarContainer: {
        height: 4,
        backgroundColor: Colors.mediumGray,
        borderRadius: BorderRadius.xs,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: Colors.primary,
    },
    hint: {
        ...TextStyles.caption,
        color: Colors.darkGray,
        textAlign: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
    },
});
