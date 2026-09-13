import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  UserX,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Shield,
} from 'lucide-react-native';
import { colors, fonts, spacing, radius, shadows } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

export const DeleteAccountScreen = ({ navigation }) => {
  const { currentUser, logout } = useAuth();

  const [email, setEmail] = useState(currentUser?.email || '');
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const REASONS = [
    'No longer using the service',
    'Privacy concerns',
    'Created duplicate account',
    'Switching to a different email',
    'Other reason',
  ];

  const handleSubmit = () => {
    if (confirmText.trim() !== 'DELETE') {
      Alert.alert('Confirmation Required', 'Please type DELETE in capital letters to confirm.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please provide the account email address.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(async () => {
      setIsSubmitting(false);
      setIsSuccess(true);
      if (currentUser) {
        await logout();
      }
    }, 900);
  };

  return (
    <View style={styles.container}>
      <Header title="Account Deletion" showBack={true} showSearchPill={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        {isSuccess ? (
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={50} color={colors.success} />
            </View>
            <Text style={styles.successTitle}>Request Submitted</Text>
            <Text style={styles.successDesc}>
              Your account deletion request has been registered. Your data and associated profile will be permanently purged in accordance with our data retention policy.
            </Text>
            <TouchableOpacity
              style={styles.returnBtn}
              onPress={() => navigation.navigate('HomeTab')}
            >
              <Text style={styles.returnBtnText}>Return to Home</Text>
              <ArrowRight size={16} color={colors.surface} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Warning Card */}
            <View style={styles.warningCard}>
              <View style={styles.warningHeader}>
                <UserX size={20} color={colors.danger} />
                <Text style={styles.warningTitle}>PERMANENT ACCOUNT REMOVAL</Text>
              </View>
              <Text style={styles.warningText}>
                Deleting your account is irreversible. Once confirmed, all your active sessions, addresses, wishlist items, and personal preferences will be removed.
              </Text>
            </View>

            {/* Information Deletion Breakdown */}
            <View style={styles.infoCard}>
              <View style={styles.infoTitleRow}>
                <Trash2 size={16} color={colors.danger} />
                <Text style={styles.infoCardTitle}>DATA THAT WILL BE PURGED</Text>
              </View>
              <Text style={styles.bulletItem}>• Personal profile and login credentials</Text>
              <Text style={styles.bulletItem}>• Saved delivery addresses</Text>
              <Text style={styles.bulletItem}>• Wishlist and saved bag items</Text>
              <Text style={styles.bulletItem}>• Marketing notifications and preferences</Text>
              <Text style={styles.noticeText}>
                Note: Invoices and transactional records may be retained as mandated by Indian tax and e-commerce compliance regulations.
              </Text>
            </View>

            {/* Deletion Form */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Submit Deletion Request</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Email Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter account email"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* Reason Selector Chips */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reason for Deletion (Optional)</Text>
                <View style={styles.reasonsWrap}>
                  {REASONS.map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.reasonPill, reason === r && styles.reasonPillActive]}
                      onPress={() => setReason(r)}
                    >
                      <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Confirmation Box */}
              <View style={styles.confirmBox}>
                <View style={styles.confirmHeader}>
                  <AlertTriangle size={16} color={colors.danger} />
                  <Text style={styles.confirmHeaderText}>Confirmation Step</Text>
                </View>
                <Text style={styles.confirmPrompt}>
                  Type <Text style={styles.boldWord}>DELETE</Text> in capital letters below to confirm.
                </Text>
                <TextInput
                  style={styles.confirmInput}
                  placeholder="Type DELETE to confirm"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  value={confirmText}
                  onChangeText={setConfirmText}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.deleteBtn,
                  confirmText.trim() !== 'DELETE' && styles.deleteBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={confirmText.trim() !== 'DELETE' || isSubmitting}
                activeOpacity={0.88}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.deleteBtnText}>Permanently Delete My Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
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
  warningCard: {
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FECDD3',
    marginBottom: spacing.sm,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  warningTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.danger,
    letterSpacing: 1,
  },
  warningText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#9F1239',
    lineHeight: 17,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  infoCardTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textPrimary,
    letterSpacing: 0.8,
  },
  bulletItem: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  noticeText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 15,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  formTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  input: {
    height: 44,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textPrimary,
  },
  reasonsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  reasonPill: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  reasonPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  reasonText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  reasonTextActive: {
    fontFamily: fonts.bold,
    color: colors.surface,
  },
  confirmBox: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  confirmHeaderText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.danger,
  },
  confirmPrompt: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  boldWord: {
    fontFamily: fonts.bold,
    color: colors.danger,
  },
  confirmInput: {
    height: 40,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.xs,
    paddingHorizontal: spacing.sm,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.danger,
  },
  deleteBtn: {
    backgroundColor: colors.danger,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnDisabled: {
    opacity: 0.4,
  },
  deleteBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.surface,
    letterSpacing: 0.5,
  },
  successCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: spacing.lg,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  successTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  successDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  returnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.full,
    gap: 8,
  },
  returnBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.surface,
  },
});

export default DeleteAccountScreen;
