import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '../api/api';
import { useAuth } from './AuthContext';
import { normalizeProduct } from '../utils/productAdapter';

const CartContext = createContext(undefined);

const mapServerCartItems = (rawItems) => {
  return (rawItems || []).map((item) => {
    const rawProd = item.product || {};
    const normProduct = normalizeProduct(rawProd) || rawProd;
    return {
      id: item.id || item.cartItemId || item._id,
      cartItemId: item.cartItemId || item.id || item._id,
      product: normProduct,
      quantity: Number(item.quantity) || 1,
      selectedSize: item.selectedSize || 'Standard',
      selectedColor: item.selectedColor || { name: 'Standard', hex: '#1D241C' },
    };
  });
};

export const CartProvider = ({ children }) => {
  const { token, isAuthenticated, requireAuth } = useAuth();

  const [cart, setCart] = useState([]);
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discountRate, setDiscountRate] = useState(0);

  // Dynamic Store Settings from Backend
  const [storeSettings, setStoreSettings] = useState({
    shippingFee: 30,
    freeShippingThreshold: 5000,
    promoCode: 'SUMI15',
    discountPercent: 15,
    isPromoActive: true,
  });

  const fetchStoreSettings = useCallback(async () => {
    try {
      const response = await api.get('/api/settings');
      if (response.data?.status && response.data?.data) {
        setStoreSettings(response.data.data);
      }
    } catch (error) {
      console.warn('Failed to load store settings:', error.message);
    }
  }, []);

  useEffect(() => {
    fetchStoreSettings();
  }, [fetchStoreSettings]);

  const cartRef = useRef(cart);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const fetchBackendCart = useCallback(async () => {
    if (!token) {
      setCart([]);
      return;
    }
    setIsLoadingCart(true);
    try {
      const response = await api.get('/api/cart');
      if (response.data?.status && response.data?.data) {
        const backendItems = mapServerCartItems(response.data.data.items);
        setCart(backendItems);
      }
    } catch (error) {
      console.warn('Failed to load user cart from server:', error.message);
    } finally {
      setIsLoadingCart(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && isAuthenticated) {
      fetchBackendCart();
    } else {
      setCart([]);
    }
  }, [token, isAuthenticated, fetchBackendCart]);

  // Add Item to Cart
  const addToCart = useCallback(
    async (product, arg2, arg3, arg4) => {
      if (!product) return;

      if (!token || !isAuthenticated) {
        requireAuth(
          () => addToCart(product, arg2, arg3, arg4),
          {
            title: 'Sign In to Add to Bag',
            message: 'Please sign in or create an account to add items to your shopping bag.',
          }
        );
        return;
      }

      let quantity = 1;
      let selectedSize = 'Standard';
      let selectedColor = { name: 'Standard', hex: '#1D241C' };

      if (typeof arg2 === 'number') {
        quantity = arg2 > 0 ? arg2 : 1;
        if (typeof arg3 === 'string' && arg3) selectedSize = arg3;
        if (arg4 && typeof arg4 === 'object' && !Array.isArray(arg4)) selectedColor = arg4;
      } else if (typeof arg2 === 'string') {
        selectedSize = arg2 || 'Standard';
        if (arg3 && typeof arg3 === 'object' && !Array.isArray(arg3)) selectedColor = arg3;
        if (typeof arg4 === 'number' && arg4 > 0) quantity = arg4;
      } else if (arg2 && typeof arg2 === 'object' && !Array.isArray(arg2)) {
        if (arg2.hex) {
          selectedColor = arg2;
          if (typeof arg3 === 'string' && arg3) selectedSize = arg3;
          if (typeof arg4 === 'number' && arg4 > 0) quantity = arg4;
        } else {
          if (arg2.quantity) quantity = Number(arg2.quantity) || 1;
          if (arg2.selectedSize || arg2.size) selectedSize = arg2.selectedSize || arg2.size;
          if (arg2.selectedColor || arg2.color) selectedColor = arg2.selectedColor || arg2.color;
        }
      }

      const finalColor = typeof selectedColor === 'string'
        ? { name: selectedColor, hex: '#1D241C' }
        : (selectedColor || { name: 'Standard', hex: '#1D241C' });

      const prodId = product.id || product._id;
      const currentCart = [...cartRef.current];

      const existingItemIndex = currentCart.findIndex(
        (item) =>
          (item.product?.id === prodId || item.product?._id === prodId) &&
          item.selectedSize === selectedSize &&
          (item.selectedColor?.name === finalColor.name || item.selectedColor === finalColor.name)
      );

      let updatedCart;
      if (existingItemIndex > -1) {
        updatedCart = currentCart.map((item, idx) =>
          idx === existingItemIndex
            ? { ...item, quantity: item.quantity + (Number(quantity) || 1) }
            : item
        );
      } else {
        updatedCart = [
          ...currentCart,
          {
            id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            cartItemId: `temp-${Date.now()}`,
            product,
            quantity: Number(quantity) || 1,
            selectedSize,
            selectedColor: finalColor,
          },
        ];
      }

      setCart(updatedCart);

      if (token) {
        try {
          const response = await api.post('/api/cart/add', {
            productId: prodId,
            quantity: Number(quantity) || 1,
            selectedSize,
            selectedColor: finalColor,
          });

          if (response.data?.status && response.data?.data) {
            const serverItems = mapServerCartItems(response.data.data.items);
            setCart(serverItems);
          }
        } catch (err) {
          console.warn('Background cart sync warning:', err.message);
        }
      }
    },
    [token, isAuthenticated, requireAuth]
  );

  // Update Item Quantity
  const updateCartQuantity = useCallback(
    async (cartItemId, quantity) => {
      const numQty = Number(quantity);
      if (numQty < 1) return;

      const previousCart = [...cartRef.current];
      const updatedCart = previousCart.map((item) =>
        item.cartItemId === cartItemId || item.id === cartItemId ? { ...item, quantity: numQty } : item
      );

      setCart(updatedCart);

      if (token) {
        try {
          const response = await api.put('/api/cart/update', {
            cartItemId,
            quantity: numQty,
          });

          if (response.data?.status && response.data?.data) {
            const serverItems = mapServerCartItems(response.data.data.items);
            setCart(serverItems);
          }
        } catch (err) {
          console.warn('Failed to update cart quantity on server:', err.message);
        }
      }
    },
    [token]
  );

  // Remove Item from Cart
  const removeCartItem = useCallback(
    async (cartItemId) => {
      const previousCart = [...cartRef.current];
      const updatedCart = previousCart.filter(
        (item) => item.cartItemId !== cartItemId && item.id !== cartItemId
      );

      setCart(updatedCart);

      if (token) {
        try {
          const response = await api.delete(`/api/cart/item/${encodeURIComponent(cartItemId)}`);
          if (response.data?.status && response.data?.data) {
            const serverItems = mapServerCartItems(response.data.data.items);
            setCart(serverItems);
          }
        } catch (err) {
          console.warn('Failed to remove cart item from server:', err.message);
        }
      }
    },
    [token]
  );

  // Clear Cart
  const clearCart = useCallback(async () => {
    const previousCart = [...cartRef.current];
    setCart([]);

    if (token) {
      try {
        await api.delete('/api/cart/clear');
      } catch (err) {
        console.error('Failed to clear cart on server:', err.message);
        setCart(previousCart);
      }
    }
  }, [token]);

  // Apply Promo Code
  const applyPromoCode = useCallback(
    async (code) => {
      if (!code || !code.trim()) {
        return { success: false, message: 'Please enter a promotional code.' };
      }

      try {
        const res = await api.post('/api/settings/validate-promo', { code: code.trim() });
        if (res.data?.status && res.data?.valid) {
          setPromoCode(res.data.code);
          setDiscountRate(res.data.discountRate || res.data.discountPercent / 100);
          return { success: true, message: res.data.message };
        }
        return { success: false, message: res.data?.message || 'Invalid promotional code.' };
      } catch (error) {
        if (error.response?.data?.message) {
          return { success: false, message: error.response.data.message };
        }
        const input = code.trim().toUpperCase();
        if (storeSettings.isPromoActive && storeSettings.promoCode && input === storeSettings.promoCode) {
          setPromoCode(storeSettings.promoCode);
          setDiscountRate(storeSettings.discountPercent / 100);
          return { success: true, message: `Promo code ${storeSettings.promoCode} applied! (${storeSettings.discountPercent}% OFF)` };
        }
        return { success: false, message: 'Invalid or expired promotional code.' };
      }
    },
    [storeSettings]
  );

  const removePromoCode = useCallback(() => {
    setPromoCode('');
    setDiscountRate(0);
  }, []);

  const outOfStockItems = useMemo(
    () => cart.filter((item) => item.product?.isStockAvailable === false),
    [cart]
  );
  const hasOutOfStockItems = outOfStockItems.length > 0;

  const cartSubtotal = useMemo(
    () =>
      cart.reduce((acc, i) => {
        if (i.product?.isStockAvailable === false) return acc;
        return acc + (Number(i.product?.price) || 0) * i.quantity;
      }, 0),
    [cart]
  );

  const cartItemCount = useMemo(() => cart.reduce((acc, i) => acc + i.quantity, 0), [cart]);
  const discountAmount = useMemo(() => cartSubtotal * discountRate, [cartSubtotal, discountRate]);

  const freeShippingThreshold = storeSettings.freeShippingThreshold !== undefined ? storeSettings.freeShippingThreshold : 5000;
  const baseShippingFee = storeSettings.shippingFee !== undefined ? storeSettings.shippingFee : 30;

  const shippingCost = useMemo(() => {
    if (cart.length === 0 || cartSubtotal === 0) return 0;
    if (cartSubtotal >= freeShippingThreshold) return 0;
    return baseShippingFee;
  }, [cartSubtotal, cart.length, freeShippingThreshold, baseShippingFee]);

  const cartTotal = useMemo(
    () => (cartSubtotal > 0 ? Math.max(0, cartSubtotal - discountAmount + shippingCost) : 0),
    [cartSubtotal, discountAmount, shippingCost]
  );

  const isInCart = useCallback(
    (productId) => {
      if (!productId) return false;
      const stringId = (productId?.id || productId?._id || productId).toString();
      return cart.some((item) => {
        const itemProdId = (item.product?.id || item.product?._id || item.id)?.toString?.() || '';
        return itemProdId === stringId;
      });
    },
    [cart]
  );

  const getCartItemQuantity = useCallback(
    (productId) => {
      if (!productId) return 0;
      const stringId = (productId?.id || productId?._id || productId).toString();
      const matchingItems = cart.filter((item) => {
        const itemProdId = (item.product?.id || item.product?._id || item.id)?.toString?.() || '';
        return itemProdId === stringId;
      });
      return matchingItems.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);
    },
    [cart]
  );

  const getCartItem = useCallback(
    (productId, selectedSize, selectedColor) => {
      if (!productId) return null;
      const stringId = (productId?.id || productId?._id || productId).toString();
      const colorName = typeof selectedColor === 'object' ? selectedColor?.name : selectedColor;

      if (selectedSize || colorName) {
        const exactMatch = cart.find((item) => {
          const itemProdId = (item.product?.id || item.product?._id || item.id)?.toString?.() || '';
          if (itemProdId !== stringId) return false;
          if (selectedSize && item.selectedSize !== selectedSize) return false;
          if (colorName) {
            const itemColor = typeof item.selectedColor === 'object' ? item.selectedColor?.name : item.selectedColor;
            if (itemColor !== colorName) return false;
          }
          return true;
        });
        if (exactMatch) return exactMatch;
      }

      return cart.find((item) => {
        const itemProdId = (item.product?.id || item.product?._id || item.id)?.toString?.() || '';
        return itemProdId === stringId;
      }) || null;
    },
    [cart]
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoadingCart,
        cartSubtotal,
        cartItemCount,
        discountRate,
        discountAmount,
        shippingCost,
        shippingFee: baseShippingFee,
        freeShippingThreshold,
        cartTotal,
        promoCode,
        hasOutOfStockItems,
        outOfStockItems,
        storeSettings,
        refreshSettings: fetchStoreSettings,
        addToCart,
        updateCartQuantity,
        removeCartItem,
        clearCart,
        applyPromoCode,
        removePromoCode,
        refreshCart: fetchBackendCart,
        isInCart,
        getCartItemQuantity,
        getCartItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
