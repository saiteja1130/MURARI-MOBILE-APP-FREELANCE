import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { Sparkles, ArrowRight, Flame, ChevronRight } from 'lucide-react-native';
import { colors, fonts, spacing, radius, shadows } from '../utils/theme';
import { useStore } from '../context/StoreContext';
import Header from '../components/Header';
import CategoryStoryBubbles from '../components/CategoryStoryBubbles';
import HeroBannerCarousel from '../components/HeroBannerCarousel';
import ProductCard from '../components/ProductCard';
import TrustBadges from '../components/TrustBadges';

const { width } = Dimensions.get('window');

export const HomeScreen = ({ navigation }) => {
  const {
    products,
    mainCategories,
    categories,
    isLoadingProducts,
    refreshProducts,
    refreshCategories,
    refreshMainCategories,
  } = useStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshProducts(),
      refreshCategories(),
      refreshMainCategories(),
    ]);
    setRefreshing(false);
  };

  // Trending Deals / Flash items (products on sale or with high rating)
  const trendingDeals = useMemo(() => {
    return products
      .filter((p) => p.badge === 'SALE' || (p.originalPrice && p.originalPrice > p.price))
      .slice(0, 6);
  }, [products]);

  // Filtered catalog by category bubble or department
  const displayProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategory && selectedCategory !== 'All') {
      const catLower = selectedCategory.toLowerCase();
      list = list.filter(
        (p) =>
          (p.category || '').toLowerCase() === catLower ||
          (p.categorySlug || '').toLowerCase() === catLower ||
          (p.mainCategory || '').toLowerCase() === catLower ||
          (p.mainCategorySlug || '').toLowerCase() === catLower
      );
    }

    if (selectedDepartment && selectedDepartment !== 'All') {
      const deptLower = selectedDepartment.toLowerCase();
      list = list.filter(
        (p) =>
          (p.mainCategory || '').toLowerCase() === deptLower ||
          (p.mainCategorySlug || '').toLowerCase() === deptLower ||
          (p.category || '').toLowerCase() === deptLower ||
          (p.categorySlug || '').toLowerCase() === deptLower
      );
    }

    return list;
  }, [products, selectedCategory, selectedDepartment]);

  const departments = useMemo(() => {
    if (categories && categories.length > 0) {
      return ['All', ...categories.slice(0, 8).map((c) => c.name)];
    }
    return ['All', 'Sarees', 'Kurtas', 'Lehengas', 'Jewellery', 'Festive Wear'];
  }, [categories]);

  return (
    <View style={styles.container}>
      {/* Dynamic Mobile E-Commerce Header */}
      <Header
        showSearchPill={true}
        showPromoBanner={true}
        searchPlaceholder="Search 500+ handcrafted ethnic styles..."
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
        }
        contentContainerStyle={styles.scrollBody}
      >
        {/* 1. Category Story Bubbles */}
        <CategoryStoryBubbles
          selectedCategory={selectedCategory}
          onSelectCategory={(slug) => {
            setSelectedCategory(slug);
            if (slug !== 'All') {
              navigation.navigate('ShopTab', { selectedCategory: slug });
            }
          }}
        />

        {/* 2. Hero Campaign Banners */}
        <HeroBannerCarousel />

        {/* 3. Flash Sale / Trending Section */}
        {trendingDeals.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <Flame size={18} color={colors.danger} />
                <Text style={styles.sectionTitle}>FLASH SALE &amp; TRENDING</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('ShopTab', { filter: 'sale' })}
                style={styles.seeAllBtn}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <ChevronRight size={14} color={colors.goldHover} />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {trendingDeals.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  style={styles.horizontalCard}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* 4. Curated Department Switcher Pills */}
        <View style={styles.deptContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.deptScroll}
          >
            {departments.map((dept) => (
              <TouchableOpacity
                key={dept}
                style={[
                  styles.deptPill,
                  selectedDepartment === dept && styles.deptPillActive,
                ]}
                onPress={() => setSelectedDepartment(dept)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.deptPillText,
                    selectedDepartment === dept && styles.deptPillTextActive,
                  ]}
                >
                  {dept}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 5. Editorial Spotlight / Lookbook Card */}
        <View style={styles.spotlightContainer}>
          <TouchableOpacity
            style={styles.spotlightCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ShopTab', { selectedCategory: 'Sarees' })}
          >
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200',
              }}
              style={styles.spotlightImage}
              resizeMode="cover"
            />
            <View style={styles.spotlightOverlay} />
            <View style={styles.spotlightContent}>
              <View style={styles.spotlightBadge}>
                <Sparkles size={12} color={colors.gold} />
                <Text style={styles.spotlightBadgeText}>CURATED EDIT</Text>
              </View>
              <Text style={styles.spotlightTitle}>The Heritage Saree Lookbook</Text>
              <Text style={styles.spotlightDesc}>
                Hand-woven weaves, zari borders &amp; pure silken drapes crafted for timeless grace.
              </Text>
              <View style={styles.spotlightCta}>
                <Text style={styles.spotlightCtaText}>Shop The Look</Text>
                <ArrowRight size={14} color={colors.surface} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 6. Main Product Feed (2-Column Grid) */}
        <View style={styles.feedContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory !== 'All' ? `${selectedCategory.toUpperCase()} COLLECTION` : 'CURATED FOR YOU'}
            </Text>
            <Text style={styles.productCount}>{displayProducts.length} items</Text>
          </View>

          <View style={styles.productGrid}>
            {displayProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </View>
        </View>

        {/* 7. Trust & Assurance Badges */}
        <TrustBadges />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollBody: {
    paddingBottom: spacing.xxxl,
  },
  sectionContainer: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.goldHover,
  },
  horizontalScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  horizontalCard: {
    width: width * 0.44,
    marginRight: spacing.sm,
  },
  deptContainer: {
    marginVertical: spacing.md,
  },
  deptScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  deptPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deptPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  deptPillText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  deptPillTextActive: {
    fontFamily: fonts.bold,
    color: colors.surface,
  },
  spotlightContainer: {
    paddingHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  spotlightCard: {
    height: 200,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  spotlightImage: {
    width: '100%',
    height: '100%',
  },
  spotlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(29, 36, 28, 0.55)',
  },
  spotlightContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  spotlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  spotlightBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 1.5,
  },
  spotlightTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.surface,
    marginBottom: 4,
  },
  spotlightDesc: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#E8E4DC',
    marginBottom: spacing.sm,
    lineHeight: 15,
  },
  spotlightCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
  },
  spotlightCtaText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.surface,
    letterSpacing: 0.5,
  },
  feedContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  productCount: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default HomeScreen;
