import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface MapSearchBoxProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
  colors: {
    surface: string;
    border: string;
    text: string;
    textSecondary: string;
    primary: string;
  };
}

export const MapSearchBox: React.FC<MapSearchBoxProps> = ({
  searchQuery,
  setSearchQuery,
  onSearch,
  colors,
}) => {
  return (
    <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TextInput
        style={[styles.searchInput, { color: colors.text }]}
        placeholder="Busca ex: -12.34, -45.67"
        placeholderTextColor={colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <TouchableOpacity style={[styles.searchBtn, { backgroundColor: colors.primary }]} onPress={onSearch}>
        <Text style={styles.searchBtnText}>Ir</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
});
