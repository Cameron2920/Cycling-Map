import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import { MAPBOX_ACCESS_TOKEN } from '@env';

export const geocodingClient = mbxGeocoding({ accessToken: MAPBOX_ACCESS_TOKEN });
export const directionsClient = mbxDirections({ accessToken: MAPBOX_ACCESS_TOKEN });

export function haversineDistance(coordinate1: [number, number], coordinate2: [number, number]): number {
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const [lon1, lat1] = coordinate1;
  const [lon2, lat2] = coordinate2;
  const earthRadius = 6371000; // meters

  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

export function calculatePathDistance(startPosition: [number, number], endPosition: [number, number], routeCoordinates:any[]): number {
  let closestIndex = 0;
  let minDistance = Infinity;

  for (let routeIndex = 0; routeIndex < routeCoordinates.length; routeIndex++) {
    const distance = haversineDistance(startPosition, routeCoordinates[routeIndex]);

    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = routeIndex;
    }
  }
  let distanceSum = 0;

  for (let routeIndex = closestIndex; routeIndex < routeCoordinates.length - 1; routeIndex++) {
    const segmentStart = routeCoordinates[routeIndex];
    const segmentEnd = routeCoordinates[routeIndex + 1];
    distanceSum += haversineDistance(segmentStart, segmentEnd);

    if (haversineDistance(segmentEnd, endPosition) < 5) {
      break;
    }
  }
  return distanceSum;
}
