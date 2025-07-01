// lib/hooks/useDirections.ts
import {useState} from "react";
import {directionsClient, LatLng} from "@/files/lib/MapBox";


export type Step = {
  location: LatLng;
  coordinates: LatLng[];
  instruction: string;
  type: string;
  modifier: string;
};

export type Route = {
  coordinates: LatLng[];
  distance: number; // in meters
  duration: number; // in seconds
  steps: Array<Step>;
};

const GRAPH_HOPPER_API_KEY = process.env.EXPO_PUBLIC_GRAPH_HOPPER_KEY!;

export function useDirections() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route|null>(null);
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
        steps: route.legs[0].steps.map((step: any) => ({
          coordinates: step.geometry.coordinates,
          location: step.maneuver.location,
          instruction: step.maneuver.instruction,
          type: step.maneuver.type,
          modifier: step.maneuver.modifier,
        })),
        //   TODO: Will need to parse steps to Step object if plan on using mapbox again
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

  const parseGrasshopperPath = (path: any):Route => {
    const graphHopperSignToMapboxModifier: Record<number, string> = {
      [-98]: "uturn",          // Unknown direction U-turn
      [-8]: "uturn",           // Left U-turn
      [-7]: "slight left",     // Keep left
      [-6]: "roundabout",      // Exit roundabout (no exact Mapbox match)
      [-3]: "sharp left",      // Sharp left
      [-2]: "left",            // Left turn
      [-1]: "slight left",     // Slight left
      [0]: "straight",        // Continue
      [1]: "slight right",    // Slight right
      [2]: "right",           // Right turn
      [3]: "sharp right",     // Sharp right
      [4]: "arrive",          // Finish instruction
      [5]: "arrive",          // Via point
      [6]: "roundabout",      // Enter roundabout
      [7]: "slight right",    // Keep right
      [8]: "uturn",           // Right U-turn
    };
    const instructions = path.instructions.map((inst: any) => {
      const [start, end] = inst.interval;
      const segmentCoords = path.points.coordinates.slice(start, end + 1); // inclusive
      return {
        ...inst,
        coordinates: segmentCoords,
        maneuverLocation: segmentCoords.at(-1),
      };
    });
    let returnValue:Route = {
      coordinates: path.points.coordinates.map(([lng, lat]: number[]) => [lng, lat]),
      distance: path.distance, // meters
      duration: path.time / 1000, // milliseconds to seconds
      steps: instructions.map((instruction:any) => {
        let modifier = graphHopperSignToMapboxModifier[instruction.sign];
        return {
          location: instruction.coordinates[0],
          coordinates: instruction.coordinates,
          modifier,
          instruction: instruction.text,
          type: "",
        }
      })
    }
    return returnValue;
  }

  async function snapToRoad(coordinate: LatLng): Promise<LatLng> {
    const url = `https://graphhopper.com/api/1/nearest?point=${coordinate[1]},${coordinate[0]}&vehicle=car&key=${GRAPH_HOPPER_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log("data", data);

    if (!data || !data.snapped_point || !data.snapped_point.coordinates) {
      console.error("Failed to snap to road");
      throw new Error("Failed to snap to road");
    }

    const [snappedLng, snappedLat] = data.snapped_point.coordinates;
    return [snappedLat, snappedLng];
  }

  const getDirectionsWithGrasshopper = async (start: LatLng, end: LatLng) => {
    const snappedStart = start;
    // const snappedStart = await snapToRoad(start);
    const snappedEnd = end;
    // const snappedEnd = await snapToRoad(start);
    setLoading(true);
    setError(null);

    try {
      const url = `https://graphhopper.com/api/1/route?point=${snappedStart[1]},${snappedStart[0]}&point=${snappedEnd[1]},${snappedEnd[0]}&vehicle=bike&locale=en&points_encoded=false&alternative_route.max_paths=3&instructions=true&key=${GRAPH_HOPPER_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      const parsedRoutes = (data.paths || []).map((path: any) => parseGrasshopperPath(path));
      console.log("parsedRoutes", parsedRoutes)
      console.log("data.paths", data.paths)
      setRoutes(parsedRoutes);
      setSelectedRoute(parsedRoutes[0]);
    } catch (error: any) {
      console.error("Error fetching routes from grasshopper: ", error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getDirections = async (start: LatLng, end: LatLng) => {
    // return getDirectionsWithGrasshopper(start, end);
    return getDirectionsWithMapbox(start, end);
  };
  return { routes, getDirections, isLoadingDirections: loading, directionsError: error, selectedRoute, setSelectedRoute };
}
