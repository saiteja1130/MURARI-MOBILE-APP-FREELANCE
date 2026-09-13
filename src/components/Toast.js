import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Check, X, AlertCircle, ShoppingBag, Heart, Info } from 'lucide-react-native';
import { colors, fonts, spacing, radius, shadows } from '../utils/theme';
import { useStore } from '../context/StoreContext';

export const ToastContainer = () => {
  const { toasts, dismissToast } = useStore();

  if (!toasts || toasts.length === 0) return null;

  const renderIcon = (type) => {
    switch (type) {
      case 'cart':
        return <ShoppingBag size={18} color={colors.gold} />;
      case 'wishlist':
        return <Heart size={18} color={colors.danger} fill={colors.danger} />;
      case 'success':
        return <Check size={18} color={colors.success} />;
      case 'error':
        return <AlertCircle size={18} color={colors.danger} />;
      default:
        return <Info size={18} color={colors.primary} />;
    }
  };

  return (
    <SafeAreaView pointerEvents="box-none" style={styles.container}>
      {toasts.map((toast) => (
        <TouchableOpacity
          key={toast.id}
          style={styles.toastCard}
          activeOpacity={0.9}
          onPress={() => dismissToast(toast.id)}
        >
          {toast.image ? (
            <Image
              source={{ uri: toast.image }}
              style={styles.toastImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.iconCircle}>{renderIcon(toast.type)}</View>
          )}

          <View style={styles.textContainer}>
            {toast.title ? (
              <Text style={styles.toastTitle} numberOfLines={1}>
                {toast.title}
              </Text>
            ) : null}
            <Text style={styles.toastMessage} numberOfLines={2}>
              {toast.message}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => dismissToast(toast.id)}
            style={styles.closeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
    gap: spacing.xs,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  toastImage: {
    width: 40,
    height: 48,
    borderRadius: radius.xs,
    marginRight: spacing.sm,
    backgroundColor: colors.surfaceAlt,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  toastTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  toastMessage: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
    marginLeft: spacing.xs,
  },
});

export default ToastContainer;
