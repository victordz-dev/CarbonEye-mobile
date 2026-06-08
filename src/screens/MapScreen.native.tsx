import React, { useState, useEffect, useRef } from 'react';
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
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../hooks';
import { Coordenada, calcularAreaHa, verificarAutoIntersecao } from '../utils/geo';
import api from '../services/api';

const { height: screenHeight } = Dimensions.get('window');

const LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #f8fafc; }
    /* Estilização para o tooltip do número do vértice */
    .leaflet-tooltip-own {
      background: #0284c7;
      color: #ffffff;
      border: none;
      font-weight: bold;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .custom-area-label {
      background: rgba(255, 255, 255, 0.85);
      color: #0f172a;
      border: none;
      font-weight: bold;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([-22.9068, -47.0613], 13);
    
    L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      detectRetina: true,
      attribution: '© Google Maps'
    }).addTo(map);

    var markerGroup = L.featureGroup().addTo(map);
    var existingAreasGroup = L.featureGroup().addTo(map);
    var polygon = null;
    var polyline = null;

    map.on('click', function(e) {
      var lat = e.latlng.lat;
      var lng = e.latlng.lng;
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'MAP_CLICK',
        coordinate: { latitude: lat, longitude: lng }
      }));
    });

    function handleMessage(event) {
      try {
        var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.type === 'UPDATE_AREAS') {
          existingAreasGroup.clearLayers();
          data.areas.forEach(function(area) {
            var poly = L.polygon(area.coordinates, {
              color: '#64748b',
              fillColor: 'rgba(100, 116, 139, 0.4)',
              weight: 2
            }).addTo(existingAreasGroup);

            // Add center icon marker
            var center = poly.getBounds().getCenter();
            var iconHtml = '<div style="font-size: 20px; text-shadow: 0 0 4px rgba(255,255,255,1); display: flex; justify-content: center; align-items: center;">📍</div>';
            var customIcon = L.divIcon({ html: iconHtml, className: 'custom-area-marker', iconSize: [24, 24], iconAnchor: [12, 24] });
            
            L.marker(center, { icon: customIcon })
              .bindTooltip(area.nome, { permanent: true, direction: 'bottom', offset: [0, 5], className: 'custom-area-label', opacity: 0.9 })
              .addTo(existingAreasGroup);
          });
        }
        else if (data && data.type === 'UPDATE_POINTS') {
          markerGroup.clearLayers();
          if (polygon) {
            map.removeLayer(polygon);
            polygon = null;
          }
          if (polyline) {
            map.removeLayer(polyline);
            polyline = null;
          }

          const pts = data.points;
          const latLngs = pts.map(p => [p.latitude, p.longitude]);

          // Add markers (as vector circle markers to avoid image URL loading failures)
          pts.forEach((p, idx) => {
            L.circleMarker([p.latitude, p.longitude], {
              radius: 6,
              fillColor: '#0284c7',
              color: '#ffffff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.9
            })
            .bindTooltip((idx + 1).toString(), { permanent: true, direction: 'top', className: 'leaflet-tooltip-own' })
            .addTo(markerGroup);
          });

          // Add polygon or polyline
          if (latLngs.length >= 3) {
            polygon = L.polygon(latLngs, {
              color: '#0284c7',
              fillColor: 'rgba(2, 132, 199, 0.3)',
              weight: 2
            }).addTo(map);
            if (data.fitBounds) {
              map.fitBounds(polygon.getBounds(), { padding: [40, 40] });
            }
          } else if (latLngs.length === 2) {
            polyline = L.polyline(latLngs, {
              color: '#0284c7',
              weight: 2,
              dashArray: '5, 5'
            }).addTo(map);
            if (data.fitBounds) {
              var bounds = L.latLngBounds(latLngs);
              map.fitBounds(bounds, { maxZoom: 15, padding: [40, 40] });
            }
          } else if (latLngs.length > 0) {
            if (data.fitBounds) {
              var bounds = L.latLngBounds(latLngs);
              map.fitBounds(bounds, { maxZoom: 15, padding: [40, 40] });
            }
          }
        }
      } catch (e) {
        console.error('Error processing message in WebView:', e);
      }
    }

    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage);
  </script>
</body>
</html>
`;

export const MapScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const queryClient = useQueryClient();

  const [pontos, setPontos] = useState<Coordenada[]>([]);
  const [nome, setNome] = useState<string>('');
  const [monitorar, setMonitorar] = useState<boolean>(true);
  const [loadingText, setLoadingText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
      Alert.alert('Erro na Análise', msg);
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

  useEffect(() => {
    if (webViewRef.current && areas.length > 0) {
      const mapAreas = areas.map((a: any) => ({
        nome: a.nome,
        coordinates: a.geometria.coordinates[0].map((c: number[]) => [c[1], c[0]])
      }));
      webViewRef.current.postMessage(JSON.stringify({
        type: 'UPDATE_AREAS',
        areas: mapAreas
      }));
    }
  }, [areas]);

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

  const webViewRef = useRef<WebView>(null);
  const isClickRef = useRef(false);

  // Sync state to WebView when points change
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'UPDATE_POINTS',
        points: pontos,
        fitBounds: !isClickRef.current,
      }));
    }
    isClickRef.current = false;
  }, [pontos]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_CLICK') {
        if (analiseResultado) return; // Se já analisou, bloqueia novas adições até limpar

        const newCoord: Coordenada = data.coordinate;
        if (pontos.length >= 50) {
          Alert.alert('Limite Atingido', 'O limite é de 50 vértices por polígono.');
          return;
        }
        isClickRef.current = true;
        setPontos([...pontos, newCoord]);
      }
    } catch (e) {
      console.error('Error handling WebView message:', e);
    }
  };

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
      Alert.alert('Formato Inválido', 'Digite no formato: Latitude, Longitude (ex: -12.34, -45.67)');
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
      Alert.alert('Erro', 'Desenhe pelo menos 3 pontos no mapa para formar um polígono.');
      return;
    }
    if (verificarAutoIntersecao(pontos)) {
      Alert.alert('Erro de Geometria', 'O polígono possui autointerseções (arestas que se cruzam). Ajuste o desenho.');
      return;
    }
    iniciarAnaliseMutation.mutate(pontos);
  };

  const salvarAreaMutation = useMutation({
    mutationFn: (data: any) => api.post('/areas', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      Alert.alert('Sucesso', 'Área salva com sucesso!', [
        { text: 'OK', onPress: () => (navigation as any).navigate('Home') }
      ]);
      setAnaliseResultado(null);
      setPontos([]);
      setNome('');
      setMonitorar(true);
    },
    onError: (error: unknown) => {
      const msg = (error as any)?.response?.data?.message || 'Falha ao salvar a área.';
      Alert.alert('Erro ao Salvar', msg);
    }
  });

  const salvarArea = () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'Por favor, digite um nome para a área.');
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Container do WebView contendo Leaflet - TELA CHEIA */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: LEAFLET_HTML }}
          style={styles.map}
          onMessage={handleMessage}
          onLoadEnd={() => {
            webViewRef.current?.postMessage(JSON.stringify({
              type: 'UPDATE_POINTS',
              points: pontos,
              fitBounds: true,
            }));
            
            if (areas && areas.length > 0) {
              const mapAreas = areas.map((a: any) => ({
                nome: a.nome,
                coordinates: a.geometria.coordinates[0].map((c: number[]) => [c[1], c[0]])
              }));
              webViewRef.current?.postMessage(JSON.stringify({
                type: 'UPDATE_AREAS',
                areas: mapAreas
              }));
            }
          }}
        />
      </View>

      {/* Caixa de Busca no Topo */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Busca ex: -12.34, -45.67"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={[styles.searchBtn, { backgroundColor: colors.primary }]} onPress={buscarCoordenada}>
          <Text style={styles.searchBtnText}>Ir</Text>
        </TouchableOpacity>
      </View>

      {/* Ferramentas Flutuantes (Direita) */}
      <View style={styles.floatingToolsContainer}>
        <TouchableOpacity
          style={[styles.floatingToolBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={desfazerUltimo}
        >
          <Text style={styles.floatingToolText}>↩️</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.floatingToolBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={limparDesenho}
        >
          <Text style={styles.floatingToolText}>🗑️</Text>
        </TouchableOpacity>

        {pontos.length > 0 && (
          <TouchableOpacity
            style={[styles.floatingToolBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={centralizarMapa}
          >
            <Text style={styles.floatingToolText}>🎯</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Painel de Controle (Fixo na Base) */}
      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ScrollView style={styles.panelScroll} contentContainerStyle={styles.panelScrollContent}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>Desenho de Polígono</Text>
          <Text style={[styles.panelDetail, { color: colors.textSecondary }]}>
            Vértices: {pontos.length}/50 | Área: {areaHa.toFixed(2)} ha (Mín: 1ha - Máx: 50ha)
          </Text>

          {/* Triagem preliminar pendente */}
          {!analiseResultado ? (
            <View>
              {iniciarAnaliseMutation.isPending ? (
                <View style={{ alignItems: 'center', marginBottom: 16, padding: 16, backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                  <ActivityIndicator color={colors.primary} size="large" style={{ marginBottom: 12 }} />
                  <Text style={{ color: colors.primary, fontWeight: 'bold', textAlign: 'center', fontSize: 15, marginBottom: 4 }}>
                    {loadingText}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
                    O tempo de processamento de novas áreas no satélite é de cerca de 1 a 2 minutos. Por favor, aguarde...
                  </Text>
                </View>
              ) : (
                <Text style={[styles.infoNote, { color: colors.textSecondary }]}>
                  Toque no mapa para posicionar os vértices. O polígono será desenhado automaticamente ao colocar 3 ou mais pontos.
                </Text>
              )}
              
                <TouchableOpacity
            style={[styles.btnPri, { backgroundColor: colors.primary, opacity: pontos.length < 3 || iniciarAnaliseMutation.isPending ? 0.6 : 1 }]}
            onPress={() => void iniciarAnalise()}
            disabled={pontos.length < 3 || iniciarAnaliseMutation.isPending}
          >
            {iniciarAnaliseMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
                    <Text style={styles.btnPriText}>Analisar Área</Text>
                  )}
                </TouchableOpacity>
            </View>
          ) : (
            /* Formulário após análise */
            <View style={styles.formContainer}>
              <View style={[styles.resultCard, { borderColor: colors.border }]}>
                <Text style={[styles.resultHeader, { color: colors.text }]}>Resultado da Triagem:</Text>
                
                {analiseResultado.status_territorial === 'BLOQUEADO' ? (
                  <View>
                    <Text style={[styles.statusText, { color: colors.danger }]}>
                      🚫 {analiseResultado.classificacao_final}
                    </Text>
                    <Text style={[styles.statusReason, { color: colors.textSecondary }]}>
                      Motivo: {analiseResultado.motivo}
                    </Text>
                    <TouchableOpacity
                      style={[styles.btnSec, { borderColor: colors.primary, marginTop: 12 }]}
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
                      Laudo: {analiseResultado.classificacao_final}
                    </Text>
                    {analiseResultado.siri && (
                      <Text style={[styles.statusSiri, { color: colors.primary }]}>
                        Índice SIRI Calculado: {analiseResultado.siri.pontuacao_total} / 100
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

                    <View style={styles.btnRow}>
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
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  searchBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  searchBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  floatingToolsContainer: {
    position: 'absolute',
    right: 16,
    top: 110,
    alignItems: 'center',
    zIndex: 10,
  },
  floatingToolBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  floatingToolText: {
    fontSize: 18,
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    maxHeight: '50%',
    borderTopWidth: 2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  panelScroll: {
    flex: 1,
  },
  panelScrollContent: {
    padding: 20,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  panelDetail: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  infoNote: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  btnPri: {
    flex: 1.3,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 10,
  },
  btnPriText: {
    color: '#ffffff',
    fontSize: 15,
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
    fontSize: 15,
    fontWeight: 'bold',
  },
  formContainer: {
    marginTop: 8,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  resultHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
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
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
});
