import { BookCard, FloatingMenu, StreakDisplay } from '@/components';
import { BorderRadius, Colors, Spacing, TextStyles } from '@/constants';
import { useBooksStore, useReadingStore } from '@/stores';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { books, loadBooks } = useBooksStore();
  const { stats, loadStats } = useReadingStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const bookList = Object.values(books);
  const currentBook = bookList[currentIndex];

  // Load data on mount
  useEffect(() => {
    const initializeApp = async () => {
      await Promise.all([loadBooks(), loadStats()]);
    };
    initializeApp();
  }, []);

  // Reload data when screen focuses (after returning from reader)
  useFocusEffect(
    useCallback(() => {
      loadBooks();
      loadStats();
    }, [loadBooks, loadStats])
  );

  const handleSwipeRight = () => {
    if (currentBook) {
      router.push(`/reader/${currentBook.id}`);
    }
  };

  const handleSwipeLeft = () => {
    // Skip to next book
    if (currentIndex < bookList.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleSwipeUp = () => {
    handleSwipeLeft();
  };

  const handleMenuClose = () => {
    // Close menu by clicking outside
  };

  const calculateProgress = (book: typeof currentBook) => {
    if (!book?.totalPages || !book?.currentPage) return 0;
    return Math.min((book.currentPage / book.totalPages) * 100, 100);
  };

  const menuItems = useMemo(() => [
    {
      id: 'add-book',
      label: 'Add Book',
      icon: 'add',
      onPress: () => router.push('/add-book'),
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: 'person',
      onPress: () => router.push('/profile'),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      onPress: () => router.push('/settings'),
    },
    {
      id: 'login',
      label: 'Login',
      icon: 'login',
      onPress: () => router.push('/auth/login'),
    },
  ], [router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.backgroundBlobTop} />
      <View style={styles.backgroundBlobBottom} />

      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>Your Reading Adventure</Text>
        <Text style={styles.heroTitle}>Pick Your Next Journey</Text>
        <Text style={styles.heroSubtitle}>Swipe right to dive in • left to skip</Text>
      </View>

      <View style={styles.streakCard}>
        <StreakDisplay streak={stats.currentStreak} lastReadDate={stats.lastReadDate} />
      </View>

      <View style={styles.content}>
        {bookList.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>📚 The shelf is empty</Text>
            <Text style={styles.emptySubtitle}>
              Tap the round button below to add your first book and begin.
            </Text>
          </View>
        ) : (
          <View style={styles.cardStack}>
            {/* Next card (peeking from behind) */}
            {bookList.length > 1 && (
              <BookCard
                title={bookList[(currentIndex + 1) % bookList.length]?.title || 'Unknown'}
                author={bookList[(currentIndex + 1) % bookList.length]?.author || 'Unknown'}
                coverUri={bookList[(currentIndex + 1) % bookList.length]?.coverUri}
                progress={calculateProgress(bookList[(currentIndex + 1) % bookList.length])}
                rotation={-3}
                style={styles.nextCard}
              />
            )}

            {/* Current card */}
            <BookCard
              key={currentBook?.id}
              title={currentBook?.title || 'Unknown'}
              author={currentBook?.author || 'Unknown'}
              coverUri={currentBook?.coverUri}
              progress={calculateProgress(currentBook)}
              rotation={3}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              onSwipeUp={handleSwipeUp}
              style={styles.currentCard}
            />
          </View>
        )}
      </View>

      {bookList.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.counterText}>{currentIndex + 1} of {bookList.length}</Text>
        </View>
      )}

      <FloatingMenu items={menuItems} onToggle={handleMenuClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  backgroundBlobTop: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.yellow,
    top: 20,
    right: -80,
    opacity: 0.6,
  },
  backgroundBlobBottom: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.secondary,
    bottom: 120,
    left: -60,
    opacity: 0.5,
  },
  hero: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  heroEyebrow: {
    ...TextStyles.caption,
    color: Colors.secondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroTitle: {
    ...TextStyles.h2,
    color: Colors.brown,
    fontFamily: 'Modak-Regular',
  },
  heroSubtitle: {
    ...TextStyles.bodySmall,
    color: Colors.textLight,
  },
  streakCard: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.mediumGray,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardStack: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentCard: {
    width: '82%',
    zIndex: 10,
  },
  nextCard: {
    width: '82%',
    position: 'absolute',
    top: 40,
    zIndex: 5,
    opacity: 0.7,
  },
  emptyState: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyTitle: {
    ...TextStyles.h2,
    color: Colors.textDark,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...TextStyles.body,
    color: Colors.textLight,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  counterText: {
    ...TextStyles.caption,
    color: Colors.brown,
    fontWeight: '700',
  },
});
