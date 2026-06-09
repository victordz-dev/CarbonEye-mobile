import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CarbonEstimationCardProps {
  estimativaCarbono: string;
  ha: number;
  colors: any;
}

export const CarbonEstimationCard: React.FC<CarbonEstimationCardProps> = ({ estimativaCarbono, ha, colors }) => {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border, padding: 20 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
          <Text style={{ fontSize: 20 }}>🌳</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sequestro de Carbono</Text>
          <Text style={[styles.sectionCaption, { color: colors.textSecondary, marginBottom: 0 }]}>Estimativa baseada em biomassa</Text>
        </View>
      </View>
      
      <View style={{ alignItems: 'center', marginVertical: 16 }}>
        <Text style={{ fontSize: 36, fontWeight: '900', color: colors.success }}>{estimativaCarbono}</Text>
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.textSecondary }}>toneladas de CO₂ / ano</Text>
      </View>

      <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: colors.warning }}>
        <Text style={{ fontSize: 11, color: colors.textSecondary, fontStyle: 'italic', lineHeight: 16 }}>
          <Text style={{ fontWeight: 'bold', color: colors.warning }}>Aviso Legal: </Text>
          Este é um cálculo puramente acadêmico que cruza o Índice SIRI com a área total ({ha.toFixed(1)} ha). Não possui valor de auditoria oficial para mercado de créditos de carbono.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionCaption: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 16,
  },
});
