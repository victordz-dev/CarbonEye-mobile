import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import { Edit2, PowerOff, Trash2 } from 'lucide-react-native';
import { Area } from '../types';
import { useTheme, useAlert } from '../hooks';

interface AreaActionModalsProps {
  area: Area | null;
  actionModalVisible: boolean;
  setActionModalVisible: (visible: boolean) => void;
  renameModalVisible: boolean;
  setRenameModalVisible: (visible: boolean) => void;
  onRename: (id: string, newName: string) => void;
  onToggleMonitor: (id: string) => void;
  onDelete: (id: string) => void;
}

export const AreaActionModals: React.FC<AreaActionModalsProps> = ({
  area,
  actionModalVisible,
  setActionModalVisible,
  renameModalVisible,
  setRenameModalVisible,
  onRename,
  onToggleMonitor,
  onDelete
}) => {
  const { colors } = useTheme();
  const { alert } = useAlert();
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (area) setNewName(area.nome);
  }, [area, renameModalVisible]);

  const handleDelete = () => {
    if (!area) return;
    alert('Excluir Área', `Tem certeza que deseja excluir "${area.nome}"? Isso não pode ser desfeito.`, [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Excluir', 
        style: 'destructive',
        onPress: () => {
          onDelete(area.id);
          setActionModalVisible(false);
        }
      }
    ]);
  };

  const handleToggleMonitor = () => {
    if (!area) return;
    setActionModalVisible(false);
    
    alert(
      'Desativar Monitoramento',
      '⚠️ AÇÃO IRREVERSÍVEL\n\nAo desativar o monitoramento:\n\n• O polígono será excluído permanentemente do satélite (AgroMonitoring)\n• Não será possível reativar o monitoramento nesta área\n• A área ficará salva apenas no histórico\n\nDeseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Desativar Permanentemente', 
          style: 'destructive',
          onPress: () => onToggleMonitor(area.id)
        }
      ]
    );
  };

  const handleRenameSubmit = () => {
    if (!area || !newName.trim()) return;
    onRename(area.id, newName.trim());
    setRenameModalVisible(false);
  };

  return (
    <>
      {/* Action Menu Modal */}
      <Modal visible={actionModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setActionModalVisible(false)}>
          <View style={[styles.actionSheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.actionSheetTitle, { color: colors.textSecondary }]}>
              {area?.nome}
            </Text>
            
            <TouchableOpacity style={styles.actionItem} onPress={() => { setActionModalVisible(false); setRenameModalVisible(true); }}>
              <Edit2 size={20} color={colors.text} style={{ marginRight: 12 }} />
              <Text style={[styles.actionText, { color: colors.text }]}>Editar Nome</Text>
            </TouchableOpacity>

            {area?.monitoramentoAtivo && (
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
        <View style={styles.modalOverlayCenter}>
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
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
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
});
