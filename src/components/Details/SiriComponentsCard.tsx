import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SiriComponentsCardProps {
  historico: { valor: number }[];
  eviAtual: number | null;
  ndwiAtual: number | null;
  umidadeSolo: number | null;
  tempSolo: number | null;
  focosIncendio: number;
  area: any;
  colors: any;
}

export const SiriComponentsCard: React.FC<SiriComponentsCardProps> = ({
  historico,
  eviAtual,
  ndwiAtual,
  umidadeSolo,
  tempSolo,
  focosIncendio,
  area,
  colors
}) => {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Componentes do Índice SIRI</Text>
      <Text style={[styles.sectionCaption, { color: colors.textSecondary }]}>Análise orbital da última passagem</Text>

      <View style={styles.metricRow}>
        <Text style={[styles.metricLabel, { color: colors.text }]}>NDVI (Biomassa)</Text>
        <Text style={[styles.metricVal, { color: colors.textSecondary }]}>
          {historico.length > 0 ? historico[historico.length - 1].valor.toFixed(2) : '--'}
        </Text>
      </View>
      <View style={styles.metricRow}>
        <Text style={[styles.metricLabel, { color: colors.text }]}>EVI (Vegetação Densa)</Text>
        <Text style={[styles.metricVal, { color: colors.textSecondary }]}>
          {eviAtual !== null ? eviAtual.toFixed(2) : '--'}
        </Text>
      </View>
      <View style={styles.metricRow}>
        <Text style={[styles.metricLabel, { color: colors.text }]}>NDWI (Estresse Hídrico)</Text>
        <Text style={[styles.metricVal, { color: colors.textSecondary }]}>
          {ndwiAtual !== null ? ndwiAtual.toFixed(2) : '--'}
        </Text>
      </View>
      <View style={styles.metricRow}>
        <Text style={[styles.metricLabel, { color: colors.text }]}>Umidade do Solo (Top 10cm)</Text>
        <Text style={[styles.metricVal, { color: colors.textSecondary }]}>
          {umidadeSolo !== null ? `${(umidadeSolo * 100).toFixed(1)}%` : '--'}
        </Text>
      </View>
      <View style={styles.metricRow}>
        <Text style={[styles.metricLabel, { color: colors.text }]}>Temp. da Superfície do Solo</Text>
        <Text style={[styles.metricVal, { color: colors.textSecondary }]}>
          {tempSolo !== null ? `${tempSolo.toFixed(1)} °C` : '--'}
        </Text>
      </View>
      <View style={styles.metricRow}>
        <Text style={[styles.metricLabel, { color: colors.text }]}>Focos de Calor Recentes</Text>
        <Text style={[styles.metricVal, { color: colors.danger }]}>{focosIncendio}</Text>
      </View>
      <View style={styles.metricRow}>
        <Text style={[styles.metricLabel, { color: colors.text }]}>Última Atualização Orbital</Text>
        <Text style={[styles.metricVal, { color: colors.textSecondary }]}>
          {area.ultimaAnalise ? new Date(area.ultimaAnalise).toLocaleDateString('pt-BR') : 'Sem análise'}
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
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: 'bold',
  },
});
