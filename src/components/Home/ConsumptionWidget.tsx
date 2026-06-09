import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ConsumptionWidgetProps {
  totalAreaHa: number;
  maxAreaHa?: number;
  colors: {
    surface: string;
    border: string;
    text: string;
    textSecondary: string;
    primary: string;
    background: string;
    warning: string;
  };
}

export const ConsumptionWidget: React.FC<ConsumptionWidgetProps> = ({
  totalAreaHa,
  maxAreaHa = 50.0,
  colors,
}) => {
  const isNearLimit = totalAreaHa >= maxAreaHa * 0.8;
  const progressPercent = Math.min(100, (totalAreaHa / maxAreaHa) * 100);

  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Consumo de Cota (Satélite)</Text>
      <Text style={[styles.sectionCaption, { color: colors.textSecondary }]}>
        Limite global de hectares monitorados
      </Text>

      <View style={styles.cotaRow}>
        <View style={styles.cotaTextRow}>
          <Text style={[styles.cotaLabel, { color: colors.text }]}>Área Consumida (Hectares)</Text>
          <Text style={[styles.cotaVal, { color: colors.primary }]}>
            {totalAreaHa.toFixed(2)} / {maxAreaHa.toFixed(2)} ha
          </Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: colors.background }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: isNearLimit ? colors.warning : colors.primary,
                width: `${progressPercent}%`,
              },
            ]}
          />
        </View>
      </View>

      <Text style={[styles.infoNote, { color: colors.textSecondary }]}>
        * A cota de {maxAreaHa} hectares é o limite máximo somado das áreas com monitoramento ativo. Áreas desativadas no histórico não consomem a cota.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionCaption: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  cotaRow: {
    marginBottom: 14,
  },
  cotaTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cotaLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  cotaVal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  infoNote: {
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 15,
    marginTop: 10,
  },
});
