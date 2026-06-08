import kinks from '@turf/kinks';
import { polygon } from '@turf/helpers';

export interface Coordenada {
  latitude: number;
  longitude: number;
}

export type GeoPoint = Coordenada | number[];

/**
 * Calculates the polygon area in hectares using flat shoelace formula.
 * Supports both Coordenada ({latitude, longitude}) and GeoJSON point ([longitude, latitude]).
 */
export function calcularAreaHa(coordinates: GeoPoint[]): number {
  if (coordinates.length < 3) return 0;

  const getLatLng = (pt: GeoPoint): { lat: number; lng: number } => {
    if (Array.isArray(pt)) {
      return { lng: pt[0], lat: pt[1] };
    }
    return { lng: pt.longitude, lat: pt.latitude };
  };

  let area = 0;
  const numPoints = coordinates.length;
  const firstPt = getLatLng(coordinates[0]);
  const latRad = (firstPt.lat * Math.PI) / 180;
  const kLat = 111139;
  const kLng = 111139 * Math.cos(latRad);

  for (let i = 0; i < numPoints; i++) {
    const j = (i + 1) % numPoints;
    const pi = getLatLng(coordinates[i]);
    const pj = getLatLng(coordinates[j]);
    
    const xi = pi.lng * kLng;
    const yi = pi.lat * kLat;
    const xj = pj.lng * kLng;
    const yj = pj.lat * kLat;
    
    area += xi * yj - xj * yi;
  }
  return Math.abs(area / 2) / 10000;
}

/**
 * Checks for polygon self-intersection using Turf.js kinks
 */
export function verificarAutoIntersecao(coords: Coordenada[]): boolean {
  if (coords.length < 4) return false;
  const formatted = coords.map((c) => [c.longitude, c.latitude]);
  
  // Close the polygon
  if (
    formatted[0][0] !== formatted[formatted.length - 1][0] ||
    formatted[0][1] !== formatted[formatted.length - 1][1]
  ) {
    formatted.push(formatted[0]);
  }

  try {
    const poly = polygon([formatted]);
    const selfIntersections = kinks(poly);
    return selfIntersections.features.length > 0;
  } catch (error) {
    console.error('Turf validation error:', error);
    return false;
  }
}
