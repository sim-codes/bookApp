export const Colors = {
    // Primary
    primary: '#FF6B35',      // Orange - main accent, CTA, streak
    secondary: '#00BFA5',    // Teal - buttons, progress

    // Neutrals
    white: '#FFFFFF',
    lightGray: '#F9F9F9',
    mediumGray: '#E8E8E8',
    darkGray: '#999999',

    // Text
    textDark: '#1A1A1A',
    textLight: '#666666',

    // Accents
    brown: '#3D2817',        // Book-like brown for text
    yellow: '#FFD93D',       // Achievements/badges
    purple: '#9D4EDD',       // Future features
    red: '#FF4757',          // Warnings/errors

    // Semantic
    success: '#00BFA5',
    warning: '#FFD93D',
    error: '#FF4757',
};

export const Shadows = {
    small: {
        shadowColor: Colors.textDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    medium: {
        shadowColor: Colors.textDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    large: {
        shadowColor: Colors.textDark,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
};
