import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface MapFloatingToolsProps {
  pontosCount: number;
  onUndo: () => void;
  onClear: () => void;
  onCenter: () => void;
  colors: {
    surface: string;
    border: string;
  };
}

export const MapFloatingTools: React.FC<MapFloatingToolsProps> = ({
  pontosCount,
  onUndo,
  onClear,
  onCenter,
  colors,
}) => {
  return (
    <View style={styles.floatingToolsContainer}>
      <TouchableOpacity
        style={[styles.floatingToolBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onUndo}
      >
        <Text style={styles.floatingToolText}>↩️</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.floatingToolBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onClear}
      >
        <Text style={styles.floatingToolText}>🗑️</Text>
      </TouchableOpacity>

      {pontosCount > 0 && (
        <TouchableOpacity
          style={[styles.floatingToolBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={onCenter}
        >
          <Text style={styles.floatingToolText}>🎯</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  floatingToolsContainer: {
    position: 'absolute',
    right: 16,
    top: 110,
    alignItems: 'center',
    zIndex: 10,
  },
  floatingToolBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  floatingToolText: {
    fontSize: 18,
  },
});
