import { Colors, Spacing, TextStyles } from '@/constants';
import { WORDNET_LICENSE } from '@/constants/wordnetLicense';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DictionaryCreditsScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Dictionary</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.intro}>
                    Word definitions come from WordNet 3.1, a lexical database of English created at Princeton
                    University, and are stored on your device so they work offline.
                </Text>
                <Text style={styles.license}>{WORDNET_LICENSE}</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGray,
    },
    headerTitle: {
        ...TextStyles.h3,
        color: Colors.textDark,
    },
    content: {
        padding: Spacing.lg,
        gap: Spacing.lg,
    },
    intro: {
        ...TextStyles.body,
        color: Colors.textDark,
    },
    license: {
        ...TextStyles.bodySmall,
        color: Colors.textLight,
    },
});
