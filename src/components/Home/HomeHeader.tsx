import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';

interface HomeHeaderProps {
  userName: string;
  alertCount: number;
  textColor: string;
  textSecondaryColor: string;
  onNotificationPress: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  userName,
  alertCount,
  textColor,
  textSecondaryColor,
  onNotificationPress,
}) => {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.welcomeText, { color: textColor }]}>
          Olá, {userName} 👋
        </Text>
        <Text style={[styles.subWelcomeText, { color: textSecondaryColor }]}>
          Bem-vindo ao CarbonEye
        </Text>
      </View>
      <TouchableOpacity
        style={styles.bellButton}
        onPress={onNotificationPress}
      >
        <Bell size={24} color={textColor} />
        {alertCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {alertCount > 99 ? '99+' : alertCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subWelcomeText: {
    fontSize: 14,
    marginTop: 4,
  },
  bellButton: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'red',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
