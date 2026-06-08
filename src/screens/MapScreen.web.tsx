import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { Coordenada, calcularAreaHa, verificarAutoIntersecao } from '../utils/geo';
import api from '../services/api';

// Predefined coordinate templates for easy testing/grading
const TEMPLATE_SP_NORMAL: Coordenada[] = [
  { longitude: -47.0005, latitude: -22.9005 },
  { longitude: -46.9995, latitude: -22.9005 },
  { longitude: -46.9995, latitude: -22.8995 },
  { longitude: -47.0005, latitude: -22.8995 },
];

const TEMPLATE_YANOMAMI: Coordenada[] = [
  { longitude: -62.5005, latitude: 2.5005 },
  { longitude: -62.4995, latitude: 2.5005 },
  { longitude: -62.4995, latitude: 2.4995 },
  { longitude: -62.5005, latitude: 2.4995 },
];

const TEMPLATE_CANTAREIRA: Coordenada[] = [
  { longitude: -46.6505, latitude: -23.4205 },
  { longitude: -46.6495, latitude: -23.4205 },
  { longitude: -46.6495, latitude: -23.4195 },
  { longitude: -46.6505, latitude: -23.4195 },
];

const TEMPLATE_SP_INCENDIO: Coordenada[] = [
  { longitude: -47.0205, latitude: -22.9205 },
  { longitude: -47.0195, latitude: -22.9205 },
  { longitude: -47.0195, latitude: -22.9195 },
  { longitude: -47.0205, latitude: -22.9195 },
];

export const MapScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const queryClient = useQueryClient();

  const [pontos, setPontos] = useState<Coordenada[]>([]);
  const [nome, setNome] = useState<string>('');
  const [monitorar, setMonitorar] = useState<boolean>(true);
  const [loadingText, setLoadingText] = useState<string>('');

  const iniciarAnaliseMutation = useMutation({
    mutationFn: (pontosParaAnalise: Coordenada[]) => api.post<{
      status_territorial: string;
      classificacao_final: string;
      agro_polygon_id?: string;
      siri?: {
        pontuacao_total: number;
        detalhes?: any;
      };
      motivo?: string;
    }>('/areas/analisar', { poligono: pontosParaAnalise }),
    onSuccess: (response) => {
      setAnaliseResultado(response.data);
    },
    onError: (error: unknown) => {
      const msg = (error as any)?.response?.data?.message || 'Falha ao analisar.';
      Alert.alert('Erro', msg);
    }
  });

  const salvarAreaMutation = useMutation({
    mutationFn: (data: any) => api.post('/areas', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      Alert.alert('Sucesso', 'Área salva no histórico com sucesso!', [
        { text: 'OK', onPress: () => (navigation as any).navigate('Home') }
      ]);
      limparDesenho();
      setNome('');
      setMonitorar(true);
    },
    onError: (error: unknown) => {
      const msg = (error as any)?.response?.data?.message || 'Falha ao salvar.';
      Alert.alert('Erro', msg);
    }
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (iniciarAnaliseMutation.isPending) {
      const messages = [
        'Iniciando análise geoespacial...',
        'Buscando histórico de satélite (Sentinel-2)...',
        'Calculando média do índice NDVI...',
        'Processando imagens orbitais...',
        'Cruzando dados climáticos e focos de calor...',
        'Finalizando laudo SIRI... quase lá!',
      ];
      let msgIndex = 0;
      setLoadingText(messages[0]);
      interval = setInterval(() => {
        msgIndex++;
        if (msgIndex < messages.length) {
          setLoadingText(messages[msgIndex]);
        }
      }, 12000);
    } else {
      setLoadingText('');
    }
    return () => clearInterval(interval);
  }, [iniciarAnaliseMutation.isPending]);

  // Manual input state
  const [inputLat, setInputLat] = useState<string>('');
  const [inputLng, setInputLng] = useState<string>('');

  const [analiseResultado, setAnaliseResultado] = useState<{
    status_territorial: string;
    classificacao_final: string;
    agro_polygon_id?: string;
    siri?: {
      pontuacao_total: number;
      detalhes?: any;
    };
    motivo?: string;
  } | null>(null);

  const carregarTemplate = (template: Coordenada[]) => {
    setPontos(template);
    setAnaliseResultado(null);
  };

  const adicionarPontoManual = () => {
    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Erro', 'Coordenadas inválidas. Digite valores numéricos válidas.');
      return;
    }

    if (pontos.length >= 50) {
      Alert.alert('Limite', 'Limite de 50 vértices atingido.');
      return;
    }

    setPontos([...pontos, { latitude: lat, longitude: lng }]);
    setInputLat('');
    setInputLng('');
  };

  const limparDesenho = () => {
    setPontos([]);
    setAnaliseResultado(null);
  };

  const iniciarAnalise = () => {
    setAnaliseResultado(null);
    if (pontos.length < 3) {
      Alert.alert('Erro', 'Desenhe pelo menos 3 pontos no mapa para formar um polígono.');
      return;
    }

    if (verificarAutoIntersecao(pontos)) {
      Alert.alert('Erro de Geometria', 'O polígono possui autointerseções. Corrija os pontos.');
      return;
    }

    iniciarAnaliseMutation.mutate(pontos);
  };

  const salvarArea = () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'Digite um nome para o talhão.');
      return;
    }

    salvarAreaMutation.mutate({
      nome,
      poligono: pontos,
      monitoramento_ativo: monitorar,
      agro_polygon_id: analiseResultado?.agro_polygon_id,
      siri_inicial: analiseResultado?.siri?.pontuacao_total ?? 0,
      siri_completo: analiseResultado?.siri ? {
        pontuacaoTotal: analiseResultado.siri.pontuacao_total,
        classificacao: analiseResultado.classificacao_final,
        detalhes: analiseResultado.siri.detalhes
      } : undefined,
    });
  };

  const areaHa = calcularAreaHa(pontos);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Simulador Cartográfico (Ambiente Web)</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Selecione um template rápido abaixo ou insira coordenadas manualmente.
        </Text>

        {/* Templates Rápidos */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Templates Rápidos:</Text>
        <View style={styles.templateGrid}>
          <TouchableOpacity
            style={[styles.templateBtn, { backgroundColor: colors.primary }]}
            onPress={() => carregarTemplate(TEMPLATE_SP_NORMAL)}
          >
            <Text style={styles.templateBtnText}>SP Normal (1.2 ha)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.templateBtn, { backgroundColor: colors.danger }]}
            onPress={() => carregarTemplate(TEMPLATE_SP_INCENDIO)}
          >
            <Text style={styles.templateBtnText}>SP Foco Proximidade</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.templateBtn, { backgroundColor: colors.warning }]}
            onPress={() => carregarTemplate(TEMPLATE_YANOMAMI)}
          >
            <Text style={styles.templateBtnText}>Yanomami TI (Bloqueado)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.templateBtn, { backgroundColor: colors.warning }]}
            onPress={() => carregarTemplate(TEMPLATE_CANTAREIRA)}
          >
            <Text style={styles.templateBtnText}>Cantareira UC (Bloqueado)</Text>
          </TouchableOpacity>
        </View>

        {/* Adicionar Coordenada Manual */}
        {!analiseResultado && (
          <View style={[styles.manualForm, { borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Inserir Vértice Manualmente</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputCol}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Latitude</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  placeholder="Ex: -22.9068"
                  placeholderTextColor={colors.textSecondary}
                  value={inputLat}
                  onChangeText={setInputLat}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputCol}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Longitude</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  placeholder="Ex: -47.0613"
                  placeholderTextColor={colors.textSecondary}
                  value={inputLng}
                  onChangeText={setInputLng}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.btnAdd, { backgroundColor: colors.primary }]}
              onPress={adicionarPontoManual}
            >
              <Text style={styles.btnAddText}>Adicionar Ponto</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Lista de Vértices Carregados */}
        <View style={styles.verticesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Vértices Inseridos ({pontos.length}/50) | Área: {areaHa.toFixed(2)} ha (Mín: 1ha - Máx: 50ha)
          </Text>
          {pontos.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum ponto inserido.</Text>
          ) : (
            <View style={[styles.table, { borderColor: colors.border }]}>
              {pontos.map((p, idx) => (
                <View key={idx} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                  <Text style={{ color: colors.text }}>Vértice {idx + 1}:</Text>
                  <Text style={{ color: colors.textSecondary }}>Lat {p.latitude.toFixed(6)}, Lng {p.longitude.toFixed(6)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Ações */}
        {!analiseResultado ? (
          <View>
            {iniciarAnaliseMutation.isPending && (
              <View style={{ alignItems: 'center', marginBottom: 16, marginTop: 16, padding: 16, backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                <ActivityIndicator color={colors.primary} size="large" style={{ marginBottom: 12 }} />
                <Text style={{ color: colors.primary, fontWeight: 'bold', textAlign: 'center', fontSize: 15, marginBottom: 4 }}>
                  {loadingText}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
                  O tempo de processamento de novas áreas no satélite é de cerca de 1 a 2 minutos. Por favor, aguarde...
                </Text>
              </View>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.btnSec, { borderColor: colors.danger }]} onPress={limparDesenho} disabled={iniciarAnaliseMutation.isPending}>
                <Text style={[styles.btnSecText, { color: colors.danger }]}>Limpar Tudo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPri, { backgroundColor: iniciarAnaliseMutation.isPending ? colors.textSecondary : colors.primary }]}
                onPress={() => void iniciarAnalise()}
                disabled={iniciarAnaliseMutation.isPending}
              >
                {iniciarAnaliseMutation.isPending ? <Text style={styles.btnPriText}>Processando...</Text> : <Text style={styles.btnPriText}>Analisar Área</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Exibição após análise */
          <View style={[styles.resultCard, { borderColor: colors.border }]}>
            <Text style={[styles.resultHeader, { color: colors.text }]}>Resultado da Triagem Territorial & SIRI:</Text>
            {analiseResultado.status_territorial === 'BLOQUEADO' ? (
              <View>
                <Text style={[styles.statusText, { color: colors.danger }]}>
                  🚫 {analiseResultado.classificacao_final}
                </Text>
                <Text style={[styles.statusReason, { color: colors.textSecondary }]}>
                  Motivo: {analiseResultado.motivo}
                </Text>
                <TouchableOpacity
                  style={[styles.btnSec, { borderColor: colors.primary, marginTop: 14 }]}
                  onPress={limparDesenho}
                >
                  <Text style={[styles.btnSecText, { color: colors.primary }]}>Voltar / Redesenhar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={[styles.statusText, { color: colors.success }]}>
                  ✅ Área Disponível para Monitoramento
                </Text>
                <Text style={[styles.statusCls, { color: colors.text }]}>
                  Laudo Preliminar: {analiseResultado.classificacao_final}
                </Text>
                {analiseResultado.siri && (
                  <Text style={[styles.statusSiri, { color: colors.primary }]}>
                    Pontuação SIRI: {analiseResultado.siri.pontuacao_total} / 100
                  </Text>
                )}

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Nome da Área / Talhão</Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                    placeholder="Ex: Talhão Central SP"
                    placeholderTextColor={colors.textSecondary}
                    value={nome}
                    onChangeText={setNome}
                  />
                </View>

                <View style={styles.switchRow}>
                  <Text style={[styles.label, { color: colors.text }]}>Monitoramento Ativo</Text>
                  <Switch value={monitorar} onValueChange={setMonitorar} />
                </View>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.btnPri, { backgroundColor: colors.primary, width: '100%' }]}
                        onPress={() => void salvarArea()}
                        disabled={salvarAreaMutation.isPending}
                      >
                        {salvarAreaMutation.isPending ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.btnPriText}>Concluir Pesquisa</Text>
                        )}
                      </TouchableOpacity>
                    </View>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  templateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  templateBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  manualForm: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
  },
  btnAdd: {
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnAddText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  verticesSection: {
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  table: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderBottomWidth: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  btnPri: {
    flex: 1.2,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnPriText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  btnSec: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnSecText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginTop: 20,
  },
  resultHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  statusReason: {
    fontSize: 13,
    lineHeight: 18,
  },
  statusCls: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  statusSiri: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 14,
  },
  inputGroup: {
    marginTop: 14,
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
});
