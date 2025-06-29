// lib/hooks/useGeocoding.ts
import { useState } from "react";
import {geocodingClient} from "@/files/lib/MapBox";


type LatLng = [number, number];

export type GeocodeResult = {
  place_name: string;
  center: LatLng;
};

export function useGeocoding() {
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const searchWithMapbox = async (query: string, location:LatLng) => {
    if (!query) return;

    setLoading(true);
    setError(null);

    try {
      const response = await geocodingClient
        .forwardGeocode({
          query: query,
          autocomplete: true,
          types: ['poi', 'address', 'place', 'locality', 'poi.landmark'],
          limit: 10,
          proximity: location,
        })
        .send();
      console.log(response.body.features[0]);
      const parsed = response.body.features.map((feature) => ({
        place_name: feature.place_name,
        center: feature.center as LatLng,
      }));
      setResults(parsed);
    }
    catch (error: any) {
      setError(error);
    }
    finally {
      setLoading(false);
    }
  }

  const search = async (query: string, location:LatLng) => {
    return searchWithMapbox(query, location);
  };

  return { searchResults: results, search, isLoadingGeocoding: loading, geocodingError: error };
}
