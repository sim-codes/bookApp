import { Colors, Spacing, Typography } from '@/constants';
import { toTitleCase } from '@/utils';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface CoverTheme {
    background: string;
    text: string;
    accent: string;
}

const THEMES: CoverTheme[] = [
    { background: Colors.brown, text: '#FFF8F0', accent: Colors.primary },
    { background: Colors.primary, text: '#FFF8F0', accent: Colors.brown },
    { background: '#0F4C5C', text: '#FFF8F0', accent: Colors.yellow },
    { background: Colors.secondary, text: '#FFFFFF', accent: Colors.brown },
    { background: Colors.textDark, text: '#FFF8F0', accent: Colors.yellow },
    { background: '#5A2A82', text: '#FFF8F0', accent: Colors.primary },
];

const themeFor = (title: string): CoverTheme => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = (hash * 31 + title.charCodeAt(i)) | 0;
    }
    return THEMES[Math.abs(hash) % THEMES.length];
};

interface GeneratedCoverProps {
    title: string;
    author?: string;
    size?: 'regular' | 'small';
    style?: StyleProp<ViewStyle>;
}

/** A book cover drawn from the title and author, coloured consistently per title. */
export function GeneratedCover({ title, author, size = 'regular', style }: GeneratedCoverProps) {
    const theme = themeFor(title.trim().toLowerCase());
    const small = size === 'small';

    return (
        <View style={[styles.container, { backgroundColor: theme.background }, style]}>
            <View style={[styles.spine, small && styles.spineSmall, { backgroundColor: theme.accent }]} />

            <View style={[styles.body, small && styles.bodySmall]}>
                {!small && <View style={[styles.rule, { backgroundColor: theme.accent }]} />}
                <Text
                    style={[styles.title, small && styles.titleSmall, { color: theme.text }]}
                    numberOfLines={4}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                >
                    {toTitleCase(title) || 'Untitled'}
                </Text>
                {!small && !!author && (
                    <Text style={[styles.author, { color: theme.text }]} numberOfLines={2}>
                        {author.toUpperCase()}
                    </Text>
                )}
            </View>

            <View style={[styles.footer, { backgroundColor: theme.accent }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
    spine: {
        position: 'absolute',
        left: Spacing.lg,
        top: 0,
        bottom: 0,
        width: 3,
        opacity: 0.6,
    },
    body: {
        flex: 1,
        justifyContent: 'center',
        paddingLeft: Spacing.xl + Spacing.md,
        paddingRight: Spacing.xl,
        gap: Spacing.md,
    },
    spineSmall: {
        left: Spacing.xs,
        width: 2,
    },
    bodySmall: {
        paddingLeft: Spacing.md,
        paddingRight: Spacing.xs,
        gap: 0,
    },
    titleSmall: {
        fontSize: 9,
        lineHeight: 11,
    },
    rule: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    title: {
        fontFamily: Typography.fontFamily.semibold,
        fontSize: 30,
        lineHeight: 38,
    },
    author: {
        fontFamily: Typography.fontFamily.regular,
        fontSize: 13,
        letterSpacing: 2,
        opacity: 0.85,
    },
    footer: {
        height: 10,
    },
});
