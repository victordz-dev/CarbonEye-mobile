import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DetailsHeaderProps {
  nome: string;
  ha: number;
  colors: any;
}

export const DetailsHeader: React.FC<DetailsHeaderProps> = ({ nome, ha, colors }) => {
  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: colors.text }]}>{nome}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Tamanho total do talhão: {ha.toFixed(2)} ha
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
});
