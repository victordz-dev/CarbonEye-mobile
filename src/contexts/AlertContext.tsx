import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert as RNAlert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
}

interface AlertContextType {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => void;
}

const AlertContext = createContext<AlertContextType>({
  alert: () => {},
});

export const useAlert = () => useContext(AlertContext);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colors } = useTheme();
  const [state, setState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const alert = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      if (Platform.OS !== 'web') {
        // No mobile, usar o Alert nativo normalmente
        RNAlert.alert(title, message, buttons as any);
        return;
      }

      // Na web, mostrar o modal customizado
      setState({
        visible: true,
        title,
        message: message || '',
        buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }],
      });
    },
    []
  );

  const handlePress = useCallback((button: AlertButton) => {
    setState((prev) => ({ ...prev, visible: false }));
    // Pequeno delay para fechar o modal antes de executar a ação
    if (button.onPress) {
      setTimeout(() => {
        button.onPress!();
      }, 100);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    // Ao tocar fora do modal, executa o botão "cancel" se existir, senão apenas fecha
    const cancelBtn = state.buttons.find((b) => b.style === 'cancel');
    setState((prev) => ({ ...prev, visible: false }));
    if (cancelBtn?.onPress) {
      setTimeout(() => cancelBtn.onPress!(), 100);
    }
  }, [state.buttons]);

  const getButtonStyle = (button: AlertButton, index: number, total: number) => {
    const isCancel = button.style === 'cancel';
    const isDestructive = button.style === 'destructive';
    const isPrimary = !isCancel && !isDestructive && total > 1 && index === total - 1;

    return {
      backgroundColor: isDestructive
        ? colors.danger
        : isPrimary
        ? colors.primary
        : 'transparent',
      borderWidth: isCancel ? 1 : 0,
      borderColor: isCancel ? colors.border : 'transparent',
    };
  };

  const getButtonTextColor = (button: AlertButton, index: number, total: number) => {
    const isCancel = button.style === 'cancel';
    const isDestructive = button.style === 'destructive';
    const isPrimary = !isCancel && !isDestructive && total > 1 && index === total - 1;

    if (isDestructive || isPrimary) return '#ffffff';
    if (isCancel) return colors.textSecondary;
    if (total === 1) return '#ffffff'; // Botão único (OK) com fundo primary
    return colors.text;
  };

  const getSingleButtonBg = () => colors.primary;

  // Reordenar: cancel primeiro (esquerda), depois default/destructive (direita)
  const sortedButtons = [...state.buttons].sort((a, b) => {
    if (a.style === 'cancel') return -1;
    if (b.style === 'cancel') return 1;
    return 0;
  });

  return (
    <AlertContext.Provider value={{ alert }}>
      {children}
      {Platform.OS === 'web' && (
        <Modal
          visible={state.visible}
          transparent
          animationType="fade"
          onRequestClose={handleDismiss}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={handleDismiss}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              style={[styles.dialog, { backgroundColor: colors.surface }]}
            >
              {/* Barra decorativa superior */}
              <View style={[styles.topBar, { backgroundColor: colors.primary }]} />

              <View style={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {state.title}
                </Text>
                {state.message ? (
                  <Text style={[styles.message, { color: colors.textSecondary }]}>
                    {state.message}
                  </Text>
                ) : null}
              </View>

              <View
                style={[
                  styles.buttonRow,
                  sortedButtons.length === 1 && styles.buttonRowSingle,
                ]}
              >
                {sortedButtons.map((button, index) => {
                  const isSingle = sortedButtons.length === 1;
                  const btnStyle = isSingle
                    ? { backgroundColor: getSingleButtonBg() }
                    : getButtonStyle(button, index, sortedButtons.length);
                  const textColor = isSingle
                    ? '#ffffff'
                    : getButtonTextColor(button, index, sortedButtons.length);

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        btnStyle,
                        isSingle && styles.buttonFull,
                      ]}
                      onPress={() => handlePress(button)}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          { color: textColor },
                          button.style === 'destructive' && styles.buttonTextBold,
                        ]}
                      >
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  topBar: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  buttonRowSingle: {
    justifyContent: 'center',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonFull: {
    flex: 1,
    marginHorizontal: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextBold: {
    fontWeight: 'bold',
  },
});
