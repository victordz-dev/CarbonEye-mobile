import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import api, { API_URL } from '../services/api';
import { ShieldCheck, ShieldAlert, Activity, Wifi, RefreshCw } from 'lucide-react-native';

interface ApiStatus {
  name: string;
  url: string;
  status: 'checking' | 'online' | 'offline';
  latency: number;
  description: string;
}

export const HealthCheckScreen: React.FC = () => {
  const { colors } = useTheme();
  const [statuses, setStatuses] = useState<ApiStatus[]>([
    {
      name: 'Servidor Principal (Backend)',
      url: `${API_URL}/areas`,
      status: 'checking',
      latency: 0,
      description: 'Serviço central de cálculo e monitoramento PostGIS.',
    },
    {
      name: 'API de Monitoramento Termal',
      url: 'https://firms.modaps.eosdis.nasa.gov',
      status: 'checking',
      latency: 0,
      description: 'Monitoramento de focos de incêndio e anomalias termais em tempo real.',
    },
    {
      name: 'API de Monitoramento via Satélite',
      url: 'https://api.agromonitoring.com/agro/1.0/polygons?appid=check',
      status: 'checking',
      latency: 0,
      description: 'Imagens multiespectrais e histórico de índice vegetativo.',
    },
    {
      name: 'API de Risco Climático',
      url: 'https://api.openweathermap.org/data/2.5/weather?q=Campinas&appid=check',
      status: 'checking',
      latency: 0,
      description: 'Serviço de dados meteorológicos para previsão e alertas climáticos.',
    }
  ]);

  const runHealthCheck = useCallback(async () => {
    // Reset all statuses to checking
    setStatuses((prev) => prev.map((s) => ({ ...s, status: 'checking', latency: 0 })));

    const checkService = async (item: ApiStatus): Promise<ApiStatus> => {
      const startTime = Date.now();
      try {
        if (item.name.includes('CarbonEye')) {
          // Check backend using our axios client
          try {
            await api.get('/areas', { timeout: 6000 });
            return {
              ...item,
              status: 'online',
              latency: Date.now() - startTime,
            };
          } catch (axiosErr: any) {
            // 401 Unauthorized or 403 Forbidden means the server is UP and active
            if (axiosErr.response) {
              return {
                ...item,
                status: 'online',
                latency: Date.now() - startTime,
              };
            }
            throw axiosErr;
          }
        } else {
          // Check third party services
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          await fetch(item.url, {
            method: 'GET',
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          return {
            ...item,
            status: 'online',
            latency: Date.now() - startTime,
          };
        }
      } catch (err: any) {
        const latency = Date.now() - startTime;
        // Check if it's a reachable error (like HTTP 401/404) or timeout/connection failed
        const isTimeout = err.name === 'AbortError';
        const isNetworkError = err.message && err.message.toLowerCase().includes('network');

        // If it timed out or has no internet connection, it's offline.
        // Otherwise, if we got a response block or a response even with 401/400, it's online
        const resolvedStatus = (isTimeout || isNetworkError) ? 'offline' : 'online';

        return {
          ...item,
          status: resolvedStatus,
          latency,
        };
      }
    };

    // Run checks sequentially to avoid network congestion interference
    for (let i = 0; i < statuses.length; i++) {
      const updatedStatus = await checkService(statuses[i]);
      setStatuses((prev) => {
        const copy = [...prev];
        copy[i] = updatedStatus;
        return copy;
      });
    }
  }, []);

  useEffect(() => {
    void runHealthCheck();
  }, [runHealthCheck]);

  const getStatusIcon = (status: ApiStatus['status']) => {
    if (status === 'checking') {
      return <ActivityIndicator size="small" color={colors.primary} />;
    }
    if (status === 'online') {
      return <ShieldCheck color={colors.success} size={28} />;
    }
    return <ShieldAlert color={colors.danger} size={28} />;
  };

  const getLatencyColor = (latency: number, status: ApiStatus['status']) => {
    if (status !== 'online') return colors.textSecondary;
    if (latency < 400) return colors.success;
    if (latency < 1000) return colors.warning;
    return colors.danger;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Wifi color={colors.primary} size={28} style={styles.titleIcon} />
          <Text style={[styles.title, { color: colors.text }]}>Telemetria de APIs</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Monitoramento e verificação de integridade das integrações espaciais e do servidor local.
        </Text>
      </View>

      <View style={styles.cardList}>
        {statuses.map((item, idx) => (
          <View key={idx} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={styles.nameSection}>
                <Text style={[styles.apiName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.apiDesc, { color: colors.textSecondary }]}>{item.description}</Text>
              </View>
              <View style={styles.statusSection}>{getStatusIcon(item.status)}</View>
            </View>

            <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
              <View style={styles.latencyRow}>
                <Activity size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.latencyLabel, { color: colors.textSecondary }]}>Latência de Resposta:</Text>
                <Text
                  style={[
                    styles.latencyVal,
                    { color: getLatencyColor(item.latency, item.status) },
                  ]}
                >
                  {item.status === 'checking'
                    ? 'Medindo...'
                    : item.status === 'offline'
                    ? 'Inalcançável'
                    : `${item.latency} ms`}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.btnRefresh, { backgroundColor: colors.primary }]}
        onPress={() => void runHealthCheck()}
      >
        <RefreshCw color="#fff" size={18} style={{ marginRight: 8 }} />
        <Text style={styles.btnRefreshText}>Atualizar Diagnóstico</Text>
      </TouchableOpacity>
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
  header: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardList: {
    gap: 16,
    marginBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameSection: {
    flex: 1,
    paddingRight: 12,
  },
  apiName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  apiDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  statusSection: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  latencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  latencyLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  latencyVal: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  btnRefresh: {
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  btnRefreshText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
