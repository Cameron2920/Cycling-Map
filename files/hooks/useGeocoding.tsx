// lib/hooks/useGeocoding.ts
import { useState } from "react";
import {geocodingClient, LatLng, Place} from "@/files/lib/MapBox";

export function useGeocoding() {
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const searchWithMapbox = async (query: string, location:LatLng) => {
    if (!query) return;

    setLoading(true);
    setError(null);

    try {
      setResults(await fetchSearchResults(query, location));
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

  const fetchSearchResults = async (query: string, location:LatLng):Promise<Place[]> => {
    console.log("fetchSearchResults 1");
    const response = await geocodingClient
      .forwardGeocode({
        query: query,
        autocomplete: true,
        types: ['poi', 'address', 'place', 'locality', 'poi.landmark'],
        limit: 10,
        proximity: location,
      })
      .send();
    return response.body.features.map((feature) => ({
      name: feature.place_name,
      center: feature.center as LatLng,
    }));
  };

  return { searchResults: results, search, isLoadingGeocoding: loading, geocodingError: error, fetchSearchResults };
}
