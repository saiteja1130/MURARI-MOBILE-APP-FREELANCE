import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Heart, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react-native';
import { colors, fonts, spacing, radius } from '../utils/theme';
import { useStore } from '../context/StoreContext';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';

const { width } = Dimensions.get('window');

export const WishlistScreen = ({ navigation }) => {
  const { wishlistProducts, clearWishlist, wishlist } = useStore();

  if (!wishlist || wishlist.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="My Wishlist" showBack={false} showSearchPill={false} showWishlistAction={false} />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Heart size={40} color={colors.danger} />
          </View>
          <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Save your favorite ethnic couture and designer pieces here to easily shop later.
          </Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'ShopTab' })}
            activeOpacity={0.85}
          >
            <Text style={styles.exploreBtnText}>Discover Styles</Text>
            <ArrowRight size={16} color={colors.surface} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={`My Wishlist (${wishlist.length})`}
        showBack={false}
        showSearchPill={false}
        showWishlistAction={false}
      />

      <View style={styles.topActionBar}>
        <Text style={styles.countText}>
          {wishlist.length} {wishlist.length === 1 ? 'Design Saved' : 'Designs Saved'}
        </Text>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={clearWishlist}
          activeOpacity={0.7}
        >
          <Trash2 size={13} color={colors.danger} />
          <Text style={styles.clearBtnText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={wishlistProducts}
        numColumns={2}
        keyExtractor={(item, index) => (item.id || item._id || `wishlist-${index}`).toString()}
        renderItem={({ item }) => <ProductCard product={item} />}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  countText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.danger,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  listContent: {
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 18,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: radius.full,
    gap: 8,
  },
  exploreBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.surface,
    letterSpacing: 0.5,
  },
});

export default WishlistScreen;
