import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Text } from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { useAuth, useTheme, useFavorites } from '../hooks';
import { Area, Alerta as AlertaType } from '../types';
import { Skeleton, AreaCard, AreaActionModals, HomeHeader, ConsumptionWidget, HomeFilters } from '../components';
import { calcularAreaHa } from '../utils/geo';
import { useAreas } from '../hooks/queries/useAreas';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isFavorite } = useFavorites();
  const { areas, isLoading, disableMonitor, renameArea, deleteArea } = useAreas();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFav, setFilterFav] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'size_desc' | 'siri_desc'>('newest');
  
  // Actions State
  const [actionArea, setActionArea] = useState<Area | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);

  // Consumption Quotas (Global Total Area - Only Monitored)
  const totalAreaHa = areas
    .filter(a => a.monitoramentoAtivo)
    .reduce((acc, curr) => {
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

  const openActionMenu = useCallback((area: Area) => {
    setActionArea(area);
    setActionModalVisible(true);
  }, []);

  if (isLoading) {
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

  const ListHeader = (
    <>
      <HomeHeader
        userName={user?.nome?.split(' ')[0] || 'Usuário'}
        alertCount={todosAlertas.length}
        textColor={colors.text}
        textSecondaryColor={colors.textSecondary}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      <ConsumptionWidget
        totalAreaHa={totalAreaHa}
        colors={colors as any}
      />

      <HomeFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterFav={filterFav}
        setFilterFav={setFilterFav}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        sortBy={sortBy}
        setSortBy={setSortBy}
        colors={colors as any}
      />

      {/* Áreas Monitoradas — Title */}
      <Text style={[styles.listTitle, { color: colors.text }]}>Minhas Áreas Monitoradas ({filteredAreas.length})</Text>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredAreas}
        renderItem={({ item }) => (
          <AreaCard 
            area={item} 
            onPress={() => navigation.navigate('Details', { areaId: item.id })}
            onOpenActions={openActionMenu}
          />
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nenhuma área encontrada.
            </Text>
          </View>
        }
        contentContainerStyle={styles.scrollContent}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('Map')}
      >
        <Text style={styles.fabText}>+ Fazer Nova Consulta</Text>
      </TouchableOpacity>

      <AreaActionModals 
        area={actionArea}
        actionModalVisible={actionModalVisible}
        setActionModalVisible={setActionModalVisible}
        renameModalVisible={renameModalVisible}
        setRenameModalVisible={setRenameModalVisible}
        onRename={(id, nome) => renameArea({ id, nome })}
        onToggleMonitor={(id) => disableMonitor(id)}
        onDelete={(id) => deleteArea(id)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 80 },
  listTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  emptyCard: { borderWidth: 1, borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 24, right: 24, left: 24, borderRadius: 30,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

