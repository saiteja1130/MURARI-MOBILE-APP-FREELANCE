import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, Lock, Phone, ArrowRight, ArrowLeft, Check, AlertCircle } from 'lucide-react-native';
import { colors, fonts, spacing, radius } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

export const SignupScreen = ({ navigation }) => {
  const { signup, login } = useAuth();
  const { showToast } = useStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignup = async () => {
    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    const cleanPhone = phone.trim().replace(/[\s-+]/g, '');
    if (phone.trim() && !/^[6-9]\d{9}$/.test(cleanPhone.slice(-10))) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (!agreedToTerms) {
      setErrorMessage('Please accept our terms and privacy policy to continue.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await signup({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim(),
      });

      showToast({
        type: 'success',
        title: 'Account Created!',
        message: 'Welcome to Murari\'s Glam & Glow.',
      });

      // Auto-login after successful registration
      try {
        await login(email.trim(), password.trim());
        navigation.replace('MainTabs');
      } catch (loginErr) {
        showToast({
          type: 'info',
          title: 'Sign In Required',
          message: 'Account created! Please sign in with your credentials.',
        });
        navigation.replace('Login');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bounces={true}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={22} color={colors.primary} />
          </TouchableOpacity>

        <View style={styles.header}>
          <Image
            source={require('../../assets/images/Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Join Glam &amp; Glow</Text>
          <Text style={styles.subtitle}>
            Create your account to unlock curated designer collections and seamless checkout
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorCard}>
            <AlertCircle size={18} color={colors.danger} style={styles.errorIcon} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <View style={styles.inputWrap}>
              <User size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Ananya Rao"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address *</Text>
            <View style={styles.inputWrap}>
              <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="youremail@domain.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Phone (Optional)</Text>
            <View style={styles.inputWrap}>
              <Phone size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="10-digit phone number"
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Create Password *</Text>
            <View style={styles.inputWrap}>
              <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* Terms Agreement */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxActive]}>
              {agreedToTerms && <Check size={14} color={colors.surface} />}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text
                style={styles.termsLink}
                onPress={() => Linking.openURL('https://murarisglamandglow.com/terms')}
              >
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text
                style={styles.termsLink}
                onPress={() => Linking.openURL('https://murarisglamandglow.com/privacy-policy')}
              >
                Privacy Policy
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSignup}
            disabled={isLoading}
            activeOpacity={0.88}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Create Account</Text>
                <ArrowRight size={16} color={colors.surface} />
              </>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}> Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollBody: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 60 : 90,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  logo: {
    width: 170,
    height: 55,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
  },
  errorCard: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(140, 51, 34, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorIcon: {
    flexShrink: 0,
  },
  errorText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.danger,
    lineHeight: 18,
  },
  form: {
    gap: spacing.sm,
  },
  inputGroup: {},
  inputLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textPrimary,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  termsText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  termsLink: {
    fontFamily: fonts.bold,
    color: colors.goldHover,
    textDecorationLine: 'underline',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: radius.md,
    gap: 8,
    marginTop: spacing.xs,
  },
  submitBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.surface,
    letterSpacing: 0.5,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  loginPrompt: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  loginLink: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.goldHover,
  },
});

export default SignupScreen;
