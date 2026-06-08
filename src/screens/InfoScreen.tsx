import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../hooks';

export const InfoScreen: React.FC = () => {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.primary }]}>Metodologia CarbonEye</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Entenda o funcionamento do Índice de Risco Ambiental (SIRI)
      </Text>

      {/* Seção 1 */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>O que é o SIRI?</Text>
        <Text style={[styles.cardText, { color: colors.textSecondary }]}>
          O **SIRI (Satellite Environmental Risk Index)** é uma ferramenta algorítmica de triagem rápida que varia de **0 a 100**. 
          Ele calcula o nível de risco ambiental de um talhão de terra usando sensoriamento remoto de satélites e meteorologia.
        </Text>
      </View>

      {/* Seção 2 */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Como as Notas são Calculadas?</Text>
        
        <Text style={[styles.subCardTitle, { color: colors.text }]}>1. Saúde Atual da Vegetação (NDVI, EVI e NDWI) - Peso 45%</Text>
        <Text style={[styles.cardText, { color: colors.textSecondary }]}>
          Mapeado via imagens orbitais Sentinel/Landsat. Avalia a saúde vegetativa usando o melhor índice entre NDVI e EVI. Penaliza a nota em até 5 pontos se o NDWI indicar estresse hídrico agudo nas folhas.
        </Text>

        <Text style={[styles.subCardTitle, { color: colors.text }]}>2. Degradação Histórica - Peso 30%</Text>
        <Text style={[styles.cardText, { color: colors.textSecondary }]}>
          Compara o NDVI atual com as médias sazonais dos últimos 12 meses. Identifica padrões de estresse vegetativo contínuo ou desmatamento acelerado.
        </Text>

        <Text style={[styles.subCardTitle, { color: colors.text }]}>3. Risco de Incêndios - Peso 20%</Text>
        <Text style={[styles.cardText, { color: colors.textSecondary }]}>
          Analisa focos de queimadas em um buffer de **10km** usando o histórico (INPE BDQueimadas) e tempo real (NASA FIRMS).
        </Text>

        <Text style={[styles.subCardTitle, { color: colors.text }]}>4. Fatores Climáticos e Solo - Peso 5%</Text>
        <Text style={[styles.cardText, { color: colors.textSecondary }]}>
          Avalia Umidade do Solo, Temperatura da Superfície, Umidade do Ar e Ventos (OpenWeather/AgroMonitoring) para prever seca extrema e risco de queimada no curto prazo.
        </Text>
      </View>

      {/* Seção 3 */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Classificação Geral</Text>
        
        <View style={styles.classRow}>
          <Text style={[styles.classBadge, { backgroundColor: colors.success }]}>Normal (SIRI ≥ 70)</Text>
          <Text style={[styles.classDesc, { color: colors.textSecondary }]}>
            Área com Baixo Risco Ambiental (Potencialmente Classificável para créditos de carbono).
          </Text>
        </View>

        <View style={styles.classRow}>
          <Text style={[styles.classBadge, { backgroundColor: colors.warning }]}>Atenção (SIRI 40-69)</Text>
          <Text style={[styles.classDesc, { color: colors.textSecondary }]}>
            Área em Atenção devido a degradação leve, focos distantes ou clima desfavorável.
          </Text>
        </View>

        <View style={styles.classRow}>
          <Text style={[styles.classBadge, { backgroundColor: colors.danger }]}>Risco (SIRI &lt; 40)</Text>
          <Text style={[styles.classDesc, { color: colors.textSecondary }]}>
            Área Sob Risco Ambiental Crítico (Queimadas próximas ou desmatamento acelerado).
          </Text>
        </View>

        <View style={styles.classRow}>
          <Text style={[styles.classBadge, { backgroundColor: '#475569' }]}>Restrição Territorial</Text>
          <Text style={[styles.classDesc, { color: colors.textSecondary }]}>
            Área sobreposta a Terras Indígenas (TI) ou Unidades de Conservação (UC) protegidas. Bloqueio automático no sistema.
          </Text>
        </View>
      </View>

      {/* Disclaimer */}
      <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
        Aviso Acadêmico: Este projeto tem fins meramente educativos e demonstrativos da aplicabilidade de dados aeroespaciais no monitoramento da Terra.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 6,
  },
  cardText: {
    fontSize: 13,
    lineHeight: 18,
  },
  classRow: {
    marginBottom: 16,
  },
  classBadge: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  classDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  disclaimer: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
  },
});
