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

export function calculatePathDistance(
  startPosition: [number, number],
  endPosition: [number, number],
  routeCoordinates: Array<[number, number]>
): number {
  if (routeCoordinates.length === 0) return 0;

  let closestIndex = 0;
  let minDistance = Infinity;

  for (let index = 0; index < routeCoordinates.length; index++) {
    const dist = haversineDistance(startPosition, routeCoordinates[index]);
    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = index;
    }
  }
  let closestEndIndex = closestIndex;
  minDistance = Infinity;

  for (let index = closestIndex; index < routeCoordinates.length; index++) {
    const dist = haversineDistance(endPosition, routeCoordinates[index]);
    if (dist < minDistance) {
      minDistance = dist;
      closestEndIndex = index;
    }
  }

  let distanceSum = 0;

  for (let index = closestIndex; index < closestEndIndex; index++) {
    distanceSum += haversineDistance(routeCoordinates[index], routeCoordinates[index + 1]);
  }
  distanceSum += haversineDistance(startPosition, routeCoordinates[closestIndex]);
  distanceSum += haversineDistance(routeCoordinates[closestEndIndex], endPosition);
  return distanceSum;
}
