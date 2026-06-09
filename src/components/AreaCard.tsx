import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Star, MoreVertical } from 'lucide-react-native';
import { Area } from '../types';
import { SiriBadge } from './SiriBadge';
import { calcularAreaHa } from '../utils/geo';
import { useTheme, useFavorites } from '../hooks';

interface AreaCardProps {
  area: Area;
  onPress: () => void;
  onOpenActions: (area: Area) => void;
}

export const AreaCard: React.FC<AreaCardProps> = ({ area, onPress, onOpenActions }) => {
  const { colors } = useTheme();
  const { toggleFavorite, isFavorite } = useFavorites();

  const coords = area.geometria.coordinates[0];
  const ha = calcularAreaHa(coords);
  const isFav = isFavorite(area.id);

  return (
    <TouchableOpacity
      style={[styles.areaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
          <TouchableOpacity onPress={() => void toggleFavorite(area.id)} style={{ marginRight: 6 }}>
            <Star
              size={18}
              color={isFav ? '#eab308' : colors.textSecondary}
              fill={isFav ? '#eab308' : 'none'}
            />
          </TouchableOpacity>
          <Text style={[styles.areaName, { color: colors.text, flex: 1 }]} numberOfLines={1}>
            {area.nome}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <SiriBadge status={area.status} score={area.siriAtual ?? 0} />
          <TouchableOpacity onPress={() => onOpenActions(area)} style={{ marginLeft: 8, padding: 4 }}>
            <MoreVertical size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.areaDetail, { color: colors.textSecondary }]}>
        Tamanho: {ha.toFixed(2)} ha | {area.classificacaoAtual || 'Não classificado'}
      </Text>
      <Text style={[styles.areaDetail, { color: colors.textSecondary }]}>
        Monitoramento: {area.monitoramentoAtivo ? 'Ativo' : 'Pausado'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
});
