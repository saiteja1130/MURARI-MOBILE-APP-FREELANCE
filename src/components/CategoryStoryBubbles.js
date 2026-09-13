import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../utils/theme';
import { useStore } from '../context/StoreContext';

const DEFAULT_MAIN_CATEGORIES = [
  {
    id: 'women',
    name: 'Women',
    slug: 'Women',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=400',
  },
  {
    id: 'kids',
    name: 'Kids',
    slug: 'Kids',
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=400',
  },
  {
    id: 'festive',
    name: 'Festive',
    slug: 'Festive',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=400',
  },
  {
    id: 'jewellery',
    name: 'Jewellery',
    slug: 'Jewellery',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=400',
  },
];

const getMainCategoryImage = (name = '', currentImage) => {
  if (currentImage && typeof currentImage === 'string' && !currentImage.includes('490481651871')) {
    return currentImage;
  }
  const n = (name || '').toLowerCase();
  if (n.includes('women')) return 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=400';
  if (n.includes('kid')) return 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=400';
  if (n.includes('men')) return 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=400';
  if (n.includes('jewel') || n.includes('access')) return 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=400';
  if (n.includes('festive') || n.includes('occasion') || n.includes('bridal') || n.includes('wedding')) {
    return 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=400';
  }
  return currentImage || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=400';
};

export const CategoryStoryBubbles = ({ onSelectCategory, selectedCategory = 'All' }) => {
  const { mainCategories } = useStore();

  // Prioritize active main categories from backend, fallback gracefully to default departments
  const activeMainList = useMemo(() => {
    if (mainCategories && mainCategories.length > 0) {
      const active = mainCategories.filter((m) => m.isActive !== false);
      if (active.length > 0) return active;
    }
    return DEFAULT_MAIN_CATEGORIES;
  }, [mainCategories]);

  // Combine curated main categories with "All" for mobile story bubbles
  const bubbleItems = useMemo(() => {
    return [
      {
        id: 'all',
        name: 'All',
        slug: 'All',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400',
      },
      ...activeMainList.map((m) => ({
        id: m.id || m._id || m.slug || m.name,
        name: m.name,
        slug: m.slug || m.name,
        image: getMainCategoryImage(m.name, m.image),
      })),
    ];
  }, [activeMainList]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {bubbleItems.map((item) => {
          const isActive =
            (item.slug === 'All' && (!selectedCategory || selectedCategory === 'All')) ||
            selectedCategory?.toLowerCase() === item.slug?.toLowerCase() ||
            selectedCategory?.toLowerCase() === item.name?.toLowerCase();

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.bubbleItem}
              activeOpacity={0.8}
              onPress={() => onSelectCategory && onSelectCategory(item.slug)}
            >
              <View
                style={[
                  styles.avatarRing,
                  isActive && styles.avatarRingActive,
                ]}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              </View>
              <Text
                style={[
                  styles.categoryTitle,
                  isActive && styles.categoryTitleActive,
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  bubbleItem: {
    alignItems: 'center',
    width: 72,
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  avatarRingActive: {
    borderColor: colors.gold,
    borderWidth: 2.2,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.surfaceAlt,
  },
  categoryTitle: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  categoryTitleActive: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
});

export default CategoryStoryBubbles;
