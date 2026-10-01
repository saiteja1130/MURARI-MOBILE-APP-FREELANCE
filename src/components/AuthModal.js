import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
  Keyboard,
  Dimensions,
  StatusBar,
} from 'react-native';
import { X, Lock, Mail, ArrowRight, Shield, User, Phone } from 'lucide-react-native';
import { colors, fonts, spacing, radius, shadows } from '../utils/theme';
import { useAuth } from '../context/AuthContext';

export const AuthModal = () => {
  const {
    isAuthModalOpen,
    authModalConfig,
    closeAuthModal,
    login,
    signup,
    loginWithOtp,
    requestOtp,
  } = useAuth();

  // Active top tab: 'signin' | 'signup'
  const [activeTab, setActiveTab] = useState('signin');
  // Sign-in sub-mode: 'password' | 'otp'
  const [authMode, setAuthMode] = useState('password');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Active keyboard tracking to elevate modal above Android/iOS soft keyboards
  useEffect(() => {
    const onShow = (e) => {
      const h = e.endCoordinates ? e.endCoordinates.height : (e.height || 0);
      setKeyboardHeight(h);
    };
    const onHide = () => {
      setKeyboardHeight(0);
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

  // Sync mode when modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
      setActiveTab(authModalConfig.mode === 'signup' ? 'signup' : 'signin');
      setErrorMessage('');
      setOtpSent(false);
      setOtpCode('');
      setKeyboardHeight(0);
    }
  }, [isAuthModalOpen, authModalConfig.mode]);

  const handleClose = () => {
    Keyboard.dismiss();
    setKeyboardHeight(0);
    closeAuthModal();
  };

  if (!isAuthModalOpen) return null;

  const handlePasswordLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in your email and password');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      await login(email.trim(), password.trim());
      Keyboard.dismiss();
      const successCb = authModalConfig?.onSuccess;
      closeAuthModal();
      if (typeof successCb === 'function') {
        setTimeout(() => {
          try {
            successCb();
          } catch (cbErr) {
            console.warn('Post-auth callback error:', cbErr);
          }
        }, 120);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      await requestOtp(email.trim());
      setOtpSent(true);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to send OTP code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    if (!email.trim() || !otpCode.trim()) {
      setErrorMessage('Please enter email and 6-digit OTP code');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      await loginWithOtp(email.trim(), otpCode.trim());
      Keyboard.dismiss();
      const successCb = authModalConfig?.onSuccess;
      closeAuthModal();
      if (typeof successCb === 'function') {
        setTimeout(() => {
          try {
            successCb();
          } catch (cbErr) {
            console.warn('Post-auth callback error:', cbErr);
          }
        }, 120);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Invalid or expired OTP code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Please enter your name, email, and password.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      await signup({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || '9876543210',
        password: password.trim(),
      });

      // Auto-login after successful registration
      try {
        await login(email.trim(), password.trim());
      } catch (loginErr) {
        // In case auto-login is needed with verification
      }

      Keyboard.dismiss();
      const successCb = authModalConfig?.onSuccess;
      closeAuthModal();
      if (typeof successCb === 'function') {
        setTimeout(() => {
          try {
            successCb();
          } catch (cbErr) {
            console.warn('Post-auth callback error:', cbErr);
          }
        }, 120);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const screenHeight = Dimensions.get('window').height;
  const sheetMaxHeight = keyboardHeight > 0
    ? Math.max(260, screenHeight - keyboardHeight - (Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 44))
    : '92%';

  return (
    <Modal
      visible={isAuthModalOpen}
      transparent
      animationType="slide"
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={handleClose}
    >
      <View
        style={[
          styles.backdrop,
          keyboardHeight > 0 && {
            paddingBottom: keyboardHeight,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View
          style={[
            styles.sheetContainer,
            keyboardHeight > 0 && {
              maxHeight: sheetMaxHeight,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            },
          ]}
        >
          {/* Header Row with Safe Boundaries */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {activeTab === 'signup'
                  ? 'Create an Account'
                  : (authModalConfig.title || 'Sign In')}
              </Text>
              <Text style={styles.sheetSubtitle}>
                {activeTab === 'signup'
                  ? 'Join Murari\'s Glam & Glow for curated collections & fast checkout'
                  : (authModalConfig.message || 'Sign in to access your bag & wishlist')}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Main Mode Switcher Tabs (Sign In vs Create Account) */}
          <View style={styles.mainTabRow}>
            <TouchableOpacity
              style={[styles.mainTabBtn, activeTab === 'signin' && styles.mainTabBtnActive]}
              onPress={() => {
                setActiveTab('signin');
                setErrorMessage('');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.mainTabText, activeTab === 'signin' && styles.mainTabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mainTabBtn, activeTab === 'signup' && styles.mainTabBtnActive]}
              onPress={() => {
                setActiveTab('signup');
                setErrorMessage('');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.mainTabText, activeTab === 'signup' && styles.mainTabTextActive]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Form Content */}
          <ScrollView
            style={styles.formScrollView}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.scrollForm}
            bounces={false}
          >
            {/* Sub Mode Pills for Sign In (Password vs OTP) */}
            {activeTab === 'signin' && (
              <View style={styles.subTabRow}>
                <TouchableOpacity
                  style={[styles.subTabPill, authMode === 'password' && styles.subTabPillActive]}
                  onPress={() => {
                    setAuthMode('password');
                    setErrorMessage('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.subTabPillText, authMode === 'password' && styles.subTabPillTextActive]}>
                    Password Login
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.subTabPill, authMode === 'otp' && styles.subTabPillActive]}
                  onPress={() => {
                    setAuthMode('otp');
                    setErrorMessage('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.subTabPillText, authMode === 'otp' && styles.subTabPillTextActive]}>
                    OTP Login
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Error Alert Banner */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Inputs for Sign In */}
            {activeTab === 'signin' ? (
              <View style={styles.form}>
                <View style={styles.inputWrap}>
                  <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Email address"
                    placeholderTextColor={colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {authMode === 'password' ? (
                  <View style={styles.inputWrap}>
                    <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Password"
                      placeholderTextColor={colors.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>
                ) : (
                  otpSent && (
                    <View style={styles.inputWrap}>
                      <Shield size={18} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter 6-digit OTP code"
                        placeholderTextColor={colors.textMuted}
                        value={otpCode}
                        onChangeText={setOtpCode}
                        keyboardType="number-pad"
                      />
                    </View>
                  )
                )}

                {/* Sign In Action Button */}
                {authMode === 'password' ? (
                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handlePasswordLogin}
                    disabled={isLoading}
                    activeOpacity={0.85}
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
                    activeOpacity={0.85}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={colors.surface} />
                    ) : (
                      <>
                        <Text style={styles.submitBtnText}>Send Verification Code</Text>
                        <ArrowRight size={16} color={colors.surface} />
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleOtpLogin}
                    disabled={isLoading}
                    activeOpacity={0.85}
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

                {/* Switch to Sign Up Link */}
                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>New to Glam &amp; Glow? </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setActiveTab('signup');
                      setErrorMessage('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.footerLink}>Create an Account</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Inputs for Create Account (Sign Up) */
              <View style={styles.form}>
                <View style={styles.inputWrap}>
                  <User size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Full Name"
                    placeholderTextColor={colors.textMuted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputWrap}>
                  <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Email address"
                    placeholderTextColor={colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputWrap}>
                  <Phone size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Mobile number"
                    placeholderTextColor={colors.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputWrap}>
                  <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Password"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                {/* Sign Up Action Button */}
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSignup}
                  disabled={isLoading}
                  activeOpacity={0.85}
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

                {/* Switch to Sign In Link */}
                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setActiveTab('signin');
                      setErrorMessage('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.footerLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.md,
    maxHeight: '92%',
    ...shadows.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 19,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  mainTabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.md,
  },
  mainTabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  mainTabBtnActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  mainTabText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  mainTabTextActive: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  formScrollView: {
    flexShrink: 1,
  },
  scrollForm: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  subTabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  subTabPill: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subTabPillActive: {
    backgroundColor: colors.goldPale,
    borderColor: colors.gold,
  },
  subTabPillText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  subTabPillTextActive: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.danger,
    lineHeight: 16,
  },
  form: {
    gap: spacing.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
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
    height: 48,
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  footerLink: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.goldHover,
    textDecorationLine: 'underline',
  },
});

export default AuthModal;
