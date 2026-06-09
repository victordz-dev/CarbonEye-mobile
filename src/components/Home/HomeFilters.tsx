import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Search, Star } from 'lucide-react-native';

interface HomeFiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterFav: boolean;
  setFilterFav: (v: boolean) => void;
  filterStatus: string | null;
  setFilterStatus: (status: string | null) => void;
  sortBy: 'newest' | 'size_desc' | 'siri_desc';
  setSortBy: (sort: 'newest' | 'size_desc' | 'siri_desc') => void;
  colors: {
    background: string;
    surface: string;
    border: string;
    text: string;
    textSecondary: string;
  };
}

export const HomeFilters: React.FC<HomeFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  filterFav,
  setFilterFav,
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  colors,
}) => {
  return (
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
          style={[
            styles.chip,
            filterFav && { backgroundColor: '#fef08a', borderColor: '#eab308' },
            { borderColor: colors.border },
          ]}
          onPress={() => setFilterFav(!filterFav)}
        >
          <Star
            size={14}
            color={filterFav ? '#ca8a04' : colors.textSecondary}
            fill={filterFav ? '#eab308' : 'none'}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.chipText, { color: filterFav ? '#ca8a04' : colors.textSecondary }]}>
            Favoritos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            filterStatus === 'NORMAL' && styles.chipActive,
            { borderColor: colors.border },
          ]}
          onPress={() => setFilterStatus(filterStatus === 'NORMAL' ? null : 'NORMAL')}
        >
          <Text style={[styles.chipText, filterStatus === 'NORMAL' ? styles.chipTextActive : { color: colors.textSecondary }]}>
            Status: Normal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            filterStatus === 'ALERTA' && styles.chipActive,
            { borderColor: colors.border },
          ]}
          onPress={() => setFilterStatus(filterStatus === 'ALERTA' ? null : 'ALERTA')}
        >
          <Text style={[styles.chipText, filterStatus === 'ALERTA' ? styles.chipTextActive : { color: colors.textSecondary }]}>
            Status: Alerta
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            sortBy === 'size_desc' && styles.chipActive,
            { borderColor: colors.border },
          ]}
          onPress={() => setSortBy(sortBy === 'size_desc' ? 'newest' : 'size_desc')}
        >
          <Text style={[styles.chipText, sortBy === 'size_desc' ? styles.chipTextActive : { color: colors.textSecondary }]}>
            Maior Tamanho
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            sortBy === 'siri_desc' && styles.chipActive,
            { borderColor: colors.border },
          ]}
          onPress={() => setSortBy(sortBy === 'siri_desc' ? 'newest' : 'siri_desc')}
        >
          <Text style={[styles.chipText, sortBy === 'siri_desc' ? styles.chipTextActive : { color: colors.textSecondary }]}>
            Maior Pontuação
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
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
});
