import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BugPlay, AlertTriangle } from 'lucide-react-native';
import api from '../services/api';
import { useTheme, useAlert } from '../hooks';
import { Area } from '../types';

export const TestAreaScreen: React.FC = () => {
  const { colors } = useTheme();
  const { alert } = useAlert();
  const queryClient = useQueryClient();
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  const { data: areas = [], isLoading } = useQuery<Area[]>({
    queryKey: ['areas'],
    queryFn: async () => {
      const res = await api.get('/areas');
      return res.data;
    },
  });

  const monitoredAreas = areas.filter(a => a.monitoramentoAtivo);

  const mockMutation = useMutation({
    mutationFn: (areaId: string) => api.post(`/areas/${areaId}/alertas/mock`),
    onSuccess: () => {
      alert('Sucesso', 'Um alerta mockado foi gerado para esta área! Verifique a central de notificações.');
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['areas'] });
    },
    onError: () => {
      alert('Erro', 'Não foi possível gerar o alerta.');
    }
  });

  const handleGenerateAlert = useCallback(() => {
    if (!selectedAreaId) {
      alert('Atenção', 'Selecione uma área primeiro.');
      return;
    }
    mockMutation.mutate(selectedAreaId);
  }, [selectedAreaId, mockMutation]);

  const renderAreaItem = useCallback(({ item: area }: { item: Area }) => (
    <TouchableOpacity
      key={area.id}
      style={[
        styles.areaItem,
        { backgroundColor: colors.surface, borderColor: selectedAreaId === area.id ? colors.primary : colors.border },
      ]}
      onPress={() => setSelectedAreaId(area.id)}
    >
      <Text style={[styles.areaName, { color: colors.text }]}>{area.nome}</Text>
      {selectedAreaId === area.id && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>Selecionada</Text>
        </View>
      )}
    </TouchableOpacity>
  ), [colors, selectedAreaId]);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const ListHeader = (
    <>
      <View style={[styles.headerCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: colors.danger }]}>
        <BugPlay size={32} color={colors.danger} style={{ marginBottom: 12 }} />
        <Text style={[styles.title, { color: colors.danger }]}>Área de Testes (Debug)</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Selecione uma área abaixo para disparar um alerta falso de incêndio ou degradação. Isso simula o comportamento da integração com a NASA FIRMS.
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Áreas Disponíveis</Text>
    </>
  );

  const ListFooter = (
    <TouchableOpacity
      style={[styles.btnAction, { backgroundColor: selectedAreaId ? colors.danger : colors.border, opacity: mockMutation.isPending ? 0.7 : 1 }]}
      onPress={handleGenerateAlert}
      disabled={!selectedAreaId || mockMutation.isPending}
    >
      <AlertTriangle size={20} color="#fff" style={{ marginRight: 8 }} />
      <Text style={styles.btnActionText}>
        {mockMutation.isPending ? 'Gerando...' : 'Disparar Alerta Falso'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <FlatList
      style={[styles.container, { backgroundColor: colors.background }]}
      data={monitoredAreas}
      renderItem={renderAreaItem}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={ListFooter}
      ListEmptyComponent={
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 20 }}>Nenhuma área sendo monitorada.</Text>
      }
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  areaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  areaName: {
    fontSize: 16,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 40,
  },
  btnActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

