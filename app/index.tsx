import React, {useState, useEffect, useRef} from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import MapboxGL from "@rnmapbox/maps";
import { MAPBOX_ACCESS_TOKEN } from '@env';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SearchBar from "@/files/components/SearchBar";
import useCurrentLocation from "@/files/hooks/UseCurrentLocation";
import {directionsClient, geocodingClient} from "@/files/lib/MapBox";

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

  useEffect(() => {
    console.log("Coordinate changed:", currentCoordinate);
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
      <MapboxGL.MapView style={{ flex: 1 }}
                        onPress={(event) => handleMapPress(event)}>
        <MapboxGL.Camera zoomLevel={13} centerCoordinate={selectedPlace?.center ? selectedPlace.center : currentCoordinate} />
        <MapboxGL.UserLocation visible={true} />
        {selectedPlace && (
          <MapboxGL.PointAnnotation
            id="selectedPlace"
            coordinate={selectedPlace.center}
          >
            <View style={styles.markerContainer}>
              <View style={styles.marker} />
            </View>
            <MapboxGL.Callout title={selectedPlace.name} />
          </MapboxGL.PointAnnotation>
        )}
        {routeCoordinates.length > 0 && (
          <MapboxGL.ShapeSource
            id="routeSource"
            shape={{
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: routeCoordinates,
              },
            }}
          >
            <MapboxGL.LineLayer
              id="routeLine"
              style={{
                lineColor: "#007AFF",
                lineWidth: 4,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </MapboxGL.ShapeSource>
        )}
      </MapboxGL.MapView>

      <SearchBar
        query={query}
        setQuery={setQuery}
        setSuggestions={setSuggestions}
        suggestions={suggestions}
        fetchSuggestions={fetchSuggestions}
        onSuggestionSelect={handleSuggestionPress}
      />
      {!isNavigating && selectedPlace && (
        <View style={{ paddingBottom: insets.bottom + 10 }}>
          <TouchableOpacity style={styles.routeButton} onPress={handleStartRoutePress}>
            <Text style={styles.routeButtonText}>Start</Text>
          </TouchableOpacity>
        </View>
      )}
      {isNavigating && (
        <View style={{ paddingBottom: insets.bottom + 10 }}>
          {currentStepIndex < steps.length && (
            <Text style={styles.instructionText}>{steps[currentStepIndex]}</Text>
          )}
          <TouchableOpacity style={styles.routeButton} onPress={() => setIsNavigating(false)}>
            <Text style={styles.routeButtonText}>Stop</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000, // Ensure the search bar is above the map
  },
  dropdown: {
    backgroundColor: "white",
    borderRadius: 5,
    paddingVertical: 5,
    width: "100%",
    maxHeight: 150,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
  },
  marker: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "red",
    borderColor: "white",
    borderWidth: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 5,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  clearButton: {
    fontSize: 18,
    color: "#888",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  routeButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  routeButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  instructionBox: {
    position: 'absolute',
    bottom: 100,
    left: 10,
    right: 10,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    elevation: 5,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
});

