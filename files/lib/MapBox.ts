import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import { MAPBOX_ACCESS_TOKEN } from '@env';

export const geocodingClient = mbxGeocoding({ accessToken: MAPBOX_ACCESS_TOKEN });
export const directionsClient = mbxDirections({ accessToken: MAPBOX_ACCESS_TOKEN });

export type LatLng = [number, number];

export type Place = {
  name: string;
  center: LatLng;
};

export function haversineDistance(coordinate1: LatLng, coordinate2: LatLng): number {
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
  startPosition: LatLng,
  endPosition: LatLng,
  routeCoordinates: Array<LatLng>
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

export function isOnStepPath(
  userPosition: LatLng,
  step: any,
): boolean {
  const stepPolyline = step.coordinates;
  const THRESHOLD_METERS = 30;
  let minDistance = Infinity;

  for (let polylineIndex = 0; polylineIndex < stepPolyline.length - 1; polylineIndex++) {
    const a = stepPolyline[polylineIndex];
    const b = stepPolyline[polylineIndex + 1];
    const distance = pointToSegmentDistance(userPosition, a, b);

    if (distance < minDistance) {
      minDistance = distance;
    }
  }
  console.log("isOnStepPath: ", userPosition, stepPolyline, minDistance, minDistance > THRESHOLD_METERS);
  return minDistance < THRESHOLD_METERS;
}

function pointToSegmentDistance(
  p: LatLng,
  a: LatLng,
  b: LatLng
): number {
  const toRadians = (deg: number) => deg * (Math.PI / 180);

  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;

  const A = {
    x: toRadians(ax),
    y: toRadians(ay)
  };
  const B = {
    x: toRadians(bx),
    y: toRadians(by)
  };
  const P = {
    x: toRadians(px),
    y: toRadians(py)
  };

  const dx = B.x - A.x;
  const dy = B.y - A.y;

  if (dx === 0 && dy === 0) {
    return haversineDistance(p, a); // A and B are the same point
  }

  // Projection formula
  const t = ((P.x - A.x) * dx + (P.y - A.y) * dy) / (dx * dx + dy * dy);
  const tClamped = Math.max(0, Math.min(1, t));
  const closestPoint = [A.x + tClamped * dx, A.y + tClamped * dy];

  // Convert back from radians to degrees
  const closestLonLat: LatLng = [
    closestPoint[0] * (180 / Math.PI),
    closestPoint[1] * (180 / Math.PI),
  ];

  return haversineDistance(p, closestLonLat);
}

export function formatDistance(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
};

export function formatDuration(s: number) {
  const min = Math.round(s / 60);
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
};
