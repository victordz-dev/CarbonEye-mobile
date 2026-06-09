import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useAlert } from '../hooks';
import { WebView } from 'react-native-webview';
import { InteractiveMap } from '../components/Map/InteractiveMap';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../hooks';
import { Coordenada, calcularAreaHa, verificarAutoIntersecao } from '../utils/geo';
import api from '../services/api';
import { z } from 'zod';
import { MapSearchBox, MapFloatingTools, MapControlPanel } from '../components';

const areaSchema = z.object({
  nome: z.string().min(3, 'O nome da área deve ter no mínimo 3 caracteres.').max(50, 'O nome da área não pode exceder 50 caracteres.'),
});

export const MapScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();

  const [pontos, setPontos] = useState<Coordenada[]>([]);
  const [nome, setNome] = useState<string>('');
  const [monitorar, setMonitorar] = useState<boolean>(true);
  const [loadingText, setLoadingText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { alert } = useAlert();

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

  const iniciarAnaliseMutation = useMutation({
    mutationFn: (pontosParaAnalise: Coordenada[]) => api.post<{
      status_territorial: string;
      classificacao_final: string;
      agro_polygon_id?: string;
      siri?: { pontuacao_total: number; detalhes?: any };
      motivo?: string;
    }>('/areas/analisar', { poligono: pontosParaAnalise }),
    onSuccess: (response) => {
      setAnaliseResultado(response.data);
    },
    onError: (error: unknown) => {
      const msg = (error as any)?.response?.data?.message || 'Falha ao analisar a área.';
      alert('Erro na Análise', msg);
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
      setLoadingText(messages[0]);
      let step = 0;
      interval = setInterval(() => {
        step++;
        if (step < messages.length) {
          setLoadingText(messages[step]);
        } else {
          clearInterval(interval);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [iniciarAnaliseMutation.isPending]);

  const { data: areas = [] } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const response = await api.get<any[]>('/areas');
      return response.data;
    }
  });

  const webViewRef = useRef<WebView>(null);
  const isClickRef = useRef(false);

  const centralizarMapa = () => {
    if (webViewRef.current && pontos.length > 0) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'UPDATE_POINTS',
        points: pontos,
        fitBounds: true,
      }));
    }
  };

  const buscarCoordenada = () => {
    if (!searchQuery.trim()) return;
    const parts = searchQuery.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const coord = { latitude: parts[0], longitude: parts[1] };
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'UPDATE_POINTS',
        points: [...pontos, coord],
        fitBounds: true,
      }));
      setSearchQuery('');
    } else {
      alert('Formato Inválido', 'Digite no formato: Latitude, Longitude (ex: -12.34, -45.67)');
    }
  };

  const desfazerUltimo = () => {
    if (pontos.length > 0) {
      setPontos(pontos.slice(0, -1));
    }
  };

  const limparDesenho = () => {
    setPontos([]);
    setAnaliseResultado(null);
  };

  const iniciarAnalise = () => {
    setAnaliseResultado(null);
    if (pontos.length < 3) {
      alert('Erro', 'Desenhe pelo menos 3 pontos no mapa para formar um polígono.');
      return;
    }
    if (verificarAutoIntersecao(pontos)) {
      alert('Erro de Geometria', 'O polígono possui autointerseções (arestas que se cruzam). Ajuste o desenho.');
      return;
    }
    iniciarAnaliseMutation.mutate(pontos);
  };

  const salvarAreaMutation = useMutation({
    mutationFn: (data: any) => api.post('/areas', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      alert('Sucesso', 'Área salva com sucesso!', [
        { text: 'OK', onPress: () => (navigation as any).navigate('Home') }
      ]);
      setAnaliseResultado(null);
      setPontos([]);
      setNome('');
      setMonitorar(true);
    },
    onError: (error: unknown) => {
      const msg = (error as any)?.response?.data?.message || 'Falha ao salvar a área.';
      alert('Erro ao Salvar', msg);
    }
  });

  const salvarArea = () => {
    try {
      areaSchema.parse({ nome });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        alert('Erro de Validação', e.errors[0].message);
        return;
      }
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.mapContainer}>
        <InteractiveMap
          ref={webViewRef}
          pontos={pontos}
          areas={areas}
          onMapClick={(coordinate) => {
            if (analiseResultado) return;
            if (pontos.length >= 50) {
              alert('Limite Atingido', 'O limite é de 50 vértices por polígono.');
              return;
            }
            isClickRef.current = true;
            setPontos((prev) => [...prev, coordinate]);
          }}
          isClickRef={isClickRef}
        />
      </View>

      <MapSearchBox
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={buscarCoordenada}
        colors={colors as any}
      />

      <MapFloatingTools
        pontosCount={pontos.length}
        onUndo={desfazerUltimo}
        onClear={limparDesenho}
        onCenter={centralizarMapa}
        colors={colors as any}
      />

      <MapControlPanel
        pontosCount={pontos.length}
        areaHa={areaHa}
        analiseResultado={analiseResultado}
        loadingText={loadingText}
        isAnalyzing={iniciarAnaliseMutation.isPending}
        isSaving={salvarAreaMutation.isPending}
        nome={nome}
        setNome={setNome}
        monitorar={monitorar}
        setMonitorar={setMonitorar}
        onAnalyze={iniciarAnalise}
        onClear={limparDesenho}
        onSave={salvarArea}
        colors={colors as any}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});
