import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Cloud, CloudRain, Sun, Wind, Droplets } from 'lucide-react-native';
import { getWeatherForCoords } from '../services/weather';
import { useTheme } from '../hooks';

interface WeatherWidgetProps {
  latitude: number;
  longitude: number;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ latitude, longitude }) => {
  const { colors } = useTheme();
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(false);
        const data = await getWeatherForCoords(latitude, longitude);
        setWeatherData(data);
      } catch (err) {
        console.error('Falha ao carregar clima:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [latitude, longitude]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando dados climáticos ao vivo...</Text>
      </View>
    );
  }

  if (error || !weatherData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ color: colors.danger, fontSize: 12 }}>Não foi possível carregar o clima local (OpenWeather).</Text>
      </View>
    );
  }

  const { main, weather, wind } = weatherData;
  const temp = Math.round(main.temp);
  const desc = weather[0]?.description;
  
  // Choose icon based on weather main
  let WeatherIcon = Sun;
  const condition = weather[0]?.main?.toLowerCase();
  if (condition?.includes('rain')) WeatherIcon = CloudRain;
  else if (condition?.includes('cloud')) WeatherIcon = Cloud;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Clima Local Atual</Text>
        <Text style={[styles.badge, { backgroundColor: colors.primary, color: '#fff' }]}>Ao vivo via OpenWeather</Text>
      </View>
      
      <View style={styles.mainRow}>
        <View style={styles.tempCol}>
          <WeatherIcon size={32} color={colors.primary} />
          <Text style={[styles.tempText, { color: colors.text }]}>{temp}°C</Text>
        </View>
        
        <View style={styles.detailsCol}>
          <Text style={[styles.descText, { color: colors.textSecondary }]}>{desc.charAt(0).toUpperCase() + desc.slice(1)}</Text>
          <View style={styles.infoRow}>
            <Droplets size={14} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>Umidade: {main.humidity}%</Text>
          </View>
          <View style={styles.infoRow}>
            <Wind size={14} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>Vento: {wind.speed} m/s</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  badge: {
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tempCol: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  tempText: {
    fontSize: 32,
    fontWeight: '900',
    marginLeft: 12,
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  descText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    marginLeft: 6,
  },
});
