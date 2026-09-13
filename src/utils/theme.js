export const colors = {
  primary: '#1D241C',
  primaryLight: '#2D382B',
  gold: '#C69E58',
  goldHover: '#A87C38',
  goldLight: '#F3E6D0',
  goldPale: '#FBF7F0',
  background: '#FAF8F5',
  surface: '#FFFFFF',
  surfaceAlt: '#F3EFEA',
  botanical: '#506040',
  border: '#E8E4DC',
  borderLight: '#F2EFE9',
  textPrimary: '#1D241C',
  textSecondary: '#687163',
  textMuted: '#8A9286',
  textLight: '#A3A8A0',
  danger: '#8C3322',
  dangerLight: '#FDF2F0',
  success: '#2E6930',
  successLight: '#F0FDF4',
  warning: '#B45309',
  warningLight: '#FEF3C7',
  overlay: 'rgba(0, 0, 0, 0.5)',
  transparent: 'transparent',
};

export const fonts = {
  regular: 'Inter_18pt-Regular',
  medium: 'Inter_18pt-Medium',
  semiBold: 'Inter_18pt-SemiBold',
  bold: 'Inter_18pt-Bold',
  extraBold: 'Inter_18pt-ExtraBold',
  black: 'Inter_18pt-Black',
  italic: 'Inter_18pt-Italic',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  none: {
    elevation: 0,
  },
  sm: {
    elevation: 2,
    shadowColor: '#1D241C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  md: {
    elevation: 4,
    shadowColor: '#1D241C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  lg: {
    elevation: 8,
    shadowColor: '#1D241C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
};

export default {
  colors,
  fonts,
  spacing,
  radius,
  shadows,
};
