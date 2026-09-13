import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { CartProvider, useCart } from './CartContext';
import { WishlistProvider, useWishlist } from './WishlistContext';
import { StoreProvider, useStore } from './StoreContext';
import { HeroProvider, useHero } from './HeroContext';

export const RootProvider = ({ children }) => {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <StoreProvider>
            <HeroProvider>
              {children}
            </HeroProvider>
          </StoreProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export { useAuth, useCart, useWishlist, useStore, useHero };
export default RootProvider;
