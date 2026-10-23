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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Shield, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react-native';
import { colors, fonts, spacing, radius, shadows } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

export const LoginScreen = ({ navigation }) => {
  const { login, loginWithOtp, requestOtp } = useAuth();
  const { showToast } = useStore();

  const [mode, setMode] = useState('password'); // 'password' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePasswordLogin = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      await login(email.trim(), password);
      showToast({
        type: 'success',
        title: 'Welcome Back!',
        message: 'Signed in successfully.',
      });
      navigation.replace('MainTabs');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      await requestOtp(email.trim());
      setOtpSent(true);
      showToast({
        type: 'info',
        title: 'OTP Dispatched',
        message: 'A 6-digit verification code has been sent to your email.',
      });
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to send OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    if (!email.trim() || !otpCode.trim()) {
      setErrorMessage('Please enter your email and 6-digit OTP code.');
      return;
    }
    if (otpCode.trim().length !== 6) {
      setErrorMessage('OTP code must be exactly 6 digits.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      await loginWithOtp(email.trim(), otpCode.trim());
      showToast({
        type: 'success',
        title: 'Welcome Back!',
        message: 'Signed in successfully with OTP.',
      });
      navigation.replace('MainTabs');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Invalid or expired OTP code.');
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
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={22} color={colors.primary} />
          </TouchableOpacity>

        {/* Brand Logo & Heading */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to access your orders, saved addresses &amp; luxury wishlist
          </Text>
        </View>

        {/* Auth Mode Toggle Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, mode === 'password' && styles.tabBtnActive]}
            onPress={() => {
              setMode('password');
              setErrorMessage('');
            }}
          >
            <Text style={[styles.tabText, mode === 'password' && styles.tabTextActive]}>
              Password Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, mode === 'otp' && styles.tabBtnActive]}
            onPress={() => {
              setMode('otp');
              setErrorMessage('');
            }}
          >
            <Text style={[styles.tabText, mode === 'otp' && styles.tabTextActive]}>
              OTP Login
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Alert */}
        {errorMessage ? (
          <View style={styles.errorCard}>
            <AlertCircle size={18} color={colors.danger} style={styles.errorIcon} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
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

          {mode === 'password' ? (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrap}>
                <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>
          ) : (
            otpSent && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>6-Digit OTP Code</Text>
                <View style={styles.inputWrap}>
                  <Shield size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor={colors.textMuted}
                    value={otpCode}
                    onChangeText={setOtpCode}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            )
          )}

          {/* Action Buttons */}
          {mode === 'password' ? (
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handlePasswordLogin}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Sign In</Text>
                  <ArrowRight size={16} color={colors.surface} />
                </>
              )}
            </TouchableOpacity>
          ) : !otpSent ? (
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleRequestOtp}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Send OTP Code</Text>
                  <ArrowRight size={16} color={colors.surface} />
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleOtpLogin}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Verify &amp; Sign In</Text>
                  <ArrowRight size={16} color={colors.surface} />
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Create Account Link */}
          <View style={styles.signupRow}>
            <Text style={styles.signupPrompt}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}> Create One</Text>
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
    paddingBottom: Platform.OS === 'ios' ? 50 : 80,
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
    width: 180,
    height: 60,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabBtnActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tabText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  tabTextActive: {
    fontFamily: fonts.bold,
    color: colors.primary,
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
    gap: spacing.md,
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
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: radius.md,
    gap: 8,
    marginTop: spacing.sm,
  },
  submitBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.surface,
    letterSpacing: 0.5,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  signupPrompt: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  signupLink: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.goldHover,
  },
});

export default LoginScreen;
