// lib/hooks/useDirections.ts
import { useState } from "react";
import {directionsClient} from "@/files/lib/MapBox";

type LatLng = [number, number];

export type Route = {
  coordinates: LatLng[];
  distance: number; // in meters
  duration: number; // in seconds
  steps: Array<any>;
};

export function useDirections() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const getDirectionsWithMapbox = async (start: LatLng, end: LatLng) => {
    setLoading(true);
    setError(null);

    try {
      const response = await directionsClient
        .getDirections({
          profile: 'cycling',
          geometries: 'geojson',
          steps: true,
          overview: "full",
          alternatives: true,
          waypoints: [
            {
              coordinates: start,
            },
            {
              coordinates: end,
            },
          ],
        })
        .send();
      const parsedRoutes = response.body.routes.map((route: any) => ({
        coordinates: route.geometry.coordinates,
        distance: route.distance,
        duration: route.duration,
        steps: route.legs[0].steps,
      }));
      setRoutes(parsedRoutes);
      setSelectedRoute(parsedRoutes[0]);
    }
    catch (error) {
      setError(error);
    }
    finally {
      setLoading(false);
    }
  }

  const getDirections = async (start: LatLng, end: LatLng) => {
    return getDirectionsWithMapbox(start, end);
  };
  return { routes, getDirections, isLoadingDirections: loading, directionsError: error, selectedRoute, setSelectedRoute };
}
