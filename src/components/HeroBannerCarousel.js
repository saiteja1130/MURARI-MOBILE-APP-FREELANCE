import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing, radius } from '../utils/theme';
import { useHero } from '../context/HeroContext';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - spacing.md * 2;
const BANNER_HEIGHT = BANNER_WIDTH * 0.55;



export const HeroBannerCarousel = () => {
  const navigation = useNavigation();
  const { heroSlides } = useHero();
  const slides = heroSlides && heroSlides.length > 0 ? heroSlides : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  // Auto scroll every 5 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % slides.length;
        flatListRef.current?.scrollToOffset({
          offset: next * BANNER_WIDTH,
          animated: true,
        });
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handleScroll = (event) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / BANNER_WIDTH);
    if (index !== activeIndex && index >= 0 && index < slides.length) {
      setActiveIndex(index);
    }
  };

  const handleBannerPress = (slide) => {
    navigation.navigate('ShopTab', {
      selectedCategory: slide.categorySlug || 'All',
    });
  };

  const renderBanner = ({ item }) => (
    <TouchableOpacity
      style={styles.bannerContainer}
      activeOpacity={0.92}
      onPress={() => handleBannerPress(item)}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.bannerImage}
        resizeMode="cover"
      />
      <View style={styles.overlay} />

      <View style={styles.contentWrapper}>
        <View style={styles.badgeRow}>
          <Sparkles size={12} color={colors.gold} />
          <Text style={styles.badgeText}>EXCLUSIVE COUTURE</Text>
        </View>

        <Text style={styles.heading} numberOfLines={2}>
          {item.heading || item.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {item.subtitle || item.subheading}
        </Text>

        <View style={styles.ctaButton}>
          <Text style={styles.ctaText}>{item.cta || 'Shop Now'}</Text>
          <ArrowRight size={14} color={colors.surface} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBanner}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        decelerationRate="fast"
        snapToInterval={BANNER_WIDTH}
        contentContainerStyle={styles.listContent}
      />

      {/* Pagination Dots */}
      {slides.length > 1 && (
        <View style={styles.dotsRow}>
          {slides.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === activeIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
  },
  bannerContainer: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.primary,
    marginRight: 10
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(29, 36, 28, 0.45)',
  },
  contentWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    justifyContent: 'flex-end',
  },
  badgeRow: {
    flexDirection: 'row',
    // alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 1.5,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#000",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: '#4e4e4eff',
    marginBottom: spacing.md,
    width: 180
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.gold,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    gap: 6,
  },
  ctaText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.surface,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  activeDot: {
    width: 18,
    backgroundColor: colors.gold,
  },
});

export default HeroBannerCarousel;
