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
import {calculatePathDistance, directionsClient, geocodingClient} from "@/files/lib/MapBox";
import MapViewComponent from "@/files/components/MapView";
import NavigationPanel from "@/files/components/NavigationPanel";
import * as Location from "expo-location";
import { Accuracy } from "expo-location";
import * as Speech from 'expo-speech';
import { Vibration } from 'react-native';

MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

export default function Index() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState<null | {
    center: [number, number];
    name?: string;
  }>(null);
  const coordinateRef = useRef<[number, number] | null>(null);
  const currentStepIndexRef = useRef<number>(0);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<[number, number]>>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [steps, setSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentCoordinate, setCurrentCoordinate] = useCurrentLocation();
  const [distanceToNextStep, setDistanceToNextStep] = useState<number | null>(null);
  const mockLocation = true;

  useEffect(() => {
    coordinateRef.current = currentCoordinate;
  }, [currentCoordinate]);

  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

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
    }
    catch (error) {
      console.error("Failed to fetch suggestions:", error);
    }
  };

  useEffect(() => {
    setRoute();
  }, [selectedPlace]);

  useEffect(() => {
    if (isNavigating && currentStepIndex > 0 && steps[currentStepIndex]) {
      speakText(steps[currentStepIndex].maneuver?.instruction);
    }
  }, [currentStepIndex]);

  const handleSuggestionPress = (center: [number, number], name: string) => {
    if(!isNavigating) {
      setQuery(name);
      setSuggestions([]);
      setSelectedPlace({center, name});
    }
  };

  const handleMapPress = (event) => {
    if(!isNavigating){
      const coords = event.geometry.coordinates as [number, number];
      setSelectedPlace({ center: coords });
      setSuggestions([]);
    }
  }

  const speakText = (text) => {
    console.log("speaking: ", text);
    Vibration.vibrate([0, 300, 100, 300, 100, 500]);
    Speech.speak(text, {
      volume: 1
    });
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
      const allSteps = route.legs.flatMap((leg) => leg.steps);
      setRouteCoordinates(geometry);
      setSteps(allSteps);
      console.log("Geocode response: ", route.legs);
    }
    catch (error) {
      console.error("Failed to fetch route:", error);
      Alert.alert("Error", "Could not fetch route");
    }
  }

  useEffect(() => {
    if(mockLocation){
      return mockUserMovement();
    }
    else{
      return trackUserMovement();
    }
  }, [isNavigating]);

  const trackUserMovement = () => {
    let subscription: Location.LocationSubscription;

    const startWatching = async () => {
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Accuracy.High,
          timeInterval: 1000, // update every second
          distanceInterval: 1, // or every meter
        },
        (location) => {
          const coords: [number, number] = [
            location.coords.longitude,
            location.coords.latitude,
          ];
          setCurrentCoordinate(coords);

          if (isNavigating) {
            checkAdvanceStep(coords);
          }
        }
      );
    };
    startWatching();
    return () => {
      subscription?.remove();
    };
  }

  const mockUserMovement = () => {
    if (!isNavigating || routeCoordinates.length === 0) return;

    let coordinateIndex = 0;

    const interval = setInterval(() => {
      if (coordinateIndex < routeCoordinates.length) {
        const nextCoordinate = routeCoordinates[coordinateIndex];
        setCurrentCoordinate(nextCoordinate);
        console.log("Updating location: ", nextCoordinate)
        checkAdvanceStep(nextCoordinate);
        coordinateIndex += 1;
      } else {
        clearInterval(interval);
      }
    }, 3000); // faster to test step detection

    return () => clearInterval(interval);
  }

  const checkAdvanceStep = (position: [number, number]) => {
    if (!steps || steps.length === 0 || currentStepIndexRef.current >= steps.length){
      return;
    }
    const step = steps[currentStepIndexRef.current];

    if (!step){
      return;
    }
    console.log("position: ", position)
    console.log("step.maneuver.location: ", step.maneuver.location)
    console.log("routeCoordinates: ", routeCoordinates.flat())
    let distance = calculatePathDistance(position, step.maneuver.location, routeCoordinates);
    setDistanceToNextStep(distance);
    console.log("distance: ", distance)

    if (distance < 20) {
      setCurrentStepIndex((prev) => {
        console.log("Updating step index: ", Math.min(prev + 1, steps.length - 1))
        return Math.min(prev + 1, steps.length - 1);
      });
    }
  };

  const startNavigating = () => {
    setIsNavigating(true);
    setCurrentStepIndex(0);

    if (steps[0]) {
      speakText(steps[0]?.maneuver?.instruction);
    }
  }

  const stopNavigating = () => {
    setIsNavigating(false);
    setDistanceToNextStep(null);
    Speech.stop();
  }

  if (!currentCoordinate) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapViewComponent
        mockLocation={mockLocation}
        currentCoordinate={currentCoordinate}
        selectedPlace={selectedPlace}
        routeCoordinates={routeCoordinates}
        onMapPress={handleMapPress}
      />
      {!isNavigating && (
        <SearchBar
          query={query}
          setQuery={setQuery}
          setSuggestions={setSuggestions}
          suggestions={suggestions}
          fetchSuggestions={fetchSuggestions}
          onSuggestionSelect={handleSuggestionPress}
        />
      )}
      <NavigationPanel
        selectedPlace={selectedPlace}
        isNavigating={isNavigating}
        steps={steps}
        currentStepIndex={currentStepIndex}
        onStart={startNavigating}
        onStop={stopNavigating}
        distanceToNextStep={distanceToNextStep}
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

