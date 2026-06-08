import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface SiriBadgeProps {
  status: 'NORMAL' | 'ALERTA' | 'EMERGENCIA' | string;
  score: number;
}

export const SiriBadge: React.FC<SiriBadgeProps> = ({ status, score }) => {
  const { colors } = useTheme();

  let statusColor = colors.success;
  if (status === 'ALERTA') statusColor = colors.warning;
  if (status === 'EMERGENCIA') statusColor = colors.danger;

  return (
    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
      <Text style={styles.statusBadgeText}>{score} SIRI</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
