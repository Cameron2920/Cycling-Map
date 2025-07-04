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
  isOnStepPath,
  LatLng, Place
} from "@/files/lib/MapBox";
import MapViewComponent from "@/files/components/MapView";
import NavigationPanel from "@/files/components/NavigationPanel";
import * as Location from "expo-location";
import { Accuracy } from "expo-location";
import * as Speech from 'expo-speech';
import {useDirections} from "@/files/hooks/useDirections";
import {useGeocoding} from "@/files/hooks/useGeocoding";
import StartEndSearch from "@/files/components/StartEndSearch";

MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

export default function Index() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [startPlace, setStartPlace] = useState<Place|null>(null);
  const [endPlace, setEndPlace] = useState<Place|null>(null);
  const currentCoordinateRef = useRef<LatLng | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<LatLng>>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [steps, setSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentCoordinate, setCurrentCoordinate] = useCurrentLocation();
  const [pickingFromMap, setPickingFromMap] = useState<"start" | "end" | null>("end");
  const { routes, getDirections, isLoadingDirections, setSelectedRoute, selectedRoute } = useDirections();
  const { searchResults, search, isLoadingGeocoding, fetchSearchResults } = useGeocoding();

  const mockLocation = true;

  useEffect(() => {
    currentCoordinateRef.current = currentCoordinate;

    if(!startPlace && currentCoordinate != null){
      console.log("currentCoordinate", currentCoordinate)
      setStartPlace({
        name: "Current Location",
        center: currentCoordinate
      })
    }
  }, [currentCoordinate]);

  useEffect(() => {
    if (isNavigating && currentCoordinate) {
      checkAdvanceStep(currentCoordinate, currentStepIndex);
    }
  }, [currentStepIndex, currentCoordinate]);

  useEffect(() => {
    if (!isNavigating && startPlace && endPlace) {
      console.log("getDirections", startPlace, endPlace)
      getDirections(startPlace.center, endPlace.center);
    }
  }, [startPlace, endPlace]);

  const handleSuggestionPress = (center: LatLng, name: string) => {
    if(!isNavigating) {
      setQuery(name);
      setSuggestions([]);
      setEndPlace({center, name});
    }
  };

  const handleStartPlaceSelected = (place:Place) => {
    if(!isNavigating) {
      setStartPlace(place);
    }
  };

  const handleEndPlaceSelected = (place:Place) => {
    if(!isNavigating) {
      setEndPlace(place);
    }
  };

  const handleMapPress = (event) => {
    const coords = event.geometry.coordinates as LatLng;

    if(!isNavigating){
      if(pickingFromMap == "start"){
        setStartPlace({ center: coords });
      }
      else{
        setEndPlace({ center: coords });
      }
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
          const coords: LatLng = [
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

  const checkAdvanceStep = (position: LatLng, currentStepIndex: number) => {
    if (!steps || steps.length === 0 || currentStepIndex >= steps.length){
      return;
    }
    const step = steps[currentStepIndex];
    const nextStep = steps[currentStepIndex + 1];
    const lastStep = steps[steps.length - 1];

    if (!step){
      return;
    }

    if(calculatePathDistance(position, lastStep.location, routeCoordinates) < 15){
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
        startPlace={startPlace}
        endPlace={endPlace}
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
            <StartEndSearch startPlace={startPlace}
                            endPlace={endPlace}
                            pickingFromMap={pickingFromMap}
                            setPickingFromMap={setPickingFromMap}
                            onSelectStart={handleStartPlaceSelected}
                            onSelectEnd={handleEndPlaceSelected}
                            onSwap={() => {
                              setEndPlace(startPlace);
                              setStartPlace(endPlace);
                            }}
                            onSearch={(query) => fetchSearchResults(query, currentCoordinateRef.current)}>

            </StartEndSearch>
            {pickingFromMap && (
              <View style={styles.mapHint}>
                <Text>
                  Tap the map to select {pickingFromMap === "start" ? "starting point" : "destination"}
                </Text>
              </View>
            )}
          </View>
        )}
        <View style={{ flex: 1, position: "relative" }}>


          <View style={{ flex: 1, justifyContent: "flex-end" }} pointerEvents="box-none">
            <NavigationPanel
              selectedPlace={endPlace}
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
  mapHint: {
    backgroundColor: "#fff",
    padding: 12,
    marginHorizontal: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
    alignItems: "center",
    zIndex: 1000,
  },
});

