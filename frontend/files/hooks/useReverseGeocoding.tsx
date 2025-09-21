// hooks/useReverseGeocoding.ts
import { useCallback } from "react";
import {geocodingClient} from "@/files/lib/MapBox";

export function useReverseGeocoding() {
  const reverseGeocode = useCallback(async (coords: [number, number]) => {
    try {
      const [lng, lat] = coords;
      const response = await geocodingClient.reverseGeocode({
        query: [lng, lat],
        limit: 1,
      }).send();

      return response.body?.features?.[0] || null;
    } catch (err) {
      console.error("Reverse geocode failed:", err);
      return null;
    }
  }, []);

  return { reverseGeocode };
}
