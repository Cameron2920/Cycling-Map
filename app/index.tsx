import React, {useState, useEffect, useRef} from "react";
import {
  View,
  StyleSheet,
  Text,
} from "react-native";
import MapboxGL from "@rnmapbox/maps";
import { MAPBOX_ACCESS_TOKEN } from '@env';
import {SafeAreaView} from 'react-native-safe-area-context';
import SearchBar from "@/files/components/SearchBar";
import useCurrentLocation from "@/files/hooks/UseCurrentLocation";
import {
  calculatePathDistance,
  isOnStepPath
} from "@/files/lib/MapBox";
import MapViewComponent from "@/files/components/MapView";
import NavigationPanel from "@/files/components/NavigationPanel";
import * as Location from "expo-location";
import { Accuracy } from "expo-location";
import * as Speech from 'expo-speech';
import {useDirections} from "@/files/hooks/useDirections";
import {useGeocoding} from "@/files/hooks/useGeocoding";

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
  const [isNavigating, setIsNavigating] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [steps, setSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentCoordinate, setCurrentCoordinate] = useCurrentLocation();
  const { routes, getDirections, isLoadingDirections, setSelectedRoute, selectedRoute } = useDirections();
  const { searchResults, search, isLoadingGeocoding } = useGeocoding();

  const mockLocation = true;

  useEffect(() => {
    coordinateRef.current = currentCoordinate;
  }, [currentCoordinate]);

  useEffect(() => {
    if (isNavigating && currentCoordinate) {
      checkAdvanceStep(currentCoordinate, currentStepIndex);
    }
  }, [currentStepIndex, currentCoordinate]);

  useEffect(() => {
    if (!isNavigating && currentCoordinate && selectedPlace) {
      getDirections(currentCoordinate, selectedPlace.center);
    }
  }, [currentCoordinate, selectedPlace]);

  const handleSuggestionPress = (center: [number, number], name: string) => {
    if(!isNavigating) {
      setQuery(name);
      setSuggestions([]);
      setSelectedPlace({center, name});
    }
  };

  const handleMapPress = (event) => {
    const coords = event.geometry.coordinates as [number, number];

    if(!isNavigating){
      setSelectedPlace({ center: coords });
      setSuggestions([]);
    }
    else if(mockLocation){
      setCurrentCoordinate(coords);
    }
  }

  useEffect(() => {
    if(!mockLocation){
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
        }
      );
    };
    startWatching();
    return () => {
      subscription?.remove();
    };
  }

  const checkAdvanceStep = (position: [number, number], currentStepIndex: number) => {
    if (!steps || steps.length === 0 || currentStepIndex >= steps.length){
      return;
    }
    const step = steps[currentStepIndex];
    const nextStep = steps[currentStepIndex + 1];
    const lastStep = steps[steps.length - 1];

    if (!step){
      return;
    }

    if(calculatePathDistance(position, lastStep.maneuver.location, routeCoordinates) < 15){
      setArrived(true);
      return;
    }

    if(isOnStepPath(position, step)){
      console.log("Still on current step.")
      return;
    }

    if(nextStep){
      if(isOnStepPath(position, nextStep)){
        console.log("On next step.")
        setCurrentStepIndex((prev) => {
          console.log("Updating step index: ", Math.min(prev + 1, steps.length - 1))
          return Math.min(prev + 1, steps.length - 1);
        });
        return;
      }
    }
    console.log("Off route");
  };

  const startNavigating = () => {
    if(selectedRoute){
      setSteps(selectedRoute.steps);
      setRouteCoordinates(selectedRoute.coordinates);
      setIsNavigating(true);
      setArrived(false);
      setCurrentStepIndex(0);
    }
  }

  const stopNavigating = () => {
    setIsNavigating(false);
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
        routes={routes}
        selectedRoute={selectedRoute}
        onMapPress={handleMapPress}
      />
      <SafeAreaView
        edges={["top", "bottom", "left", "right"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="box-none"
      >
        {!isNavigating && (
          <View style={{ flex: 1, justifyContent: "flex-start" }} pointerEvents="box-none">
            <SearchBar
              query={query}
              setQuery={setQuery}
              setSuggestions={setSuggestions}
              suggestions={searchResults}
              fetchSuggestions={(query) => search(query, coordinateRef.current)}
              onSuggestionSelect={handleSuggestionPress}
            />
          </View>
        )}
        <View style={{ flex: 1, justifyContent: "flex-end" }} pointerEvents="box-none">
          <NavigationPanel
            selectedPlace={selectedPlace}
            isNavigating={isNavigating}
            steps={steps}
            currentStepIndex={currentStepIndex}
            onStart={startNavigating}
            onStop={stopNavigating}
            arrived={arrived}
            currentCoordinate={currentCoordinate}
            routeCoordinates={routeCoordinates}
          />
        </View>
      </SafeAreaView>
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

