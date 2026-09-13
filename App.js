import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import RootProvider from './src/context/RootProvider';
import AppNavigator from './src/navigations/AppNavigator';
import { colors } from './src/utils/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <RootProvider>
        <SafeAreaView style={styles.root} edges={['top']}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
          <AppNavigator />
        </SafeAreaView>
      </RootProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
});
