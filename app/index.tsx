import { BookCard } from '@/components';
import { DeckActions, LibraryScope, LibraryToggle, ReadingStatChips } from '@/components/home';
import { BorderRadius, Colors, Spacing, TextStyles } from '@/constants';
import { useBooksStore, useFeatureStore, useReadingStore } from '@/stores';
import { bookProgress, sortBooksByActivity } from '@/utils';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { books, loadBooks } = useBooksStore();
  const { stats, loadStats } = useReadingStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const communityLibrary = useFeatureStore(state => state.communityLibrary);
  const [scope, setScope] = useState<LibraryScope>('mine');
  // Most recent activity first, so a newly added or just-read book tops the deck.
  const bookList = useMemo(() => sortBooksByActivity(Object.values(books)), [books]);
  const currentBook = bookList[currentIndex];
  const nextBook = bookList.length > 1 ? bookList[(currentIndex + 1) % bookList.length] : undefined;

  useEffect(() => {
    Promise.all([loadBooks(), loadStats()]);
  }, [loadBooks, loadStats]);

  // Reload data when screen focuses (after returning from reader)
  useFocusEffect(
    useCallback(() => {
      setCurrentIndex(0);
      loadBooks();
      loadStats();
    }, [loadBooks, loadStats])
  );

  const openCurrentBook = () => {
    if (currentBook) router.push(`/reader/${currentBook.id}`);
  };

  const skipToNextBook = () => {
    setCurrentIndex(index => (index < bookList.length - 1 ? index + 1 : 0));
  };

  const showingMine = !communityLibrary || scope === 'mine';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>Spinematch</Text>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => router.push('/profile')}
          accessibilityLabel="Profile and settings"
        >
          <MaterialIcons name="person" size={24} color="#9A3412" />
        </TouchableOpacity>
      </View>

      {communityLibrary && (
        <View style={styles.toggle}>
          <LibraryToggle value={scope} onChange={setScope} />
        </View>
      )}

      {showingMine ? (
        <>
          <View style={styles.chips}>
            <ReadingStatChips streak={stats.currentStreak} totalHours={stats.totalHours} />
          </View>

          <View style={styles.deck}>
            {currentBook ? (
              <View style={styles.cardStack}>
                {nextBook && (
                  <BookCard
                    title={nextBook.title || 'Unknown'}
                    author={nextBook.author || 'Unknown'}
                    coverUri={nextBook.coverUri}
                    progress={bookProgress(nextBook)}
                    style={styles.nextCard}
                  />
                )}
                <BookCard
                  key={currentBook.id}
                  title={currentBook.title || 'Unknown'}
                  author={currentBook.author || 'Unknown'}
                  coverUri={currentBook.coverUri}
                  progress={bookProgress(currentBook)}
                  onSwipeRight={openCurrentBook}
                  onSwipeLeft={skipToNextBook}
                  onSwipeUp={skipToNextBook}
                  style={styles.currentCard}
                />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Your shelf is empty</Text>
                <Text style={styles.emptySubtitle}>Tap Add below to bring in your first book.</Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <DeckActions
              hasBooks={!!currentBook}
              onSkip={skipToNextBook}
              onRead={openCurrentBook}
              onAdd={() => router.push('/add-book')}
            />
          </View>
        </>
      ) : (
        <View style={styles.deck}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nothing shared yet</Text>
            <Text style={styles.emptySubtitle}>Books other readers share will appear here.</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  wordmark: {
    ...TextStyles.h2,
    color: Colors.brown,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: '#FFE3D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggle: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  chips: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  deck: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardStack: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentCard: {
    width: '86%',
    zIndex: 10,
  },
  nextCard: {
    width: '80%',
    position: 'absolute',
    zIndex: 5,
    opacity: 0.45,
    transform: [{ translateY: 14 }],
  },
  emptyState: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyTitle: {
    ...TextStyles.h3,
    color: Colors.textDark,
  },
  emptySubtitle: {
    ...TextStyles.body,
    color: Colors.textLight,
    textAlign: 'center',
  },
  actions: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
});
