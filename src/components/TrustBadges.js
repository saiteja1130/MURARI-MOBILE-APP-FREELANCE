import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, Truck, RefreshCw, Lock } from 'lucide-react-native';
import { colors, fonts, spacing, radius } from '../utils/theme';

const BADGES = [
  {
    icon: ShieldCheck,
    title: '100% Authentic',
    subtitle: 'Certified handloom fabrics',
  },
  {
    icon: Truck,
    title: 'Free Shipping',
    subtitle: 'On orders above ₹200',
  },
  {
    icon: RefreshCw,
    title: 'Easy Exchange',
    subtitle: '7-day doorstep pickup',
  },
  {
    icon: Lock,
    title: 'Secure Payment',
    subtitle: 'UPI, Cards & NetBanking',
  },
];

export const TrustBadges = () => {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {BADGES.map((badge, idx) => {
          const IconComp = badge.icon;
          return (
            <View key={idx} style={styles.badgeCard}>
              <View style={styles.iconCircle}>
                <IconComp size={18} color={colors.gold} />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.title}>{badge.title}</Text>
                <Text style={styles.subtitle}>{badge.subtitle}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    marginVertical: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeCard: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.goldPale,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 1,
  },
});

export default TrustBadges;
