import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Switch, StyleSheet } from 'react-native';

interface MapControlPanelProps {
  pontosCount: number;
  areaHa: number;
  analiseResultado: any;
  loadingText: string;
  isAnalyzing: boolean;
  isSaving: boolean;
  nome: string;
  setNome: (nome: string) => void;
  monitorar: boolean;
  setMonitorar: (val: boolean) => void;
  onAnalyze: () => void;
  onClear: () => void;
  onSave: () => void;
  colors: any;
}

export const MapControlPanel: React.FC<MapControlPanelProps> = ({
  pontosCount,
  areaHa,
  analiseResultado,
  loadingText,
  isAnalyzing,
  isSaving,
  nome,
  setNome,
  monitorar,
  setMonitorar,
  onAnalyze,
  onClear,
  onSave,
  colors,
}) => {
  return (
    <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <ScrollView style={styles.panelScroll} contentContainerStyle={styles.panelScrollContent}>
        <Text style={[styles.panelTitle, { color: colors.text }]}>Desenho de Polígono</Text>
        <Text style={[styles.panelDetail, { color: colors.textSecondary }]}>
          Vértices: {pontosCount}/50 | Área: {areaHa.toFixed(2)} ha (Mín: 1ha - Máx: 50ha)
        </Text>

        {!analiseResultado ? (
          <View>
            {isAnalyzing ? (
              <View style={{ alignItems: 'center', marginBottom: 16, padding: 16, backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                <ActivityIndicator color={colors.primary} size="large" style={{ marginBottom: 12 }} />
                <Text style={{ color: colors.primary, fontWeight: 'bold', textAlign: 'center', fontSize: 15, marginBottom: 4 }}>
                  {loadingText}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
                  O tempo de processamento de novas áreas no satélite é de cerca de 1 a 2 minutos. Por favor, aguarde...
                </Text>
              </View>
            ) : (
              <Text style={[styles.infoNote, { color: colors.textSecondary }]}>
                Toque no mapa para posicionar os vértices. O polígono será desenhado automaticamente ao colocar 3 ou mais pontos.
              </Text>
            )}
            
            <TouchableOpacity
              style={[styles.btnPri, { backgroundColor: colors.primary, opacity: pontosCount < 3 || isAnalyzing ? 0.6 : 1 }]}
              onPress={onAnalyze}
              disabled={pontosCount < 3 || isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnPriText}>Analisar Área</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={[styles.resultCard, { borderColor: colors.border }]}>
              <Text style={[styles.resultHeader, { color: colors.text }]}>Resultado da Triagem:</Text>
              
              {analiseResultado.status_territorial === 'BLOQUEADO' ? (
                <View>
                  <Text style={[styles.statusText, { color: colors.danger }]}>
                    🚫 {analiseResultado.classificacao_final}
                  </Text>
                  <Text style={[styles.statusReason, { color: colors.textSecondary }]}>
                    Motivo: {analiseResultado.motivo}
                  </Text>
                  <TouchableOpacity
                    style={[styles.btnSec, { borderColor: colors.primary, marginTop: 12 }]}
                    onPress={onClear}
                  >
                    <Text style={[styles.btnSecText, { color: colors.primary }]}>Voltar / Redesenhar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={[styles.statusText, { color: colors.success }]}>
                    ✅ Área Disponível para Monitoramento
                  </Text>
                  <Text style={[styles.statusCls, { color: colors.text }]}>
                    Laudo: {analiseResultado.classificacao_final}
                  </Text>
                  {analiseResultado.siri && (
                    <Text style={[styles.statusSiri, { color: colors.primary }]}>
                      Índice SIRI Calculado: {analiseResultado.siri.pontuacao_total} / 100
                    </Text>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Nome da Área / Talhão</Text>
                    <TextInput
                      style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                      placeholder="Ex: Talhão Central SP"
                      placeholderTextColor={colors.textSecondary}
                      value={nome}
                      onChangeText={setNome}
                    />
                  </View>

                  <View style={styles.switchRow}>
                    <Text style={[styles.label, { color: colors.text }]}>Monitoramento Ativo</Text>
                    <Switch value={monitorar} onValueChange={setMonitorar} />
                  </View>

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={[styles.btnPri, { backgroundColor: colors.primary, width: '100%' }]}
                      onPress={onSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.btnPriText}>Concluir Pesquisa</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    maxHeight: '50%',
    borderTopWidth: 2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  panelScroll: {
    flex: 1,
  },
  panelScrollContent: {
    padding: 20,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  panelDetail: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  infoNote: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  btnPri: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  btnPriText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  btnSec: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnSecText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  formContainer: {
    marginTop: 8,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  resultHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  statusReason: {
    fontSize: 13,
    lineHeight: 18,
  },
  statusCls: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  statusSiri: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});
