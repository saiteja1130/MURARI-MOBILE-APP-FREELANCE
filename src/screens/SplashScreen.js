import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { colors, fonts } from '../utils/theme';

const { width } = Dimensions.get('window');

export const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const lineAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Run sequence of animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(lineAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: false,
        }),
      ]),
    ]).start();

    // Transition after splash animation
    const timer = setTimeout(() => {
      navigation.replace('MainTabs');
    }, 2400);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, scaleAnim, textFadeAnim, lineAnim]);

  const lineWidth = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.45],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.content}>
        {/* Animated Brand Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require('../../assets/images/Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Brand Accent Golden Line */}
        <Animated.View style={[styles.goldLine, { width: lineWidth }]} />

        {/* Animated Subtitle / Tagline */}
        <Animated.View style={{ opacity: textFadeAnim, alignItems: 'center' }}>
          <Text style={styles.tagline}>MURARI'S GLAM &amp; GLOW</Text>
          <Text style={styles.subtext}>Luxury Fashion &amp; Timeless Elegance</Text>
        </Animated.View>
      </View>

      {/* Footer copyright / established badge */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>HAUTE COUTURE • FINE ATTIRE</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 220,
    height: 110,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  goldLine: {
    height: 2,
    backgroundColor: colors.gold,
    borderRadius: 2,
    marginVertical: 14,
  },
  tagline: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.gold,
    letterSpacing: 3,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#D4D0C8',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 36,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 2,
  },
});

export default SplashScreen;
