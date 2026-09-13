import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
  Platform,
  Keyboard,
  Dimensions,
  StatusBar,
} from 'react-native';
import {
  User,
  ShoppingBag,
  Heart,
  Package,
  Shield,
  HelpCircle,
  FileText,
  Truck,
  RotateCcw,
  Ban,
  PhoneCall,
  Info,
  LogOut,
  ChevronRight,
  UserX,
  CreditCard,
  Sparkles,
  Edit3,
  ExternalLink,
  X,
} from 'lucide-react-native';
import { colors, fonts, spacing, radius, shadows } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import Header from '../components/Header';

export const AccountScreen = ({ navigation }) => {
  const {
    currentUser,
    isAuthenticated,
    logout,
    orders,
    payments,
    cancelOrder,
    updateProfile,
  } = useAuth();
  const { wishlist, cartItemCount } = useStore();

  // Active sub-tab or view: 'menu' | 'orders'
  const [activeView, setActiveView] = useState('menu');

  // Edit Profile Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser?.name || currentUser?.fullName || '');
  const [phoneInput, setPhoneInput] = useState(currentUser?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [editKeyboardHeight, setEditKeyboardHeight] = useState(0);

  // Active keyboard tracking for Edit Profile bottom sheet
  useEffect(() => {
    const onShow = (e) => {
      const h = e.endCoordinates ? e.endCoordinates.height : (e.height || 0);
      setEditKeyboardHeight(h);
    };
    const onHide = () => {
      setEditKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      onShow
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      onHide
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const closeEditModal = () => {
    Keyboard.dismiss();
    setEditKeyboardHeight(0);
    setIsEditModalOpen(false);
  };

  const openWebLink = (url) => {
    Linking.openURL(url).catch((err) => {
      console.warn('Failed to open website link:', err);
      Alert.alert('Link Error', 'Unable to open website link at this time.');
    });
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const handleSaveProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      await updateProfile({ name: nameInput, phone: phoneInput });
      setIsEditModalOpen(false);
      Alert.alert('Success', 'Profile details updated successfully.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleCancelOrder = (orderId) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to request cancellation for this order?',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Confirm Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelOrder(orderId);
              Alert.alert('Order Cancelled', 'Your order cancellation has been submitted.');
            } catch (err) {
              Alert.alert('Cancellation Error', err.message || 'Could not cancel order.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="My Account" showBack={false} showSearchPill={false} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        {/* 1. User Profile Header Card */}
        <View style={styles.profileCard}>
          {isAuthenticated ? (
            <View style={styles.authProfileRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>
                  {(currentUser?.name || currentUser?.fullName || currentUser?.email || 'M')
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileMeta}>
                <View style={styles.vipRow}>
                  <Text style={styles.profileName}>
                    {currentUser?.name || currentUser?.fullName || 'Valued Client'}
                  </Text>
                  <View style={styles.vipBadge}>
                    <Sparkles size={10} color={colors.goldLight} />
                    <Text style={styles.vipText}>PREMIUM MEMBER</Text>
                  </View>
                </View>
                <Text style={styles.profileEmail}>{currentUser?.email}</Text>
                {currentUser?.phone ? (
                  <Text style={styles.profilePhone}>{currentUser.phone}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => {
                  setNameInput(currentUser?.name || currentUser?.fullName || '');
                  setPhoneInput(currentUser?.phone || '');
                  setIsEditModalOpen(true);
                }}
              >
                <Edit3 size={16} color={colors.goldHover} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.guestCard}>
              <View style={styles.guestTextWrap}>
                <Text style={styles.guestTitle}>Welcome to Murari's Glam &amp; Glow</Text>
                <Text style={styles.guestSubtitle}>
                  Sign in or create an account to manage orders, wishlist &amp; addresses.
                </Text>
              </View>
              <View style={styles.guestActionRow}>
                <TouchableOpacity
                  style={styles.loginBtn}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.loginBtnText}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.signupBtn}
                  onPress={() => navigation.navigate('Signup')}
                >
                  <Text style={styles.signupBtnText}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* KPI Stat Chips */}
          <View style={styles.kpiRow}>
            <TouchableOpacity
              style={styles.kpiChip}
              onPress={() => setActiveView(activeView === 'orders' ? 'menu' : 'orders')}
            >
              <Package size={18} color={colors.gold} />
              <Text style={styles.kpiNumber}>{orders?.length || 0}</Text>
              <Text style={styles.kpiLabel}>Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.kpiChip}
              onPress={() => navigation.navigate('WishlistTab')}
            >
              <Heart size={18} color={colors.danger} />
              <Text style={styles.kpiNumber}>{wishlist?.length || 0}</Text>
              <Text style={styles.kpiLabel}>Wishlist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.kpiChip}
              onPress={() => navigation.navigate('CartTab')}
            >
              <ShoppingBag size={18} color={colors.primary} />
              <Text style={styles.kpiNumber}>{cartItemCount || 0}</Text>
              <Text style={styles.kpiLabel}>Bag</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Order History View (if toggled or orders exist) */}
        {activeView === 'orders' && (
          <View style={styles.ordersSection}>
            <View style={styles.sectionTitleRow}>
              <Package size={18} color={colors.primary} />
              <Text style={styles.sectionHeaderTitle}>MY ORDERS &amp; SHIPMENTS</Text>
            </View>

            {orders.length === 0 ? (
              <View style={styles.noOrdersCard}>
                <Text style={styles.noOrdersText}>You have not placed any orders yet.</Text>
                <TouchableOpacity
                  style={styles.shopNowMiniBtn}
                  onPress={() => navigation.navigate('ShopTab')}
                >
                  <Text style={styles.shopNowMiniText}>Explore Collections</Text>
                </TouchableOpacity>
              </View>
            ) : (
              orders.map((ord) => (
                <View key={ord.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View>
                      <Text style={styles.orderNumberText}>Order #{ord.orderNumber || ord.id.slice(-6)}</Text>
                      <Text style={styles.orderDateText}>{ord.date}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        ord.status === 'delivered'
                          ? styles.statusDelivered
                          : ord.status === 'cancelled'
                          ? styles.statusCancelled
                          : styles.statusProcessing,
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {(ord.status || 'Confirmed').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Order Items */}
                  {(ord.items || []).map((it, idx) => (
                    <View key={idx} style={styles.orderItemRow}>
                      <Text style={styles.orderItemName} numberOfLines={1}>
                        {it.quantity}× {it.name}
                      </Text>
                      <Text style={styles.orderItemPrice}>
                        ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  ))}

                  <View style={styles.orderDivider} />

                  <View style={styles.orderFooter}>
                    <Text style={styles.orderTotalText}>
                      Total: ₹{ord.total?.toLocaleString('en-IN')}
                    </Text>

                    {ord.status !== 'cancelled' && ord.status !== 'delivered' && (
                      <TouchableOpacity
                        style={styles.cancelOrderBtn}
                        onPress={() => handleCancelOrder(ord.id)}
                      >
                        <Text style={styles.cancelOrderText}>Cancel Order</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* 3. Section: Customer Service & Policies */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupHeader}>POLICIES &amp; STORE LEGAL</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => openWebLink('https://murarisglamandglow.com/privacy-policy')}
          >
            <View style={styles.menuItemLeft}>
              <Shield size={18} color={colors.primary} />
              <Text style={styles.menuItemText}>Privacy Policy</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => openWebLink('https://murarisglamandglow.com/terms')}
          >
            <View style={styles.menuItemLeft}>
              <FileText size={18} color={colors.primary} />
              <Text style={styles.menuItemText}>Terms &amp; Conditions</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => openWebLink('https://murarisglamandglow.com/shipping-policy')}
          >
            <View style={styles.menuItemLeft}>
              <Truck size={18} color={colors.primary} />
              <Text style={styles.menuItemText}>Shipping &amp; Delivery Policy</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('ReturnsPolicy')}
          >
            <View style={styles.menuItemLeft}>
              <RotateCcw size={18} color={colors.primary} />
              <Text style={styles.menuItemText}>Returns &amp; Exchange Policy</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => openWebLink('https://murarisglamandglow.com/cancellation-policy')}
          >
            <View style={styles.menuItemLeft}>
              <Ban size={18} color={colors.primary} />
              <Text style={styles.menuItemText}>Cancellation &amp; Refund Policy</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 4. Section: Support & Concierge */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupHeader}>SUPPORT &amp; CONCIERGE</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => openWebLink('https://murarisglamandglow.com/contact')}
          >
            <View style={styles.menuItemLeft}>
              <PhoneCall size={18} color={colors.goldHover} />
              <Text style={styles.menuItemText}>Contact Us &amp; Concierge</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => openWebLink('https://murarisglamandglow.com/faq')}
          >
            <View style={styles.menuItemLeft}>
              <HelpCircle size={18} color={colors.primary} />
              <Text style={styles.menuItemText}>Frequently Asked Questions (FAQ)</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => openWebLink('https://murarisglamandglow.com/about')}
          >
            <View style={styles.menuItemLeft}>
              <Info size={18} color={colors.primary} />
              <Text style={styles.menuItemText}>About Murari's Glam &amp; Glow</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 5. Section: Account Security & Delete Account */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupHeader}>ACCOUNT PRIVACY &amp; ACTIONS</Text>

          <TouchableOpacity
            style={[styles.menuItem, styles.deleteAccountItem]}
            onPress={() => navigation.navigate('DeleteAccount')}
          >
            <View style={styles.menuItemLeft}>
              <UserX size={18} color={colors.danger} />
              <Text style={[styles.menuItemText, styles.deleteAccountText]}>
                Delete Account / Data Deletion
              </Text>
            </View>
            <ChevronRight size={18} color={colors.danger} />
          </TouchableOpacity>

          {isAuthenticated && (
            <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
              <LogOut size={18} color={colors.danger} />
              <Text style={styles.logoutText}>Sign Out of Account</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer Brand Credit */}
        <View style={styles.footerBrand}>
          <Text style={styles.footerBrandText}>MURARI'S GLAM &amp; GLOW</Text>
          <Text style={styles.versionText}>Version 1.0.0 • Mobile App</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalOpen}
        transparent
        animationType="slide"
        statusBarTranslucent={Platform.OS === 'android'}
        onRequestClose={closeEditModal}
      >
        <View
          style={[
            styles.modalBackdrop,
            editKeyboardHeight > 0 && {
              paddingBottom: editKeyboardHeight,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={closeEditModal}
          />

          <View
            style={[
              styles.editProfileSheet,
              editKeyboardHeight > 0 && {
                maxHeight: Math.max(
                  260,
                  Dimensions.get('window').height -
                    editKeyboardHeight -
                    (Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 44)
                ),
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              },
            ]}
          >
            <View style={styles.editSheetHeader}>
              <Text style={styles.editSheetTitle}>Edit Profile Information</Text>
              <TouchableOpacity
                onPress={closeEditModal}
                style={styles.editCloseBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing.lg }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              bounces={false}
            >
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Your Full Name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={phoneInput}
                  onChangeText={setPhoneInput}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.editModalActions}>
                <TouchableOpacity
                  style={styles.editCancelBtn}
                  onPress={closeEditModal}
                >
                  <Text style={styles.editCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editSaveBtn}
                  onPress={handleSaveProfile}
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <Text style={styles.editSaveText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  scrollBody: {
    paddingBottom: spacing.xxxl,
  },
  profileCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.sm,
  },
  authProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarInitial: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.goldLight,
  },
  profileMeta: {
    flex: 1,
  },
  vipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  profileName: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  vipText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    color: colors.surface,
    letterSpacing: 0.5,
  },
  profileEmail: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profilePhone: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.goldHover,
    marginTop: 1,
  },
  editBtn: {
    padding: spacing.xs,
  },
  guestCard: {
    marginBottom: spacing.md,
  },
  guestTextWrap: {
    marginBottom: spacing.md,
  },
  guestTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  guestSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  guestActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  loginBtn: {
    flex: 1,
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.surface,
  },
  signupBtn: {
    flex: 1,
    height: 44,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
  },
  kpiRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  kpiChip: {
    alignItems: 'center',
    flex: 1,
  },
  kpiNumber: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
    marginVertical: 2,
  },
  kpiLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  ordersSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  sectionHeaderTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  noOrdersCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  noOrdersText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  shopNowMiniBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.full,
  },
  shopNowMiniText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.surface,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  orderNumberText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  orderDateText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  statusDelivered: {
    backgroundColor: colors.successLight,
  },
  statusProcessing: {
    backgroundColor: colors.warningLight,
  },
  statusCancelled: {
    backgroundColor: colors.dangerLight,
  },
  statusBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.primary,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  orderItemName: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  orderItemPrice: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textPrimary,
  },
  orderDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  orderTotalText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
  },
  cancelOrderBtn: {
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.xs,
  },
  cancelOrderText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.danger,
  },
  menuGroup: {
    backgroundColor: colors.surface,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  groupHeader: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1.2,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuItemText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  deleteAccountItem: {
    borderBottomWidth: 0,
  },
  deleteAccountText: {
    color: colors.danger,
    fontFamily: fonts.semiBold,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  logoutText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.danger,
  },
  footerBrand: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerBrandText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: 2,
  },
  versionText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textMuted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  editProfileSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.md,
    maxHeight: '85%',
    ...shadows.lg,
  },
  editSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  editSheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  editCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  inputWrap: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  textInput: {
    height: 44,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textPrimary,
  },
  editModalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  editCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editCancelText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  editSaveBtn: {
    flex: 2,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editSaveText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.surface,
  },
});

export default AccountScreen;
