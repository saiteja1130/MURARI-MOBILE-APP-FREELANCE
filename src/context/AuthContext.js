import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // User addresses, orders, and payments
  const [userAddresses, setUserAddresses] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [userPayments, setUserPayments] = useState([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  // Global Auth Modal State for Action-Gating
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState({
    mode: 'login',
    title: 'Sign In Required',
    message: 'Please sign in to proceed.',
    onSuccess: null,
  });

  // Load saved session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const [savedUser, savedToken] = await Promise.all([
          AsyncStorage.getItem('sumilux_user'),
          AsyncStorage.getItem('sumilux_token'),
        ]);
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
        }
        if (savedToken) {
          setToken(savedToken);
        }
      } catch (err) {
        console.warn('Failed to load auth session:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    loadSession();
  }, []);

  const openAuthModal = useCallback(({ mode = 'login', title = 'Sign In Required', message = 'Please sign in to proceed.', onSuccess = null } = {}) => {
    setAuthModalConfig({
      mode,
      title,
      message,
      onSuccess,
    });
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const requireAuth = useCallback(
    (actionCallback, { title = 'Sign In to Proceed', message = 'Please sign in to continue.' } = {}) => {
      if (token && currentUser) {
        if (typeof actionCallback === 'function') {
          actionCallback();
        }
        return true;
      }
      openAuthModal({
        mode: 'login',
        title,
        message,
        onSuccess: actionCallback,
      });
      return false;
    },
    [token, currentUser, openAuthModal]
  );

  // Shared address normalizer — single source of truth for mapping backend → UI shape
  const normalizeAddress = (a) => ({
    id: a._id || a.id,
    _id: a._id || a.id,
    name: a.fullName,
    fullName: a.fullName,
    phone: a.phone,
    street: a.street,
    apartment: a.apartment || '',
    city: a.city,
    state: a.state,
    postalCode: a.postalCode,
    country: a.country || 'India',
    addressType: a.addressType || 'home',
    isDefault: !!a.isDefault,
  });

  // Fetch addresses from backend
  const fetchAddresses = useCallback(async () => {
    const storedToken = await AsyncStorage.getItem('sumilux_token');
    if (!storedToken) return;
    try {
      const response = await api.get('/api/users/addresses');
      if (response.data?.status) {
        const list = (response.data.data || []).map(normalizeAddress);
        setUserAddresses(list);
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err.message);
    }
  }, []);

  // Fetch orders from backend
  const fetchOrders = useCallback(async () => {
    const storedToken = await AsyncStorage.getItem('sumilux_token');
    if (!storedToken) {
      setUserOrders([]);
      return;
    }
    setIsLoadingOrders(true);
    try {
      const response = await api.get('/api/orders/my-orders');
      if (response.data?.status) {
        const rawOrders = response.data.data || [];
        const normalized = rawOrders.map((o) => ({
          ...o,
          id: o._id || o.id,
          orderNumber: o.orderNumber,
          status: o.orderStatus || o.status || 'confirmed',
          orderStatus: o.orderStatus || o.status || 'confirmed',
          paymentStatus: o.paymentStatus || 'paid',
          paymentMethod: o.paymentMethod || 'upi',
          total: Number(o.total || 0),
          subtotal: Number(o.subtotal !== undefined ? o.subtotal : o.total || 0),
          shippingCost: Number(o.shippingCost || 0),
          discount: Number(o.discount || 0),
          date: o.createdAt
            ? new Date(o.createdAt).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'Recent',
          createdAt: o.createdAt || new Date().toISOString(),
          items: (o.items || []).map((i) => ({
            ...i,
            id: i._id || i.product?._id || i.id,
            name: i.name || i.product?.name || 'Garment Piece',
            price: Number(i.price !== undefined ? i.price : (i.product?.price || 0)),
            quantity: Number(i.quantity || 1),
            size: i.selectedSize || i.size || 'Standard',
            color: typeof i.selectedColor === 'object' ? i.selectedColor?.name : (i.selectedColor || i.color || 'Standard'),
            image: i.image || i.product?.image || (Array.isArray(i.product?.images) && i.product.images[0]) || '',
          })),
        }));
        setUserOrders(normalized);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err.message);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  // Fetch payments from backend
  const fetchPayments = useCallback(async () => {
    const storedToken = await AsyncStorage.getItem('sumilux_token');
    if (!storedToken) {
      setUserPayments([]);
      return;
    }
    setIsLoadingPayments(true);
    try {
      const response = await api.get('/api/payments/my-payments');
      if (response.data?.status) {
        setUserPayments(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err.message);
    } finally {
      setIsLoadingPayments(false);
    }
  }, []);

  // Cancel order customer action
  const cancelOrder = useCallback(async (orderId) => {
    try {
      const response = await api.patch(`/api/orders/${orderId}/cancel`);
      if (response.data?.status) {
        await fetchOrders();
        await fetchPayments();
        return response.data;
      }
    } catch (err) {
      console.error('Failed to cancel order:', err.message);
      throw err;
    }
  }, [fetchOrders, fetchPayments]);

  useEffect(() => {
    if (token) {
      fetchAddresses();
      fetchOrders();
      fetchPayments();
    } else {
      setUserAddresses([]);
      setUserOrders([]);
      setUserPayments([]);
    }
  }, [token, fetchAddresses, fetchOrders, fetchPayments]);

  // Auth Actions
  const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    if (response.data.status) {
      const u = response.data.user;
      const t = response.data.token;
      setCurrentUser(u);
      setToken(t);
      await AsyncStorage.setItem('sumilux_user', JSON.stringify(u));
      await AsyncStorage.setItem('sumilux_token', t);
      return response.data;
    }
    throw new Error(response.data.message || 'Login failed');
  };

  const requestOtp = async (email) => {
    const response = await api.post('/api/auth/request-otp', { email });
    return response.data;
  };

  const loginWithOtp = async (email, otpCode) => {
    const response = await api.post('/api/auth/login-otp', { email, otpCode });
    if (response.data.status) {
      const u = response.data.user;
      const t = response.data.token;
      setCurrentUser(u);
      setToken(t);
      await AsyncStorage.setItem('sumilux_user', JSON.stringify(u));
      await AsyncStorage.setItem('sumilux_token', t);
      return response.data;
    }
    throw new Error(response.data.message || 'Login failed');
  };

  const signup = async (userData) => {
    const response = await api.post('/api/auth/signup', userData);
    return response.data;
  };

  const verifyEmail = async (email, otpCode) => {
    const response = await api.post('/api/auth/verify-email', { email, otpCode });
    if (response.data.status) {
      const u = response.data.user;
      const t = response.data.token;
      setCurrentUser(u);
      setToken(t);
      await AsyncStorage.setItem('sumilux_user', JSON.stringify(u));
      await AsyncStorage.setItem('sumilux_token', t);
      return response.data;
    }
    throw new Error(response.data.message || 'Verification failed');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/api/users/profile', profileData);
      if (response.data?.status) {
        setCurrentUser(response.data.user);
        await AsyncStorage.setItem('sumilux_user', JSON.stringify(response.data.user));
        return response.data;
      }
      throw new Error(response.data?.message || 'Failed to update profile');
    } catch (error) {
      console.error('Update profile error:', error.message);
      throw error;
    }
  };

  const logout = async () => {
    setCurrentUser(null);
    setToken(null);
    setUserAddresses([]);
    setUserOrders([]);
    setUserPayments([]);
    await AsyncStorage.removeItem('sumilux_user');
    await AsyncStorage.removeItem('sumilux_token');
    await AsyncStorage.removeItem('sumilux_addresses');
  };

  // Address Actions
  const addAddress = async (newAddr) => {
    try {
      const payload = {
        fullName: newAddr.fullName || newAddr.name,
        phone: newAddr.phone || currentUser?.phone || '',
        street: newAddr.street,
        apartment: newAddr.apartment || '',
        city: newAddr.city,
        state: newAddr.state,
        postalCode: newAddr.postalCode,
        country: newAddr.country || 'India',
        addressType: newAddr.addressType || 'home',
        isDefault: newAddr.isDefault !== undefined ? newAddr.isDefault : userAddresses.length === 0,
      };

      if (token) {
        const response = await api.post('/api/users/addresses', payload);
        if (response.data?.status) {
          const list = (response.data.data || []).map(normalizeAddress);
          setUserAddresses(list);
          return list;
        }
      } else {
        const localAddr = {
          ...payload,
          id: `addr-${Date.now()}`,
          name: payload.fullName,
        };
        setUserAddresses((prev) => {
          if (localAddr.isDefault) {
            return [...prev.map((a) => ({ ...a, isDefault: false })), localAddr];
          }
          return [...prev, localAddr];
        });
        return localAddr;
      }
    } catch (err) {
      console.error('Failed to add address:', err.message);
      throw err;
    }
  };

  const updateAddress = async (updatedAddr) => {
    const targetId = updatedAddr.id || updatedAddr._id;
    try {
      const payload = {
        fullName: updatedAddr.fullName || updatedAddr.name,
        phone: updatedAddr.phone || currentUser?.phone || '',
        street: updatedAddr.street,
        apartment: updatedAddr.apartment || '',
        city: updatedAddr.city,
        state: updatedAddr.state,
        postalCode: updatedAddr.postalCode,
        country: updatedAddr.country || 'India',
        addressType: updatedAddr.addressType || 'home',
        isDefault: updatedAddr.isDefault,
      };

      if (token) {
        const response = await api.put(`/api/users/addresses/${targetId}`, payload);
        if (response.data?.status) {
          const list = (response.data.data || []).map(normalizeAddress);
          setUserAddresses(list);
          return list;
        }
      } else {
        setUserAddresses((prev) =>
          prev.map((a) => {
            if (a.id === targetId) return { ...a, ...payload, name: payload.fullName };
            if (payload.isDefault) return { ...a, isDefault: false };
            return a;
          })
        );
      }
    } catch (err) {
      console.error('Failed to update address:', err.message);
      throw err;
    }
  };

  const deleteAddress = async (id) => {
    try {
      if (token) {
        const response = await api.delete(`/api/users/addresses/${id}`);
        if (response.data?.status) {
          const list = (response.data.data || []).map(normalizeAddress);
          setUserAddresses(list);
          return list;
        }
      } else {
        setUserAddresses((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete address:', err.message);
      throw err;
    }
  };

  const setDefaultAddress = async (id) => {
    try {
      if (token) {
        const response = await api.patch(`/api/users/addresses/${id}/default`);
        if (response.data?.status) {
          const list = (response.data.data || []).map(normalizeAddress);
          setUserAddresses(list);
          return list;
        }
      } else {
        setUserAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            isDefault: a.id === id,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to set default address:', err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user: currentUser,
        token,
        isLoadingAuth,
        isAuthenticated: !!currentUser && !!token,
        login,
        signup,
        updateProfile,
        requestOtp,
        loginWithOtp,
        verifyEmail,
        logout,
        addresses: userAddresses,
        fetchAddresses,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        orders: userOrders,
        isLoadingOrders,
        fetchOrders,
        payments: userPayments,
        isLoadingPayments,
        fetchPayments,
        cancelOrder,
        isAuthModalOpen,
        authModalConfig,
        openAuthModal,
        closeAuthModal,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
