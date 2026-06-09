import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList } from '../types/navigation';
import { useTheme, useFavorites, useAlert } from '../hooks';
import { Area } from '../types';
import api from '../services/api';
import { HistoryFilters, StatusFilter, HistoryCard } from '../components';

export const HistoryScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { alert } = useAlert();

  const queryClient = useQueryClient();

  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('TODOS');

  const { data: areas = [], isLoading: loading } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const response = await api.get<Area[]>('/areas');
      return response.data;
    }
  });

  const excluirAreaMutation = useMutation({
    mutationFn: (areaId: string) => api.delete(`/areas/${areaId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      alert('Sucesso', 'Área excluída com sucesso.');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Falha ao excluir.';
      alert('Erro', msg);
    }
  });

  const excluirArea = useCallback((areaId: string, areaNome: string) => {
    alert(
      'Confirmar Exclusão',
      `Tem certeza de que deseja excluir a área "${areaNome}" do histórico?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => excluirAreaMutation.mutate(areaId),
        },
      ]
    );
  }, [excluirAreaMutation]);

  const filteredAreas = areas.filter((area) => {
    const matchesSearch = area.nome.toLowerCase().includes(search.toLowerCase());
    let matchesStatus = false;
    if (statusFilter === 'TODOS') {
      matchesStatus = true;
    } else if (statusFilter === 'FAVORITOS') {
      matchesStatus = isFavorite(area.id);
    } else {
      matchesStatus = area.status === statusFilter;
    }
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HistoryFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        colors={colors}
      />

      {filteredAreas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nenhuma área encontrada para os filtros aplicados.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAreas}
          renderItem={({ item }) => (
            <HistoryCard
              item={item}
              isFavorite={isFavorite(item.id)}
              onToggleFavorite={() => toggleFavorite(item.id)}
              onDelete={() => excluirArea(item.id, item.nome)}
              onDetails={() => navigation.navigate('Details', { areaId: item.id })}
              colors={colors}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
