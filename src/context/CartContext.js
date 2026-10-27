import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '../api/api';
import { useAuth } from './AuthContext';
import { normalizeProduct } from '../utils/productAdapter';

const CartContext = createContext(undefined);

const mapServerCartItems = (rawItems) => {
  return (rawItems || []).map((item) => {
    const rawProd = item.product || {};
    const normProduct = normalizeProduct(rawProd) || rawProd;
    const colorName = (item.selectedColor?.name || (typeof item.selectedColor === 'string' ? item.selectedColor : '')).trim().toLowerCase();
    let matchedColorImage = '';
    if (colorName && Array.isArray(normProduct.colorImages) && normProduct.colorImages.length > 0) {
      const match = normProduct.colorImages.find(
        (ci) => ci.color && ci.color.trim().toLowerCase() === colorName
      );
      if (match && Array.isArray(match.images) && match.images.length > 0) {
        matchedColorImage = match.images[0];
      }
    }
    const finalImage = matchedColorImage || item.image || normProduct.image || normProduct.images?.[0] || normProduct.galleryImages?.[0];

    return {
      id: item.id || item.cartItemId || item._id,
      cartItemId: item.cartItemId || item.id || item._id,
      variantId: item.variantId || '',
      sku: item.sku || normProduct.sku || '',
      product: { ...normProduct, image: finalImage },
      price: Number(item.price !== undefined ? item.price : (normProduct.price || 0)),
      image: finalImage,
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

  // Dynamic Store Settings & Latest Coupon from Backend
  const [storeSettings, setStoreSettings] = useState({
    shippingFee: 30,
    freeShippingThreshold: 5000,
    promoCode: 'SUMI15',
    discountPercent: 15,
    isPromoActive: true,
  });
  const [latestCoupon, setLatestCoupon] = useState(null);

  const fetchStoreSettings = useCallback(async () => {
    try {
      const response = await api.get('/api/settings');
      if (response.data?.status && response.data?.data) {
        setStoreSettings(response.data.data);
        if (response.data.data.latestCoupon) {
          setLatestCoupon(response.data.data.latestCoupon);
        }
      }
    } catch (error) {
      console.warn('Failed to load store settings:', error.message);
    }
  }, []);

  const fetchLatestCoupon = useCallback(async () => {
    try {
      const response = await api.get('/api/coupons/latest');
      if (response.data?.status && response.data?.data) {
        setLatestCoupon(response.data.data);
      }
    } catch (error) {
      // Graceful fallback to storeSettings promo
    }
  }, []);

  useEffect(() => {
    fetchStoreSettings();
    fetchLatestCoupon();
  }, [fetchStoreSettings, fetchLatestCoupon]);

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
    async (product, arg2, arg3, arg4, arg5) => {
      if (!product) return;

      if (!token || !isAuthenticated) {
        requireAuth(
          () => addToCart(product, arg2, arg3, arg4, arg5),
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
      let variantId = '';
      let sku = '';

      // Pattern 1: Options object: addToCart(product, { size, color, quantity, variantId, sku })
      if (arg2 && typeof arg2 === 'object' && !Array.isArray(arg2) && !arg2.hex && !arg2.name) {
        quantity = Number(arg2.quantity) || 1;
        selectedSize = arg2.selectedSize || arg2.size || 'Standard';
        selectedColor = arg2.selectedColor || arg2.color || { name: 'Standard', hex: '#1D241C' };
        variantId = arg2.variantId || arg2.variant?._id || arg2.variant?.id || '';
        sku = arg2.sku || arg2.variant?.sku || '';
      }
      // Pattern 2: (product, quantity, size, color, variant)
      else if (typeof arg2 === 'number') {
        quantity = arg2 > 0 ? arg2 : 1;
        if (typeof arg3 === 'string' && arg3) selectedSize = arg3;
        if (arg4 && typeof arg4 === 'object') selectedColor = arg4;
        if (arg5 && typeof arg5 === 'object') {
          variantId = arg5.variantId || arg5._id || arg5.id || '';
          sku = arg5.sku || '';
        } else if (typeof arg5 === 'string') {
          variantId = arg5;
        }
      }
      // Pattern 3: (product, size, color, quantity, variant)
      else if (typeof arg2 === 'string') {
        selectedSize = arg2 || 'Standard';
        if (arg3 && typeof arg3 === 'object') selectedColor = arg3;
        else if (typeof arg3 === 'string') selectedColor = { name: arg3, hex: '#1D241C' };
        if (typeof arg4 === 'number' && arg4 > 0) quantity = arg4;
        if (arg5 && typeof arg5 === 'object') {
          variantId = arg5.variantId || arg5._id || arg5.id || '';
          sku = arg5.sku || '';
        } else if (typeof arg5 === 'string') {
          variantId = arg5;
        }
      }
      // Pattern 4: (product, colorObject, size, quantity, variant)
      else if (arg2 && typeof arg2 === 'object' && (arg2.hex || arg2.name)) {
        selectedColor = arg2;
        if (typeof arg3 === 'string' && arg3) selectedSize = arg3;
        if (typeof arg4 === 'number' && arg4 > 0) quantity = arg4;
        if (arg5 && typeof arg5 === 'object') {
          variantId = arg5.variantId || arg5._id || arg5.id || '';
          sku = arg5.sku || '';
        } else if (typeof arg5 === 'string') {
          variantId = arg5;
        }
      }

      // Check if product object itself carried variant info
      if (!variantId && product.variantId) variantId = product.variantId;
      if (!variantId && product.selectedVariant?._id) variantId = product.selectedVariant._id;
      if (!sku && product.selectedVariant?.sku) sku = product.selectedVariant.sku;

      const finalColor = typeof selectedColor === 'string'
        ? { name: selectedColor, hex: '#1D241C' }
        : (selectedColor || { name: 'Standard', hex: '#1D241C' });

      // Automatically resolve matching variant if product.variants is present
      if (!variantId && Array.isArray(product.variants) && product.variants.length > 0) {
        const targetColorName = (finalColor.name || '').trim().toLowerCase();
        const targetSize = (selectedSize || '').trim().toLowerCase();
        const matched = product.variants.find((v) => {
          const vColor = (v.color || '').trim().toLowerCase();
          const vSize = (v.size || '').trim().toLowerCase();
          const colorMatches = !vColor || !targetColorName || targetColorName === 'standard' || vColor === targetColorName;
          const sizeMatches = !vSize || !targetSize || targetSize === 'standard' || targetSize === 'one size' || vSize === targetSize;
          return colorMatches && sizeMatches;
        });
        if (matched) {
          variantId = (matched._id || matched.id || '').toString();
          if (!sku) sku = matched.sku || '';
        }
      }

      // Resolve color image for optimistic cart
      const colorName = (finalColor.name || '').trim().toLowerCase();
      let matchedColorImage = '';
      if (colorName && Array.isArray(product.colorImages) && product.colorImages.length > 0) {
        const match = product.colorImages.find(
          (ci) => ci.color && ci.color.trim().toLowerCase() === colorName
        );
        if (match && Array.isArray(match.images) && match.images.length > 0) {
          matchedColorImage = match.images[0];
        }
      }
      const itemImage = matchedColorImage || product.image || (Array.isArray(product.images) && product.images[0]) || (Array.isArray(product.galleryImages) && product.galleryImages[0]) || '';
      let variantPrice = Number(product.price) || 0;
      if (variantId && Array.isArray(product.variants)) {
        const foundV = product.variants.find((v) => (v._id || v.id || '').toString() === variantId.toString() || (sku && v.sku === sku));
        if (foundV && typeof foundV.price === 'number' && foundV.price > 0) {
          variantPrice = foundV.price;
        }
      }
      const productWithColorImage = { ...product, price: variantPrice, image: itemImage };

      const prodId = product.id || product._id;
      const expectedCartItemId = variantId
        ? `${prodId}-${variantId}`
        : (sku && sku !== product.sku
            ? `${prodId}-${sku}`
            : `${prodId}-${selectedSize}-${finalColor.name || 'Standard'}`);

      const currentCart = [...cartRef.current];

      const existingItemIndex = currentCart.findIndex((item) => {
        const itemProdId = item.product?.id || item.product?._id;
        if (itemProdId !== prodId) return false;
        if (variantId && item.variantId) return item.variantId.toString() === variantId.toString();
        if (sku && item.sku && sku !== product.sku) return item.sku === sku;
        return (
          item.selectedSize === selectedSize &&
          (item.selectedColor?.name === finalColor.name || item.selectedColor === finalColor.name)
        );
      });

      let updatedCart;
      if (existingItemIndex > -1) {
        updatedCart = currentCart.map((item, idx) =>
          idx === existingItemIndex
            ? {
                ...item,
                quantity: item.quantity + (Number(quantity) || 1),
                image: item.image || itemImage,
                variantId: item.variantId || variantId,
                sku: item.sku || sku,
              }
            : item
        );
      } else {
        updatedCart = [
          ...currentCart,
          {
            id: expectedCartItemId,
            cartItemId: expectedCartItemId,
            variantId,
            sku,
            product: productWithColorImage,
            price: variantPrice,
            image: itemImage,
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
            variantId,
            sku,
          });

          if (response.data?.status && response.data?.data) {
            const serverItems = mapServerCartItems(response.data.data.items);
            setCart(serverItems);
          }
        } catch (err) {
          console.warn('Background cart sync warning (keeping local cart):', err.message);
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
        const itPrice = Number(i.price !== undefined ? i.price : (i.product?.price || 0));
        return acc + itPrice * i.quantity;
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

  const cartProductMap = useMemo(() => {
    const map = new Map();
    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      const prodId = (item.product?.id || item.product?._id || item.id)?.toString?.() || '';
      if (!prodId) continue;
      if (!map.has(prodId)) {
        map.set(prodId, { items: [], totalQty: 0 });
      }
      const entry = map.get(prodId);
      entry.items.push(item);
      entry.totalQty += Number(item.quantity) || 1;
    }
    return map;
  }, [cart]);

  const isInCart = useCallback(
    (productId) => {
      if (!productId) return false;
      const stringId = (productId?.id || productId?._id || productId).toString();
      return cartProductMap.has(stringId);
    },
    [cartProductMap]
  );

  const getCartItemQuantity = useCallback(
    (productId) => {
      if (!productId) return 0;
      const stringId = (productId?.id || productId?._id || productId).toString();
      const entry = cartProductMap.get(stringId);
      return entry ? entry.totalQty : 0;
    },
    [cartProductMap]
  );

  const getCartItem = useCallback(
    (productId, selectedSize, selectedColor, variantId) => {
      if (!productId) return null;
      const stringId = (productId?.id || productId?._id || productId).toString();
      const entry = cartProductMap.get(stringId);
      if (!entry || entry.items.length === 0) return null;

      const colorName = typeof selectedColor === 'object' ? selectedColor?.name : selectedColor;

      if (variantId || selectedSize || colorName) {
        const exactMatch = entry.items.find((item) => {
          if (variantId && item.variantId && item.variantId.toString() !== variantId.toString()) return false;
          if (selectedSize && item.selectedSize !== selectedSize) return false;
          if (colorName) {
            const itemColor = typeof item.selectedColor === 'object' ? item.selectedColor?.name : item.selectedColor;
            if (itemColor && colorName && itemColor.toLowerCase() !== colorName.toLowerCase()) return false;
          }
          return true;
        });
        if (exactMatch) return exactMatch;
      }

      return entry.items[0] || null;
    },
    [cartProductMap]
  );

  const contextValue = useMemo(
    () => ({
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
      latestCoupon,
      refreshSettings: fetchStoreSettings,
      refreshLatestCoupon: fetchLatestCoupon,
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
    }),
    [
      cart,
      isLoadingCart,
      cartSubtotal,
      cartItemCount,
      discountRate,
      discountAmount,
      shippingCost,
      baseShippingFee,
      freeShippingThreshold,
      cartTotal,
      promoCode,
      hasOutOfStockItems,
      outOfStockItems,
      storeSettings,
      latestCoupon,
      fetchStoreSettings,
      fetchLatestCoupon,
      addToCart,
      updateCartQuantity,
      removeCartItem,
      clearCart,
      applyPromoCode,
      removePromoCode,
      fetchBackendCart,
      isInCart,
      getCartItemQuantity,
      getCartItem,
    ]
  );

  return (
    <CartContext.Provider value={contextValue}>
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
