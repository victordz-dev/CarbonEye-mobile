import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';

interface SystemMenuProps {
  isDark: boolean;
  toggleTheme: () => void;
  onNavigateHealthCheck: () => void;
  onNavigateTestArea: () => void;
  colors: any;
}

export const SystemMenu: React.FC<SystemMenuProps> = ({
  isDark,
  toggleTheme,
  onNavigateHealthCheck,
  onNavigateTestArea,
  colors,
}) => {
  return (
    <>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferências</Text>
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>Modo Escuro (Dark Mode)</Text>
          <Switch value={isDark} onValueChange={toggleTheme} />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Sistema & Conectividade</Text>
        
        <TouchableOpacity style={styles.menuRow} onPress={onNavigateHealthCheck}>
          <Text style={[styles.menuLabel, { color: colors.text }]}>Disponibilidade das APIs</Text>
          <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Verificar ⚡</Text>
        </TouchableOpacity>
        
        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
        
        <TouchableOpacity style={styles.menuRow} onPress={onNavigateTestArea}>
          <Text style={[styles.menuLabel, { color: colors.text }]}>Área de Testes (Alertas Mock)</Text>
          <Text style={{ color: colors.danger, fontWeight: 'bold' }}>Debug 🧪</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  section: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
