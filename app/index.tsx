import React, {useState, useEffect, useRef} from "react";
import {
  View,
  StyleSheet,
  Text,
  Alert,
} from "react-native";
import MapboxGL from "@rnmapbox/maps";
import { MAPBOX_ACCESS_TOKEN } from '@env';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SearchBar from "@/files/components/SearchBar";
import useCurrentLocation from "@/files/hooks/UseCurrentLocation";
import {directionsClient, geocodingClient} from "@/files/lib/MapBox";
import MapViewComponent from "@/files/components/MapView";
import NavigationPanel from "@/files/components/NavigationPanel";

MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

export default function Index() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState<null | {
    center: [number, number];
    name?: string;
  }>(null);
  const coordinateRef = useRef<[number, number] | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<[number, number]>>([]);
  const insets = useSafeAreaInsets();
  const [isNavigating, setIsNavigating] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentCoordinate = useCurrentLocation();

  useEffect(() => {
    coordinateRef.current = currentCoordinate;
  }, [currentCoordinate]);

  const fetchSuggestions = async (text: string) => {
    console.log("Fetching Suggestions: ", text);

    if (!text) {
      setSuggestions([]);
      return;
    }

    try {
      console.log("coordinate: ", currentCoordinate);
      const response = await geocodingClient
        .forwardGeocode({
          query: text,
          autocomplete: true,
          types: ['poi', 'address', 'place', 'locality', 'poi.landmark'],
          limit: 10,
          proximity: coordinateRef.current,
        })
        .send();

      if (response.body.features) {
        console.log("Geocode response: ", response.body.features);
        setSuggestions(response.body.features);
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    }
  };

  useEffect(() => {
    setRoute();
  }, [selectedPlace]);

  const handleSuggestionPress = (center: [number, number], name: string) => {
    setQuery(name);
    setSuggestions([]);
    setSelectedPlace({ center, name });
  };

  const handleMapPress = (event) => {
    const coords = event.geometry.coordinates as [number, number];
    setSelectedPlace({ center: coords });
    setSuggestions([]);
  }

  const setRoute = async () => {
    if (!currentCoordinate || !selectedPlace){
      return;
    }

    try {
      const response = await directionsClient
        .getDirections({
          profile: 'cycling',
          geometries: 'geojson',
          steps: true,
          waypoints: [
            {
              coordinates: currentCoordinate,
            },
            {
              coordinates: selectedPlace.center,
            },
          ],
        })
        .send();

      const route = response.body.routes[0];
      const geometry = route.geometry.coordinates;
      const allSteps = route.legs.flatMap((leg) =>
        leg.steps.map((step) => step.maneuver.instruction)
      );
      setRouteCoordinates(geometry);
      setSteps(allSteps);
      console.log("Geocode response: ", route.legs);
    } catch (error) {
      console.error("Failed to fetch route:", error);
      Alert.alert("Error", "Could not fetch route");
    }
  }


  if (!currentCoordinate) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  const handleStartRoutePress = () => {
    setIsNavigating(true);
    setCurrentStepIndex(0);
    console.log("start route:", steps);
  }

  return (
    <View style={{ flex: 1 }}>
      <MapViewComponent
        currentCoordinate={currentCoordinate}
        selectedPlace={selectedPlace}
        routeCoordinates={routeCoordinates}
        onMapPress={handleMapPress}
      />
      <SearchBar
        query={query}
        setQuery={setQuery}
        setSuggestions={setSuggestions}
        suggestions={suggestions}
        fetchSuggestions={fetchSuggestions}
        onSuggestionSelect={handleSuggestionPress}
      />
      <NavigationPanel
        selectedPlace={selectedPlace}
        isNavigating={isNavigating}
        steps={steps}
        currentStepIndex={currentStepIndex}
        onStart={() => {
          setIsNavigating(true);
          setCurrentStepIndex(0);
        }}
        onStop={() => {
          setIsNavigating(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

