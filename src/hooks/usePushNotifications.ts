import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface PushNotificationState {
  expoPushToken: string | null;
  notification: any | null;
}

// Notifications.setNotificationHandler will be called inside the hook if not in Expo Go

export const usePushNotifications = (): PushNotificationState => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any | null>(null);

  const notificationListener = useRef<any | null>(null);
  const responseListener = useRef<any | null>(null);

  async function registerForPushNotificationsAsync() {
    let token = null;

    if (Constants.appOwnership === 'expo') {
      console.warn('Expo Go não suporta Notificações Push remotas. Use um Development Build.');
      return null;
    }

    const Notifications = require('expo-notifications');

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      } catch (e) {
        console.warn('Erro ao configurar canal de notificação:', e);
      }
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.warn('Falha ao obter permissão para push notifications!');
        return null;
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      try {
        if (projectId) {
          const pushTokenString = (
            await Notifications.getExpoPushTokenAsync({
              projectId,
            })
          ).data;
          token = pushTokenString;
        } else {
           const pushTokenString = (await Notifications.getExpoPushTokenAsync()).data;
           token = pushTokenString;
        }
      } catch (e: unknown) {
        token = null;
      }
    } else {
      console.warn('Você deve usar um dispositivo físico para Push Notifications');
    }

    return token;
  }

  useEffect(() => {
    if (Constants.appOwnership === 'expo') {
      return;
    }

    const Notifications = require('expo-notifications');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((notif: any) => {
      setNotification(notif);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log('User interacted with notification:', response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return { expoPushToken, notification };
};
