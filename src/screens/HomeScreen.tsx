import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList } from '../types/navigation';
import { useAuth, useTheme, useFavorites } from '../hooks';
import { Area, Alerta as AlertaType } from '../types';
import { SiriBadge, Skeleton } from '../components';
import { calcularAreaHa } from '../utils/geo';
import { Star, Search, Filter, MoreVertical, X, Edit2, Trash2, PowerOff, Bell } from 'lucide-react-native';
import api from '../services/api';

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { toggleFavorite, isFavorite } = useFavorites();
  const queryClient = useQueryClient();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFav, setFilterFav] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'size_desc' | 'siri_desc'>('newest');
  
  // Actions State
  const [actionArea, setActionArea] = useState<Area | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newName, setNewName] = useState('');

  const { data: areas = [], isLoading: loading } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const response = await api.get<Area[]>('/areas');
      return response.data;
    }
  });

  // Mutations
  const deleteAreaMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/areas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      setActionModalVisible(false);
    },
    onError: () => Alert.alert('Erro', 'Não foi possível excluir a área.')
  });

  const toggleMonitorMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string, ativo: boolean }) => api.patch(`/areas/${id}/monitoramento`, { monitoramento_ativo: ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      setActionModalVisible(false);
    },
    onError: () => Alert.alert('Erro', 'Não foi possível alterar o monitoramento.')
  });

  const renameAreaMutation = useMutation({
    mutationFn: ({ id, nome }: { id: string, nome: string }) => api.patch(`/areas/${id}/nome`, { nome }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      setRenameModalVisible(false);
    },
    onError: () => Alert.alert('Erro', 'Não foi possível renomear a área.')
  });

  // Consumption Quotas (Global Total Area)
  const totalAreaHa = areas.reduce((acc, curr) => {
    const coords = curr.geometria.coordinates[0];
    return acc + calcularAreaHa(coords);
  }, 0);

  // Compile recent alerts
  const todosAlertas: AlertaType[] = [];
  areas.forEach((a) => {
    if (a.alertas) {
      a.alertas.forEach((alerta) => {
        if (!alerta.lida) {
          todosAlertas.push(alerta);
        }
      });
    }
  });

  // Filter and Sort Logic
  const filteredAreas = useMemo(() => {
    let result = [...areas].filter(a => a.monitoramentoAtivo === true);

    if (searchQuery) {
      result = result.filter(a => a.nome.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (filterFav) {
      result = result.filter(a => isFavorite(a.id));
    }

    if (filterStatus) {
      result = result.filter(a => a.status === filterStatus);
    }

    result.sort((a, b) => {
      if (sortBy === 'size_desc') {
        return calcularAreaHa(b.geometria.coordinates[0]) - calcularAreaHa(a.geometria.coordinates[0]);
      }
      if (sortBy === 'siri_desc') {
        return (b.siriAtual || 0) - (a.siriAtual || 0);
      }
      // newest
      return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
    });

    return result;
  }, [areas, searchQuery, filterFav, filterStatus, sortBy, isFavorite]);

  // Actions Logic
  const openActionMenu = (area: Area) => {
    setActionArea(area);
    setActionModalVisible(true);
  };

  const handleDelete = () => {
    if (!actionArea) return;
    Alert.alert('Excluir Área', `Tem certeza que deseja excluir "${actionArea.nome}"? Isso não pode ser desfeito.`, [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Excluir', 
        style: 'destructive',
        onPress: () => deleteAreaMutation.mutate(actionArea.id)
      }
    ]);
  };

  const handleToggleMonitor = () => {
    if (!actionArea) return;
    setActionModalVisible(false);
    
    Alert.alert(
      'Desativar Monitoramento',
      'Aviso: ao retirar o monitoramento, não será mais possível ativá-lo nesta área novamente. Ela ficará salva apenas no histórico.\n\nDeseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Desativar', 
          style: 'destructive',
          onPress: () => toggleMonitorMutation.mutate({ id: actionArea.id, ativo: false })
        }
      ]
    );
  };

  const handleRenameSubmit = () => {
    if (!actionArea || !newName.trim()) return;
    renameAreaMutation.mutate({ id: actionArea.id, nome: newName.trim() });
  };

  const renderAreaCard = ({ item }: { item: Area }) => {
    const coords = item.geometria.coordinates[0];
    const ha = calcularAreaHa(coords);

    return (
      <TouchableOpacity
        style={[styles.areaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => navigation.navigate('Details', { areaId: item.id, areaNome: item.nome })}
      >
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
            <TouchableOpacity onPress={() => void toggleFavorite(item.id)} style={{ marginRight: 6 }}>
              <Star
                size={18}
                color={isFavorite(item.id) ? '#eab308' : colors.textSecondary}
                fill={isFavorite(item.id) ? '#eab308' : 'none'}
              />
            </TouchableOpacity>
            <Text style={[styles.areaName, { color: colors.text, flex: 1 }]} numberOfLines={1}>
              {item.nome}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <SiriBadge status={item.status} score={item.siriAtual ?? 0} />
            <TouchableOpacity onPress={() => openActionMenu(item)} style={{ marginLeft: 8, padding: 4 }}>
              <MoreVertical size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.areaDetail, { color: colors.textSecondary }]}>
          Tamanho: {ha.toFixed(2)} ha | {item.classificacaoAtual || 'Não classificado'}
        </Text>
        <Text style={[styles.areaDetail, { color: colors.textSecondary }]}>
          Monitoramento: {item.monitoramentoAtivo ? 'Ativo' : 'Pausado'}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: 16 }]}>
        <Skeleton height={80} borderRadius={12} style={{ marginBottom: 16 }} />
        <Skeleton height={40} borderRadius={8} style={{ marginBottom: 24 }} />
        <Skeleton height={150} borderRadius={12} style={{ marginBottom: 16 }} />
        <Skeleton height={150} borderRadius={12} style={{ marginBottom: 16 }} />
        <Skeleton height={150} borderRadius={12} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.welcomeText, { color: colors.text }]}>Olá, {user?.nome?.split(' ')[0] || 'Usuário'} 👋</Text>
          <Text style={[styles.subWelcomeText, { color: colors.textSecondary }]}>
            Bem-vindo ao CarbonEye
          </Text>
        </View>
        <TouchableOpacity
          style={{ padding: 8, position: 'relative' }}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Bell size={24} color={colors.text} />
          {todosAlertas.length > 0 && (
            <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'red', borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{todosAlertas.length > 99 ? '99+' : todosAlertas.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} stickyHeaderIndices={[1]}>
        {/* Cota Global */}
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Consumo de Cota (Satélite)</Text>
        <Text style={[styles.sectionCaption, { color: colors.textSecondary }]}>
          Limite global de hectares monitorados
        </Text>

        <View style={styles.cotaRow}>
          <View style={styles.cotaTextRow}>
            <Text style={[styles.cotaLabel, { color: colors.text }]}>Área Consumida (Hectares)</Text>
            <Text style={[styles.cotaVal, { color: colors.primary }]}>
              {totalAreaHa.toFixed(2)} / 50.00 ha
            </Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.background }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: totalAreaHa >= 40 ? colors.warning : colors.primary,
                  width: `${Math.min(100, (totalAreaHa / 50) * 100)}%`,
                },
              ]}
            />
          </View>
        </View>

        <Text style={[styles.infoNote, { color: colors.textSecondary }]}>
          * A cota de 50 hectares é o limite máximo somado de todas as suas áreas salvas. Você pode apagar áreas antigas para liberar espaço.
        </Text>
      </View>

      {/* Filter Bar (Sticky) */}
      <View style={[styles.filterContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar área por nome..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          <TouchableOpacity 
            style={[styles.chip, filterFav && { backgroundColor: '#fef08a', borderColor: '#eab308' }, { borderColor: colors.border }]} 
            onPress={() => setFilterFav(!filterFav)}
          >
            <Star size={14} color={filterFav ? '#ca8a04' : colors.textSecondary} fill={filterFav ? '#eab308' : 'none'} style={{ marginRight: 4 }}/>
            <Text style={[styles.chipText, { color: filterFav ? '#ca8a04' : colors.textSecondary }]}>Favoritos</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.chip, filterStatus === 'NORMAL' && styles.chipActive, { borderColor: colors.border }]} 
            onPress={() => setFilterStatus(filterStatus === 'NORMAL' ? null : 'NORMAL')}
          >
            <Text style={[styles.chipText, filterStatus === 'NORMAL' ? styles.chipTextActive : { color: colors.textSecondary }]}>Status: Normal</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.chip, filterStatus === 'ALERTA' && styles.chipActive, { borderColor: colors.border }]} 
            onPress={() => setFilterStatus(filterStatus === 'ALERTA' ? null : 'ALERTA')}
          >
            <Text style={[styles.chipText, filterStatus === 'ALERTA' ? styles.chipTextActive : { color: colors.textSecondary }]}>Status: Alerta</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.chip, sortBy === 'size_desc' && styles.chipActive, { borderColor: colors.border }]} 
            onPress={() => setSortBy(sortBy === 'size_desc' ? 'newest' : 'size_desc')}
          >
            <Text style={[styles.chipText, sortBy === 'size_desc' ? styles.chipTextActive : { color: colors.textSecondary }]}>Maior Tamanho</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.chip, sortBy === 'siri_desc' && styles.chipActive, { borderColor: colors.border }]} 
            onPress={() => setSortBy(sortBy === 'siri_desc' ? 'newest' : 'siri_desc')}
          >
            <Text style={[styles.chipText, sortBy === 'siri_desc' ? styles.chipTextActive : { color: colors.textSecondary }]}>Maior Pontuação</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Áreas Monitoradas */}
      <View style={styles.listSection}>
        <Text style={[styles.listTitle, { color: colors.text }]}>Minhas Áreas Monitoradas ({filteredAreas.length})</Text>
        {filteredAreas.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nenhuma área encontrada.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredAreas}
            renderItem={renderAreaCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Action Menu Modal */}
      <Modal visible={actionModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setActionModalVisible(false)}>
          <View style={[styles.actionSheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.actionSheetTitle, { color: colors.textSecondary }]}>
              {actionArea?.nome}
            </Text>
            
            <TouchableOpacity style={styles.actionItem} onPress={() => { setActionModalVisible(false); setNewName(actionArea?.nome || ''); setRenameModalVisible(true); }}>
              <Edit2 size={20} color={colors.text} style={{ marginRight: 12 }} />
              <Text style={[styles.actionText, { color: colors.text }]}>Editar Nome</Text>
            </TouchableOpacity>

            {actionArea?.monitoramentoAtivo && (
              <TouchableOpacity style={styles.actionItem} onPress={handleToggleMonitor}>
                <PowerOff size={20} color={colors.text} style={{ marginRight: 12 }} />
                <Text style={[styles.actionText, { color: colors.text }]}>
                  Desativar Monitoramento
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionItem} onPress={handleDelete}>
              <Trash2 size={20} color="#ef4444" style={{ marginRight: 12 }} />
              <Text style={[styles.actionText, { color: "#ef4444" }]}>Excluir Área</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCancel, { borderColor: colors.border }]} onPress={() => setActionModalVisible(false)}>
              <Text style={[styles.actionText, { color: colors.text, textAlign: 'center' }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Rename Modal */}
      <Modal visible={renameModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.dialogBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Renomear Área</Text>
            <TextInput
              style={[styles.dialogInput, { borderColor: colors.border, color: colors.text }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Novo nome"
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />
            <View style={styles.dialogButtons}>
              <TouchableOpacity style={{ padding: 10, marginRight: 10 }} onPress={() => setRenameModalVisible(false)}>
                <Text style={{ color: colors.textSecondary }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: 10, backgroundColor: colors.primary, borderRadius: 6 }} onPress={handleRenameSubmit}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => (navigation as any).navigate('Map')}
      >
        <Text style={styles.fabText}>+ Fazer Nova Consulta</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // espaço para o FAB
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subWelcomeText: {
    fontSize: 14,
    marginTop: 4,
  },
  alertContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  alertMsg: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  sectionCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionCaption: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  cotaRow: {
    marginBottom: 14,
  },
  cotaTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cotaLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  cotaVal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  infoNote: {
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 15,
    marginTop: 10,
  },
  filterContainer: {
    paddingVertical: 10,
    marginBottom: 10,
    zIndex: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  listSection: {
    marginBottom: 40,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  areaCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  areaName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  areaDetail: {
    fontSize: 13,
    marginBottom: 3,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  actionSheetTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionCancel: {
    marginTop: 16,
    borderTopWidth: 1,
    paddingTop: 16,
    alignItems: 'center',
  },
  dialogBox: {
    margin: 20,
    marginTop: 'auto',
    marginBottom: 'auto',
    borderRadius: 12,
    padding: 20,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dialogInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    left: 24,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
