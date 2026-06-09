import React, { useEffect, forwardRef, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { LEAFLET_HTML } from './LeafletTemplate';
import { Coordenada } from '../../utils/geo';

export interface InteractiveMapProps {
  pontos: Coordenada[];
  areas?: any[];
  onMapClick: (coordinate: Coordenada) => void;
  isClickRef: React.MutableRefObject<boolean>;
}

export const InteractiveMap = forwardRef<any, InteractiveMapProps>(
  ({ pontos, areas, onMapClick, isClickRef }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    React.useImperativeHandle(ref, () => ({
      postMessage: (data: string) => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage(data, '*');
        }
      }
    }));

    // Sincroniza os pontos sempre que eles mudarem
    useEffect(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            type: 'UPDATE_POINTS',
            points: pontos,
            fitBounds: !isClickRef.current,
          }),
          '*'
        );
      }
      isClickRef.current = false;
    }, [pontos, isClickRef]);

    // Sincroniza as áreas salvas
    useEffect(() => {
      if (iframeRef.current?.contentWindow && areas && areas.length > 0) {
        const mapAreas = areas.map((a: any) => ({
          nome: a.nome,
          coordinates: a.geometria.coordinates[0].map((c: number[]) => [c[1], c[0]]),
        }));
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            type: 'UPDATE_AREAS',
            areas: mapAreas,
          }),
          '*'
        );
      }
    }, [areas]);

    // Ouve mensagens do iframe
    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data.type === 'MAP_CLICK') {
            onMapClick(data.coordinate);
          }
        } catch (e) {
          // Ignora mensagens que não sejam JSON
        }
      };

      window.addEventListener('message', handleMessage);
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }, [onMapClick]);

    const handleLoadEnd = () => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            type: 'UPDATE_POINTS',
            points: pontos,
            fitBounds: true,
          }),
          '*'
        );

        if (areas && areas.length > 0) {
          const mapAreas = areas.map((a: any) => ({
            nome: a.nome,
            coordinates: a.geometria.coordinates[0].map((c: number[]) => [c[1], c[0]]),
          }));
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({
              type: 'UPDATE_AREAS',
              areas: mapAreas,
            }),
            '*'
          );
        }
      }
    };

    return (
      <View style={styles.mapContainer}>
        <iframe
          ref={iframeRef}
          srcDoc={LEAFLET_HTML}
          style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
          onLoad={handleLoadEnd}
          title="Leaflet Map"
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
});
