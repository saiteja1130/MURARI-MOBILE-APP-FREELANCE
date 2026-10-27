import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(undefined);

export const WishlistProvider = ({ children }) => {
  const { currentUser, token, requireAuth } = useAuth();

  const [wishlist, setWishlist] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchBackendWishlist = async () => {
      if (!token || !currentUser) {
        setWishlist([]);
        setWishlistProducts([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await api.get('/api/wishlist');
        if (res.data?.success && isMounted) {
          setWishlist(res.data.wishlistIds || []);
          setWishlistProducts(res.data.data || []);
        }
      } catch (err) {
        console.warn('Wishlist backend fetch error:', err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchBackendWishlist();

    return () => {
      isMounted = false;
    };
  }, [token, currentUser]);

  const toggleWishlist = useCallback(
    async (product) => {
      if (!product) return;
      const prodId = product.id || product._id;
      if (!prodId) return;

      if (!token || !currentUser) {
        requireAuth(
          () => toggleWishlist(product),
          {
            title: 'Sign In to Save Wishlist',
            message: 'Please sign in or create an account to save items to your wishlist.',
          }
        );
        return;
      }

      const stringId = (prodId?.id || prodId?._id || prodId).toString();
      const isCurrentlySaved = wishlist.some((id) => (id?.toString?.() || id) === stringId);

      // Optimistic UI update
      setWishlist((prev) => {
        if (isCurrentlySaved) {
          return prev.filter((id) => (id?.toString?.() || id) !== stringId);
        } else {
          return [...prev, stringId];
        }
      });

      setWishlistProducts((prev) => {
        if (isCurrentlySaved) {
          return prev.filter((p) => ((p?.id || p?._id || p)?.toString?.() || '') !== stringId);
        } else {
          return [...prev, product];
        }
      });

      try {
        const response = await api.post('/api/wishlist/toggle', { productId: stringId });
        if (response.data?.success && response.data.wishlistIds) {
          const stringIds = response.data.wishlistIds.map((id) => id.toString());
          setWishlist(stringIds);
          if (response.data.data) {
            setWishlistProducts(response.data.data);
          }
        }
      } catch (error) {
        console.warn('Backend wishlist toggle failed:', error.message);
      }
    },
    [wishlist, token, currentUser, requireAuth]
  );

  const removeFromWishlist = useCallback(
    async (productId) => {
      if (!productId) return;
      const stringId = (productId?.id || productId?._id || productId).toString();

      if (!token) return;

      setWishlist((prev) => prev.filter((id) => (id?.toString?.() || id) !== stringId));
      setWishlistProducts((prev) => prev.filter((p) => ((p?.id || p?._id || p)?.toString?.() || '') !== stringId));

      try {
        const response = await api.delete(`/api/wishlist/${stringId}`);
        if (response.data?.success && response.data.wishlistIds) {
          const stringIds = response.data.wishlistIds.map((id) => id.toString());
          setWishlist(stringIds);
        }
      } catch (error) {
        console.warn('Backend wishlist removal failed:', error.message);
      }
    },
    [token]
  );

  const clearWishlist = useCallback(async () => {
    setWishlist([]);
    setWishlistProducts([]);

    if (token) {
      try {
        await api.delete('/api/wishlist');
      } catch (error) {
        console.warn('Backend wishlist clear failed:', error.message);
      }
    }
  }, [token]);

  const wishlistSet = useMemo(() => {
    return new Set(wishlist.map((id) => (id?.toString?.() || id)));
  }, [wishlist]);

  const isWishlisted = useCallback(
    (productId) => {
      if (!productId || !token) return false;
      const stringId = (productId?.id || productId?._id || productId).toString();
      return wishlistSet.has(stringId);
    },
    [wishlistSet, token]
  );

  const contextValue = useMemo(
    () => ({
      wishlist,
      wishlistProducts,
      wishlistCount: wishlist.length,
      isLoading,
      toggleWishlist,
      removeFromWishlist,
      clearWishlist,
      isWishlisted,
    }),
    [
      wishlist,
      wishlistProducts,
      isLoading,
      toggleWishlist,
      removeFromWishlist,
      clearWishlist,
      isWishlisted,
    ]
  );

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;
