import React, { useEffect, forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { LEAFLET_HTML } from './LeafletTemplate';
import { Coordenada } from '../../utils/geo';

export interface InteractiveMapProps {
  pontos: Coordenada[];
  areas?: any[];
  onMapClick: (coordinate: Coordenada) => void;
  isClickRef: React.MutableRefObject<boolean>;
}

export const InteractiveMap = forwardRef<WebView, InteractiveMapProps>(
  ({ pontos, areas, onMapClick, isClickRef }, ref) => {
    
    // Sincroniza os pontos sempre que eles mudarem
    useEffect(() => {
      if (ref && 'current' in ref && ref.current) {
        ref.current.postMessage(
          JSON.stringify({
            type: 'UPDATE_POINTS',
            points: pontos,
            fitBounds: !isClickRef.current,
          })
        );
      }
      isClickRef.current = false;
    }, [pontos, ref, isClickRef]);

    // Sincroniza as áreas salvas
    useEffect(() => {
      if (ref && 'current' in ref && ref.current && areas && areas.length > 0) {
        const mapAreas = areas.map((a: any) => ({
          nome: a.nome,
          coordinates: a.geometria.coordinates[0].map((c: number[]) => [c[1], c[0]]),
        }));
        ref.current.postMessage(
          JSON.stringify({
            type: 'UPDATE_AREAS',
            areas: mapAreas,
          })
        );
      }
    }, [areas, ref]);

    const handleMessage = (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'MAP_CLICK') {
          onMapClick(data.coordinate);
        }
      } catch (e) {
        console.error('Error handling WebView message:', e);
      }
    };

    const handleLoadEnd = () => {
      if (ref && 'current' in ref && ref.current) {
        ref.current.postMessage(
          JSON.stringify({
            type: 'UPDATE_POINTS',
            points: pontos,
            fitBounds: true,
          })
        );

        if (areas && areas.length > 0) {
          const mapAreas = areas.map((a: any) => ({
            nome: a.nome,
            coordinates: a.geometria.coordinates[0].map((c: number[]) => [c[1], c[0]]),
          }));
          ref.current.postMessage(
            JSON.stringify({
              type: 'UPDATE_AREAS',
              areas: mapAreas,
            })
          );
        }
      }
    };

    return (
      <View style={styles.mapContainer}>
        <WebView
          ref={ref}
          source={{ html: LEAFLET_HTML }}
          style={styles.map}
          onMessage={handleMessage}
          onLoadEnd={handleLoadEnd}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  map: {
    flex: 1,
  },
});
