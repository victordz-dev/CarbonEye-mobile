import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DetailsStatusProps {
  score: number;
  statusName: string;
  statusColor: string;
  colors: any;
}

export const DetailsStatus: React.FC<DetailsStatusProps> = ({ score, statusName, statusColor, colors }) => {
  return (
    <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.scoreRow}>
        <View style={[styles.scoreCircle, { backgroundColor: statusColor }]}>
          <Text style={styles.scoreNumber}>{score}</Text>
          <Text style={styles.scoreLabel}>SIRI</Text>
        </View>
        <View style={styles.statusNameCol}>
          <Text style={[styles.statusTitle, { color: colors.text }]}>Status do Laudo:</Text>
          <Text style={[styles.statusName, { color: statusColor }]}>{statusName}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statusCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: -2,
  },
  statusNameCol: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 4,
    lineHeight: 20,
  },
});
