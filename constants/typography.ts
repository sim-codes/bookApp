export const Typography = {
    // Font sizes
    h1: 36,
    h2: 28,
    h3: 24,
    h4: 20,

    body: 16,
    bodySmall: 14,
    caption: 12,
    tiny: 10,

    // Font weights (React Native uses numeric values)
    thin: '100' as const,
    extralight: '200' as const,
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,

    // Font family - optimized for modern look
    fontFamily: {
        regular: 'Poppins-Regular',
        medium: 'Poppins-Regular',
        semibold: 'Poppins-SemiBold',
        bold: 'Modak-Regular',
    },
};

export const TextStyles = {
    h1: {
        fontSize: Typography.h1,
        fontWeight: Typography.bold,
        lineHeight: 42,
        fontFamily: 'Modak-Regular',
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: Typography.h2,
        fontWeight: Typography.bold,
        lineHeight: 34,
        fontFamily: 'Modak-Regular',
        letterSpacing: -0.3,
    },
    h3: {
        fontSize: Typography.h3,
        fontWeight: Typography.bold,
        lineHeight: 30,
        fontFamily: 'Modak-Regular',
        letterSpacing: -0.2,
    },
    h4: {
        fontSize: Typography.h4,
        fontWeight: Typography.semibold,
        lineHeight: 26,
        fontFamily: 'Modak-Regular',
        letterSpacing: -0.1,
    },
    body: {
        fontSize: Typography.body,
        fontWeight: Typography.normal,
        lineHeight: 22,
        fontFamily: 'Poppins-Regular',
    },
    bodySmall: {
        fontSize: Typography.bodySmall,
        fontWeight: Typography.normal,
        lineHeight: 20,
        fontFamily: 'Poppins-Regular',
    },
    caption: {
        fontSize: Typography.caption,
        fontWeight: Typography.normal,
        lineHeight: 16,
        fontFamily: 'Poppins-Regular',
    },
    tiny: {
        fontSize: Typography.tiny,
        fontWeight: Typography.normal,
        lineHeight: 14,
        fontFamily: 'Poppins-Regular',
    },
};
