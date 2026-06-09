import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface DetailsActionsProps {
  monitoramentoAtivo: boolean;
  onDisableMonitor: () => void;
  onExportPdf: () => void;
  onGoBack: () => void;
  colors: any;
}

export const DetailsActions: React.FC<DetailsActionsProps> = ({
  monitoramentoAtivo,
  onDisableMonitor,
  onExportPdf,
  onGoBack,
  colors,
}) => {
  return (
    <View style={styles.actionSection}>
      {monitoramentoAtivo && (
        <TouchableOpacity style={[styles.btnExport, { backgroundColor: '#fee2e2', marginBottom: 12 }]} onPress={onDisableMonitor}>
          <Text style={[styles.btnExportText, { color: '#ef4444' }]}>⏸ Desativar Monitoramento</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={[styles.btnExport, { backgroundColor: colors.primary }]} onPress={onExportPdf}>
        <Text style={styles.btnExportText}>📄 Exportar Laudo Técnico (PDF)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btnBackOutline, { borderColor: colors.border }]} onPress={onGoBack}>
        <Text style={[styles.btnBackOutlineText, { color: colors.text }]}>Voltar ao Painel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  actionSection: {
    marginBottom: 40,
    gap: 12,
  },
  btnExport: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  btnExportText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  btnBackOutline: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnBackOutlineText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
