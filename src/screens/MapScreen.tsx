import React from 'react';
import { Platform } from 'react-native';

export const MapScreen: React.FC = () => {
  if (Platform.OS === 'web') {
    const { MapScreen: WebScreen } = require('./MapScreen.web') as {
      MapScreen: React.ComponentType;
    };
    return <WebScreen />;
  } else {
    const { MapScreen: NativeScreen } = require('./MapScreen.native') as {
      MapScreen: React.ComponentType;
    };
    return <NativeScreen />;
  }
};
