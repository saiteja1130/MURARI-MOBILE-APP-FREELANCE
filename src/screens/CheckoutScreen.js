import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  Lock,
  Truck,
  ShieldCheck,
  ArrowRight,
  ShoppingBag,
  QrCode,
  Smartphone,
  Zap,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { colors, fonts, spacing, radius, shadows } from '../utils/theme';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import Header from '../components/Header';

// Safely import react-native-razorpay with fallback for Android emulator
let RazorpayCheckout = null;
try {
  RazorpayCheckout = require('react-native-razorpay').default;
} catch (e) {
  console.warn('Razorpay native module not available, fallback mode enabled:', e);
}

export const CheckoutScreen = ({ navigation }) => {
  const { cart, cartSubtotal, discountAmount, shippingCost, cartTotal, promoCode, clearCart, showToast } = useStore();
  const { currentUser, token, fetchOrders } = useAuth();

  // Form State - manual address per order
  const [fullName, setFullName] = useState(currentUser?.name || currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [street, setStreet] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(true);

  // Sync profile details if available
  useEffect(() => {
    if (currentUser) {
      if (!fullName && (currentUser.name || currentUser.fullName)) {
        setFullName(currentUser.name || currentUser.fullName);
      }
      if (!email && currentUser.email) setEmail(currentUser.email);
      if (!phone && currentUser.phone) setPhone(currentUser.phone);
    }
  }, [currentUser]);

  // Robust Razorpay error normalizer to prevent raw JSON/code or 'undefined' alerts
  const parseRazorpayError = (error) => {
    let rawDesc = '';
    let code = null;
    let isCancelled = false;

    if (typeof error === 'string') {
      rawDesc = error;
    } else if (error && typeof error === 'object') {
      code = error.code !== undefined ? error.code : (error.error?.code !== undefined ? error.error.code : null);
      rawDesc = error.description || error.error?.description || error.message || error.error?.message || '';

      if (error.reason === 'payment_cancelled' || error.error?.reason === 'payment_cancelled') {
        isCancelled = true;
      }
    }

    // Check if error.description is a stringified JSON (common in Razorpay Android Native SDK)
    if (typeof rawDesc === 'string' && (rawDesc.trim().startsWith('{') || rawDesc.trim().startsWith('['))) {
      try {
        const parsed = JSON.parse(rawDesc.trim());
        if (parsed?.error?.description) {
          rawDesc = parsed.error.description;
        } else if (parsed?.error?.message) {
          rawDesc = parsed.error.message;
        }
        if (parsed?.error?.code !== undefined) {
          code = parsed.error.code;
        }
        if (parsed?.error?.reason === 'payment_cancelled') {
          isCancelled = true;
        }
      } catch (e) {
        // Fall back to original rawDesc
      }
    }

    // Strip literal 'undefined' or 'null' strings
    if (typeof rawDesc === 'string') {
      const trimmed = rawDesc.trim();
      if (trimmed === 'undefined' || trimmed === 'null' || trimmed === '') {
        rawDesc = '';
      }
    } else {
      rawDesc = '';
    }

    const lower = rawDesc.toLowerCase();

    // Cancellation checks:
    // - Razorpay code 0 or '0' (PAYMENT_CANCELED)
    // - Razorpay code 2 or '2'
    // - Explicit cancellation reason
    // - Matching keywords
    // - OR: Razorpay closed with empty/undefined description (user pressed back/dismissed)
    if (
      Number(code) === 0 ||
      code === 0 ||
      code === '0' ||
      code === 2 ||
      code === '2' ||
      (code === 'BAD_REQUEST_ERROR' && (!rawDesc || lower.includes('cancel'))) ||
      isCancelled ||
      lower.includes('cancel') ||
      lower.includes('back button') ||
      lower.includes('dismiss') ||
      lower.includes('user pressed back') ||
      !rawDesc
    ) {
      return {
        isCancelled: true,
        title: 'Payment Cancelled',
        message: 'Payment was not completed. Your items remain saved in your bag whenever you are ready.',
      };
    }

    return {
      isCancelled: false,
      title: 'Payment Incomplete',
      message: rawDesc || 'Payment could not be processed. Please try another UPI app or retry.',
    };
  };

  const handlePayAndPlaceOrder = async () => {
    // Validation
    if (!fullName.trim() || !phone.trim() || !street.trim() || !city.trim() || !postalCode.trim()) {
      Alert.alert('Incomplete Address', 'Please fill in your recipient name, phone, street, city, and 6-digit PIN code.');
      return;
    }
    if (postalCode.trim().length !== 6) {
      Alert.alert('Invalid PIN Code', 'Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    setIsProcessing(true);

    const orderPayload = {
      items: cart.map((item) => {
        const colorName = (item.selectedColor?.name || (typeof item.selectedColor === 'string' ? item.selectedColor : '')).trim().toLowerCase();
        let matchedColorImage = '';
        if (colorName && Array.isArray(item.product?.colorImages) && item.product.colorImages.length > 0) {
          const match = item.product.colorImages.find(
            (ci) => ci.color && ci.color.trim().toLowerCase() === colorName
          );
          if (match && Array.isArray(match.images) && match.images.length > 0) {
            matchedColorImage = match.images[0];
          }
        }
        const itemFinalImage = matchedColorImage || item.image || item.product?.image || item.product?.galleryImages?.[0] || '';

        return {
          id: item.product?._id || item.product?.id || item.id,
          quantity: item.quantity,
          selectedSize: item.selectedSize || 'Standard',
          selectedColor: item.selectedColor || { name: 'Standard', hex: '#1D241C' },
          price: item.product?.price,
          name: item.product?.name,
          image: itemFinalImage,
        };
      }),
      shippingAddress: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        street: apartment ? `${street.trim()}, ${apartment.trim()}` : street.trim(),
        apartment: apartment.trim() || '',
        city: city.trim(),
        state: stateName.trim() || 'Telangana',
        postalCode: postalCode.trim(),
        country: country || 'India',
        addressType: 'home',
      },
      promoCode: promoCode || '',
    };

    try {
      // 1. Create Razorpay Order on Backend
      const orderRes = await api.post('/api/orders/create-razorpay-order', orderPayload);
      if (!orderRes.data?.status || !orderRes.data?.data) {
        throw new Error(orderRes.data?.message || 'Failed to initiate Razorpay order');
      }

      const { razorpayOrderId, amount, key_id, currency, orderNumber, orderId } = orderRes.data.data;

      // 2. Open Razorpay Checkout via Native SDK or verification fallback
      if (RazorpayCheckout && typeof RazorpayCheckout.open === 'function') {
        const options = {
          description: `Order #${orderNumber}`,
          image: 'https://api.murarisglamandglow.com/assets/images/Logo.png',
          currency: currency || 'INR',
          key: key_id,
          amount: amount,
          name: "Murari's Glam & Glow",
          order_id: razorpayOrderId,
          prefill: {
            email: email || currentUser?.email || 'customer@example.com',
            contact: phone || currentUser?.phone || '9999999999',
            name: fullName,
            method: 'upi',
          },
          theme: { color: '#C69E58' },
          // Restrict exclusively to UPI payment methods (hide Cards, NetBanking, Wallets, EMI, PayLater)
          method: {
            upi: true,
            card: false,
            netbanking: false,
            wallet: false,
            emi: false,
            paylater: false,
          },
          config: {
            display: {
              blocks: {
                upi: {
                  name: 'Pay via UPI',
                  instruments: [
                    {
                      method: 'upi',
                    },
                  ],
                },
              },
              sequence: ['block.upi'],
              preferences: {
                show_default_blocks: false,
              },
            },
          },
        };

        RazorpayCheckout.open(options)
          .then(async (data) => {
            // Payment Success -> Verify on backend
            try {
              const verifyRes = await api.post('/api/orders/verify-payment', {
                razorpay_order_id: data.razorpay_order_id,
                razorpay_payment_id: data.razorpay_payment_id,
                razorpay_signature: data.razorpay_signature,
                orderNumber: orderNumber,
                items: orderPayload.items,
                shippingAddress: orderPayload.shippingAddress,
                promoCode: promoCode || '',
                notes: '',
              });

              if (verifyRes.data?.status && verifyRes.data?.data) {
                clearCart();
                if (typeof fetchOrders === 'function') {
                  fetchOrders().catch(() => {});
                }
                setIsProcessing(false);
                navigation.replace('OrderSuccess', { order: verifyRes.data.data });
              } else {
                Alert.alert('Payment Verification', 'Signature verification failed.');
                setIsProcessing(false);
              }
            } catch (vErr) {
              setIsProcessing(false);
              const vMsg = vErr.response?.data?.message || vErr.message || 'Payment confirmation error.';
              Alert.alert('Verification Error', vMsg);
            }
          })
          .catch((error) => {
            setIsProcessing(false);
            const { isCancelled, title, message } = parseRazorpayError(error);

            if (isCancelled) {
              // Non-intrusive floating toast instead of an annoying raw code alert
              showToast({
                type: 'info',
                title: 'Payment Cancelled',
                message: 'Payment was cancelled. Your items remain saved in your bag.',
              });
            } else {
              // Real payment decline or failure: show clear, human-readable alert without raw code
              Alert.alert(title, message, [{ text: 'OK' }]);
            }
          });
      } else if (__DEV__) {
        // DEV ONLY: Fallback for emulator testing — never runs in production builds
        console.warn('[DEV] Razorpay native module unavailable, using simulated payment flow.');
        const verifyRes = await api.post('/api/orders/verify-payment', {
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          razorpay_signature: 'sig_simulation_verified',
          orderNumber: orderNumber,
          items: orderPayload.items,
          shippingAddress: orderPayload.shippingAddress,
          promoCode: promoCode || '',
          notes: '',
        });

        if (verifyRes.data?.status && verifyRes.data?.data) {
          clearCart();
          setIsProcessing(false);
          navigation.replace('OrderSuccess', { order: verifyRes.data.data });
        } else {
          clearCart();
          setIsProcessing(false);
          navigation.replace('OrderSuccess', {
            order: {
              orderNumber,
              total: cartTotal,
              shippingAddress: orderPayload.shippingAddress,
            },
          });
        }
      } else {
        // Production: Razorpay SDK must be available
        setIsProcessing(false);
        Alert.alert(
          'Payment Unavailable',
          'UPI payment service is temporarily unavailable. Please update the app or try again later.'
        );
      }
    } catch (err) {
      setIsProcessing(false);
      const backendMsg = err.response?.data?.message || err.message || 'Unable to start checkout at this time.';
      Alert.alert('Order Initiation', backendMsg);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Secure Checkout" showBack={true} showSearchPill={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCircleActive]}>
              <Text style={styles.stepNumberActive}>1</Text>
            </View>
            <Text style={styles.stepLabelActive}>Address</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCircleActive]}>
              <Text style={styles.stepNumberActive}>2</Text>
            </View>
            <Text style={styles.stepLabelActive}>Payment</Text>
          </View>
        </View>

        {/* 1. Contact Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>CONTACT DETAILS</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Priya Sharma"
              placeholderTextColor={colors.textMuted}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Mobile Phone *</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="email@domain.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>
        </View>

        {/* 2. Shipping Address Details (Manual entry per order) */}
        <View style={styles.sectionCard}>
          <View style={styles.addressTitleRow}>
            <MapPin size={16} color={colors.gold} />
            <Text style={styles.sectionTitle}>DELIVERY ADDRESS</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>House No. / Building / Street Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Flat 402, Hilltop Residences, Road No. 12"
              placeholderTextColor={colors.textMuted}
              value={street}
              onChangeText={setStreet}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Apartment / Floor / Landmark (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Near Heritage Park"
              placeholderTextColor={colors.textMuted}
              value={apartment}
              onChangeText={setApartment}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Hyderabad"
                placeholderTextColor={colors.textMuted}
                value={city}
                onChangeText={setCity}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>State *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Telangana"
                placeholderTextColor={colors.textMuted}
                value={stateName}
                onChangeText={setStateName}
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>PIN Code *</Text>
              <TextInput
                style={styles.input}
                placeholder="6-digit PIN"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                value={postalCode}
                onChangeText={setPostalCode}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Country</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceAlt }]}
                editable={false}
                value={country}
              />
            </View>
          </View>
        </View>

        {/* 3. Payment Method Selection Card - Exclusively UPI Apps */}
        <View style={styles.sectionCard}>
          <View style={styles.paymentHeaderRow}>
            <Text style={styles.sectionTitle}>PAYMENT METHOD</Text>
            <View style={styles.instantBadge}>
              <Zap size={11} color={colors.gold} />
              <Text style={styles.instantBadgeText}>INSTANT UPI</Text>
            </View>
          </View>

          <View style={styles.paymentMethodActive}>
            <View style={styles.paymentMethodLeft}>
              <View style={styles.radioDot}>
                <View style={styles.radioInnerDot} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.paymentNameRow}>
                  <Text style={styles.paymentName}>UPI Apps (Instant Checkout)</Text>
                  <View style={styles.recommendedPill}>
                    <Text style={styles.recommendedPillText}>FASTEST</Text>
                  </View>
                </View>
                <Text style={styles.paymentDesc}>
                  Pay securely using any UPI app installed on your phone
                </Text>
              </View>
            </View>
            <ShieldCheck size={20} color={colors.success} />
          </View>

          {/* Supported UPI Apps Row */}
          {/* <View style={styles.upiAppsContainer}>
            <Text style={styles.upiAppsHeader}>POPULAR UPI APPS SUPPORTED</Text>
            <View style={styles.upiAppsRow}>
              <View style={styles.upiAppBadge}>
                <Smartphone size={13} color="#4285F4" />
                <Text style={styles.upiAppName}>Google Pay</Text>
              </View>
              <View style={styles.upiAppBadge}>
                <Smartphone size={13} color="#5F259F" />
                <Text style={styles.upiAppName}>PhonePe</Text>
              </View>
              <View style={styles.upiAppBadge}>
                <Smartphone size={13} color="#00BAF2" />
                <Text style={styles.upiAppName}>Paytm</Text>
              </View>
              <View style={styles.upiAppBadge}>
                <QrCode size={13} color="#25D366" />
                <Text style={styles.upiAppName}>BHIM / QR</Text>
              </View>
            </View>
          </View> */}

          <View style={styles.paymentSecurityRow}>
            <Lock size={12} color={colors.textMuted} />
            <Text style={styles.paymentSecurityText}>
              Encrypted Razorpay UPI Gateway • Zero Transaction Fee
            </Text>
          </View>
        </View>

        {/* 4. Order Summary Accordion */}
        <View style={styles.summaryCard}>
          <TouchableOpacity
            style={styles.summaryToggleHeader}
            onPress={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}
          >
            <View style={styles.summaryTitleRow}>
              <ShoppingBag size={16} color={colors.gold} />
              <Text style={styles.summaryCardTitle}>
                ORDER SUMMARY ({cart.length} {cart.length === 1 ? 'Item' : 'Items'})
              </Text>
            </View>
            {isOrderSummaryOpen ? (
              <ChevronUp size={18} color={colors.textPrimary} />
            ) : (
              <ChevronDown size={18} color={colors.textPrimary} />
            )}
          </TouchableOpacity>

          {isOrderSummaryOpen && (
            <View style={styles.summaryBody}>
              {cart.map((it) => {
                const itColorName = (it.selectedColor?.name || (typeof it.selectedColor === 'string' ? it.selectedColor : '')).trim().toLowerCase();
                let matchedColorImage = '';
                if (itColorName && Array.isArray(it.product?.colorImages) && it.product.colorImages.length > 0) {
                  const match = it.product.colorImages.find(
                    (ci) => (ci.color || '').trim().toLowerCase() === itColorName
                  );
                  if (match && Array.isArray(match.images) && match.images.length > 0) {
                    matchedColorImage = match.images[0];
                  }
                }
                const itThumb = matchedColorImage || it.image || it.product?.image || (Array.isArray(it.product?.galleryImages) && it.product.galleryImages[0]) || '';
                const itColorLabel = typeof it.selectedColor === 'object' ? it.selectedColor?.name : (it.selectedColor || 'Standard');
                const itColorHex = typeof it.selectedColor === 'object' ? it.selectedColor?.hex : '#1D241C';

                return (
                  <View key={it.cartItemId || it.id} style={styles.summaryItemRow}>
                    {itThumb ? (
                      <Image
                        source={{ uri: itThumb }}
                        style={styles.summaryItemThumb}
                        resizeMode="cover"
                      />
                    ) : null}
                    <View style={styles.summaryItemInfo}>
                      <Text style={styles.summaryItemName} numberOfLines={1}>
                        {it.quantity}× {it.product?.name}
                      </Text>
                      <View style={styles.summaryItemMetaRow}>
                        <View style={[styles.summaryColorDot, { backgroundColor: itColorHex }]} />
                        <Text style={styles.summaryItemMeta}>
                          {itColorLabel} • Size: {it.selectedSize}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.summaryItemPrice}>
                      ₹{((it.product?.price || 0) * it.quantity).toLocaleString('en-IN')}
                    </Text>
                  </View>
                );
              })}

              <View style={styles.summaryDivider} />

              <View style={styles.priceLine}>
                <Text style={styles.priceLineLabel}>Subtotal</Text>
                <Text style={styles.priceLineVal}>₹{cartSubtotal.toLocaleString('en-IN')}</Text>
              </View>

              {discountAmount > 0 && (
                <View style={styles.priceLine}>
                  <Text style={styles.priceLineLabel}>Coupon Savings</Text>
                  <Text style={[styles.priceLineVal, { color: colors.success }]}>
                    -₹{Math.round(discountAmount).toLocaleString('en-IN')}
                  </Text>
                </View>
              )}

              <View style={styles.priceLine}>
                <Text style={styles.priceLineLabel}>Delivery Charges</Text>
                <Text style={[styles.priceLineVal, shippingCost === 0 && { color: colors.success }]}>
                  {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.totalPayableRow}>
                <Text style={styles.totalPayableLabel}>Total Amount Payable</Text>
                <Text style={styles.totalPayableVal}>
                  ₹{Math.round(cartTotal).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Place Order Footer */}
      <View style={styles.footerBar}>
        <View style={styles.footerTotalWrap}>
          <Text style={styles.footerTotalLabel}>PAYABLE TOTAL</Text>
          <Text style={styles.footerTotalVal}>
            ₹{Math.round(cartTotal).toLocaleString('en-IN')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.payBtn}
          onPress={handlePayAndPlaceOrder}
          disabled={isProcessing}
          activeOpacity={0.88}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <>
              <Lock size={16} color={colors.surface} />
              <Text style={styles.payBtnText}>Pay via UPI &amp; Place Order</Text>
              <ArrowRight size={16} color={colors.surface} />
            </>
          )}
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
    padding: spacing.md,
    paddingBottom: 130,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.border,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepNumberActive: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.surface,
  },
  stepLabelActive: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textPrimary,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.gold,
    marginHorizontal: spacing.sm,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textPrimary,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  inputGroup: {
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 3,
  },
  input: {
    height: 42,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textPrimary,
  },
  paymentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  instantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.goldPale,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.goldLight,
  },
  instantBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  paymentMethodActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.goldPale,
    borderWidth: 1.5,
    borderColor: colors.gold,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginVertical: spacing.xs,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
  },
  paymentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  recommendedPill: {
    backgroundColor: colors.gold,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  recommendedPillText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    color: colors.surface,
    letterSpacing: 0.5,
  },
  paymentName: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  paymentDesc: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  upiAppsContainer: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: spacing.xs + 2,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  upiAppsHeader: {
    fontFamily: fonts.semiBold,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  upiAppsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  upiAppBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  upiAppName: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textPrimary,
  },
  paymentSecurityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs + 2,
    paddingHorizontal: 2,
  },
  paymentSecurityText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textMuted,
    flex: 1,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  summaryToggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryCardTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  summaryBody: {
    marginTop: spacing.sm,
  },
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItemThumb: {
    width: 36,
    height: 44,
    borderRadius: radius.xs,
    marginRight: spacing.sm,
    backgroundColor: colors.surfaceAlt,
  },
  summaryItemInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  summaryItemName: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textPrimary,
  },
  summaryItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  summaryColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  summaryItemMeta: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textMuted,
  },
  summaryItemPrice: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textPrimary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs,
  },
  priceLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priceLineLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  priceLineVal: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textPrimary,
  },
  totalPayableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 4,
  },
  totalPayableLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  totalPayableVal: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.primary,
  },
  footerBar: {
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
  footerTotalWrap: {
    flex: 1,
  },
  footerTotalLabel: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  footerTotalVal: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.primary,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    gap: 8,
  },
  payBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.surface,
  },
});

export default CheckoutScreen;
