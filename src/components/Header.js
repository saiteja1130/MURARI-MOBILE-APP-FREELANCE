import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { Search, ShoppingBag, Heart, ArrowLeft, SlidersHorizontal, Sparkles, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing, radius } from '../utils/theme';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { navigationRef } from '../navigations/AppNavigator';

/**
 * Modern E-Commerce Mobile App Header
 * Features:
 * - Brand bar with luxury logo & live counters (Account, Wishlist & Cart)
 * - Safe nested navigation across stack and tab contexts
 * - Integrated native search pill with filter trigger
 * - Micro-marquee for promotional announcements
 */
export const Header = ({
  title,
  showBack = false,
  onBack,
  showLogo,
  showSearchPill = true,
  searchPlaceholder = 'Search sarees, lehengas, kurtis...',
  onFilterPress,
  showPromoBanner = false,
  showRightActions = true,
  showWishlistAction = true,
  showCartAction = true,
  showAccountAction = true,
}) => {
  const navigation = useNavigation();
  const { openSearch, cartItemCount, wishlist } = useStore();
  const { currentUser } = useAuth();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const navigateToTab = (tabName) => {
    try {
      if (navigation && typeof navigation.navigate === 'function') {
        navigation.navigate('MainTabs', { screen: tabName });
        return;
      }
    } catch (e) {
      // Fall through to navigationRef
    }
    if (navigationRef && navigationRef.isReady()) {
      navigationRef.navigate('MainTabs', { screen: tabName });
    }
  };

  // Only show the brand logo when explicitly set to true OR on Home screen (no title and no back button)
  const shouldShowLogo = showLogo !== undefined ? showLogo : (!title && !showBack);

  return (
    <View style={styles.headerWrapper}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Top Brand & Actions Bar */}
      <View style={styles.topRow}>
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowLeft size={22} color={colors.primary} />
            </TouchableOpacity>
          )}

          {shouldShowLogo ? (
            <TouchableOpacity
              onPress={() => navigateToTab('HomeTab')}
              activeOpacity={0.8}
              style={styles.brandContainer}
            >
              <Image
                source={require('../../assets/images/Logo2.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ) : (
            title ? (
              <Text
                style={[
                  styles.screenTitle,
                  showBack && styles.screenTitleWithBack,
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
            ) : null
          )}
        </View>

        {/* Right Icon Actions: Account, Wishlist & Bag */}
        {showRightActions && (
          <View style={styles.rightActions}>
            {showAccountAction && (
              <TouchableOpacity
                onPress={() => navigateToTab('AccountTab')}
                style={styles.actionIconBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <User size={21} color={colors.primary} />
                {currentUser && (
                  <View style={styles.authDotBadge} />
                )}
              </TouchableOpacity>
            )}

            {showWishlistAction && (
              <TouchableOpacity
                onPress={() => navigateToTab('WishlistTab')}
                style={styles.actionIconBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Heart size={21} color={colors.primary} />
                {wishlist && wishlist.length > 0 && (
                  <View style={styles.counterBadge}>
                    <Text style={styles.counterBadgeText}>
                      {wishlist.length > 99 ? '99+' : wishlist.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {showCartAction && (
              <TouchableOpacity
                onPress={() => navigateToTab('CartTab')}
                style={styles.actionIconBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ShoppingBag size={21} color={colors.primary} />
                {cartItemCount > 0 && (
                  <View style={[styles.counterBadge, styles.cartBadge]}>
                    <Text style={styles.counterBadgeText}>
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Integrated Native Mobile Search Pill (E-Commerce Style) */}
      {showSearchPill && (
        <View style={styles.searchPillWrapper}>
          <TouchableOpacity
            style={styles.searchPill}
            activeOpacity={0.85}
            onPress={openSearch}
          >
            <Search size={18} color={colors.textSecondary} style={styles.searchPillIcon} />
            <Text style={styles.searchPillPlaceholder} numberOfLines={1}>
              {searchPlaceholder}
            </Text>
            {onFilterPress ? (
              <TouchableOpacity
                onPress={onFilterPress}
                style={styles.filterInlineBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <SlidersHorizontal size={16} color={colors.gold} />
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
        </View>
      )}

      {/* Optional Top Announcement Strip */}
      {showPromoBanner && (
        <View style={styles.announcementStrip}>
          <Sparkles size={12} color={colors.gold} />
          <Text style={styles.announcementText}>
            Extra 15% OFF with code{' '}
            <Text style={styles.announcementCode}>SUMI15</Text> • Free Shipping ₹200+
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingTop: Platform.OS === 'android' ? 0 : 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    height: 48,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  brandContainer: {
    width: 145,
    height: 38,
  },
  brandLogo: {
    width: '100%',
    height: '100%',
  },
  screenTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
    flex: 1,
    letterSpacing: -0.3,
  },
  screenTitleWithBack: {
    fontSize: 18,
    marginLeft: spacing.xs,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  authDotBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  counterBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: colors.primary,
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  cartBadge: {
    backgroundColor: colors.gold,
  },
  counterBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.surface,
    textAlign: 'center',
  },
  searchPillWrapper: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchPillIcon: {
    marginRight: spacing.sm,
  },
  searchPillPlaceholder: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  filterInlineBtn: {
    paddingLeft: spacing.xs,
  },
  announcementStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldPale,
    paddingVertical: 5,
    paddingHorizontal: spacing.xl,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.goldLight,
  },
  announcementText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.2,
  },
  announcementCode: {
    fontFamily: fonts.bold,
    color: colors.goldHover,
  },
});

export default Header;
