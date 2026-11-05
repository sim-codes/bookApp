import { BorderRadius, Colors, Shadows, Spacing, TextStyles } from '@/constants';
import { BookCardProps } from '@/types';
import { toTitleCase } from '@/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Image, PanResponder, StyleSheet, Text, View } from 'react-native';
import { GeneratedCover } from './GeneratedCover';

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
    const [pan] = useState(() => new Animated.ValueXY());

    // The PanResponder is created once, so it reads the latest swipe callbacks
    // from a ref instead of capturing the ones from the first render.
    const swipeCallbacks = useRef({ onSwipeRight, onSwipeLeft, onSwipeUp });
    useEffect(() => {
        swipeCallbacks.current = { onSwipeRight, onSwipeLeft, onSwipeUp };
    });

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

    const panResponder = useMemo(() => {
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
                const callbacks = swipeCallbacks.current;
                if (direction === 'right') callbacks.onSwipeRight?.();
                else if (direction === 'left') callbacks.onSwipeLeft?.();
                else if (direction === 'up') callbacks.onSwipeUp?.();
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

        // The ref is only read inside the gesture callbacks (after render), never
        // during render, so the "ref read during render" warning is a false positive.
        // eslint-disable-next-line react-hooks/refs
        return PanResponder.create({
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
        });
    }, [pan]);

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
            {/* Cover fills the card; a generated cover already shows the title and author */}
            {coverUri ? (
                <Image source={{ uri: coverUri }} style={styles.cover} resizeMode="cover" />
            ) : (
                <GeneratedCover title={title} author={author} />
            )}

            {progress > 0 && (
                <View style={styles.progressBadge}>
                    <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                </View>
            )}

            <View style={styles.overlay}>
                {coverUri && (
                    <>
                        <Text style={styles.title} numberOfLines={2}>
                            {toTitleCase(title)}
                        </Text>
                        <Text style={styles.author} numberOfLines={1}>
                            {toTitleCase(author)}
                        </Text>
                    </>
                )}
                <Text style={styles.hint}>← Swipe right to read →</Text>
            </View>

            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
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
    cover: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.md + 4,
        gap: Spacing.xs,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
    title: {
        ...TextStyles.h4,
        color: Colors.white,
    },
    author: {
        ...TextStyles.bodySmall,
        color: 'rgba(255, 255, 255, 0.85)',
    },
    progressBarContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 4,
    },
    progressBar: {
        height: '100%',
        backgroundColor: Colors.primary,
    },
    hint: {
        ...TextStyles.caption,
        color: 'rgba(255, 255, 255, 0.75)',
        textAlign: 'center',
        marginTop: Spacing.xs,
    },
});
