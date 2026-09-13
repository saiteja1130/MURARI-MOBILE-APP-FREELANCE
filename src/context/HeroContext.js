import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/api';

const HeroContext = createContext(undefined);

export const HeroProvider = ({ children }) => {
  const [heroSlides, setHeroSlides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHeroSlides = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/hero');
      if (response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        const mapped = response.data.data.map((slide, index) => ({
          id: slide._id || `slide-${index}`,
          title: slide.title,
          heading: slide.title,
          subtitle: slide.subtitle || '',
          subheading: slide.subtitle || '',
          image: slide.image,
          ctaText: slide.ctaText || 'Explore Collection',
          cta: slide.ctaText || 'Explore Collection',
          ctaLink: slide.ctaLink || '/products',
          categorySlug: slide.ctaLink?.replace(/^\/products\/?/, '') || 'All',
          order: slide.order ?? index,
        }));
        setHeroSlides(mapped);
      }
    } catch (error) {
      console.warn('Live hero slides fetch unavailable:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHeroSlides();
  }, []);

  return (
    <HeroContext.Provider
      value={{
        heroSlides,
        isLoading,
        refetchHeroSlides: fetchHeroSlides,
      }}
    >
      {children}
    </HeroContext.Provider>
  );
};

export const useHero = () => {
  const context = useContext(HeroContext);
  if (!context) {
    throw new Error('useHero must be used within a HeroProvider');
  }
  return context;
};

export default HeroContext;
