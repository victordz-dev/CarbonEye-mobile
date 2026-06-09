import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { Area } from '../../types';
import { calcularAreaHa } from '../../utils/geo';
import { SiriBadge } from '../SiriBadge';

interface HistoryCardProps {
  item: Area;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onDetails: () => void;
  colors: any;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({
  item,
  isFavorite,
  onToggleFavorite,
  onDelete,
  onDetails,
  colors,
}) => {
  const date = new Date(item.criadoEm);
  const formattedDate = `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  const ha = calcularAreaHa(item.geometria.coordinates[0]);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
            <TouchableOpacity onPress={onToggleFavorite} style={{ marginRight: 6 }}>
              <Star
                size={18}
                color={isFavorite ? '#eab308' : colors.textSecondary}
                fill={isFavorite ? '#eab308' : 'none'}
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
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.btnAction, { backgroundColor: '#fee2e2' }]}
            onPress={onDelete}
          >
            <Text style={[styles.btnActionText, { color: colors.danger }]}>Excluir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnAction, { backgroundColor: colors.primary }]}
            onPress={onDetails}
          >
            <Text style={[styles.btnActionText, { color: '#fff' }]}>Ver Detalhes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
});
