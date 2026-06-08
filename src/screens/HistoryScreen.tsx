import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList } from '../types/navigation';
import { useTheme, useFavorites } from '../hooks';
import { Area } from '../types';
import { calcularAreaHa } from '../utils/geo';
import { SiriBadge } from '../components';
import { Star } from 'lucide-react-native';
import api from '../services/api';

type StatusFilter = 'TODOS' | 'FAVORITOS' | 'NORMAL' | 'ALERTA' | 'EMERGENCIA';

export const HistoryScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { toggleFavorite, isFavorite } = useFavorites();

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
      Alert.alert('Sucesso', 'Área excluída com sucesso.');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Falha ao excluir.';
      Alert.alert('Erro', msg);
    }
  });

  const toggleMonitoramento = (areaId: string, currentVal: boolean) => {
    toggleMonitorMutation.mutate({ areaId, currentVal });
  };

  const excluirArea = (areaId: string, areaNome: string) => {
    Alert.alert(
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
  };

  // Filter and Search
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

  const renderItem = ({ item }: { item: Area }) => {
    const date = new Date(item.criadoEm);
    const formattedDate = `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    const ha = calcularAreaHa(item.geometria.coordinates[0]);

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <TouchableOpacity onPress={() => void toggleFavorite(item.id)} style={{ marginRight: 6 }}>
                <Star
                  size={18}
                  color={isFavorite(item.id) ? '#eab308' : colors.textSecondary}
                  fill={isFavorite(item.id) ? '#eab308' : 'none'}
                />
              </TouchableOpacity>
              <Text style={[styles.cardTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                {item.nome}
              </Text>
            </View>
            <Text style={[styles.cardDate, { color: colors.textSecondary }]}>{formattedDate}</Text>
          </View>
          <SiriBadge status={item.status} score={item.siriAtual ?? 0} />
        </View>

        <Text style={[styles.cardDetail, { color: colors.textSecondary }]}>
          Tamanho: {ha.toFixed(2)} ha | {item.classificacaoAtual || 'Não classificado'}
        </Text>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.cardFooter}>
          {/* Ações */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.btnAction, { backgroundColor: '#fee2e2' }]}
              onPress={() => excluirArea(item.id, item.nome)}
            >
              <Text style={[styles.btnActionText, { color: colors.danger }]}>Excluir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnAction, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Details', { areaId: item.id, areaNome: item.nome })}
            >
              <Text style={[styles.btnActionText, { color: '#fff' }]}>Ver Detalhes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header e Busca */}
      <View style={styles.header}>
        <TextInput
          style={[styles.searchInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
          placeholder="Buscar áreas por nome..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filtros de Status */}
      <View style={styles.filtersContainer}>
        {(['TODOS', 'FAVORITOS', 'NORMAL', 'ALERTA', 'EMERGENCIA'] as StatusFilter[]).map((filter) => {
          const isActive = statusFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterBtn,
                {
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setStatusFilter(filter)}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  {
                    color: isActive ? '#ffffff' : colors.textSecondary,
                  },
                ]}
              >
                {filter.charAt(0) + filter.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Lista */}
      {filteredAreas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nenhuma área encontrada para os filtros aplicados.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAreas}
          renderItem={renderItem}
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  cardDate: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardDetail: {
    fontSize: 13,
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchCol: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  switchLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  btnActionText: {
    fontSize: 12,
    fontWeight: 'bold',
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
