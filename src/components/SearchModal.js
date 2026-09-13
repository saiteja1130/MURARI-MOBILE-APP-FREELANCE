import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X, ArrowRight, Sparkles } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing, radius } from '../utils/theme';
import { useStore } from '../context/StoreContext';
import { navigationRef } from '../navigations/AppNavigator';

const POPULAR_SEARCHES = ['Sarees', 'Kurtis', 'Dresses', 'Lehenga', 'Co-ord Sets', 'Jewellery'];

export const SearchModal = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  let navigation = null;
  try {
    navigation = useNavigation();
  } catch (e) {
    // Rendered outside of navigation context, navigationRef fallback will be used
  }

  const { products, isSearchOpen, closeSearch } = useStore();
  const [query, setQuery] = useState('');

  const isOpen = visible !== undefined ? visible : isSearchOpen;
  const handleClose = onClose || closeSearch;

  const filteredProducts = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      const mainCategory = (p.mainCategory || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      return (
        name.includes(q) ||
        category.includes(q) ||
        mainCategory.includes(q) ||
        desc.includes(q)
      );
    });
  }, [query, products]);

  const handleSelectProduct = (product) => {
    handleClose();
    const prodId = product.id || product._id;
    if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('ProductDetail', { product, id: prodId });
    } else if (navigationRef && navigationRef.isReady()) {
      navigationRef.navigate('ProductDetail', { product, id: prodId });
    }
  };

  const handleChipPress = (term) => {
    setQuery(term);
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      activeOpacity={0.7}
      onPress={() => handleSelectProduct(item)}
    >
      <Image
        source={{ uri: item.image || item.galleryImages?.[0] }}
        style={styles.itemImage}
        resizeMode="cover"
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemCategory}>{item.category || item.mainCategory || 'Fashion'}</Text>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.itemPrice}>₹{item.price?.toLocaleString('en-IN')}</Text>
          {item.originalPrice && item.originalPrice > item.price && (
            <Text style={styles.itemOriginalPrice}>
              ₹{item.originalPrice?.toLocaleString('en-IN')}
            </Text>
          )}
        </View>
      </View>
      <ArrowRight size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={handleClose}
    >
      <SafeAreaView
        style={[
          styles.safeArea,
          Platform.OS === 'android' && {
            paddingTop: Math.max(insets?.top || 0, StatusBar.currentHeight || 0),
          },
        ]}
        edges={['top', 'bottom', 'left', 'right']}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.surface}
          translucent={Platform.OS === 'android'}
        />

        {/* Top Header Bar with Input */}
        <View style={styles.header}>
          <View style={styles.inputContainer}>
            <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search designer wear, sarees, kurtis..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus={true}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery('')}
                style={styles.clearBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity onPress={handleClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Content Area */}
        {query.trim().length === 0 ? (
          <View style={styles.popularSection}>
            <View style={styles.sectionTitleRow}>
              <Sparkles size={16} color={colors.gold} />
              <Text style={styles.sectionTitle}>POPULAR SEARCHES</Text>
            </View>
            <View style={styles.chipsContainer}>
              {POPULAR_SEARCHES.map((term) => (
                <TouchableOpacity
                  key={term}
                  style={styles.chip}
                  onPress={() => handleChipPress(term)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsCountBar}>
              <Text style={styles.resultsCountText}>
                {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'} found for "{query}"
              </Text>
            </View>

            {filteredProducts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No matching collections found</Text>
                <Text style={styles.emptySubtitle}>
                  Try checking your spelling or searching for generic terms like "saree" or "dress"
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => (item.id || item._id || Math.random()).toString()}
                renderItem={renderProductItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  cancelBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  cancelText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  popularSection: {
    padding: spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textPrimary,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsCountBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  resultsCountText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  listContent: {
    paddingVertical: spacing.xs,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemImage: {
    width: 54,
    height: 68,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceAlt,
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemCategory: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  itemName: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  itemPrice: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
  },
  itemOriginalPrice: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  emptyState: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default SearchModal;
