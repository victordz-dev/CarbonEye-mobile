import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme, useAuth, useAlert } from '../hooks';
import api, { API_URL } from '../services/api';

interface Alerta {
  id: string;
  tipo: string;
  mensagem: string;
  lida: boolean;
  criadoEm: string;
  areaId: string;
  area: {
    id: string;
    nome: string;
  };
}

export const NotificationsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { alert } = useAlert();

  const { data: alertas = [], isLoading: loading } = useQuery({
    queryKey: ['alertas'],
    queryFn: async () => {
      const response = await api.get<Alerta[]>('/alertas');
      return response.data;
    }
  });

  const marcarLidaMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/alertas/${id}/lida`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['areas'] });
    },
    onError: () => {
      alert('Erro', 'Não foi possível marcar como lida.');
    }
  });

  const excluirAlertaMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/alertas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['areas'] });
    },
    onError: () => {
      alert('Erro', 'Não foi possível excluir a notificação.');
    }
  });

  const marcarLida = (id: string) => {
    marcarLidaMutation.mutate(id);
  };

  const excluirAlerta = (id: string) => {
    excluirAlertaMutation.mutate(id);
  };

  const abrirRelatorio = async (areaId: string) => {
    const pdfUrl = `${API_URL}/areas/${areaId}/laudo-pdf?token=${token}`;
    try {
      const supported = await Linking.canOpenURL(pdfUrl);
      if (supported) {
        await Linking.openURL(pdfUrl);
      } else {
        alert('Erro', 'Não foi possível abrir o link do relatório.');
      }
    } catch (error) {
      alert('Erro', 'Ocorreu um erro ao tentar abrir o relatório.');
    }
  };

  const renderItem = ({ item }: { item: Alerta }) => {
    const isRelatorio = item.tipo === 'RELATORIO';
    const isIncendio = item.tipo === 'INCENDIO';
    const isClima = item.tipo === 'CLIMA';

    let icon = '🔔';
    if (isRelatorio) icon = '📄';
    if (isIncendio) icon = '🔥';
    if (isClima) icon = '☀️';

    return (
      <View style={[styles.card, { backgroundColor: item.lida ? colors.background : colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 20, marginRight: 8 }}>{icon}</Text>
            <Text style={[styles.areaNome, { color: colors.primary }]} numberOfLines={1}>
              {item.area?.nome || 'Sistema'}
            </Text>
          </View>
          <Text style={[styles.data, { color: colors.textSecondary }]}>
            {new Date(item.criadoEm).toLocaleDateString('pt-BR')}
          </Text>
        </View>

        <Text style={[styles.mensagem, { color: colors.text, fontWeight: item.lida ? 'normal' : 'bold' }]}>
          {item.mensagem}
        </Text>

        <View style={styles.acoesContainer}>
          <View style={{ flexDirection: 'row' }}>
            {!item.lida && (
              <TouchableOpacity onPress={() => marcarLida(item.id)} style={[styles.btnAcao, { backgroundColor: colors.primary }]}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Marcar como lida</Text>
              </TouchableOpacity>
            )}
            {isRelatorio && (
              <TouchableOpacity onPress={() => abrirRelatorio(item.areaId)} style={[styles.btnAcao, { backgroundColor: '#10b981', marginLeft: item.lida ? 0 : 10 }]}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Baixar Relatório</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={() => excluirAlerta(item.id)} style={{ padding: 4 }}>
            <Text style={{ color: colors.danger, fontSize: 12, fontWeight: 'bold' }}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={alertas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Nenhuma notificação encontrada.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  areaNome: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  data: {
    fontSize: 12,
  },
  mensagem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  acoesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  btnAcao: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
});
