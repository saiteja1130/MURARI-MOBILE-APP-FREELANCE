import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Share,
} from 'react-native';
import {
  Heart,
  ShoppingBag,
  Share2,
  Star,
  Truck,
  ShieldCheck,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Ruler,
  Check,
  Zap,
  Minus,
  Plus,
} from 'lucide-react-native';
import { colors, fonts, spacing, radius, shadows } from '../utils/theme';
import { useStore } from '../context/StoreContext';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = width * 1.25;

export const ProductDetailScreen = ({ route, navigation }) => {
  const { product: routeProduct, id } = route.params || {};
  const {
    products,
    addToCart,
    isWishlisted,
    toggleWishlist,
    getCartItem,
    updateCartQuantity,
    removeCartItem,
  } = useStore();

  // Find product from store if only id was passed
  const product = useMemo(() => {
    if (routeProduct) return routeProduct;
    return products.find((p) => (p.id || p._id) === id) || null;
  }, [routeProduct, id, products]);

  // All hooks MUST be declared before any early return (Rules of Hooks)
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColorState, setSelectedColor] = useState(null);
  const [selectedSizeState, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [expandedSection, setExpandedSection] = useState('details');

  if (!product) {
    return (
      <View style={styles.notFoundContainer}>
        <Header showBack={true} showSearchPill={false} title="Product Not Found" />
        <View style={styles.notFoundContent}>
          <Text style={styles.notFoundText}>This garment could not be loaded.</Text>
          <TouchableOpacity
            style={styles.backHomeBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
          >
            <Text style={styles.backHomeText}>Return to Collections</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Derive effective values from product defaults (after guard)
  const selectedColor = selectedColorState || product.colors?.[0] || { name: 'Standard', hex: '#1D241C' };
  const selectedSize = selectedSizeState || product.sizes?.[0] || 'Standard';

  const galleryImages =
    product.galleryImages && product.galleryImages.length > 0
      ? product.galleryImages
      : [product.image];

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const prodId = product.id || product._id;
  const saved = isWishlisted(prodId);
  const matchingCartItem = getCartItem(prodId, selectedSize, selectedColor?.name || selectedColor);
  const inBagQty = matchingCartItem?.quantity || 0;

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const savingsAmount =
    product.originalPrice && product.originalPrice > product.price
      ? product.originalPrice - product.price
      : 0;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Discover ${product.name} on Murari's Glam & Glow: https://murarisglamandglow.com/product/${product.slug || prodId}`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const handleAddToBag = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
  };

  const handleIncrement = () => {
    if (!matchingCartItem) {
      addToCart(product, selectedSize, selectedColor, 1);
      return;
    }
    const targetId = matchingCartItem.cartItemId || matchingCartItem.id;
    updateCartQuantity(targetId, inBagQty + 1);
  };

  const handleDecrement = () => {
    if (!matchingCartItem) return;
    const targetId = matchingCartItem.cartItemId || matchingCartItem.id;
    if (inBagQty > 1) {
      updateCartQuantity(targetId, inBagQty - 1);
    } else {
      removeCartItem(targetId);
    }
  };

  const handleBuyNow = () => {
    if (inBagQty === 0) {
      addToCart(product, selectedSize, selectedColor, quantity);
    }
    navigation.navigate('Checkout');
  };

  // Similar Products
  const similarProducts = useMemo(() => {
    return products
      .filter((p) => (p.id || p._id) !== prodId && (p.category === product.category || p.mainCategory === product.mainCategory))
      .slice(0, 4);
  }, [products, prodId, product.category, product.mainCategory]);

  return (
    <View style={styles.container}>
      {/* Dynamic Header */}
      <Header
        showBack={true}
        showSearchPill={false}
        title={product.name}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Swipeable Image Gallery */}
        <View style={styles.galleryContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImageIndex(idx);
            }}
          >
            {galleryImages.map((imgUri, idx) => (
              <Image
                key={idx}
                source={{ uri: imgUri }}
                style={styles.galleryImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Image Counter Badge (1/4) */}
          <View style={styles.counterPill}>
            <Text style={styles.counterText}>
              {activeImageIndex + 1} / {galleryImages.length}
            </Text>
          </View>

          {/* Share Button on Top Right */}
          <TouchableOpacity
            style={styles.floatingShareBtn}
            onPress={handleShare}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Share2 size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* 2. Product Meta & Pricing */}
        <View style={styles.detailsCard}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryBadge}>
              {product.category || product.mainCategory || 'Haute Couture'}
            </Text>
            {product.rating ? (
              <View style={styles.ratingBadge}>
                <Star size={12} color={colors.gold} fill={colors.gold} />
                <Text style={styles.ratingValue}>{Number(product.rating).toFixed(1)}</Text>
                <Text style={styles.reviewCount}>({product.reviews || 18})</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.productTitle}>{product.name}</Text>
          <Text style={styles.skuText}>SKU: {product.sku || 'MGG-AUT-01'}</Text>

          {/* Pricing Row */}
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>₹{product.price?.toLocaleString('en-IN')}</Text>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <Text style={styles.originalPrice}>
                  ₹{product.originalPrice?.toLocaleString('en-IN')}
                </Text>
                <View style={styles.savingsPill}>
                  <Text style={styles.savingsText}>SAVE ₹{savingsAmount} ({discountPercent}% OFF)</Text>
                </View>
              </>
            )}
          </View>
          <Text style={styles.taxInclusive}>Inclusive of all taxes</Text>

          {/* Stock Urgency Tag */}
          <View style={styles.stockUrgencyRow}>
            <View style={styles.stockDot} />
            <Text style={styles.stockText}>
              {product.isStockAvailable !== false
                ? 'In Stock - Dispatches in 24 hours'
                : 'Currently Out of Stock'}
            </Text>
          </View>

          {/* 3. Color Selection Swatches */}
          {product.colors && product.colors.length > 0 && (
            <View style={styles.optionSection}>
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>COLOR</Text>
                <Text style={styles.selectedOptionValue}>
                  {selectedColor?.name || selectedColor || 'Standard'}
                </Text>
              </View>
              <View style={styles.colorSwatchRow}>
                {product.colors.map((c, idx) => {
                  const isSelected = (selectedColor?.name || selectedColor) === (c.name || c);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.colorSwatchRing,
                        isSelected && styles.colorSwatchRingActive,
                      ]}
                      onPress={() => setSelectedColor(c)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.colorSwatchCircle,
                          { backgroundColor: c.hex || '#1D241C' },
                        ]}
                      >
                        {isSelected && (
                          <Check size={12} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* 4. Size Selector Chips */}
          {product.sizes && product.sizes.length > 0 && (
            <View style={styles.optionSection}>
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>SELECT SIZE</Text>
                <TouchableOpacity style={styles.sizeGuideBtn}>
                  <Ruler size={13} color={colors.goldHover} />
                  <Text style={styles.sizeGuideText}>Size Guide</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.sizesRow}>
                {product.sizes.map((s) => {
                  const isSelected = selectedSize === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.sizePill, isSelected && styles.sizePillActive]}
                      onPress={() => setSelectedSize(s)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.sizePillText, isSelected && styles.sizePillTextActive]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

        

          {/* 5. Quantity Selector Section */}
          <View style={styles.optionSection}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionTitle}>SELECT QUANTITY</Text>
              {inBagQty > 0 && (
                <View style={styles.inBagBadge}>
                  <Check size={12} color={colors.success} />
                  <Text style={styles.inBagBadgeText}>{inBagQty} IN BAG</Text>
                </View>
              )}
            </View>
            <View style={styles.quantityPickerRow}>
              <TouchableOpacity
                style={[
                  styles.qtyPickerBtn,
                  (inBagQty > 0 ? inBagQty <= 1 : quantity <= 1) && styles.qtyPickerBtnDisabled,
                ]}
                onPress={() => {
                  if (inBagQty > 0) {
                    handleDecrement();
                  } else {
                    setQuantity((prev) => Math.max(1, prev - 1));
                  }
                }}
                activeOpacity={0.7}
              >
                <Minus size={16} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.qtyDisplayBox}>
                <Text style={styles.qtyDisplayText}>
                  {inBagQty > 0 ? inBagQty : quantity}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.qtyPickerBtn}
                onPress={() => {
                  if (inBagQty > 0) {
                    handleIncrement();
                  } else {
                    setQuantity((prev) => prev + 1);
                  }
                }}
                activeOpacity={0.7}
              >
                <Plus size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 6. Expandable Accordions */}
          <View style={styles.accordionsWrapper}>
            {/* Description */}
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => toggleSection('details')}
              activeOpacity={0.8}
            >
              <Text style={styles.accordionTitle}>Product Description</Text>
              {expandedSection === 'details' ? (
                <ChevronUp size={18} color={colors.textPrimary} />
              ) : (
                <ChevronDown size={18} color={colors.textPrimary} />
              )}
            </TouchableOpacity>
            {expandedSection === 'details' && (
              <View style={styles.accordionBody}>
                <Text style={styles.accordionText}>
                  {product.description ||
                    'Immerse in the luxury of pure craftsmanship. Carefully selected materials with rich texture, delicate stitching, and an iconic silhouette tailored for modern celebrations.'}
                </Text>
              </View>
            )}

            {/* Fabric & Material */}
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => toggleSection('fabric')}
              activeOpacity={0.8}
            >
              <Text style={styles.accordionTitle}>Fabric &amp; Care Details</Text>
              {expandedSection === 'fabric' ? (
                <ChevronUp size={18} color={colors.textPrimary} />
              ) : (
                <ChevronDown size={18} color={colors.textPrimary} />
              )}
            </TouchableOpacity>
            {expandedSection === 'fabric' && (
              <View style={styles.accordionBody}>
                <Text style={styles.accordionLabel}>Composition:</Text>
                <Text style={styles.accordionText}>
                  {product.composition || '100% Premium Hand-Woven Fabric with Pure Zari Border'}
                </Text>
                <Text style={styles.accordionLabel}>Care Instructions:</Text>
                <Text style={styles.accordionText}>
                  {product.careInstructions || 'Dry clean recommended for first wash. Gentle cold hand-wash with mild detergent.'}
                </Text>
              </View>
            )}

            {/* Shipping & Returns */}
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => toggleSection('shipping')}
              activeOpacity={0.8}
            >
              <Text style={styles.accordionTitle}>Shipping &amp; Doorstep Returns</Text>
              {expandedSection === 'shipping' ? (
                <ChevronUp size={18} color={colors.textPrimary} />
              ) : (
                <ChevronDown size={18} color={colors.textPrimary} />
              )}
            </TouchableOpacity>
            {expandedSection === 'shipping' && (
              <View style={styles.accordionBody}>
                <Text style={styles.accordionText}>
                  • Free standard delivery on all domestic orders above ₹5,000.
                  {'\n'}• Doorstep exchange/return eligible within 7 days of package delivery.
                  {'\n'}• Tamper-proof luxury gift packaging included.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 7. Similar Items Horizontal Carousel */}
        {similarProducts.length > 0 && (
          <View style={styles.similarSection}>
            <Text style={styles.similarTitle}>YOU MAY ALSO ADORE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarScroll}
            >
              {similarProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  style={styles.similarCard}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {/* Wishlist Button */}
        <TouchableOpacity
          style={[styles.wishlistBarBtn, saved && styles.wishlistBarBtnActive]}
          onPress={() => toggleWishlist(product)}
          activeOpacity={0.8}
        >
          <Heart
            size={22}
            color={saved ? colors.danger : colors.primary}
            fill={saved ? colors.danger : 'transparent'}
          />
        </TouchableOpacity>

        {/* Add To Bag or In-Bag Stepper */}
        {inBagQty > 0 ? (
          <View style={styles.bottomBarStepper}>
            <TouchableOpacity
              style={styles.bottomStepperActionBtn}
              onPress={handleDecrement}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Minus size={16} color={colors.primary} />
            </TouchableOpacity>

            <View style={styles.bottomStepperTextWrap}>
              <ShoppingBag size={14} color={colors.primary} />
              <Text style={styles.bottomStepperQtyText}>{inBagQty} in Bag</Text>
            </View>

            <TouchableOpacity
              style={styles.bottomStepperActionBtn}
              onPress={handleIncrement}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Plus size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addBagBtn}
            onPress={handleAddToBag}
            activeOpacity={0.85}
          >
            <ShoppingBag size={18} color={colors.primary} />
            <Text style={styles.addBagText}>Add To Bag</Text>
          </TouchableOpacity>
        )}

        {/* Buy Now Button */}
        <TouchableOpacity
          style={styles.buyNowBtn}
          onPress={handleBuyNow}
          activeOpacity={0.85}
        >
          <Zap size={18} color={colors.surface} />
          <Text style={styles.buyNowText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  notFoundContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  notFoundContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  notFoundText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  backHomeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.full,
  },
  backHomeText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.surface,
  },
  scrollBody: {
    paddingBottom: 100,
  },
  galleryContainer: {
    width,
    height: IMAGE_HEIGHT,
    position: 'relative',
    backgroundColor: colors.surfaceAlt,
  },
  galleryImage: {
    width,
    height: IMAGE_HEIGHT,
  },
  counterPill: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: 'rgba(29, 36, 28, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  counterText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.surface,
  },
  floatingShareBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -20,
    padding: spacing.lg,
    ...shadows.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryBadge: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.goldHover,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.goldPale,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  ratingValue: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },
  reviewCount: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textSecondary,
  },
  productTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
    lineHeight: 26,
    marginBottom: 4,
  },
  skuText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 2,
  },
  currentPrice: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.primary,
  },
  originalPrice: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  savingsPill: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  savingsText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.danger,
  },
  taxInclusive: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  stockUrgencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    marginBottom: spacing.lg,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  stockText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.success,
  },
  optionSection: {
    marginBottom: spacing.lg,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  optionTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  selectedOptionValue: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.goldHover,
  },
  colorSwatchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  colorSwatchRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchRingActive: {
    borderColor: colors.gold,
  },
  colorSwatchCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeGuideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sizeGuideText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.goldHover,
  },
  sizesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 4,
  },
  sizePill: {
    minWidth: 46,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sizePillText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textPrimary,
  },
  sizePillTextActive: {
    fontFamily: fonts.bold,
    color: colors.surface,
  },
  pincodeCard: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  pincodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  pincodeTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textPrimary,
    letterSpacing: 0.8,
  },
  pincodeInputRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pincodeInput: {
    flex: 1,
    height: 42,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textPrimary,
  },
  checkBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.surface,
  },
  deliveryStatusText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.success,
    marginTop: 6,
  },
  accordionsWrapper: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: spacing.sm,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  accordionTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  accordionBody: {
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
  },
  accordionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textPrimary,
    marginTop: 4,
    marginBottom: 2,
  },
  accordionText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  similarSection: {
    paddingVertical: spacing.lg,
  },
  similarTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textPrimary,
    letterSpacing: 1,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  similarScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  similarCard: {
    width: width * 0.44,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
    ...shadows.lg,
  },
  wishlistBarBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishlistBarBtnActive: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  addBagBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
  },
  addBagText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
  },
  bottomBarStepper: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.gold,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    backgroundColor: colors.goldPale || colors.surface,
  },
  bottomStepperActionBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.goldLight,
    ...shadows.sm,
  },
  bottomStepperTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bottomStepperQtyText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
  },
  inBagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  inBagBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.success,
    letterSpacing: 0.5,
  },
  quantityPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  qtyPickerBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyPickerBtnDisabled: {
    opacity: 0.35,
  },
  qtyDisplayBox: {
    minWidth: 48,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
  },
  qtyDisplayText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  buyNowBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.goldHover,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  buyNowText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.surface,
  },
});

export default ProductDetailScreen;
