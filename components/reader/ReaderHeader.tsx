import { Colors, Spacing, TextStyles } from '@/constants';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ReaderHeaderProps {
    title: string;
    currentPage: number;
    totalPages: number;
    epubCurrentPosition?: number;
    epubTotalPositions?: number;
    fileType: 'txt' | 'pdf' | 'epub';
    onBackPress: () => void;
}

export function ReaderHeader({
    title,
    currentPage,
    totalPages,
    epubCurrentPosition,
    epubTotalPositions,
    fileType,
    onBackPress,
}: ReaderHeaderProps) {
    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={onBackPress}>
                <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {title}
                </Text>
                <Text style={styles.headerSubtitle}>
                    {fileType === 'pdf' ? 'PDF' : 'Page'} {currentPage} of {totalPages}
                    {fileType === 'epub' ? 'pdf' : fileType === 'pdf' ? 'PDF' : 'Page'}{' '}
                    {fileType === 'epub'
                        ? `${epubCurrentPosition} of ${epubTotalPositions}`
                        : fileType === 'pdf'
                        ? `${currentPage} of ${totalPages}`
                        : `${currentPage} of ${totalPages}`
                    }
                </Text>
            </View>
            <View style={{ width: 24 }} />
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGray,
    },
    headerContent: {
        flex: 1,
        alignItems: 'center',
        gap: Spacing.xs,
    },
    headerTitle: {
        ...TextStyles.h4,
        color: Colors.textDark,
    },
    headerSubtitle: {
        ...TextStyles.caption,
        color: Colors.textLight,
    },
});
