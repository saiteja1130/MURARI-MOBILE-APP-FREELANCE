import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { RotateCcw } from 'lucide-react-native';
import { colors, fonts, spacing, radius } from '../utils/theme';
import Header from '../components/Header';

export const ReturnsPolicyScreen = () => {
  return (
    <View style={styles.container}>
      <Header title="Returns Policy" showBack={true} showSearchPill={false} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        <View style={styles.card}>
          <View style={styles.iconRow}>
            <RotateCcw size={20} color={colors.gold} />
            <Text style={styles.badgeText}>7-DAY DOORSTEP EXCHANGE &amp; RETURN</Text>
          </View>
          <Text style={styles.title}>Returns &amp; Exchange Policy</Text>

          <Text style={styles.heading}>1. Eligibility Period</Text>
          <Text style={styles.bodyText}>
            We offer a hassle-free 7-day return and size exchange policy commencing from the date your package is marked delivered by the courier partner.
          </Text>

          <Text style={styles.heading}>2. Condition of Garments</Text>
          <Text style={styles.bodyText}>
            To qualify for an exchange or refund, items must be:
            {'\n'}• Unworn, unwashed, and undamaged.
            {'\n'}• Complete with original brand tags and designer packaging intact.
            {'\n'}• Free from perfume scents, makeup blemishes, or alterations.
          </Text>

          <Text style={styles.heading}>3. Doorstep Pickup Service</Text>
          <Text style={styles.bodyText}>
            Once your return or exchange request is authorized, our courier partner will coordinate a reverse pickup from your registered address within 24 to 48 hours.
          </Text>

          <Text style={styles.heading}>4. Non-Returnable Articles</Text>
          <Text style={styles.bodyText}>
            Custom-tailored blouse stitchings, final clearance items marked non-returnable, and hair accessories are non-exchangeable due to hygienic standards.
          </Text>
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
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.goldHover,
    letterSpacing: 1,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: 4,
  },
  bodyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 6,
  },
});

export default ReturnsPolicyScreen;
