import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Heart, Plus, Minus, Star } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing, radius, shadows } from '../utils/theme';
import { useStore } from '../context/StoreContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.md * 2 - spacing.sm) / 2;

const ProductCardComponent = ({ product, style }) => {
  const navigation = useNavigation();
  const {
    isWishlisted,
    toggleWishlist,
    addToCart,
    getCartItem,
    updateCartQuantity,
    removeCartItem,
  } = useStore();

  const prodId = product?.id || product?._id;
  const saved = prodId ? isWishlisted(prodId) : false;
  const [selectedColor, setSelectedColor] = useState(
    product?.selectedColor || product?.colors?.[0] || { name: 'Standard', hex: '#1D241C' }
  );
  const selectedColorName = selectedColor?.name || (typeof selectedColor === 'string' ? selectedColor : '');
  const cartItem = prodId ? getCartItem(prodId, null, selectedColorName) : null;
  const cartQty = cartItem?.quantity || 0;

  const discountPercent = useMemo(() => {
    if (product?.originalPrice && product.originalPrice > product.price) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }
    return null;
  }, [product?.originalPrice, product?.price]);

  const activeColorImage = useMemo(() => {
    if (!product) return '';
    const colorName = (selectedColor?.name || (typeof selectedColor === 'string' ? selectedColor : '')).trim().toLowerCase();
    if (colorName && Array.isArray(product.colorImages) && product.colorImages.length > 0) {
      const match = product.colorImages.find(
        (ci) => (ci.color || '').trim().toLowerCase() === colorName
      );
      if (match && Array.isArray(match.images) && match.images.length > 0) {
        return match.images[0];
      }
    }
    return product.image || product.galleryImages?.[0] || '';
  }, [selectedColor, product]);

  const handleCardPress = useCallback(() => {
    if (!product) return;
    navigation.navigate('ProductDetail', { product: { ...product, image: activeColorImage, selectedColor }, id: prodId });
  }, [navigation, product, activeColorImage, selectedColor, prodId]);

  const handleWishlistPress = useCallback(() => {
    if (!product) return;
    toggleWishlist({ ...product, image: activeColorImage, selectedColor });
  }, [toggleWishlist, product, activeColorImage, selectedColor]);

  const handleQuickAdd = useCallback(() => {
    if (!product) return;
    addToCart({ ...product, image: activeColorImage }, product.sizes?.[0] || 'Standard', selectedColor, 1);
  }, [addToCart, product, activeColorImage, selectedColor]);

  const handleIncrement = useCallback(() => {
    if (!cartItem) {
      handleQuickAdd();
      return;
    }
    const targetId = cartItem.cartItemId || cartItem.id;
    updateCartQuantity(targetId, cartQty + 1);
  }, [cartItem, handleQuickAdd, updateCartQuantity, cartQty]);

  const handleDecrement = useCallback(() => {
    if (!cartItem) return;
    const targetId = cartItem.cartItemId || cartItem.id;
    if (cartQty > 1) {
      updateCartQuantity(targetId, cartQty - 1);
    } else {
      removeCartItem(targetId);
    }
  }, [cartItem, updateCartQuantity, cartQty, removeCartItem]);

  if (!product) return null;

  return (
    <TouchableOpacity
      style={[styles.card, { width: CARD_WIDTH }, style]}
      activeOpacity={0.9}
      onPress={handleCardPress}
    >
      {/* Product Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: activeColorImage }}
          style={styles.image}
          resizeMode="cover"
          fadeDuration={0}
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

        {/* Quick Add To Bag / Stepper Button */}
        {product.isStockAvailable !== false && (
          cartQty > 0 ? (
            <View style={styles.stepperPill}>
              <TouchableOpacity
                style={styles.stepperBtn}
                activeOpacity={0.7}
                onPress={handleDecrement}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Minus size={13} color={colors.surface} />
              </TouchableOpacity>
              <Text style={styles.stepperQtyText}>{cartQty}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                activeOpacity={0.7}
                onPress={handleIncrement}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Plus size={13} color={colors.surface} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.quickAddBtn}
              activeOpacity={0.85}
              onPress={handleQuickAdd}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Plus size={16} color={colors.surface} />
            </TouchableOpacity>
          )
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

        {/* Color Swatches if multiple colors exist */}
        {product.colors && product.colors.length > 1 && (
          <View style={styles.colorSwatchesRow}>
            {product.colors.slice(0, 4).map((c, cIdx) => {
              const cName = typeof c === 'object' ? c.name : c;
              const cHex = typeof c === 'object' ? c.hex : '#1D241C';
              const isSelected = (selectedColor?.name || selectedColor) === cName;
              return (
                <TouchableOpacity
                  key={cIdx}
                  onPress={() => setSelectedColor(c)}
                  style={[
                    styles.miniColorDot,
                    { backgroundColor: cHex },
                    isSelected && styles.miniColorDotActive,
                  ]}
                  activeOpacity={0.8}
                />
              );
            })}
            {product.colors.length > 4 && (
              <Text style={styles.moreColorsText}>+{product.colors.length - 4}</Text>
            )}
          </View>
        )}
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
  colorSwatchesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  miniColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  miniColorDotActive: {
    borderWidth: 2,
    borderColor: colors.primary,
    transform: [{ scale: 1.25 }],
  },
  moreColorsText: {
    fontSize: 9,
    fontFamily: fonts.medium,
    color: colors.textMuted,
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
  stepperPill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: 3,
    height: 28,
    zIndex: 3,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.goldLight,
  },
  stepperBtn: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperQtyText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.goldLight,
    paddingHorizontal: 4,
    minWidth: 16,
    textAlign: 'center',
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
});

export const ProductCard = memo(ProductCardComponent);
export default ProductCard;
