import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { CheckCircle2, Package, ArrowRight, Home, Sparkles, Truck } from 'lucide-react-native';
import { colors, fonts, spacing, radius, shadows } from '../utils/theme';

export const OrderSuccessScreen = ({ route, navigation }) => {
  const { order } = route.params || {};

  // Prevent user from navigating back to the empty checkout/cart
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Only block hardware back / swipe-back gestures
      if (e.data.action.type === 'GO_BACK') {
        e.preventDefault();
        navigation.navigate('MainTabs', { screen: 'HomeTab' });
      }
    });
    return unsubscribe;
  }, [navigation]);

  const orderNum = order?.orderNumber || order?.id || `MGG-${Date.now().toString().slice(-6)}`;
  const total = order?.total || order?.amount || 0;
  const address = order?.shippingAddress || {};

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
      >
        <View style={styles.successCard}>
          {/* Animated Success Icon */}
          <View style={styles.iconCircle}>
            <CheckCircle2 size={54} color={colors.success} />
          </View>

          <View style={styles.badgeRow}>
            <Sparkles size={14} color={colors.gold} />
            <Text style={styles.badgeText}>
              {order?.paymentMethod === 'cod'
                ? 'ORDER CONFIRMED • CASH ON DELIVERY'
                : 'PAYMENT VERIFIED & CONFIRMED'}
            </Text>
          </View>

          <Text style={styles.successTitle}>Order Placed Successfully!</Text>
          <Text style={styles.successSubtitle}>
            {order?.paymentMethod === 'cod'
              ? 'Thank you for choosing Murari\'s Glam & Glow. Please keep cash or UPI ready at the time of doorstep delivery.'
              : 'Thank you for choosing Murari\'s Glam & Glow. Your handcrafted couture is being prepared with utmost care.'}
          </Text>

          <View style={styles.orderIdPill}>
            <Text style={styles.orderIdLabel}>ORDER REFERENCE</Text>
            <Text style={styles.orderIdText}>#{orderNum}</Text>
          </View>
        </View>

        {/* Order Details Breakdown Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>ORDER SUMMARY</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {order?.paymentMethod === 'cod' ? 'Total to Pay on Delivery' : 'Total Amount Paid'}
            </Text>
            <Text style={styles.detailValueBold}>₹{Number(total).toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>
              {order?.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'UPI (Razorpay)'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Delivery</Text>
            <Text style={styles.detailValue}>3-5 Business Days</Text>
          </View>

          {Array.isArray(order?.items) && order.items.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.itemsSection}>
                <Text style={styles.itemsSectionTitle}>ORDERED PIECES ({order.items.length})</Text>
                {order.items.map((it, idx) => {
                  const colorName = typeof it.selectedColor === 'object' ? it.selectedColor?.name : (it.selectedColor || it.color);
                  const colorHex = typeof it.selectedColor === 'object' ? it.selectedColor?.hex : '#1D241C';
                  const colorKey = (colorName || '').trim().toLowerCase();

                  let matchedColorImg = '';
                  if (colorKey && Array.isArray(it.product?.colorImages) && it.product.colorImages.length > 0) {
                    const match = it.product.colorImages.find(
                      (ci) => (ci.color || '').trim().toLowerCase() === colorKey
                    );
                    if (match && Array.isArray(match.images) && match.images.length > 0) {
                      matchedColorImg = match.images[0];
                    }
                  }
                  const itemImg = matchedColorImg || it.image || it.product?.image || (Array.isArray(it.product?.images) && it.product.images[0]) || '';
                  const itemSku = it.sku || it.product?.sku;
                  const unitPrice = Number(it.price !== undefined ? it.price : (it.product?.price || 0));

                  return (
                    <View key={it.id || it._id || idx} style={styles.orderSuccessItemRow}>
                      {itemImg ? (
                        <Image
                          source={{ uri: itemImg }}
                          style={styles.orderSuccessItemThumb}
                          resizeMode="cover"
                        />
                      ) : null}
                      <View style={{ flex: 1, marginRight: spacing.sm }}>
                        <Text style={styles.orderSuccessItemName} numberOfLines={1}>
                          {it.quantity}× {it.name || it.product?.name || 'Garment Piece'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                          {itemSku ? (
                            <View style={styles.orderSuccessSkuBadge}>
                              <Text style={styles.orderSuccessSkuText}>SKU: {itemSku}</Text>
                            </View>
                          ) : null}
                          {colorName ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                              <View style={[styles.orderSuccessColorDot, { backgroundColor: colorHex }]} />
                              <Text style={styles.orderSuccessItemMeta}>{colorName}</Text>
                            </View>
                          ) : null}
                          {it.selectedSize || it.size ? (
                            <Text style={styles.orderSuccessItemMeta}>• Size: {it.selectedSize || it.size}</Text>
                          ) : null}
                        </View>
                      </View>
                      <Text style={styles.orderSuccessItemPrice}>
                        ₹{(unitPrice * (it.quantity || 1)).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          <View style={styles.divider} />

          {/* Delivery Address */}
          <View style={styles.addressSection}>
            <View style={styles.addressHeader}>
              <Truck size={16} color={colors.gold} />
              <Text style={styles.addressHeaderTitle}>SHIPPING ADDRESS</Text>
            </View>
            <Text style={styles.addressRecipient}>
              {address.fullName || address.name || 'Valued Customer'}
            </Text>
            <Text style={styles.addressLine}>{address.street}</Text>
            {address.apartment ? (
              <Text style={styles.addressLine}>{address.apartment}</Text>
            ) : null}
            <Text style={styles.addressLine}>
              {address.city} {address.state ? `, ${address.state}` : ''} - {address.postalCode}
            </Text>
            {address.phone ? (
              <Text style={styles.addressLine}>Phone: {address.phone}</Text>
            ) : null}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.trackOrdersBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'AccountTab' })}
            activeOpacity={0.88}
          >
            <Package size={18} color={colors.surface} />
            <Text style={styles.trackOrdersText}>View in My Orders</Text>
            <ArrowRight size={16} color={colors.surface} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueShoppingBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
            activeOpacity={0.85}
          >
            <Home size={18} color={colors.primary} />
            <Text style={styles.continueShoppingText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
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
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  successCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.goldHover,
    letterSpacing: 1.2,
  },
  successTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  successSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  orderIdPill: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  orderIdLabel: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  orderIdText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.primary,
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
    marginBottom: spacing.lg,
  },
  detailsTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailValue: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textPrimary,
  },
  detailValueBold: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  itemsSection: {
    marginTop: 2,
  },
  itemsSectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textPrimary,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  orderSuccessItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  orderSuccessItemThumb: {
    width: 36,
    height: 44,
    borderRadius: radius.xs,
    marginRight: spacing.sm,
    backgroundColor: colors.surfaceAlt,
  },
  orderSuccessItemName: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textPrimary,
  },
  orderSuccessSkuBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  orderSuccessSkuText: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: colors.textSecondary,
  },
  orderSuccessColorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  orderSuccessItemMeta: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textMuted,
  },
  orderSuccessItemPrice: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textPrimary,
  },
  addressSection: {
    marginTop: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  addressHeaderTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textPrimary,
    letterSpacing: 0.8,
  },
  addressRecipient: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  addressLine: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  actionsContainer: {
    gap: spacing.sm,
  },
  trackOrdersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: radius.md,
    gap: 8,
  },
  trackOrdersText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.surface,
    letterSpacing: 0.5,
  },
  continueShoppingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    height: 50,
    borderRadius: radius.md,
    gap: 8,
  },
  continueShoppingText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
  },
});

export default OrderSuccessScreen;
