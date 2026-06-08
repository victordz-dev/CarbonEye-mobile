import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Dimensions,
  Image,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useTheme, useAuth } from '../hooks';
import { SiriBadge, Skeleton } from '../components';
import { Area, HistoricoSiri } from '../types';
import { calcularAreaHa } from '../utils/geo';
import api, { API_URL } from '../services/api';
import Svg, { Line, Circle, Text as SvgText, Path } from 'react-native-svg';
import { WeatherWidget } from '../components/WeatherWidget';

type Props = NativeStackScreenProps<RootStackParamList, 'Details'>;

interface HistoricoNdviItem {
  data: string;
  valor: number;
}

interface HistoricoResponse {
  linha_do_tempo_ndvi: {
    data: string;
    valor: number;
  }[];
  ocorrencias_incendio: number;
  evi_atual?: number;
  ndwi_atual?: number;
  umidade_solo?: number;
  temp_solo?: number;
  imagem_satelite_truecolor?: string;
  imagem_satelite_ndvi?: string;
}

const { width } = Dimensions.get('window');

export const DetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { areaId } = route.params;
  const { colors } = useTheme();
  const { token } = useAuth();

  const [imagemSateliteUrl, setImagemSateliteUrl] = useState<{ truecolor?: string; ndvi?: string } | null>(null);
  const [historico, setHistorico] = useState<{ data: string; valor: number }[]>([]);
  const [focosIncendio, setFocosIncendio] = useState<number>(0);
  const [eviAtual, setEviAtual] = useState<number | null>(null);
  const [ndwiAtual, setNdwiAtual] = useState<number | null>(null);
  const [umidadeSolo, setUmidadeSolo] = useState<number | null>(null);
  const [tempSolo, setTempSolo] = useState<number | null>(null);
  
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar'>('bar');

  const queryClient = useQueryClient();

  const toggleMonitorMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => api.patch(`/areas/${id}/monitoramento`, { monitoramento_ativo: ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      queryClient.invalidateQueries({ queryKey: ['area', areaId] });
    },
    onError: (error: unknown) => {
      const msg = (error as any)?.response?.data?.message || 'Falha ao atualizar status de monitoramento.';
      Alert.alert('Erro', msg);
    }
  });

  const handleDisableMonitor = () => {
    Alert.alert(
      'Desativar Monitoramento',
      'Aviso: ao retirar o monitoramento, não será mais possível ativá-lo nesta área novamente. Ela ficará salva apenas no histórico.\n\nDeseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Desativar', 
          style: 'destructive',
          onPress: () => toggleMonitorMutation.mutate({ id: areaId, ativo: false })
        }
      ]
    );
  };
  const [imageType, setImageType] = useState<'truecolor' | 'ndvi'>('truecolor');

  const { data: area, isLoading: loadingArea } = useQuery({
    queryKey: ['areas', areaId],
    queryFn: async () => {
      const listRes = await api.get<Area[]>('/areas');
      const found = listRes.data.find((a) => a.id === areaId);
      if (!found) throw new Error('Area not found');
      return found;
    }
  });

  // Estimativa Acadêmica de Carbono
  const estimativaCarbono = useMemo(() => {
    if (!area) return '0.0';
    const ha = calcularAreaHa(area.geometria.coordinates[0]);
    const score = area.siriAtual ?? 0;
    const fatorSiri = score / 100; // 0 a 1
    return (ha * fatorSiri * 20).toFixed(1);
  }, [area]);

  const { data: histData, isLoading: loadingHist } = useQuery({
    queryKey: ['historico', areaId],
    queryFn: async () => {
      const histRes = await api.get<HistoricoResponse>(`/areas/${areaId}/historico`);
      return histRes.data;
    }
  });

  const loading = loadingArea || loadingHist;

  useEffect(() => {
    if (histData && histData.linha_do_tempo_ndvi) {
      setHistorico(histData.linha_do_tempo_ndvi);
      setFocosIncendio(histData.ocorrencias_incendio || 0);
      setEviAtual(histData.evi_atual ?? null);
      setNdwiAtual(histData.ndwi_atual ?? null);
      setUmidadeSolo(histData.umidade_solo ?? null);
      setTempSolo(histData.temp_solo ?? null);
      setImagemSateliteUrl({
        truecolor: histData.imagem_satelite_truecolor,
        ndvi: histData.imagem_satelite_ndvi,
      });
    }
  }, [histData]);

  // Extrair anos disponíveis e filtrar dados
  const availableYears = useMemo(() => {
    if (!historico) return [];
    const years = new Set(historico.map(item => new Date(item.data).getFullYear()));
    const sorted = Array.from(years).sort((a, b) => b - a); // Mais recente primeiro
    if (sorted.length > 0 && selectedYear === null) {
      setSelectedYear(sorted[0]);
    }
    return sorted;
  }, [historico]);

  const yearData = useMemo(() => {
    if (!historico || !selectedYear) return [];
    return historico.filter(item => new Date(item.data).getFullYear() === selectedYear);
  }, [historico, selectedYear]);

  // Calcular variação absoluta do ano (em pontos)
  const yearVariation = useMemo(() => {
    if (yearData.length < 2) return null;
    const startVal = yearData[0].valor;
    const endVal = yearData[yearData.length - 1].valor;
    return endVal - startVal; // Variação absoluta
  }, [yearData]);

  const handleExportPdf = async () => {
    if (!token) {
      Alert.alert('Erro', 'Sessão expirada. Autentique-se novamente.');
      return;
    }
    const pdfUrl = `${API_URL}/areas/${areaId}/laudo-pdf?token=${token}`;
    try {
      const supported = await Linking.canOpenURL(pdfUrl);
      if (supported) {
        await Linking.openURL(pdfUrl);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o link de download.');
      }
    } catch (e) {
      console.error('Failed to download PDF:', e);
      Alert.alert('Erro', 'Falha ao processar download do laudo.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: 16 }]}>
        <Skeleton height={200} borderRadius={12} style={{ marginBottom: 16 }} />
        <Skeleton height={60} borderRadius={8} style={{ marginBottom: 24 }} />
        <Skeleton height={250} borderRadius={12} style={{ marginBottom: 16 }} />
        <Skeleton height={100} borderRadius={12} />
      </View>
    );
  }

  if (!area) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Área não encontrada.</Text>
        <TouchableOpacity style={[styles.btnBack, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
          <Text style={styles.btnBackText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const score = area.siriAtual ?? 0;
  const ha = calcularAreaHa(area.geometria.coordinates[0]);

  let statusColor = colors.success;
  let statusName = 'Área com Baixo Risco Ambiental (Potencialmente Classificável)';

  if (area.status === 'ALERTA') {
    statusColor = colors.warning;
    statusName = 'Área em Atenção';
  } else if (area.status === 'EMERGENCIA') {
    statusColor = colors.danger;
    statusName = 'Área Sob Risco Ambiental';
  }

  // Configurações do Gráfico SVG
  const chartHeight = 200;
  const chartWidth = width - 64; // Padding 16 on each side + 16 internal padding
  const paddingX = 30;
  const paddingY = 20;
  const maxNdvi = 1.0;
  const minNdvi = 0.0;
  
  let linePath = '';
  const points: { x: number, y: number, val: number, label: string }[] = [];

  if (yearData.length > 0) {
    const xStep = (chartWidth - paddingX * 2) / Math.max(yearData.length - 1, 1);
    
    yearData.forEach((item, i) => {
      const x = paddingX + i * xStep;
      const y = chartHeight - paddingY - ((item.valor - minNdvi) / (maxNdvi - minNdvi)) * (chartHeight - paddingY * 2);
      
      points.push({ x, y, val: item.valor, label: new Date(item.data).toLocaleDateString('pt-BR', { month: 'short' }).replace(/^\w/, c => c.toUpperCase()) });
      
      if (i === 0) {
        linePath += `M ${x} ${y} `;
      } else {
        linePath += `L ${x} ${y} `;
      }
    });
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{area.nome}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Tamanho total do talhão: {ha.toFixed(2)} ha
        </Text>
      </View>

      {/* Status Card */}
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

      {/* Clima Local (OpenWeather) */}
      <WeatherWidget 
        latitude={area.geometria.coordinates[0][0][1]} 
        longitude={area.geometria.coordinates[0][0][0]} 
      />

      {/* Componentes do SIRI */}
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

      {/* Estimativa de Carbono */}
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



      {/* Histórico NDVI - Gráfico */}
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Histórico de NDVI</Text>
        <Text style={[styles.sectionCaption, { color: colors.textSecondary }]}>
          Variação da biomassa através do tempo
        </Text>

        {availableYears.length > 0 && (
          <View style={styles.filterSection}>
            <View style={styles.yearFilterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {availableYears.map(year => (
                  <TouchableOpacity 
                    key={year} 
                    style={[styles.yearChip, selectedYear === year ? { backgroundColor: colors.primary, borderColor: colors.primary } : { borderColor: colors.border }]}
                    onPress={() => setSelectedYear(year)}
                  >
                    <Text style={[styles.yearChipText, selectedYear === year ? { color: '#fff' } : { color: colors.textSecondary }]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.chartToggleContainer}>
              <TouchableOpacity onPress={() => setChartType('bar')} style={[styles.toggleBtn, chartType === 'bar' ? { backgroundColor: colors.primary } : { backgroundColor: colors.border }]}>
                <Text style={[styles.toggleText, chartType === 'bar' ? { color: '#fff' } : { color: colors.textSecondary }]}>Barras</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setChartType('line')} style={[styles.toggleBtn, chartType === 'line' ? { backgroundColor: colors.primary } : { backgroundColor: colors.border }]}>
                <Text style={[styles.toggleText, chartType === 'line' ? { color: '#fff' } : { color: colors.textSecondary }]}>Linha</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {yearData.length > 0 ? (
          <View>
            {chartType === 'line' ? (
              <View style={{ alignItems: 'center', marginTop: 10 }}>
                <Svg height={chartHeight} width={chartWidth}>
                  {/* Linhas de Grade */}
                  {[0, 0.5, 1.0].map((val, idx) => {
                    const y = chartHeight - paddingY - ((val - minNdvi) / (maxNdvi - minNdvi)) * (chartHeight - paddingY * 2);
                    return (
                      <React.Fragment key={`grid-${idx}`}>
                        <Line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke={colors.border} strokeWidth="1" strokeDasharray="4" />
                        <SvgText x={paddingX - 5} y={y + 4} fontSize="10" fill={colors.textSecondary} textAnchor="end">
                          {val.toFixed(1)}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                  
                  {/* Linha Principal */}
                  <Path d={linePath} fill="none" stroke={colors.primary} strokeWidth="3" />
                  
                  {/* Pontos e Labels */}
                  {points.map((p, i) => (
                    <React.Fragment key={`pt-${i}`}>
                      <Circle cx={p.x} cy={p.y} r="4" fill={colors.background} stroke={colors.primary} strokeWidth="2" />
                      <SvgText x={p.x} y={chartHeight - 5} fontSize="10" fill={colors.textSecondary} textAnchor="middle">
                        {p.label}
                      </SvgText>
                    </React.Fragment>
                  ))}
                </Svg>
              </View>
            ) : (
              <View style={styles.ndviList}>
                {yearData.map((item, idx) => {
                  const formattedDate = new Date(item.data).toLocaleDateString('pt-BR', { month: 'long' });
                  return (
                    <View key={idx} style={[styles.ndviRow, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.ndviDate, { color: colors.text }]}>{formattedDate}</Text>
                      <View style={styles.ndviBarContainer}>
                        <View style={[styles.ndviBarFill, { backgroundColor: colors.primary, width: `${item.valor * 100}%` }]} />
                      </View>
                      <Text style={[styles.ndviVal, { color: colors.text }]}>{item.valor.toFixed(2)}</Text>
                    </View>
                  );
                })}
              </View>
            )}
            
            {yearVariation !== null && (
              <View style={[styles.insightCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.insightTitle, { color: colors.text }]}>Variação Anual Absoluta</Text>
                <Text style={[styles.insightValue, { color: yearVariation >= 0 ? colors.success : colors.danger }]}>
                  {yearVariation > 0 ? '↗' : '↘'} {yearVariation > 0 ? '+' : ''}{yearVariation.toFixed(2)} pts
                </Text>
                <Text style={[styles.insightDesc, { color: colors.textSecondary }]}>
                  Diferença em pontos entre o primeiro e o último registro de {selectedYear}.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={[styles.emptyNDVI, { color: colors.textSecondary }]}>Nenhum histórico disponível para este ano.</Text>
        )}
      </View>

      {/* Botões de Ação */}
      <View style={styles.actionSection}>
        {area.monitoramentoAtivo && (
          <TouchableOpacity style={[styles.btnExport, { backgroundColor: '#fee2e2', marginBottom: 12 }]} onPress={handleDisableMonitor}>
            <Text style={[styles.btnExportText, { color: '#ef4444' }]}>⏸ Desativar Monitoramento</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.btnExport, { backgroundColor: colors.primary }]} onPress={() => void handleExportPdf()}>
          <Text style={styles.btnExportText}>📄 Exportar Laudo Técnico (PDF)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btnBackOutline, { borderColor: colors.border }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.btnBackOutlineText, { color: colors.text }]}>Voltar ao Painel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  btnBack: {
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  btnBackText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
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
  filterSection: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  yearFilterContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  chartToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  yearChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  yearChipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  ndviList: {
    marginTop: 6,
  },
  ndviRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  ndviDate: {
    fontSize: 13,
    flex: 1.2,
    textTransform: 'capitalize',
  },
  ndviBarContainer: {
    flex: 2,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  ndviBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  ndviVal: {
    fontSize: 13,
    fontWeight: 'bold',
    flex: 0.5,
    textAlign: 'right',
  },
  emptyNDVI: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  insightCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 11,
    textAlign: 'center',
  },
  actionSection: {
    marginBottom: 40,
    gap: 12,
  },
  btnExport: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  btnExportText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  btnBackOutline: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnBackOutlineText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
