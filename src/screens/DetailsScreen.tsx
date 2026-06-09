import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Dimensions } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useTheme, useAuth, useAlert } from '../hooks';
import { Skeleton, CarbonEstimationCard, SiriComponentsCard, ChartNDVI, DetailsHeader, DetailsStatus, DetailsActions } from '../components';
import { WeatherWidget } from '../components/WeatherWidget';
import { Area } from '../types';
import { calcularAreaHa } from '../utils/geo';
import api, { API_URL } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Details'>;

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
  const { alert } = useAlert();

  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const toggleMonitorMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => api.patch(`/areas/${id}/monitoramento`, { monitoramento_ativo: ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      queryClient.invalidateQueries({ queryKey: ['area', areaId] });
    },
    onError: (error: unknown) => {
      const msg = (error as any)?.response?.data?.message || 'Falha ao atualizar status de monitoramento.';
      alert('Erro', msg);
    }
  });

  const handleDisableMonitor = useCallback(() => {
    alert(
      'Desativar Monitoramento',
      '⚠️ AÇÃO IRREVERSÍVEL\n\nAo desativar o monitoramento:\n\n• O polígono será excluído permanentemente do satélite (AgroMonitoring)\n• Não será possível reativar o monitoramento nesta área\n• A área ficará salva apenas no histórico\n\nDeseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Desativar Permanentemente', 
          style: 'destructive',
          onPress: () => toggleMonitorMutation.mutate({ id: areaId, ativo: false })
        }
      ]
    );
  }, [areaId, toggleMonitorMutation]);

  const { data: area, isLoading: loadingArea } = useQuery({
    queryKey: ['areas', areaId],
    queryFn: async () => {
      const listRes = await api.get<Area[]>('/areas');
      const found = listRes.data.find((a) => a.id === areaId);
      if (!found) throw new Error('Area not found');
      return found;
    }
  });

  const estimativaCarbono = useMemo(() => {
    if (!area) return '0.0';
    const ha = calcularAreaHa(area.geometria.coordinates[0]);
    const score = area.siriAtual ?? 0;
    const fatorSiri = score / 100;
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

  // Derivar dados diretamente do React Query ao invés de duplicar em estados locais
  const historico = useMemo(() => histData?.linha_do_tempo_ndvi ?? [], [histData]);
  const focosIncendio = useMemo(() => histData?.ocorrencias_incendio ?? 0, [histData]);
  const eviAtual = useMemo(() => histData?.evi_atual ?? null, [histData]);
  const ndwiAtual = useMemo(() => histData?.ndwi_atual ?? null, [histData]);
  const umidadeSolo = useMemo(() => histData?.umidade_solo ?? null, [histData]);
  const tempSolo = useMemo(() => histData?.temp_solo ?? null, [histData]);

  const availableYears = useMemo(() => {
    if (!historico || historico.length === 0) return [];
    const years = new Set(historico.map(item => new Date(item.data).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [historico]);

  // Inicializar selectedYear quando anos disponíveis mudarem (sem side effect dentro de useMemo)
  useEffect(() => {
    if (availableYears.length > 0 && selectedYear === null) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  const yearData = useMemo(() => {
    if (!historico || !selectedYear) return [];
    return historico.filter(item => new Date(item.data).getFullYear() === selectedYear);
  }, [historico, selectedYear]);

  const yearVariation = useMemo(() => {
    if (yearData.length < 2) return null;
    const startVal = yearData[0].valor;
    const endVal = yearData[yearData.length - 1].valor;
    return endVal - startVal;
  }, [yearData]);

  const handleExportPdf = useCallback(async () => {
    if (!token) {
      alert('Erro', 'Sessão expirada. Autentique-se novamente.');
      return;
    }
    const pdfUrl = `${API_URL}/areas/${areaId}/laudo-pdf?token=${token}`;
    try {
      const supported = await Linking.canOpenURL(pdfUrl);
      if (supported) {
        await Linking.openURL(pdfUrl);
      } else {
        alert('Erro', 'Não foi possível abrir o link de download.');
      }
    } catch (e) {
      alert('Erro', 'Falha ao processar download do laudo.');
    }
  }, [token, areaId]);

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
  let statusName = 'Área com Baixo Risco Ambiental';

  if (area.status === 'ALERTA') {
    statusColor = colors.warning;
    statusName = 'Área em Atenção';
  } else if (area.status === 'EMERGENCIA') {
    statusColor = colors.danger;
    statusName = 'Área Sob Risco Ambiental';
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailsHeader nome={area.nome} ha={ha} colors={colors} />

      <DetailsStatus
        score={score}
        statusName={statusName}
        statusColor={statusColor}
        colors={colors}
      />

      <WeatherWidget 
        latitude={area.geometria.coordinates[0][0][1]} 
        longitude={area.geometria.coordinates[0][0][0]} 
        isActive={area.monitoramentoAtivo}
        snapshotData={{
          temp: tempSolo,
          humidity: umidadeSolo
        }}
      />

      <SiriComponentsCard 
        historico={historico}
        eviAtual={eviAtual}
        ndwiAtual={ndwiAtual}
        umidadeSolo={umidadeSolo}
        tempSolo={tempSolo}
        focosIncendio={focosIncendio}
        area={area}
        colors={colors}
      />

      <CarbonEstimationCard 
        estimativaCarbono={estimativaCarbono}
        ha={ha}
        colors={colors}
      />

      <ChartNDVI 
        historico={historico}
        availableYears={availableYears}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        yearVariation={yearVariation}
        yearData={yearData}
        colors={colors}
        chartWidth={width - 64}
      />

      <DetailsActions
        monitoramentoAtivo={area.monitoramentoAtivo}
        onDisableMonitor={handleDisableMonitor}
        onExportPdf={handleExportPdf}
        onGoBack={() => navigation.goBack()}
        colors={colors}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
});

