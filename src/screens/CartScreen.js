import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Trash2,
  Minus,
  Plus,
  Heart,
  ShoppingBag,
  Tag,
  ArrowRight,
  Truck,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react-native';
import { colors, fonts, spacing, radius, shadows } from '../utils/theme';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

export const CartScreen = ({ navigation }) => {
  const {
    cart,
    cartSubtotal,
    cartItemCount,
    discountRate,
    discountAmount,
    shippingCost,
    freeShippingThreshold,
    cartTotal,
    promoCode,
    updateCartQuantity,
    removeCartItem,
    applyPromoCode,
    removePromoCode,
    moveWishlistToCart,
    toggleWishlist,
  } = useStore();

  const { isAuthenticated, requireAuth } = useAuth();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Free shipping progress calculation
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);
  const freeShippingProgress = Math.min(1, cartSubtotal / freeShippingThreshold);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError('');
    setCouponSuccess('');
    try {
      const res = await applyPromoCode(couponInput.trim());
      if (res.success) {
        setCouponSuccess(res.message || 'Promo code applied!');
        setCouponInput('');
      } else {
        setCouponError(res.message || 'Invalid promotional code.');
      }
    } catch (err) {
      setCouponError(err.message || 'Failed to apply coupon.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      requireAuth(
        () => navigation.navigate('Checkout'),
        {
          title: 'Sign In to Checkout',
          message: 'Please sign in to proceed with your order delivery.',
        }
      );
      return;
    }
    navigation.navigate('Checkout');
  };

  if (!cart || cart.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="Shopping Bag" showBack={false} showSearchPill={false} showCartAction={false} />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <ShoppingBag size={42} color={colors.gold} />
          </View>
          <Text style={styles.emptyTitle}>Your Bag is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Looks like you haven't added any luxury pieces yet. Explore our handcrafted ethnic wear.
          </Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'ShopTab' })}
            activeOpacity={0.85}
          >
            <Text style={styles.exploreBtnText}>Explore Collections</Text>
            <ArrowRight size={16} color={colors.surface} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={`Shopping Bag (${cartItemCount})`} showBack={false} showSearchPill={false} showCartAction={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        {/* 1. Free Shipping Threshold Progress Bar */}
        <View style={styles.shippingBarCard}>
          <View style={styles.shippingBarHeader}>
            <Truck size={16} color={colors.gold} />
            <Text style={styles.shippingBarTitle}>
              {amountToFreeShipping > 0
                ? `Add ₹${amountToFreeShipping.toLocaleString('en-IN')} more for FREE Delivery`
                : 'Congratulations! You unlocked FREE Delivery'}
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.round(freeShippingProgress * 100)}%` },
              ]}
            />
          </View>
        </View>

        {/* 2. Cart Items List */}
        <View style={styles.itemsList}>
          {cart.map((item) => {
            const product = item.product || {};
            const itemKey = item.cartItemId || item.id;
            return (
              <View key={itemKey} style={styles.cartItemCard}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() =>
                    navigation.navigate('ProductDetail', {
                      product,
                      id: product.id || product._id,
                    })
                  }
                >
                  <Image
                    source={{ uri: product.image || product.galleryImages?.[0] }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>

                <View style={styles.itemDetails}>
                  <View style={styles.itemTopRow}>
                    <Text style={styles.itemCategory} numberOfLines={1}>
                      {product.category || product.mainCategory || 'Attire'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeCartItem(itemKey)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.itemName} numberOfLines={2}>
                    {product.name}
                  </Text>

                  {/* Size & Color Tags */}
                  <View style={styles.attributesRow}>
                    <View style={styles.attrPill}>
                      <Text style={styles.attrText}>Size: {item.selectedSize || 'Standard'}</Text>
                    </View>
                    <View style={styles.attrPill}>
                      <Text style={styles.attrText}>
                        Color: {item.selectedColor?.name || item.selectedColor || 'Standard'}
                      </Text>
                    </View>
                  </View>

                  {/* Price & Quantity Stepper */}
                  <View style={styles.itemBottomRow}>
                    <View style={styles.priceWrap}>
                      <Text style={styles.price}>
                        ₹{(Number(product.price || 0) * item.quantity).toLocaleString('en-IN')}
                      </Text>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <Text style={styles.origPrice}>
                          ₹{(Number(product.originalPrice) * item.quantity).toLocaleString('en-IN')}
                        </Text>
                      )}
                    </View>

                    {/* Stepper Controls */}
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => {
                          if (item.quantity > 1) {
                            updateCartQuantity(itemKey, item.quantity - 1);
                          } else {
                            removeCartItem(itemKey);
                          }
                        }}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Minus size={14} color={colors.textPrimary} />
                      </TouchableOpacity>
                      <Text style={styles.stepperQty}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => updateCartQuantity(itemKey, item.quantity + 1)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Plus size={14} color={colors.textPrimary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* 3. Promo Code Input Card */}
        <View style={styles.promoCard}>
          <View style={styles.promoHeader}>
            <Tag size={16} color={colors.gold} />
            <Text style={styles.promoTitle}>APPLY COUPON CODE</Text>
          </View>

          {promoCode ? (
            <View style={styles.appliedPromoRow}>
              <View style={styles.appliedPromoTextWrap}>
                <Sparkles size={14} color={colors.success} />
                <Text style={styles.appliedPromoCode}>{promoCode} APPLIED</Text>
                <Text style={styles.appliedPromoDiscount}>
                  -₹{Math.round(discountAmount).toLocaleString('en-IN')}
                </Text>
              </View>
              <TouchableOpacity onPress={removePromoCode}>
                <Text style={styles.removePromoText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInputRow}>
              <TextInput
                style={styles.couponInput}
                placeholder="Enter promo code (e.g. SUMI15)"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                value={couponInput}
                onChangeText={(text) => {
                  setCouponInput(text);
                  setCouponError('');
                }}
              />
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={handleApplyCoupon}
                disabled={isApplyingCoupon}
              >
                {isApplyingCoupon ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={styles.applyBtnText}>Apply</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {couponError ? <Text style={styles.couponErrorText}>{couponError}</Text> : null}
          {couponSuccess ? <Text style={styles.couponSuccessText}>{couponSuccess}</Text> : null}
        </View>

        {/* 4. Order Financial Breakdown */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>PRICE DETAILS ({cartItemCount} Items)</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Bag Subtotal</Text>
            <Text style={styles.summaryValue}>₹{cartSubtotal.toLocaleString('en-IN')}</Text>
          </View>

          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Coupon Discount ({promoCode})</Text>
              <Text style={[styles.summaryValue, styles.discountGreen]}>
                -₹{Math.round(discountAmount).toLocaleString('en-IN')}
              </Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Delivery</Text>
            <Text style={[styles.summaryValue, shippingCost === 0 && styles.discountGreen]}>
              {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryTotalRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>₹{Math.round(cartTotal).toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.assuranceStrip}>
            <ShieldCheck size={14} color={colors.success} />
            <Text style={styles.assuranceText}>Safe and Secure 256-Bit SSL Checkout</Text>
          </View>
        </View>
      </ScrollView>

      {/* 5. Sticky Bottom Checkout Bar */}
      <View style={styles.checkoutBar}>
        <View style={styles.checkoutTotalWrap}>
          <Text style={styles.checkoutTotalLabel}>TOTAL AMOUNT</Text>
          <Text style={styles.checkoutTotalValue}>
            ₹{Math.round(cartTotal).toLocaleString('en-IN')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={handleProceedToCheckout}
          activeOpacity={0.88}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <ArrowRight size={16} color={colors.surface} />
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
  scrollBody: {
    paddingBottom: 90,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.goldPale,
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
  shippingBarCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  shippingBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  shippingBarTitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textPrimary,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 3,
  },
  itemsList: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  itemImage: {
    width: 85,
    height: 110,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceAlt,
    marginRight: spacing.md,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCategory: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.goldHover,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  itemName: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 2,
    lineHeight: 17,
  },
  attributesRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 4,
  },
  attrPill: {
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  attrText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textSecondary,
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.primary,
  },
  origPrice: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  stepperQty: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textPrimary,
    paddingHorizontal: 6,
  },
  promoCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  promoTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textPrimary,
    letterSpacing: 0.8,
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  couponInput: {
    flex: 1,
    height: 42,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textPrimary,
  },
  applyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.surface,
  },
  appliedPromoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.successLight,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  appliedPromoTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appliedPromoCode: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.success,
  },
  appliedPromoDiscount: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.success,
  },
  removePromoText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.danger,
  },
  couponErrorText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.danger,
    marginTop: 4,
  },
  couponSuccessText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.success,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  summaryTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  discountGreen: {
    color: colors.success,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  totalValue: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.primary,
  },
  assuranceStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.background,
    paddingVertical: 6,
    borderRadius: radius.xs,
  },
  assuranceText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  checkoutBar: {
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
    ...shadows.lg,
  },
  checkoutTotalWrap: {
    flex: 1,
  },
  checkoutTotalLabel: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  checkoutTotalValue: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.primary,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    gap: 6,
  },
  checkoutBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.surface,
  },
});

export default CartScreen;
