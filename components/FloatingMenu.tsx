import { BorderRadius, Colors, Shadows, Spacing } from '@/constants';
import { FloatingMenuProps, MenuItem } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';

export function FloatingMenu({
    items,
    open = false,
    onToggle,
}: FloatingMenuProps) {
    const [isOpen, setIsOpen] = useState(open);
    const scaleAnim = useMemo(() => new Animated.Value(0), []);
    const rotateAnim = useMemo(() => new Animated.Value(0), []);

    const toggleMenu = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        onToggle?.(newState);

        // Animate scale and rotation in parallel
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: newState ? 1 : 0,
                tension: 200,
                friction: 20,
                useNativeDriver: true,
            }),
            Animated.spring(rotateAnim, {
                toValue: newState ? 1 : 0,
                tension: 200,
                friction: 20,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handleItemPress = (item: MenuItem) => {
        item.onPress();
        // Collapse menu after pressing
        setIsOpen(false);
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 0,
                tension: 200,
                friction: 20,
                useNativeDriver: true,
            }),
            Animated.spring(rotateAnim, {
                toValue: 0,
                tension: 200,
                friction: 20,
                useNativeDriver: true,
            }),
        ]).start();
    };

    // Position items in a radial arc (top-left, top, top-right)
    const positions = [
        { x: 0, y: -120 },      // Top
        { x: -85, y: -85 },     // Top-left
        { x: 85, y: -85 },      // Top-right
    ];

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    return (
        <View style={styles.container} pointerEvents="box-none">
            {/* Radial Menu Items - only render when open */}
            {items.slice(0, 3).map((item, index) => {
                const pos = positions[index];
                return (
                    <Animated.View
                        key={item.id}
                        style={[
                            styles.menuItemContainer,
                            {
                                opacity: scaleAnim,
                                transform: [
                                    {
                                        translateX: scaleAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, pos.x],
                                        })
                                    },
                                    {
                                        translateY: scaleAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, pos.y],
                                        })
                                    },
                                    { scale: scaleAnim },
                                ],
                            },
                        ]}
                        pointerEvents={isOpen ? 'auto' : 'none'}
                    >
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleItemPress(item)}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons
                                name={item.icon as any}
                                size={24}
                                color={Colors.white}
                            />
                        </TouchableOpacity>
                    </Animated.View>
                );
            })}

            {/* Center Floating Button */}
            <Animated.View
                style={[
                    styles.floatingButton,
                    {
                        transform: [
                            { rotate: rotateInterpolate },
                        ],
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.buttonTouchable}
                    onPress={toggleMenu}
                    activeOpacity={1}
                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                    {/* Conditionally render icon based on state */}
                    {!isOpen ? (
                        <MaterialIcons name="add" size={32} color={Colors.white} />
                    ) : (
                        <MaterialIcons name="close" size={32} color={Colors.white} />
                    )}
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Spacing.xs,
        alignSelf: 'center',
        width: 280,
        height: 280,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    floatingButton: {
        width: 72,
        height: 72,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.large,
        zIndex: 999,
        overflow: 'hidden',
    },
    buttonTouchable: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemContainer: {
        position: 'absolute',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItem: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.medium,
    },
});
