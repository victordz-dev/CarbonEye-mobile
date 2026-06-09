import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemeColors, lightColors, darkColors } from '../theme';

export interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean>(systemScheme === 'dark');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@carboneye:theme');
        if (savedTheme !== null) {
          setIsDark(savedTheme === 'dark');
        } else {
          setIsDark(systemScheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme from storage', error);
      }
    };
    loadTheme();
  }, [systemScheme]);

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem('@carboneye:theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme to storage', error);
    }
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
