import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  X,
  RotateCcw,
  LayoutGrid,
  Columns2,
} from 'lucide-react-native';
import { colors, fonts, spacing, radius, shadows } from '../utils/theme';
import { useStore } from '../context/StoreContext';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';

const { width } = Dimensions.get('window');

const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured & Recommended' },
  { id: 'newest', label: 'Newest Arrivals' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
  { id: 'rating', label: 'Highest Rated' },
];

export const ProductsScreen = ({ route, navigation }) => {
  const { products, categories, mainCategories } = useStore();
  const initialCategory = route.params?.selectedCategory || 'All';
  const initialFilter = route.params?.filter;

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSort, setSelectedSort] = useState('featured');
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSingleColumn, setIsSingleColumn] = useState(false);

  // Sync selectedCategory when navigating with route params from Home or Search
  useEffect(() => {
    if (route.params?.selectedCategory) {
      setSelectedCategory(route.params.selectedCategory);
    }
  }, [route.params?.selectedCategory]);

  // Advanced Filter Modal States
  const [maxPrice, setMaxPrice] = useState(15000);
  const [selectedSize, setSelectedSize] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Category List with "All" + Main Categories + Subcategories
  const categoryChips = useMemo(() => {
    const list = ['All'];
    if (mainCategories && mainCategories.length > 0) {
      mainCategories.forEach((m) => {
        const val = m.name || m.slug;
        if (val && !list.includes(val)) list.push(val);
      });
    }
    if (categories && categories.length > 0) {
      categories.forEach((c) => {
        const val = c.name || c.slug;
        if (val && !list.includes(val)) list.push(val);
      });
    }
    return list;
  }, [categories, mainCategories]);

  // Derived filtered & sorted list
  const processedProducts = useMemo(() => {
    let result = [...products];

    // Filter by category (matches category name/slug or mainCategory name/slug)
    if (selectedCategory && selectedCategory !== 'All') {
      const q = selectedCategory.toLowerCase();
      result = result.filter(
        (p) =>
          (p.category || '').toLowerCase() === q ||
          (p.categorySlug || '').toLowerCase() === q ||
          (p.mainCategory || '').toLowerCase() === q ||
          (p.mainCategorySlug || '').toLowerCase() === q
      );
    }

    // Filter by route filter (e.g. sale)
    if (initialFilter === 'sale') {
      result = result.filter(
        (p) => p.badge === 'SALE' || (p.originalPrice && p.originalPrice > p.price)
      );
    }

    // Filter by max price
    if (maxPrice < 15000) {
      result = result.filter((p) => (Number(p.price) || 0) <= maxPrice);
    }

    // Filter by size
    if (selectedSize !== 'All') {
      result = result.filter((p) =>
        (p.sizes || []).some((s) => s.toLowerCase() === selectedSize.toLowerCase())
      );
    }

    // Filter by in stock
    if (inStockOnly) {
      result = result.filter((p) => p.isStockAvailable !== false);
    }

    // Sort
    switch (selectedSort) {
      case 'price_low':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_high':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        break;
    }

    return result;
  }, [products, selectedCategory, initialFilter, maxPrice, selectedSize, inStockOnly, selectedSort]);

  const activeFilterCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (maxPrice < 15000 ? 1 : 0) +
    (selectedSize !== 'All' ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  const resetFilters = () => {
    setSelectedCategory('All');
    setMaxPrice(15000);
    setSelectedSize('All');
    setInStockOnly(false);
    setSelectedSort('featured');
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Header */}
      <Header
        title="Collections"
        showSearchPill={true}
        onFilterPress={() => setIsFilterModalOpen(true)}
        searchPlaceholder="Filter &amp; search catalog..."
      />

      {/* Horizontal Category Pill Bar */}
      <View style={styles.categoryBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categoryChips.map((cat) => {
            const isActive = selectedCategory?.toLowerCase() === cat.toLowerCase();
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isActive && styles.categoryPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Sticky Control Bar: Sort, Filter, and Grid Toggle */}
      <View style={styles.controlBar}>
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => setIsSortModalOpen(true)}
          activeOpacity={0.8}
        >
          <ArrowUpDown size={15} color={colors.primary} />
          <Text style={styles.controlBtnText}>
            Sort
          </Text>
        </TouchableOpacity>

        <View style={styles.controlDivider} />

        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => setIsFilterModalOpen(true)}
          activeOpacity={0.8}
        >
          <SlidersHorizontal size={15} color={colors.primary} />
          <Text style={styles.controlBtnText}>Filter</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.controlDivider} />

        {/* View Layout Toggle (2 Column vs 1 Column) */}
        <TouchableOpacity
          style={styles.iconControlBtn}
          onPress={() => setIsSingleColumn(!isSingleColumn)}
          activeOpacity={0.8}
        >
          {isSingleColumn ? (
            <Columns2 size={18} color={colors.primary} />
          ) : (
            <LayoutGrid size={18} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={processedProducts}
        key={isSingleColumn ? 'single-col' : 'two-col'}
        numColumns={isSingleColumn ? 1 : 2}
        keyExtractor={(item, index) => (item.id || item._id || `product-${index}`).toString()}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            style={
              isSingleColumn
                ? { width: width - spacing.md * 2, marginHorizontal: spacing.md }
                : undefined
            }
          />
        )}
        columnWrapperStyle={!isSingleColumn ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No matching products</Text>
            <Text style={styles.emptySubtitle}>
              We couldn't find any designs with the selected filters.
            </Text>
            <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
              <Text style={styles.resetBtnText}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Sort Bottom Sheet Modal */}
      <Modal
        visible={isSortModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSortModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsSortModalOpen(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Sort Collection By</Text>
              <TouchableOpacity onPress={() => setIsSortModalOpen(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={styles.sortOptionRow}
                onPress={() => {
                  setSelectedSort(opt.id);
                  setIsSortModalOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    selectedSort === opt.id && styles.sortOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {selectedSort === opt.id && (
                  <Check size={18} color={colors.gold} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Advanced Filter Modal */}
      <Modal
        visible={isFilterModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View style={styles.filterModalContainer}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setIsFilterModalOpen(false)}>
                <X size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.filterModalBody}>
              {/* Max Price Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>PRICE RANGE</Text>
                <Text style={styles.filterSectionSubtitle}>Up to ₹{maxPrice.toLocaleString('en-IN')}</Text>
                <View style={styles.pricePillsRow}>
                  {[3000, 5000, 8000, 12000, 15000].map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.filterPill, maxPrice === p && styles.filterPillActive]}
                      onPress={() => setMaxPrice(p)}
                    >
                      <Text style={[styles.filterPillText, maxPrice === p && styles.filterPillTextActive]}>
                        ₹{p.toLocaleString('en-IN')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Size Selector */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>SIZE</Text>
                <View style={styles.pricePillsRow}>
                  {['All', 'XS', 'S', 'M', 'L', 'XL', 'Free Size'].map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.filterPill, selectedSize === s && styles.filterPillActive]}
                      onPress={() => setSelectedSize(s)}
                    >
                      <Text style={[styles.filterPillText, selectedSize === s && styles.filterPillTextActive]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Stock Status */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>AVAILABILITY</Text>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setInStockOnly(!inStockOnly)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, inStockOnly && styles.checkboxActive]}>
                    {inStockOnly && <Check size={14} color={colors.surface} />}
                  </View>
                  <Text style={styles.checkboxLabel}>In Stock items only</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Modal Bottom Actions */}
            <View style={styles.filterModalFooter}>
              <TouchableOpacity style={styles.footerResetBtn} onPress={resetFilters}>
                <Text style={styles.footerResetText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.footerApplyBtn}
                onPress={() => setIsFilterModalOpen(false)}
              >
                <Text style={styles.footerApplyText}>
                  Show {processedProducts.length} Results
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  categoryBar: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  categoryScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryPillText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  categoryPillTextActive: {
    fontFamily: fonts.bold,
    color: colors.surface,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  controlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  controlBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  controlDivider: {
    width: 1,
    height: 18,
    backgroundColor: colors.borderLight,
  },
  iconControlBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  filterBadge: {
    backgroundColor: colors.gold,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.surface,
  },
  countBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  countText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearFiltersText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.danger,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  listContent: {
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  resetBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.full,
  },
  resetBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.surface,
    letterSpacing: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sortOptionText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sortOptionTextActive: {
    fontFamily: fonts.bold,
    color: colors.gold,
  },
  filterModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    height: '75%',
    padding: spacing.lg,
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
  },
  filterModalTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  filterModalBody: {
    flex: 1,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterSectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textPrimary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  filterSectionSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.goldHover,
    marginBottom: spacing.xs,
  },
  pricePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    fontFamily: fonts.bold,
    color: colors.surface,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textPrimary,
  },
  filterModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
  footerResetBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerResetText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  footerApplyBtn: {
    flex: 2,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerApplyText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.surface,
    letterSpacing: 0.5,
  },
});

export default ProductsScreen;
