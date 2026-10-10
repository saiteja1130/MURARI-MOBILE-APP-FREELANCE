import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { normalizeProduct, normalizeCategory, normalizeMainCategory } from '../utils/productAdapter';
import api from '../api/api';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { useWishlist } from './WishlistContext';

const StoreContext = createContext(undefined);

export const StoreProvider = ({ children }) => {
  const [mainCategories, setMainCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoadingMainCategories, setIsLoadingMainCategories] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Fetch live main categories (Women, Kids, Men, etc.)
  const fetchMainCategories = useCallback(async () => {
    setIsLoadingMainCategories(true);
    try {
      const response = await api.get('/api/main-categories');
      const apiMainCats = response.data?.data || [];
      if (apiMainCats.length > 0) {
        setMainCategories(apiMainCats.map(normalizeMainCategory).filter(Boolean));
      } else {
        setMainCategories([]);
      }
    } catch (error) {
      console.warn('Failed to load main categories:', error.message);
      setMainCategories([]);
    } finally {
      setIsLoadingMainCategories(false);
    }
  }, []);

  // Fetch live subcategories
  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const response = await api.get('/api/categories');
      const apiCats = response.data?.data || [];
      if (apiCats.length > 0) {
        setCategories(apiCats.map(normalizeCategory).filter(Boolean));
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.warn('Failed to load categories:', error.message);
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  // Fetch live products
  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const response = await api.get('/api/products?limit=100');
      const apiProducts = response.data?.data || [];
      if (apiProducts.length > 0) {
        const normalized = apiProducts.map(normalizeProduct).filter(Boolean);
        setProducts(normalized);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.warn('Failed to load products:', error.message);
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchMainCategories();
    fetchCategories();
    fetchProducts();
  }, [fetchMainCategories, fetchCategories, fetchProducts]);

  const [activeMainCategory, setActiveMainCategory] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currency] = useState('INR');

  // Search Modal & Toast State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => {
        dismissToast(id);
      }, 3500);
    },
    [dismissToast]
  );

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  const { token, isAuthenticated } = useAuth();
  const cartContext = useCart();
  const wishlistContext = useWishlist();

  const wishlistProducts = useMemo(
    () =>
      products.filter((p) => {
        const pId = (p.id || p._id || '').toString();
        return wishlistContext.wishlist.some((id) => (id?.toString?.() || id) === pId);
      }),
    [products, wishlistContext.wishlist]
  );

  const addToCartWithFeedback = useCallback(
    async (product, selectedSize, selectedColor, quantity = 1) => {
      if (!product) return;

      if (!token || !isAuthenticated) {
        await cartContext.addToCart(product, selectedSize, selectedColor, quantity);
        return;
      }

      if (product.isStockAvailable === false) {
        showToast({
          type: 'error',
          title: 'Out of Stock',
          message: `${product.name} is currently out of stock.`,
        });
        return;
      }

      await cartContext.addToCart(product, selectedSize, selectedColor, quantity);

      const size = selectedSize || product.sizes?.[0] || 'Standard';
      const color = selectedColor || product.colors?.[0] || { name: 'Standard', hex: '#1D241C' };

      showToast({
        type: 'cart',
        title: 'Added to Bag',
        message: `${quantity}× ${product.name} (${size} / ${color.name || color})`,
        image: product.image || product.images?.[0],
      });
    },
    [cartContext, showToast, token, isAuthenticated]
  );

  const toggleWishlistWithFeedback = useCallback(
    (product) => {
      if (!product) return;

      if (!token || !isAuthenticated) {
        wishlistContext.toggleWishlist(product);
        return;
      }

      const prodId = product.id || product._id;
      const isSaved = wishlistContext.isWishlisted(prodId);

      wishlistContext.toggleWishlist(product);

      if (isSaved) {
        showToast({
          type: 'info',
          title: 'Removed from Wishlist',
          message: product.name,
        });
      } else {
        showToast({
          type: 'wishlist',
          title: 'Saved to Wishlist',
          message: product.name,
          image: product.image || product.images?.[0],
        });
      }
    },
    [wishlistContext, showToast, token, isAuthenticated]
  );

  const moveWishlistToCart = useCallback(
    (product) => {
      addToCartWithFeedback(product);
      wishlistContext.removeFromWishlist(product.id || product._id);
    },
    [addToCartWithFeedback, wishlistContext]
  );

  return (
    <StoreContext.Provider
      value={{
        mainCategories,
        categories,
        products,
        activeMainCategory,
        setActiveMainCategory,
        activeCategory,
        setActiveCategory,
        searchQuery,
        setSearchQuery,
        currency,
        // Cart values
        cart: cartContext.cart,
        promoCode: cartContext.promoCode,
        discountRate: cartContext.discountRate,
        discountAmount: cartContext.discountAmount,
        cartSubtotal: cartContext.cartSubtotal,
        cartItemCount: cartContext.cartItemCount,
        shippingCost: cartContext.shippingCost,
        cartTotal: cartContext.cartTotal,
        hasOutOfStockItems: cartContext.hasOutOfStockItems,
        outOfStockItems: cartContext.outOfStockItems,
        storeSettings: cartContext.storeSettings,
        addToCart: addToCartWithFeedback,
        updateCartQuantity: cartContext.updateCartQuantity,
        removeCartItem: cartContext.removeCartItem,
        clearCart: cartContext.clearCart,
        applyPromoCode: cartContext.applyPromoCode,
        removePromoCode: cartContext.removePromoCode,
        isInCart: cartContext.isInCart,
        getCartItemQuantity: cartContext.getCartItemQuantity,
        getCartItem: cartContext.getCartItem,
        // Wishlist values
        wishlist: wishlistContext.wishlist,
        wishlistProducts,
        isWishlisted: wishlistContext.isWishlisted,
        toggleWishlist: toggleWishlistWithFeedback,
        removeFromWishlist: wishlistContext.removeFromWishlist,
        clearWishlist: wishlistContext.clearWishlist,
        moveWishlistToCart,
        // Search Modal
        isSearchOpen,
        openSearch,
        closeSearch,
        isLoadingProducts,
        isLoadingCategories,
        isLoadingMainCategories,
        refreshProducts: fetchProducts,
        refreshCategories: fetchCategories,
        refreshMainCategories: fetchMainCategories,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

export default StoreContext;
