import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Svg, { Line, Circle, Text as SvgText, Path } from 'react-native-svg';

interface ChartNDVIProps {
  historico: { data: string; valor: number }[];
  availableYears: number[];
  selectedYear: number | null;
  setSelectedYear: (year: number) => void;
  yearVariation: number | null;
  yearData: { data: string; valor: number }[];
  colors: any;
  chartWidth: number;
}

export const ChartNDVI: React.FC<ChartNDVIProps> = ({
  historico,
  availableYears,
  selectedYear,
  setSelectedYear,
  yearVariation,
  yearData,
  colors,
  chartWidth
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('bar');
  
  const chartHeight = 200;
  const paddingX = 30;
  const paddingY = 20;
  const maxNdvi = 1.0;
  const minNdvi = 0.0;
  
  let linePath = '';
  const points: { x: number, y: number, val: number, label: string }[] = [];

  if (yearData.length > 0) {
    const xStep = (chartWidth - paddingX * 2) / Math.max(yearData.length - 1, 1);
    
    yearData.forEach((item, i) => {
      const x = paddingX + i * xStep;
      const y = chartHeight - paddingY - ((item.valor - minNdvi) / (maxNdvi - minNdvi)) * (chartHeight - paddingY * 2);
      
      points.push({ x, y, val: item.valor, label: new Date(item.data).toLocaleDateString('pt-BR', { month: 'short' }).replace(/^\w/, c => c.toUpperCase()) });
      
      if (i === 0) {
        linePath += `M ${x} ${y} `;
      } else {
        linePath += `L ${x} ${y} `;
      }
    });
  }

  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Histórico de NDVI</Text>
      <Text style={[styles.sectionCaption, { color: colors.textSecondary }]}>
        Variação da biomassa através do tempo
      </Text>

      {availableYears.length > 0 && (
        <View style={styles.filterSection}>
          <View style={styles.yearFilterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {availableYears.map(year => (
                <TouchableOpacity 
                  key={year} 
                  style={[styles.yearChip, selectedYear === year ? { backgroundColor: colors.primary, borderColor: colors.primary } : { borderColor: colors.border }]}
                  onPress={() => setSelectedYear(year)}
                >
                  <Text style={[styles.yearChipText, selectedYear === year ? { color: '#fff' } : { color: colors.textSecondary }]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.chartToggleContainer}>
            <TouchableOpacity onPress={() => setChartType('bar')} style={[styles.toggleBtn, chartType === 'bar' ? { backgroundColor: colors.primary } : { backgroundColor: colors.border }]}>
              <Text style={[styles.toggleText, chartType === 'bar' ? { color: '#fff' } : { color: colors.textSecondary }]}>Barras</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setChartType('line')} style={[styles.toggleBtn, chartType === 'line' ? { backgroundColor: colors.primary } : { backgroundColor: colors.border }]}>
              <Text style={[styles.toggleText, chartType === 'line' ? { color: '#fff' } : { color: colors.textSecondary }]}>Linha</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {yearData.length > 0 ? (
        <View>
          {chartType === 'line' ? (
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <Svg height={chartHeight} width={chartWidth}>
                {/* Linhas de Grade */}
                {[0, 0.5, 1.0].map((val, idx) => {
                  const y = chartHeight - paddingY - ((val - minNdvi) / (maxNdvi - minNdvi)) * (chartHeight - paddingY * 2);
                  return (
                    <React.Fragment key={`grid-${idx}`}>
                      <Line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke={colors.border} strokeWidth="1" strokeDasharray="4" />
                      <SvgText x={paddingX - 5} y={y + 4} fontSize="10" fill={colors.textSecondary} textAnchor="end">
                        {val.toFixed(1)}
                      </SvgText>
                    </React.Fragment>
                  );
                })}
                
                {/* Linha Principal */}
                <Path d={linePath} fill="none" stroke={colors.primary} strokeWidth="3" />
                
                {/* Pontos e Labels */}
                {points.map((p, i) => (
                  <React.Fragment key={`pt-${i}`}>
                    <Circle cx={p.x} cy={p.y} r="4" fill={colors.background} stroke={colors.primary} strokeWidth="2" />
                    <SvgText x={p.x} y={chartHeight - 5} fontSize="10" fill={colors.textSecondary} textAnchor="middle">
                      {p.label}
                    </SvgText>
                  </React.Fragment>
                ))}
              </Svg>
            </View>
          ) : (
            <View style={styles.ndviList}>
              {yearData.map((item, idx) => {
                const formattedDate = new Date(item.data).toLocaleDateString('pt-BR', { month: 'long' });
                return (
                  <View key={idx} style={[styles.ndviRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.ndviDate, { color: colors.text }]}>{formattedDate}</Text>
                    <View style={styles.ndviBarContainer}>
                      <View style={[styles.ndviBarFill, { backgroundColor: colors.primary, width: `${item.valor * 100}%` }]} />
                    </View>
                    <Text style={[styles.ndviVal, { color: colors.text }]}>{item.valor.toFixed(2)}</Text>
                  </View>
                );
              })}
            </View>
          )}
          
          {yearVariation !== null && (
            <View style={[styles.insightCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.insightTitle, { color: colors.text }]}>Variação Anual Absoluta</Text>
              <Text style={[styles.insightValue, { color: yearVariation >= 0 ? colors.success : colors.danger }]}>
                {yearVariation > 0 ? '↗' : '↘'} {yearVariation > 0 ? '+' : ''}{yearVariation.toFixed(2)} pts
              </Text>
              <Text style={[styles.insightDesc, { color: colors.textSecondary }]}>
                Diferença em pontos entre o primeiro e o último registro de {selectedYear}.
              </Text>
            </View>
          )}
        </View>
      ) : (
        <Text style={[styles.emptyNDVI, { color: colors.textSecondary }]}>Nenhum histórico disponível para este ano.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionCaption: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 16,
  },
  filterSection: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  yearFilterContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  chartToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  yearChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  yearChipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  ndviList: {
    marginTop: 6,
  },
  ndviRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  ndviDate: {
    fontSize: 13,
    flex: 1.2,
    textTransform: 'capitalize',
  },
  ndviBarContainer: {
    flex: 2,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  ndviBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  ndviVal: {
    fontSize: 13,
    fontWeight: 'bold',
    flex: 0.5,
    textAlign: 'right',
  },
  emptyNDVI: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  insightCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 11,
    textAlign: 'center',
  },
});
