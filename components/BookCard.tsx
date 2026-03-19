import { BorderRadius, Colors, Shadows, Spacing, TextStyles } from '@/constants';
import { BookCardProps } from '@/types';
import { toTitleCase } from '@/utils';
import { useRef } from 'react';
import { Animated, Dimensions, Image, PanResponder, StyleSheet, Text, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_OUT_DURATION = 250;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const SWIPE_UP_THRESHOLD = 80;

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

    // Dynamic rotation: card tilts as it's dragged left/right
    const dynamicRotation = pan.x.interpolate({
        inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
        outputRange: ['-20deg', `${rotation}deg`, '20deg'],
        extrapolate: 'clamp',
    });

    // Opacity fades slightly as card moves away
    const opacity = pan.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        outputRange: [0.6, 1, 0.6],
        extrapolate: 'clamp',
    });

    const forceSwipe = (direction: 'left' | 'right' | 'up') => {
        let toValue = { x: 0, y: 0 };

        if (direction === 'right') toValue = { x: SCREEN_WIDTH * 1.5, y: 0 };
        else if (direction === 'left') toValue = { x: -SCREEN_WIDTH * 1.5, y: 0 };
        else if (direction === 'up') toValue = { x: 0, y: -SCREEN_WIDTH * 1.5 };

        Animated.timing(pan, {
            toValue,
            duration: SWIPE_OUT_DURATION,
            useNativeDriver: false,
        }).start(() => {
            // Reset position after callback
            pan.setValue({ x: 0, y: 0 });
            if (direction === 'right') onSwipeRight?.();
            else if (direction === 'left') onSwipeLeft?.();
            else if (direction === 'up') onSwipeUp?.();
        });
    };

    const resetPosition = () => {
        Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            tension: 40,
            useNativeDriver: false,
        }).start();
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (_, { dx, dy }) => {
                if (dy < -SWIPE_UP_THRESHOLD) {
                    forceSwipe('up');
                } else if (dx > SWIPE_THRESHOLD) {
                    forceSwipe('right');
                } else if (dx < -SWIPE_THRESHOLD) {
                    forceSwipe('left');
                } else {
                    resetPosition();
                }
            },
        })
    ).current;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity,
                    transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                        { rotate: dynamicRotation },
                    ],
                },
                style,
            ]}
            {...panResponder.panHandlers}
        >
            {/* Cover Image */}
            <View style={styles.coverContainer}>
                {coverUri ? (
                    <Image source={{ uri: coverUri }} style={styles.cover} resizeMode="cover" />
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
