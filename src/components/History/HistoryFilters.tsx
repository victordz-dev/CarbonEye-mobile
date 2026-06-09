import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

export type StatusFilter = 'TODOS' | 'FAVORITOS' | 'NORMAL' | 'ALERTA' | 'EMERGENCIA';

interface HistoryFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (val: StatusFilter) => void;
  colors: any;
}

export const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  colors,
}) => {
  const filters: StatusFilter[] = ['TODOS', 'FAVORITOS', 'NORMAL', 'ALERTA', 'EMERGENCIA'];

  return (
    <View>
      <View style={styles.header}>
        <TextInput
          style={[styles.searchInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
          placeholder="Buscar áreas por nome..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filtersContainer}>
        {filters.map((filter) => {
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
    </View>
  );
};

const styles = StyleSheet.create({
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
});
