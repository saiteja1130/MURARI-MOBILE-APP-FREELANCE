import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Heart, Plus, Star } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing, radius, shadows } from '../utils/theme';
import { useStore } from '../context/StoreContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.md * 2 - spacing.sm) / 2;

export const ProductCard = ({ product, style }) => {
  const navigation = useNavigation();
  const { isWishlisted, toggleWishlist, addToCart } = useStore();

  if (!product) return null;

  const prodId = product.id || product._id;
  const saved = isWishlisted(prodId);
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const handleCardPress = () => {
    navigation.navigate('ProductDetail', { product, id: prodId });
  };

  const handleWishlistPress = (e) => {
    toggleWishlist(product);
  };

  const handleQuickAdd = () => {
    addToCart(product, product.sizes?.[0] || 'Standard', product.colors?.[0] || { name: 'Standard', hex: '#1D241C' }, 1);
  };

  return (
    <TouchableOpacity
      style={[styles.card, { width: CARD_WIDTH }, style]}
      activeOpacity={0.9}
      onPress={handleCardPress}
    >
      {/* Product Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image || product.galleryImages?.[0] }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Top Badges: Discount or Custom Badge */}
        <View style={styles.badgesRow}>
          {discountPercent ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            </View>
          ) : product.badge ? (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{product.badge}</Text>
            </View>
          ) : null}
        </View>

        {/* Wishlist Heart Button */}
        <TouchableOpacity
          style={styles.wishlistBtn}
          activeOpacity={0.8}
          onPress={handleWishlistPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Heart
            size={18}
            color={saved ? colors.danger : colors.primary}
            fill={saved ? colors.danger : 'transparent'}
          />
        </TouchableOpacity>

        {/* Quick Add To Bag Button */}
        {product.isStockAvailable !== false && (
          <TouchableOpacity
            style={styles.quickAddBtn}
            activeOpacity={0.85}
            onPress={handleQuickAdd}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Plus size={16} color={colors.surface} />
          </TouchableOpacity>
        )}

        {/* Out of Stock Overlay */}
        {product.isStockAvailable === false && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
          </View>
        )}
      </View>

      {/* Product Details */}
      <View style={styles.infoContainer}>
        {/* Category & Rating Row */}
        <View style={styles.metaRow}>
          <Text style={styles.category} numberOfLines={1}>
            {product.category || product.mainCategory || 'Fashion'}
          </Text>

          {product.rating ? (
            <View style={styles.ratingBadge}>
              <Star size={10} color={colors.gold} fill={colors.gold} />
              <Text style={styles.ratingText}>{Number(product.rating).toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        {/* Product Title */}
        <Text style={styles.title} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text style={styles.currentPrice}>₹{product.price?.toLocaleString('en-IN')}</Text>
          {product.originalPrice && product.originalPrice > product.price && (
            <Text style={styles.originalPrice}>
              ₹{product.originalPrice?.toLocaleString('en-IN')}
            </Text>
          )}
        </View>
        
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.32,
    position: 'relative',
    backgroundColor: colors.surfaceAlt,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgesRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
    flexDirection: 'column',
    gap: 4,
  },
  discountBadge: {
    backgroundColor: colors.danger,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  discountText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.surface,
    letterSpacing: 0.5,
  },
  statusBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  statusText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.goldLight,
    letterSpacing: 0.5,
  },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    ...shadows.sm,
  },
  quickAddBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    ...shadows.sm,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(29, 36, 28, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  outOfStockText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.surface,
    letterSpacing: 1,
  },
  infoContainer: {
    padding: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  category: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.goldHover,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.background,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  ratingText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textPrimary,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 4,
  },
  currentPrice: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
  },
  originalPrice: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  swatchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moreColorsText: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: colors.textMuted,
    marginLeft: 2,
  },
});

export default ProductCard;
