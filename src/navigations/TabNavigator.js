import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, LayoutGrid, ShoppingBag, Heart, User } from 'lucide-react-native';
import { colors, fonts, shadows } from '../utils/theme';
import { useStore } from '../context/StoreContext';

import HomeScreen from '../screens/HomeScreen';
import ProductsScreen from '../screens/ProductsScreen';
import CartScreen from '../screens/CartScreen';
import WishlistScreen from '../screens/WishlistScreen';
import AccountScreen from '../screens/AccountScreen';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  const { cartItemCount, wishlist } = useStore();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />

      <Tab.Screen
        name="ShopTab"
        component={ProductsScreen}
        options={{
          tabBarLabel: 'Shop',
          tabBarIcon: ({ color, focused }) => (
            <LayoutGrid size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />

      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          tabBarLabel: 'Bag',
          tabBarBadge: cartItemCount > 0 ? (cartItemCount > 99 ? '99+' : cartItemCount) : undefined,
          tabBarBadgeStyle: styles.badge,
          tabBarIcon: ({ color, focused }) => (
            <ShoppingBag size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />

      <Tab.Screen
        name="WishlistTab"
        component={WishlistScreen}
        options={{
          tabBarLabel: 'Wishlist',
          tabBarBadge: wishlist?.length > 0 ? (wishlist.length > 99 ? '99+' : wishlist.length) : undefined,
          tabBarBadgeStyle: [styles.badge, { backgroundColor: colors.danger }],
          tabBarIcon: ({ color, focused }) => (
            <Heart
              size={22}
              color={color}
              strokeWidth={focused ? 2.5 : 1.8}
              fill={focused ? colors.danger : 'transparent'}
            />
          ),
        }}
      />

      <Tab.Screen
        name="AccountTab"
        component={AccountScreen}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <User size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    height: Platform.OS === 'android' ? 62 : 60,
    paddingBottom: Platform.OS === 'android' ? 8 : 6,
    paddingTop: 6,
    ...shadows.md,
  },
  tabBarLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.gold,
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.surface,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    lineHeight: 14,
  },
});

export default TabNavigator;
